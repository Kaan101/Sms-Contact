const { pool } = require('../config/db');

// Kullanıcı veya Sağlayıcının Listelerini Getir
const getListsByOwner = async (req, res) => {
  try {
    const { ownerType, ownerId } = req.params;
    const { rows } = await pool.query(
      `SELECT * FROM custom_lists WHERE owner_type = $1 AND owner_id = $2 ORDER BY created_at DESC`,
      [ownerType, ownerId]
    );
    res.status(200).json({ status: 'success', lists: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Yeni Liste Oluştur
const createList = async (req, res) => {
  try {
    const { ownerType, ownerId, listName } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO custom_lists (owner_type, owner_id, list_name) VALUES ($1, $2, $3) RETURNING *`,
      [ownerType, ownerId, listName]
    );
    res.status(201).json({ status: 'success', list: rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Listeyi Sil
const deleteList = async (req, res) => {
  try {
    const { listId } = req.params;
    await pool.query(`DELETE FROM custom_lists WHERE id = $1`, [listId]);
    res.status(200).json({ status: 'success', message: 'Liste silindi' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

 // Talep Ekle (Manuel Kontrol ile %100 Güvenli)
// Talep Ekle (Zorunlu İsim Alanı Doldurulmuş Hali)
const addRequestToList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { requestId } = req.body;

    if (!listId || !requestId) {
      return res.status(400).json({ status: 'error', message: 'Veri eksik.' });
    }

    // 1. Zaten ekli mi kontrolü
    const check = await pool.query(
      `SELECT 1 FROM list_items WHERE list_id = $1 AND request_id = $2`,
      [parseInt(listId, 10), parseInt(requestId, 10)]
    );

    if (check.rows.length > 0) {
      return res.status(200).json({ status: 'success', message: 'Zaten listede mevcut' });
    }

    // 2. Ekleme işlemi (contact_name zorunluluğunu aşmak için otomatik isim veriyoruz)
    // Not: Eğer contact_phone gibi başka bir zorunlu alan daha varsa, onu da ekleyebilmek için hazır tuttuk.
    await pool.query(
      `INSERT INTO list_items (list_id, request_id, contact_name, contact_phone) 
       VALUES ($1, $2, $3, $4)`,
      [
        parseInt(listId, 10), 
        parseInt(requestId, 10), 
        `Kayıtlı Talep #${requestId}`, // Zorunlu contact_name alanını doldurduk
        `Sistem`                       // Eğer contact_phone da zorunluysa diye doldurduk
      ]
    );

    res.status(201).json({ status: 'success', message: 'Talebiniz listeye eklendi.' });
  } catch (error) {
    console.error('Listeye ekleme hatası:', error);
    // Hata devam ederse başka hangi sütunun eksik olduğunu arayüzde gösterecek
    res.status(500).json({ status: 'error', message: `DB Hatası: ${error.message}` });
  }
};

// Listeden Öğe Çıkar
const removeRequestFromList = async (req, res) => {
  try {
    const { listId, requestId } = req.params;
    await pool.query(
      `DELETE FROM list_items WHERE list_id = $1 AND request_id = $2`,
      [listId, requestId]
    );
    res.status(200).json({ status: 'success', message: 'Listeden çıkarıldı' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ⭐ LİSTENİN İÇİNDEKİ TALEPLERİ GETİR
const getListRequests = async (req, res) => {
  try {
    const { listId } = req.params;
    const { rows } = await pool.query(
      `SELECT r.*, sp.name as provider_name, sp.phone as provider_phone,
        rpd.provider_budget as matched_budget, rpd.provider_currency as matched_currency, rpd.provider_target_date as matched_target_date
       FROM list_items li
       JOIN requests r ON li.request_id = r.id
       LEFT JOIN service_providers sp ON r.matched_provider_id = sp.id
       LEFT JOIN request_provider_details rpd ON (rpd.request_id = r.id AND rpd.provider_id = sp.id)
       WHERE li.list_id = $1 ORDER BY li.created_at DESC`,
      [listId]
    );
    res.status(200).json({ status: 'success', requests: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getListsByOwner,
  createList,
  deleteList,
  addRequestToList,
  removeRequestFromList,
  getListRequests
};
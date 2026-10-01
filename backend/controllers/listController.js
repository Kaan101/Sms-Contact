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

    // 2. Talebin asıl bilgilerini veritabanından çekelim ki list_items tablosu boş kalmasın
    const reqData = await pool.query(
      `SELECT contact_value, raw_text FROM requests WHERE id = $1`,
      [parseInt(requestId, 10)]
    );

    let phone = 'Bilinmiyor';
    let notes = 'Sistem Kaydı';

    if (reqData.rows.length > 0) {
      // Müşteri gizli moddaysa numara "555..|HIDDEN" gibi olabilir, veriyi temiz alıyoruz
      phone = reqData.rows[0].contact_value || 'Bilinmiyor';
      notes = reqData.rows[0].raw_text || 'Sistem Kaydı';
    }

    // 3. Tabloya telefon ve not alanlarıyla birlikte eksiksiz yazıyoruz
    await pool.query(
      `INSERT INTO list_items (list_id, request_id, contact_name, contact_phone, notes) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        parseInt(listId, 10), 
        parseInt(requestId, 10), 
        `Talep #${requestId}`, 
        phone, 
        notes
      ]
    );

    res.status(201).json({ status: 'success', message: 'Talebiniz listeye eklendi.' });
  } catch (error) {
    console.error('Listeye ekleme hatası:', error);
    res.status(500).json({ status: 'error', message: `DB Hatası: ${error.message}` });
  }
};

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

const getListRequests = async (req, res) => {
  try {
    const { listId } = req.params;
    
    // Hem list_items tablosundaki kendi sütunlarını (notes, phone) hem de request detaylarını çekiyoruz.
    // Sıralamayı da patlamaması için garanti olan list_items ID'sine göre yapıyoruz.
    const { rows } = await pool.query(
      `SELECT li.id as item_id, li.contact_name, li.contact_phone, li.notes, 
        r.*, sp.name as provider_name, sp.phone as provider_phone,
        rpd.provider_budget as matched_budget, rpd.provider_currency as matched_currency, rpd.provider_target_date as matched_target_date
       FROM list_items li
       LEFT JOIN requests r ON li.request_id = r.id
       LEFT JOIN service_providers sp ON r.matched_provider_id = sp.id
       LEFT JOIN request_provider_details rpd ON (rpd.request_id = r.id AND rpd.provider_id = sp.id)
       WHERE li.list_id = $1 
       ORDER BY li.id DESC`, 
      [parseInt(listId, 10)]
    );
    
    // Frontend `CustomListsManager` bileşeni 'items' dizisi de bekliyor olabilir, 
    // garantilemek için ikisini de döndürüyoruz!
    res.status(200).json({ status: 'success', requests: rows, items: rows });
  } catch (error) {
    console.error('Listeyi getirme hatası:', error);
    res.status(500).json({ status: 'error', message: `DB Getirme Hatası: ${error.message}` });
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
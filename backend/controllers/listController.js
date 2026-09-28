const { pool } = require('../config/db');

// 1. Kullanıcının/Sağlayıcının tüm listelerini ve içindeki öğeleri getir
const getListsByOwner = async (req, res) => {
  try {
    const { ownerType, ownerId } = req.params;

    const listsQuery = `SELECT * FROM custom_lists WHERE owner_type = $1 AND owner_id = $2 ORDER BY created_at DESC;`;
    const { rows: lists } = await pool.query(listsQuery, [ownerType.toUpperCase(), ownerId]);

    const detailedLists = [];
    for (const list of lists) {
      const itemsQuery = `SELECT * FROM list_items WHERE list_id = $1 ORDER BY created_at DESC;`;
      const { rows: items } = await pool.query(itemsQuery, [list.id]);
      detailedLists.push({
        ...list,
        items
      });
    }

    res.status(200).json({ status: 'success', lists: detailedLists });
  } catch (error) {
    console.error('Listeleri getirme hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 2. Yeni Liste Oluştur
const createList = async (req, res) => {
  try {
    const { ownerType, ownerId, listName } = req.body;

    if (!ownerType || !ownerId || !listName) {
      return res.status(400).json({ status: 'error', message: 'ownerType, ownerId ve listName zorunludur.' });
    }

    const query = `
      INSERT INTO custom_lists (owner_type, owner_id, list_name) 
      VALUES ($1, $2, $3) 
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [ownerType.toUpperCase(), ownerId, listName.trim()]);

    res.status(201).json({ status: 'success', message: 'Liste başarıyla oluşturuldu.', list: rows[0] });
  } catch (error) {
    console.error('Liste oluşturma hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 3. Listeye Manuel Kişi / İletişim Ekle
const addListItem = async (req, res) => {
  try {
    const { listId } = req.params;
    const { contactName, contactPhone, notes } = req.body;

    if (!contactName || !contactPhone) {
      return res.status(400).json({ status: 'error', message: 'Kişi adı ve telefon numarası zorunludur.' });
    }

    const query = `
      INSERT INTO list_items (list_id, contact_name, contact_phone, notes) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [listId, contactName.trim(), contactPhone.trim(), notes ? notes.trim() : null]);

    res.status(201).json({ status: 'success', message: 'Kişi listeye eklendi.', item: rows[0] });
  } catch (error) {
    console.error('Listeye kişi ekleme hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 4. Listeye Sistemdeki Bir Talebi (Request) Ekle (Zaten ekliyse engelle!)
const addRequestToList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ status: 'error', message: 'Talep ID (requestId) zorunludur.' });
    }

    // ⭐ Aynı talep bu listede daha önce var mı kontrol et
    const checkQuery = `SELECT id FROM list_items WHERE list_id = $1 AND request_id = $2;`;
    const { rows: existingRows } = await pool.query(checkQuery, [listId, requestId]);
    if (existingRows.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Bu talep zaten bu listede mevcut.' });
    }

    // Talebin bilgilerini çekelim
    const reqQuery = `SELECT * FROM requests WHERE id = $1;`;
    const { rows: reqRows } = await pool.query(reqQuery, [requestId]);

    if (reqRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Talep bulunamadı.' });
    }

    const targetReq = reqRows[0];
    const contactName = targetReq.provider_name || `Talep #${targetReq.id}`;
    const contactPhone = targetReq.contact_value || 'Bilinmiyor';
    const notes = `[Talep #${targetReq.id}] ${targetReq.raw_text}`;

    const query = `
      INSERT INTO list_items (list_id, request_id, contact_name, contact_phone, notes) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [listId, requestId, contactName, contactPhone, notes]);

    res.status(201).json({ status: 'success', message: 'Talep listeye eklendi.', item: rows[0] });
  } catch (error) {
    console.error('Listeye talep ekleme hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 5. Listeden Öğe Sil
const removeListItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const query = `DELETE FROM list_items WHERE id = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [itemId]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Öğe bulunamadı.' });
    }

    res.status(200).json({ status: 'success', message: 'Öğe listeden çıkarıldı.' });
  } catch (error) {
    console.error('Listeden öğe silme hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

module.exports = {
  getListsByOwner,
  createList,
  addListItem,
  addRequestToList,
  removeListItem
};
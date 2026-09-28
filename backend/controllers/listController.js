const { pool } = require('../config/db');

// 1. Kullanıcının/Sağlayıcının tüm listelerini ve içindeki kişileri getir
const getListsByOwner = async (req, res) => {
  try {
    const { ownerType, ownerId } = req.params;

    // Önce kullanıcının listelerini çek
    const listsQuery = `SELECT * FROM custom_lists WHERE owner_type = $1 AND owner_id = $2 ORDER BY created_at DESC;`;
    const { rows: lists } = await pool.query(listsQuery, [ownerType.toUpperCase(), ownerId]);

    // Her listenin içindeki kişileri (items) de ekleyerek zenginleştirilmiş bir yapı oluşturalım
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

// 3. Mevcut Listeye Kişi Ekle
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

// 4. Listeden Kişi Sil
const removeListItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const query = `DELETE FROM list_items WHERE id = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [itemId]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Kişi bulunamadı.' });
    }

    res.status(200).json({ status: 'success', message: 'Kişi listeden çıkarıldı.' });
  } catch (error) {
    console.error('Listeden kişi silme hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

module.exports = {
  getListsByOwner,
  createList,
  addListItem,
  removeListItem
};
const { pool } = require('../config/db');

// 1. Tüm Proje Özelliklerini Listele
const getFeatures = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM project_features 
      ORDER BY 
        CASE priority 
          WHEN 'KRİTİK' THEN 1 
          WHEN 'YÜKSEK' THEN 2 
          WHEN 'ORTA' THEN 3 
          WHEN 'DÜŞÜK' THEN 4 
          ELSE 5 
        END,
        target_date ASC,
        id DESC;
    `);
    res.status(200).json({ status: 'success', features: rows });
  } catch (error) {
    console.error('Özellik getirme hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 2. Yeni Özellik Ekle (Default: BEKLİYOR & ORTA)
const createFeature = async (req, res) => {
  try {
    const { title, description, targetDate, status, priority } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Tanım / Başlık alanı zorunludur.' });
    }

    const insertQuery = `
      INSERT INTO project_features (title, description, target_date, status, priority)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [
      title.trim(),
      description ? description.trim() : null,
      targetDate || new Date().toISOString().split('T')[0],
      status || 'BEKLİYOR',
      priority || 'ORTA'
    ];

    const { rows } = await pool.query(insertQuery, values);
    res.status(201).json({ status: 'success', message: 'Özellik başarıyla eklendi.', feature: rows[0] });
  } catch (error) {
    console.error('Özellik ekleme hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. Özellik Güncelle (Açılır Detaydan)
const updateFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, targetDate, status, priority } = req.body;

    const updateQuery = `
      UPDATE project_features
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        target_date = COALESCE($3, target_date),
        status = COALESCE($4, status),
        priority = COALESCE($5, priority),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *;
    `;

    const values = [
      title !== undefined ? title.trim() : null,
      description !== undefined ? description.trim() : null,
      targetDate !== undefined ? targetDate : null,
      status !== undefined ? status : null,
      priority !== undefined ? priority : null,
      parseInt(id, 10)
    ];

    const { rows } = await pool.query(updateQuery, values);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Özellik bulunamadı.' });
    }

    res.status(200).json({ status: 'success', message: 'Özellik güncellendi.', feature: rows[0] });
  } catch (error) {
    console.error('Özellik güncelleme hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. Özellik Sil
const deleteFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('DELETE FROM project_features WHERE id = $1 RETURNING *;', [parseInt(id, 10)]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Özellik bulunamadı.' });
    }

    res.status(200).json({ status: 'success', message: 'Özellik silindi.' });
  } catch (error) {
    console.error('Özellik silme hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getFeatures,
  createFeature,
  updateFeature,
  deleteFeature
};
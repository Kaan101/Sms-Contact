const { pool } = require('../config/db'); 

// 🚀 SİHİRLİ DOKUNUŞ: Tablo yoksa otomatik oluşturan fonksiyon
const ensureTagsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tags (
            id SERIAL PRIMARY KEY,
            tag_name VARCHAR(100) NOT NULL UNIQUE,
            keywords TEXT[] DEFAULT '{}',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);
};

const getTags = async (req, res) => {
    try {
        await ensureTagsTable(); // Tablo yoksa önce oluştur
        const result = await pool.query('SELECT * FROM tags ORDER BY id DESC');
        res.json({ tags: result.rows });
    } catch (error) {
        console.error("Tags Çekme Hatası:", error.message);
        res.status(500).json({ message: 'Etiketler çekilemedi', error: error.message });
    }
};

const createTag = async (req, res) => {
    const { tag_name, keywords, is_active } = req.body;
    
    try {
        await ensureTagsTable(); // Tablo yoksa önce oluştur
        
        // EXCLUDED keyword'ü PostgreSQL'de güncelleme (UPSERT) işlemi için en güvenli yöntemdir
        const result = await pool.query(
            `INSERT INTO tags (tag_name, keywords, is_active) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (tag_name) 
             DO UPDATE SET keywords = EXCLUDED.keywords, is_active = EXCLUDED.is_active 
             RETURNING *`,
            [tag_name, keywords || [], is_active ?? true]
        );
        res.status(201).json({ message: 'Etiket oluşturuldu', tag: result.rows[0] });
    } catch (error) {
        console.error("DB Tag Ekleme Hatası:", error.message);
        res.status(500).json({ message: 'Etiket oluşturulamadı', error: error.message });
    }
};

const updateTag = async (req, res) => {
    const { id } = req.params;
    const { tag_name, keywords, is_active } = req.body;
    try {
        await ensureTagsTable();
        const result = await pool.query(
            'UPDATE tags SET tag_name = $1, keywords = $2, is_active = $3 WHERE id = $4 RETURNING *',
            [tag_name, keywords || [], is_active ?? true, id]
        );
        res.json({ message: 'Etiket güncellendi', tag: result.rows[0] });
    } catch (error) {
        console.error("DB Tag Güncelleme Hatası:", error.message);
        res.status(500).json({ message: 'Etiket güncellenemedi', error: error.message });
    }
};

const deleteTag = async (req, res) => {
    const { id } = req.params;
    try {
        await ensureTagsTable();
        await pool.query('DELETE FROM tags WHERE id = $1', [id]);
        res.json({ message: 'Etiket silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Etiket silinemedi', error: error.message });
    }
};

module.exports = { getTags, createTag, updateTag, deleteTag };
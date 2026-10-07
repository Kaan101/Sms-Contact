const { pool } = require('../config/db'); 

// 1. Etiketleri lookup_tags tablosundan getir
const getTags = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM lookup_tags ORDER BY id DESC');
        res.json({ tags: result.rows });
    } catch (error) {
        // Eğer lookup_tags tablosu yoksa boş dön
        if (error.code === '42P01') { 
            return res.json({ tags: [] }); 
        }
        res.status(500).json({ message: 'Etiketler çekilemedi', error: error.message });
    }
};

// 2. lookup_tags tablosuna yeni etiket ekle veya güncelle
const createTag = async (req, res) => {
    const { tag_name, keywords, is_active } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO lookup_tags (tag_name, keywords, is_active) 
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

// 3. lookup_tags tablosundaki etiketi güncelle
const updateTag = async (req, res) => {
    const { id } = req.params;
    const { tag_name, keywords, is_active } = req.body;
    try {
        const result = await pool.query(
            'UPDATE lookup_tags SET tag_name = $1, keywords = $2, is_active = $3 WHERE id = $4 RETURNING *',
            [tag_name, keywords || [], is_active ?? true, id]
        );
        res.json({ message: 'Etiket güncellendi', tag: result.rows[0] });
    } catch (error) {
        console.error("DB Tag Güncelleme Hatası:", error.message);
        res.status(500).json({ message: 'Etiket güncellenemedi', error: error.message });
    }
};

// 4. lookup_tags tablosundan etiket sil
const deleteTag = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM lookup_tags WHERE id = $1', [id]);
        res.json({ message: 'Etiket silindi' });
    } catch (error) {
        console.error("DB Tag Silme Hatası:", error.message);
        res.status(500).json({ message: 'Etiket silinemedi', error: error.message });
    }
};

module.exports = { getTags, createTag, updateTag, deleteTag };
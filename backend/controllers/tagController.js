const pool = require('../config/db'); // Veritabanı bağlantı dosyanızın yolu (sistemine göre ayarla)

const getTags = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tags ORDER BY id DESC');
        res.json({ tags: result.rows });
    } catch (error) {
        // Eğer tablo yoksa hata vermesin, boş dizi dönsün (ilk kurulum için hayat kurtarır)
        if (error.code === '42P01') { 
            return res.json({ tags: [] }); 
        }
        res.status(500).json({ message: 'Etiketler çekilemedi', error: error.message });
    }
};

const createTag = async (req, res) => {
    const { tag_name, keywords, is_active } = req.body;
    
    try {
        const result = await pool.query(
            'INSERT INTO tags (tag_name, keywords, is_active) VALUES ($1, $2, $3) ON CONFLICT (tag_name) DO NOTHING RETURNING *',
            [tag_name, keywords || [], is_active ?? true]
        );
        res.status(201).json({ message: 'Etiket oluşturuldu', tag: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Etiket oluşturulamadı', error: error.message });
    }
};

const updateTag = async (req, res) => {
    const { id } = req.params;
    const { tag_name, keywords, is_active } = req.body;
    try {
        const result = await pool.query(
            'UPDATE tags SET tag_name = $1, keywords = $2, is_active = $3 WHERE id = $4 RETURNING *',
            [tag_name, keywords || [], is_active ?? true, id]
        );
        res.json({ message: 'Etiket güncellendi', tag: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Etiket güncellenemedi', error: error.message });
    }
};

const deleteTag = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tags WHERE id = $1', [id]);
        res.json({ message: 'Etiket silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Etiket silinemedi', error: error.message });
    }
};

module.exports = { getTags, createTag, updateTag, deleteTag };
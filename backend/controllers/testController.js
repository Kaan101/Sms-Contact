const { pool } = require('../config/db');

// 1. Tüm Test Senaryolarını Getir
const getTests = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM test_cases ORDER BY id ASC;');
    res.status(200).json({ status: 'success', tests: rows });
  } catch (error) {
    console.error('getTests hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 2. Yeni Test Senaryosu Ekle
const createTest = async (req, res) => {
  try {
    const { title, description, testerName, testDate, status } = req.body;
    if (!title) {
      return res.status(400).json({ status: 'error', message: 'Test başlığı zorunludur.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO test_cases (title, description, tester_name, test_date, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [
        title.trim(),
        description ? description.trim() : '',
        testerName && testerName.trim() !== '' ? testerName.trim() : 'Admin/Tester',
        testDate || new Date().toISOString().split('T')[0],
        status || 'BEKLİYOR'
      ]
    );

    res.status(201).json({ status: 'success', test: rows[0] });
  } catch (error) {
    console.error('createTest hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. Test Durumu & Not Güncelle
const updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resultNotes, testerName, testDate } = req.body;

    const { rows } = await pool.query(
      `UPDATE test_cases 
       SET status = COALESCE($1, status),
           result_notes = COALESCE($2, result_notes),
           tester_name = COALESCE($3, tester_name),
           test_date = COALESCE($4, test_date)
       WHERE id = $5
       RETURNING *;`,
      [status, resultNotes, testerName, testDate, parseInt(id, 10)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Test bulunamadı.' });
    }

    res.status(200).json({ status: 'success', test: rows[0] });
  } catch (error) {
    console.error('updateTest hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. Test Senaryosunu Sil
const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM test_cases WHERE id = $1;', [parseInt(id, 10)]);
    res.status(200).json({ status: 'success', message: 'Test senaryosu silindi.' });
  } catch (error) {
    console.error('deleteTest hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getTests,
  createTest,
  updateTest,
  deleteTest
};
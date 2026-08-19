const { pool } = require('../config/db');

const getTests = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM test_cases ORDER BY id ASC;');
    res.status(200).json({ status: 'success', tests: rows });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
};

const createTest = async (req, res) => {
  const { title, description, testerName, testDate } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO test_cases (title, description, tester_name, test_date) VALUES ($1, $2, $3, $4) RETURNING *;',
    [title, description, testerName, testDate]
  );
  res.status(201).json({ status: 'success', test: rows[0] });
};

const updateTest = async (req, res) => {
  const { id } = req.params;
  const { status, resultNotes, testerName } = req.body;
  const { rows } = await pool.query(
    'UPDATE test_cases SET status = COALESCE($1, status), result_notes = COALESCE($2, result_notes), tester_name = COALESCE($3, tester_name) WHERE id = $4 RETURNING *;',
    [status, resultNotes, testerName, id]
  );
  res.status(200).json({ status: 'success', test: rows[0] });
};

const deleteTest = async (req, res) => {
  await pool.query('DELETE FROM test_cases WHERE id = $1', [req.params.id]);
  res.status(200).json({ status: 'success' });
};

module.exports = { getTests, createTest, updateTest, deleteTest };
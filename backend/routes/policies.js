const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM policies ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load policies' });
  }
});

router.post('/add', async (req, res) => {
  const { contact_id, policy_number, policy_type, start_date, end_date, sum_insured, premium_amount, coverage_details, status } = req.body;
  try {
    await db.execute('INSERT INTO policies (contact_id, policy_number, policy_type, start_date, end_date, sum_insured, premium_amount, coverage_details, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [contact_id, policy_number, policy_type, start_date, end_date, sum_insured, premium_amount, coverage_details, status]);
    res.status(201).json({ success: true, message: 'Policy added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add policy' });
  }
});

module.exports = router;

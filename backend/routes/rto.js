const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM vehicles ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load vehicles' });
  }
});

router.get('/search', async (req, res) => {
  const { number } = req.query;
  try {
    const [rows] = await db.execute('SELECT * FROM vehicles WHERE vehicle_number LIKE ? ORDER BY created_at DESC', [`%${number}%`]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Search failed' });
  }
});

router.post('/add', async (req, res) => {
  const { owner_name, vehicle_number, vehicle_type, make, model, year, engine_number, chassis_number, rto_office, registration_date, fitness_expiry, insurance_expiry } = req.body;
  try {
    await db.execute(
      'INSERT INTO vehicles (owner_name, vehicle_number, vehicle_type, make, model, year, engine_number, chassis_number, rto_office, registration_date, fitness_expiry, insurance_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [owner_name, vehicle_number, vehicle_type, make, model, year, engine_number, chassis_number, rto_office, registration_date, fitness_expiry, insurance_expiry]
    );
    res.status(201).json({ success: true, message: 'Vehicle added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add vehicle' });
  }
});

router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { owner_name, vehicle_number, vehicle_type, make, model, year, engine_number, chassis_number, rto_office, registration_date, fitness_expiry, insurance_expiry } = req.body;
  try {
    await db.execute(
      'UPDATE vehicles SET owner_name=?, vehicle_number=?, vehicle_type=?, make=?, model=?, year=?, engine_number=?, chassis_number=?, rto_office=?, registration_date=?, fitness_expiry=?, insurance_expiry=? WHERE id=?',
      [owner_name, vehicle_number, vehicle_type, make, model, year, engine_number, chassis_number, rto_office, registration_date, fitness_expiry, insurance_expiry, id]
    );
    res.json({ success: true, message: 'Vehicle updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update vehicle' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete vehicle' });
  }
});

module.exports = router;

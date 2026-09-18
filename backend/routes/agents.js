const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM agents ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load agents' });
  }
});

router.post('/add', async (req, res) => {
  const { agent_name, email, phone, agent_code, address, city, joining_date, status, commission_percent } = req.body;
  try {
    await db.execute('INSERT INTO agents (agent_name, email, phone, agent_code, address, city, joining_date, status, commission_percent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [agent_name, email, phone, agent_code, address, city, joining_date, status, commission_percent]);
    res.status(201).json({ success: true, message: 'Agent added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add agent' });
  }
});

router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { agent_name, email, phone, agent_code, address, city, joining_date, status, commission_percent } = req.body;
  try {
    await db.execute('UPDATE agents SET agent_name=?, email=?, phone=?, agent_code=?, address=?, city=?, joining_date=?, status=?, commission_percent=? WHERE id=?', [agent_name, email, phone, agent_code, address, city, joining_date, status, commission_percent, id]);
    res.json({ success: true, message: 'Agent updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update agent' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM agents WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete agent' });
  }
});

router.get('/:id/policies', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM agent_policies WHERE agent_id = ? ORDER BY sale_date DESC', [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load agent policies' });
  }
});

router.post('/policy/add', async (req, res) => {
  const { agent_id, contact_id, policy_type, policy_number, premium_amount, commission_amount, sale_date, customer_name, notes } = req.body;
  try {
    await db.execute('INSERT INTO agent_policies (agent_id, contact_id, policy_type, policy_number, premium_amount, commission_amount, sale_date, customer_name, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [agent_id, contact_id, policy_type, policy_number, premium_amount, commission_amount, sale_date, customer_name, notes]);
    res.status(201).json({ success: true, message: 'Agent policy added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add policy sale' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT a.agent_name, COUNT(ap.id) AS policy_count, SUM(ap.premium_amount) AS total_premium FROM agents a LEFT JOIN agent_policies ap ON a.id = ap.agent_id GROUP BY a.id ORDER BY policy_count DESC LIMIT 5');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

module.exports = router;

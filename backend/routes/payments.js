const express = require('express');
const PDFDocument = require('pdfkit');
const db = require('../config/db');
const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT p.*, c.full_name FROM payments p LEFT JOIN contacts c ON p.contact_id = c.id ORDER BY p.payment_date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load payments' });
  }
});

router.post('/add', async (req, res) => {
  const { contact_id, policy_id, policy_type, policy_number, payment_date, amount, payment_mode, payment_status, transaction_id, receipt_number, notes } = req.body;
  try {
    await db.execute(
      'INSERT INTO payments (contact_id, policy_id, policy_type, policy_number, payment_date, amount, payment_mode, payment_status, transaction_id, receipt_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [contact_id, policy_id, policy_type, policy_number, payment_date, amount, payment_mode, payment_status, transaction_id, receipt_number, notes]
    );
    res.status(201).json({ success: true, message: 'Payment added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add payment' });
  }
});

router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { contact_id, policy_id, policy_type, policy_number, payment_date, amount, payment_mode, payment_status, transaction_id, receipt_number, notes } = req.body;
  try {
    await db.execute(
      'UPDATE payments SET contact_id=?, policy_id=?, policy_type=?, policy_number=?, payment_date=?, amount=?, payment_mode=?, payment_status=?, transaction_id=?, receipt_number=?, notes=? WHERE id=?',
      [contact_id, policy_id, policy_type, policy_number, payment_date, amount, payment_mode, payment_status, transaction_id, receipt_number, notes, id]
    );
    res.json({ success: true, message: 'Payment updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update payment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM payments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete payment' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const [today] = await db.execute('SELECT COALESCE(SUM(amount), 0) AS total_today FROM payments WHERE payment_date = CURDATE()');
    const [month] = await db.execute('SELECT COALESCE(SUM(amount), 0) AS total_month FROM payments WHERE MONTH(payment_date)=MONTH(CURDATE()) AND YEAR(payment_date)=YEAR(CURDATE())');
    const [pending] = await db.execute('SELECT COUNT(*) AS pending_count FROM payments WHERE payment_status = "pending"');
    const [total] = await db.execute('SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments');
    res.json({ today: today[0].total_today, month: month[0].total_month, pending: pending[0].pending_count, total: total[0].total_revenue });
  } catch (error) {
    res.status(500).json({ message: 'Summary failed' });
  }
});

router.get('/receipt/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT p.*, c.full_name, c.email, c.phone FROM payments p LEFT JOIN contacts c ON p.contact_id = c.id WHERE p.id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Payment not found' });
    const payment = rows[0];
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment.id}.pdf`);
    doc.pipe(res);
    doc.fontSize(20).text('SureGuard Insurance', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt Number: ${payment.receipt_number || payment.id}`);
    doc.text(`Customer: ${payment.full_name || 'N/A'}`);
    doc.text(`Email: ${payment.email || 'N/A'}`);
    doc.text(`Phone: ${payment.phone || 'N/A'}`);
    doc.text(`Amount: ₹${payment.amount}`);
    doc.text(`Payment Mode: ${payment.payment_mode}`);
    doc.text(`Status: ${payment.payment_status}`);
    doc.moveDown().text('Thank you for choosing SureGuard Insurance.');
    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Receipt generation failed' });
  }
});

module.exports = router;

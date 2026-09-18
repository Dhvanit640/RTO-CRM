const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT d.*, c.full_name FROM documents d LEFT JOIN contacts c ON d.contact_id = c.id ORDER BY d.upload_date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load documents' });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { contact_id, policy_id, document_type, document_number, expiry_date, notes } = req.body;
    if (!req.file) return res.status(400).json({ message: 'File is required' });
    const file_name = req.file.originalname;
    const file_path = `/uploads/documents/${req.file.filename}`;
    await db.execute(
      'INSERT INTO documents (contact_id, policy_id, document_type, document_number, file_name, file_path, expiry_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [contact_id || null, policy_id || null, document_type, document_number, file_name, file_path, expiry_date || null, notes]
    );
    res.status(201).json({ success: true, message: 'Document uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

router.get('/:id/download', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT file_path, file_name FROM documents WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Document not found' });
    const record = rows[0];
    const fullPath = path.join(__dirname, '..', record.file_path.replace(/^\//, ''));
    res.download(fullPath, record.file_name);
  } catch (error) {
    res.status(500).json({ message: 'Download failed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT file_path FROM documents WHERE id = ?', [req.params.id]);
    if (rows.length > 0) {
      const filePath = path.join(__dirname, '..', rows[0].file_path.replace(/^\//, ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await db.execute('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

router.get('/contact/:contact_id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM documents WHERE contact_id = ? ORDER BY upload_date DESC', [req.params.contact_id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load contact documents' });
  }
});

module.exports = router;

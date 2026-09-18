const express = require('express');
const db = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const csv = require('csv-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Multer config for import
const uploadDir = path.join(__dirname, '../uploads/contacts');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, `import_${Date.now()}_${file.originalname}`)
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx and .csv files allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Helper to apply filters
async function getFilteredContacts(filters = {}) {
  let query = 'SELECT * FROM contacts WHERE 1=1';
  let params = [];
  
  if (filters.search) {
    query += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ?)';
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }
  if (filters.city) {
    query += ' AND city = ?';
    params.push(filters.city);
  }
  if (filters.state) {
    query += ' AND state = ?';
    params.push(filters.state);
  }
  
  query += ' ORDER BY created_at DESC';
  const [rows] = await db.execute(query, params);
  return rows;
}

// =============== CRUD ROUTES ===============
router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load contacts' });
  }
});

router.post('/add', async (req, res) => {
  const { full_name, email, phone, alternate_phone, address, city, state, pincode, date_of_birth, gender, occupation, notes } = req.body;
  try {
    // Check for duplicate email
    const [existing] = await db.execute('SELECT id FROM contacts WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    await db.execute(
      'INSERT INTO contacts (full_name, email, phone, alternate_phone, address, city, state, pincode, date_of_birth, gender, occupation, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [full_name, email, phone, alternate_phone, address, city, state, pincode, date_of_birth, gender, occupation, notes]
    );
    res.status(201).json({ success: true, message: 'Contact added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add contact' });
  }
});

router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, alternate_phone, address, city, state, pincode, date_of_birth, gender, occupation, notes } = req.body;
  try {
    await db.execute(
      'UPDATE contacts SET full_name=?, email=?, phone=?, alternate_phone=?, address=?, city=?, state=?, pincode=?, date_of_birth=?, gender=?, occupation=?, notes=? WHERE id=?',
      [full_name, email, phone, alternate_phone, address, city, state, pincode, date_of_birth, gender, occupation, notes, id]
    );
    res.json({ success: true, message: 'Contact updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update contact' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete contact' });
  }
});

router.get('/:id/policies', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM policies WHERE contact_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load policies' });
  }
});

// =============== EXPORT ROUTES ===============
router.get('/export/excel', async (req, res) => {
  try {
    const contacts = await getFilteredContacts(req.query);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contacts');
    
    // Header rows
    const titleRow = worksheet.addRow(['SureGuard Insurance - Customer Contacts']);
    titleRow.font = { bold: true, size: 14 };
    worksheet.mergeCells('A1:M1');
    
    const dateRow = worksheet.addRow([`Export Date: ${new Date().toLocaleDateString()}`]);
    dateRow.font = { italic: true };
    worksheet.mergeCells('A2:M2');
    
    worksheet.addRow([]);
    
    // Data headers
    const headers = ['Sr.No', 'Full Name', 'Email', 'Phone', 'Alternate Phone', 'Date of Birth', 'Gender', 'Address', 'City', 'State', 'Pincode', 'Occupation', 'Notes', 'Created Date'];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a237e' } };
    
    // Data rows
    contacts.forEach((contact, index) => {
      const row = worksheet.addRow([
        index + 1,
        contact.full_name,
        contact.email,
        contact.phone,
        contact.alternate_phone,
        contact.date_of_birth,
        contact.gender,
        contact.address,
        contact.city,
        contact.state,
        contact.pincode,
        contact.occupation,
        contact.notes,
        contact.created_at
      ]);
      
      if ((index + 1) % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe3f2fd' } };
      }
    });
    
    // Auto column width
    worksheet.columns.forEach(col => {
      col.width = 12;
    });
    worksheet.getColumn('A').width = 6;
    worksheet.getColumn('B').width = 15;
    worksheet.getColumn('C').width = 18;
    worksheet.getColumn('H').width = 20;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=contacts_export_${new Date().toLocaleDateString('en-GB').replace(/\//g, '')}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'Failed to export Excel' });
  }
});

router.get('/export/csv', async (req, res) => {
  try {
    const contacts = await getFilteredContacts(req.query);
    
    let csv = 'Sr.No,Full Name,Email,Phone,Alternate Phone,Date of Birth,Gender,Address,City,State,Pincode,Occupation,Notes,Created Date\n';
    
    contacts.forEach((contact, index) => {
      csv += `${index + 1},"${contact.full_name}","${contact.email}","${contact.phone}","${contact.alternate_phone}","${contact.date_of_birth}","${contact.gender}","${contact.address}","${contact.city}","${contact.state}","${contact.pincode}","${contact.occupation}","${contact.notes}","${contact.created_at}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=contacts_export_${new Date().toLocaleDateString('en-GB').replace(/\//g, '')}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export CSV' });
  }
});

router.get('/export/pdf', async (req, res) => {
  try {
    const contacts = await getFilteredContacts(req.query);
    
    const doc = new PDFDocument({ size: 'A4', margin: 40, landscape: true });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=contacts_export_${new Date().toLocaleDateString('en-GB').replace(/\//g, '')}.pdf`);
    
    doc.pipe(res);
    
    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('SureGuard Insurance', 40, 40);
    doc.fontSize(14).font('Helvetica').text('Customer Contacts Report', 40, 65);
    doc.fontSize(10).text(`Export Date: ${new Date().toLocaleDateString()} | Total Contacts: ${contacts.length}`, 40, 90);
    
    // Table
    const tableTop = 120;
    const colWidth = 120;
    const rowHeight = 20;
    const columns = ['Sr.No', 'Name', 'Email', 'Phone', 'City', 'State'];
    
    // Header row
    doc.fillColor('#1a237e').rect(40, tableTop, 750, rowHeight).fill();
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    let x = 40;
    columns.forEach(col => {
      doc.text(col, x + 5, tableTop + 5, { width: colWidth - 10 });
      x += colWidth;
    });
    
    // Data rows
    doc.fillColor('#000000').font('Helvetica').fontSize(8);
    let y = tableTop + rowHeight;
    
    contacts.slice(0, 30).forEach((contact, index) => {
      if (y > 700) {
        doc.addPage().landscape();
        y = 40;
      }
      
      if (index % 2 === 0) {
        doc.fillColor('#e3f2fd').rect(40, y, 750, rowHeight).fill();
      }
      
      doc.fillColor('#000000');
      x = 40;
      const data = [index + 1, contact.full_name, contact.email, contact.phone, contact.city, contact.state];
      data.forEach((item, i) => {
        doc.text(String(item).substring(0, 15), x + 5, y + 5, { width: colWidth - 10 });
        x += colWidth;
      });
      
      y += rowHeight;
    });
    
    // Footer
    doc.fontSize(9).text('Generated by SureGuard Insurance ERP', 40, doc.page.height - 40, { align: 'center' });
    doc.fontSize(8).text(`Page ${doc.bufferedPageRange().count}`, doc.page.width - 80, doc.page.height - 40);
    
    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Failed to export PDF' });
  }
});

// =============== IMPORT ROUTES ===============
router.get('/import/template/excel', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Contacts');

    // Define columns
    sheet.columns = [
      { header: 'Full Name*', key: 'full_name', width: 20 },
      { header: 'Email*', key: 'email', width: 25 },
      { header: 'Phone*', key: 'phone', width: 15 },
      { header: 'Alternate Phone', key: 'alternate_phone', width: 15 },
      { header: 'Date of Birth', key: 'dob', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'City*', key: 'city', width: 15 },
      { header: 'State', key: 'state', width: 15 },
      { header: 'Pincode', key: 'pincode', width: 10 },
      { header: 'Occupation', key: 'occupation', width: 15 },
      { header: 'Notes', key: 'notes', width: 20 }
    ];

    // Style header row
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: 'FF1A237E' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    // Add sample rows
    sheet.addRow([
      'Raj Patel', 'raj@email.com', '9876543210',
      '9876543211', '15/06/1990', 'Male',
      '123 MG Road', 'Ahmedabad', 'Gujarat',
      '380001', 'Business', 'Sample contact'
    ]);
    sheet.addRow([
      'Priya Shah', 'priya@email.com', '9123456789',
      '', '20/03/1985', 'Female',
      '456 Ring Road', 'Surat', 'Gujarat',
      '395001', 'Service', ''
    ]);

    // Set response headers for download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=contacts_import_template.xlsx'
    );

    // Write to response directly
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Excel template error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/import/template/csv', (req, res) => {
  try {
    const csvContent = 
`Full Name*,Email*,Phone*,Alternate Phone,Date of Birth,Gender,Address,City*,State,Pincode,Occupation,Notes
Raj Patel,raj@email.com,9876543210,9876543211,15/06/1990,Male,123 MG Road,Ahmedabad,Gujarat,380001,Business,Sample contact
Priya Shah,priya@email.com,9123456789,,20/03/1985,Female,456 Ring Road,Surat,Gujarat,395001,Service,`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=contacts_import_template.csv'
    );
    res.send('\uFEFF' + csvContent);

  } catch (err) {
    console.error('CSV template error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Import preview - parse uploaded file
router.post('/import/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const data = [];
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    if (ext === '.xlsx') {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);
      const worksheet = workbook.worksheets[0];
      
      const headers = [];
      worksheet.getRow(1).eachCell(cell => headers.push(cell.value));
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const obj = {};
          row.eachCell((cell, colNumber) => {
            obj[headers[colNumber - 1]] = cell.value;
          });
          if (Object.values(obj).some(v => v)) data.push(obj);
        }
      });
    } else if (ext === '.csv') {
      const fileStream = fs.createReadStream(req.file.path);
      await new Promise((resolve, reject) => {
        fileStream
          .pipe(csv())
          .on('data', row => data.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
    }
    
    fs.unlinkSync(req.file.path);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to preview file' });
  }
});

// Import contacts
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    // This route is for future use; actual import is handled by frontend batch requests
    res.status(200).json({ message: 'Import route ready' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to import' });
  }
});

module.exports = router;

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();
const MASTER_OTP = '9999';

// TODO: Remove hardcoded OTP before going live
// Replace with real email/SMS OTP system
// Current master OTP: 9999 (testing only)

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'insurance-secret',
    { expiresIn: '1h' }
  );
};

router.post('/register', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  try {
    const [existingRows] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingRows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, is_verified) VALUES (?, ?, ?, 0)',
      [name, email.toLowerCase(), hashedPassword]
    );

    const userId = result.insertId;
    await db.execute('INSERT INTO otp_codes (email, otp, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))', [email.toLowerCase(), MASTER_OTP]);

    res.status(201).json({
      success: true,
      message: 'OTP is ready. Enter 9999 to verify your account.',
      email: email.toLowerCase(),
      userId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = rows[0];
    if (user.is_verified) {
      return res.status(400).json({ success: false, message: 'Account already verified.' });
    }

    const [otpRows] = await db.execute('SELECT * FROM otp_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1', [email.toLowerCase()]);
    if (otpRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please register again.' });
    }

    const otpRecord = otpRows[0];
    if (otpRecord.otp !== MASTER_OTP && otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    await db.execute('UPDATE users SET is_verified = 1 WHERE id = ?', [user.id]);
    await db.execute('DELETE FROM otp_codes WHERE email = ?', [email.toLowerCase()]);

    res.json({ success: true, message: 'Account verified successfully. You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = rows[0];
    if (!user.is_verified) {
      return res.status(401).json({ success: false, message: 'Please verify your account first.' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user);
    res.json({ success: true, message: 'Login successful.', token, user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

router.get('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout successful.' });
});

module.exports = router;

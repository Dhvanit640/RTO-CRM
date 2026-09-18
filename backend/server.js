const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ['http://localhost', 'http://localhost:80', 'http://localhost:5000'], credentials: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'register.html'));
});

app.get('/otp', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'otp.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dashboard.html'));
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/rto', require('./routes/rto'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Insurance app running on port ${PORT}`);
});

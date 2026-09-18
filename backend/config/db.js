const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const connection = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'insurance_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promiseConnection = connection.promise();

async function initializeDatabase() {
  const sqlFilePath = path.join(__dirname, '..', '..', 'database', 'insurance.sql');
  if (!fs.existsSync(sqlFilePath)) {
    return;
  }

  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  const statements = sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      await promiseConnection.query(statement);
    } catch (error) {
      if (!String(error.message).includes('already exists')) {
        console.warn('Database init warning:', error.message);
      }
    }
  }
}

initializeDatabase().catch((error) => {
  console.error('Database initialization failed:', error.message);
});

module.exports = promiseConnection;

CREATE DATABASE IF NOT EXISTS insurance_db;
USE insurance_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  is_verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email, password, is_verified) VALUES
('Demo User', 'demo@insurance.com', '$2a$10$Z5a33AEo/eThXgdBG5dozO6TJU1VhDSSLfrTifTPeUV9qFb9cLC/6', 1)
ON DUPLICATE KEY UPDATE name = 'Demo User', is_verified = 1;

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_name VARCHAR(100),
  vehicle_number VARCHAR(20) UNIQUE,
  vehicle_type ENUM('car','bike','truck'),
  make VARCHAR(50),
  model VARCHAR(50),
  year INT,
  engine_number VARCHAR(50),
  chassis_number VARCHAR(50),
  rto_office VARCHAR(100),
  registration_date DATE,
  fitness_expiry DATE,
  insurance_expiry DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(15),
  alternate_phone VARCHAR(15),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  pincode VARCHAR(10),
  date_of_birth DATE,
  gender ENUM('male','female','other'),
  occupation VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT,
  policy_id INT,
  document_type ENUM('pan_card','aadhar_card','rc_book','insurance_policy','driving_license','other'),
  document_number VARCHAR(50),
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATE,
  notes TEXT,
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT,
  policy_id INT,
  policy_type VARCHAR(50),
  policy_number VARCHAR(50),
  payment_date DATE,
  amount DECIMAL(10,2),
  payment_mode ENUM('cash','cheque','online','upi','bank_transfer'),
  payment_status ENUM('paid','pending','failed'),
  transaction_id VARCHAR(100),
  receipt_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

CREATE TABLE IF NOT EXISTS agents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(15),
  agent_code VARCHAR(20) UNIQUE,
  address TEXT,
  city VARCHAR(50),
  joining_date DATE,
  status ENUM('active','inactive'),
  commission_percent DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_id INT,
  contact_id INT,
  policy_type VARCHAR(50),
  policy_number VARCHAR(50),
  premium_amount DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  sale_date DATE,
  customer_name VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT,
  policy_number VARCHAR(50),
  policy_type VARCHAR(50),
  start_date DATE,
  end_date DATE,
  sum_insured DECIMAL(12,2),
  premium_amount DECIMAL(10,2),
  coverage_details TEXT,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO agents (agent_name, email, phone, agent_code, city, joining_date, status, commission_percent) VALUES
('Aman Shah', 'aman@sureguard.com', '9876543210', 'AGT001', 'Mumbai', '2023-01-10', 'active', 10.00),
('Neha Rao', 'neha@sureguard.com', '9123456780', 'AGT002', 'Delhi', '2023-02-15', 'active', 8.50),
('Rohit Verma', 'rohit@sureguard.com', '9988776655', 'AGT003', 'Bengaluru', '2023-03-01', 'inactive', 7.00) ON DUPLICATE KEY UPDATE agent_name=agent_name;

INSERT INTO contacts (full_name, email, phone, city, state, pincode, gender, occupation) VALUES
('John Doe', 'john@example.com', '9876543211', 'Mumbai', 'MH', '400001', 'male', 'Engineer'),
('Sara Khan', 'sara@example.com', '9123456781', 'Delhi', 'DL', '110001', 'female', 'Teacher'),
('Ravi Sharma', 'ravi@example.com', '9988776651', 'Pune', 'MH', '411001', 'male', 'Designer'),
('Meera Joshi', 'meera@example.com', '9012345678', 'Bengaluru', 'KA', '560001', 'female', 'Doctor'),
('Arjun Patel', 'arjun@example.com', '9090909090', 'Ahmedabad', 'GJ', '380001', 'male', 'Manager') ON DUPLICATE KEY UPDATE full_name=full_name;

INSERT INTO vehicles (owner_name, vehicle_number, vehicle_type, make, model, year, rto_office, insurance_expiry) VALUES
('John Doe', 'MH01AB1234', 'car', 'Honda', 'City', 2022, 'Mumbai Central', '2026-07-20'),
('Sara Khan', 'DL05XY4321', 'bike', 'Royal Enfield', 'Classic', 2021, 'Delhi East', '2026-09-15'),
('Ravi Sharma', 'MH12CD1111', 'truck', 'Tata', 'Ace', 2020, 'Pune West', '2025-12-01') ON DUPLICATE KEY UPDATE vehicle_number=vehicle_number;

INSERT INTO policies (contact_id, policy_number, policy_type, start_date, end_date, sum_insured, premium_amount, coverage_details, status) VALUES
(1, 'POL-1001', 'Car Insurance', '2025-01-01', '2026-01-01', 500000, 12999, 'Roadside assistance', 'active'),
(2, 'POL-1002', 'Health Insurance', '2025-02-01', '2026-02-01', 300000, 8999, 'Family cover', 'active'),
(3, 'POL-1003', 'Bike Insurance', '2025-03-01', '2026-03-01', 120000, 4999, 'Theft and damage', 'pending'),
(4, 'POL-1004', 'Home Insurance', '2025-04-01', '2026-04-01', 800000, 15999, 'Property cover', 'active'),
(5, 'POL-1005', 'Life Insurance', '2025-05-01', '2026-05-01', 1000000, 19999, 'Life cover', 'active'),
(1, 'POL-1006', 'Truck Insurance', '2025-06-01', '2026-06-01', 700000, 24999, 'Commercial', 'pending') ON DUPLICATE KEY UPDATE policy_number=policy_number;

INSERT INTO payments (contact_id, policy_id, policy_type, policy_number, payment_date, amount, payment_mode, payment_status, transaction_id, receipt_number) VALUES
(1, 1, 'Car Insurance', 'POL-1001', '2025-07-10', 12999, 'online', 'paid', 'TXN001', 'RCPT001'),
(2, 2, 'Health Insurance', 'POL-1002', '2025-07-11', 8999, 'upi', 'paid', 'TXN002', 'RCPT002'),
(3, 3, 'Bike Insurance', 'POL-1003', '2025-07-12', 4999, 'cash', 'pending', 'TXN003', 'RCPT003'),
(4, 4, 'Home Insurance', 'POL-1004', '2025-07-13', 15999, 'bank_transfer', 'paid', 'TXN004', 'RCPT004'),
(5, 5, 'Life Insurance', 'POL-1005', '2025-07-14', 19999, 'online', 'paid', 'TXN005', 'RCPT005') ON DUPLICATE KEY UPDATE receipt_number=receipt_number;

INSERT INTO agent_policies (agent_id, contact_id, policy_type, policy_number, premium_amount, commission_amount, sale_date, customer_name) VALUES
(1, 1, 'Car Insurance', 'POL-1001', 12999, 1299.90, '2025-07-10', 'John Doe'),
(2, 2, 'Health Insurance', 'POL-1002', 8999, 764.92, '2025-07-11', 'Sara Khan'),
(1, 3, 'Bike Insurance', 'POL-1003', 4999, 424.92, '2025-07-12', 'Ravi Sharma') ON DUPLICATE KEY UPDATE policy_number=policy_number;

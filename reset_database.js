const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(__dirname, 'server', 'data', 'facility_management.db');

// Delete existing database
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️ Deleted existing database');
}

// Create fresh database
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

console.log('🔄 Creating fresh database with complete sample data...');

// Create tables
db.exec(`
  CREATE TABLE facilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT,
    location TEXT,
    address TEXT,
    description TEXT,
    status TEXT DEFAULT 'Active',
    manager TEXT,
    contact TEXT,
    area REAL,
    floors INTEGER,
    yearBuilt INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    what TEXT NOT NULL,
    what_to_do TEXT,
    description TEXT,
    category TEXT,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Pending',
    deadline TEXT,
    responsible_type TEXT,
    responsible_name TEXT,
    responsible_phone TEXT,
    estimated_cost REAL,
    facility_id INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
  );

  CREATE TABLE electric_meters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number TEXT UNIQUE NOT NULL,
    location TEXT,
    facility_id INTEGER,
    currentReading REAL DEFAULT 0,
    previousReading REAL DEFAULT 0,
    installationDate TEXT,
    lastReadingDate TEXT,
    meterType TEXT,
    voltage INTEGER,
    maxCapacity INTEGER,
    status TEXT DEFAULT 'Active',
    notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
  );

  CREATE TABLE heat_gas_meters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number TEXT UNIQUE NOT NULL,
    location TEXT,
    facility_id INTEGER,
    meter_type TEXT NOT NULL,
    unit TEXT NOT NULL,
    currentReading REAL DEFAULT 0,
    previousReading REAL DEFAULT 0,
    installationDate TEXT,
    lastReadingDate TEXT,
    status TEXT DEFAULT 'Active',
    notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
  );

  CREATE TABLE daily_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meter_id INTEGER NOT NULL,
    meter_type TEXT NOT NULL,
    reading_date TEXT NOT NULL,
    reading_value REAL NOT NULL,
    consumption REAL,
    notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    originalname TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER,
    mimetype TEXT,
    description TEXT,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('✅ Tables created successfully');

// Insert facilities first
const insertFacility = db.prepare(`
  INSERT INTO facilities (name, type, location, address, description, manager, contact, area, floors, yearBuilt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const facilities = [
  ['Main Office Building', 'Office', 'Downtown', '123 Business Ave, City Center', 'Primary office building housing administrative departments', 'Sarah Johnson', 'sarah.johnson@company.com', 5000.0, 5, 2010],
  ['Manufacturing Plant A', 'Industrial', 'Industrial District', '456 Factory Rd, Industrial Zone', 'Main production facility for manufacturing operations', 'Mike Rodriguez', 'mike.rodriguez@company.com', 15000.0, 2, 2005],
  ['Warehouse Complex', 'Storage', 'Logistics Hub', '789 Storage Blvd, Warehouse District', 'Central storage and distribution facility', 'Lisa Chen', 'lisa.chen@company.com', 8000.0, 1, 2015]
];

facilities.forEach(facility => {
  insertFacility.run(...facility);
});

console.log('✅ Facilities inserted (3 facilities)');

// Insert tasks
const insertTask = db.prepare(`
  INSERT INTO tasks (what, what_to_do, description, category, priority, status, deadline, responsible_type, responsible_name, responsible_phone, estimated_cost, facility_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const tasks = [
  ['HVAC System Maintenance', 'Inspect and clean HVAC system components, check filters, test temperature controls', 'Monthly inspection of HVAC system in Main Office Building', 'Maintenance', 'High', 'In Progress', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 'company', 'John Smith', 'john.smith@company.com', 500, 1],
  ['Electrical Panel Maintenance', 'Check electrical connections, test circuit breakers, inspect wiring and safety systems', 'Quarterly maintenance of main electrical panel', 'Electrical', 'Medium', 'Pending', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), 'company', 'ElectriCorp Services', 'service@electricorp.com', 750, 2]
];

tasks.forEach(task => {
  insertTask.run(...task);
});

console.log('✅ Tasks inserted (2 tasks)');

// Insert electric meters (21 meters)
const insertElectricMeter = db.prepare(`
  INSERT INTO electric_meters (name, number, location, facility_id, currentReading, previousReading, installationDate, lastReadingDate, meterType, voltage, maxCapacity, status, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const electricMeters = [
  ['Main Building', '7269305', 'Hauptgebäude', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 400, 250, 'Active', 'Hauptzähler des Gebäudes'],
  ['EG Links', '1DZG0061112423', 'Erdgeschoss Links', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 230, 100, 'Active', 'Erdgeschoss linker Bereich'],
  ['EG Rechts', '1EMH0010473016', 'Erdgeschoss Rechts', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 230, 100, 'Active', 'Erdgeschoss rechter Bereich'],
  ['1. OG Links', '1EMH0010473017', '1. Obergeschoss Links', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 230, 80, 'Active', '1. OG linker Bereich'],
  ['1. OG Rechts', '1EMH0010473018', '1. Obergeschoss Rechts', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 230, 80, 'Active', '1. OG rechter Bereich'],
  ['2. OG Links', '1EMH0010473019', '2. Obergeschoss Links', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 230, 75, 'Active', '2. OG linker Bereich'],
  ['2. OG Rechts', '1EMH0010473020', '2. Obergeschoss Rechts', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 230, 75, 'Active', '2. OG rechter Bereich'],
  ['Keller', '1EMH0010473021', 'Kellergeschoss', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 400, 200, 'Active', 'Kellerbereich'],
  ['Garage', '1EMH0010473022', 'Tiefgarage', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 400, 150, 'Active', 'Tiefgarage'],
  ['Aufzug', '1EMH0010473023', 'Aufzugsanlage', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 400, 50, 'Active', 'Aufzugsanlage'],
  ['Beleuchtung Außen', '1EMH0010473024', 'Außenbeleuchtung', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 230, 30, 'Active', 'Außenbeleuchtung'],
  ['Notbeleuchtung', '1EMH0010473025', 'Notbeleuchtung', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 230, 20, 'Active', 'Notbeleuchtung'],
  ['Klimaanlage', '1EMH0010473026', 'Klimaanlage', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 400, 300, 'Active', 'Zentrale Klimaanlage'],
  ['Server Raum', '1EMH0010473027', 'Serverraum', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 230, 100, 'Active', 'Serverraum'],
  ['Küche', '1EMH0010473028', 'Küche/Kantine', 1, 0.0, 0.0, '2020-01-15', null, 'Digital', 400, 150, 'Active', 'Küche und Kantine'],
  ['Werkstatt Haupt', '2EMH0010473029', 'Hauptwerkstatt', 2, 0.0, 0.0, '2019-03-10', null, 'Digital', 400, 500, 'Active', 'Hauptwerkstatt'],
  ['Werkstatt Neben', '2EMH0010473030', 'Nebenwerkstatt', 2, 0.0, 0.0, '2019-03-10', null, 'Digital', 400, 300, 'Active', 'Nebenwerkstatt'],
  ['Lager Werkstatt', '2EMH0010473031', 'Werkstattlager', 2, 0.0, 0.0, '2019-03-10', null, 'Digital', 230, 100, 'Active', 'Werkstattlager'],
  ['Lager Haupt', '3EMH0010473032', 'Hauptlager', 3, 0.0, 0.0, '2018-11-20', null, 'Digital', 400, 400, 'Active', 'Hauptlager'],
  ['Lager Kühl', '3EMH0010473033', 'Kühllager', 3, 0.0, 0.0, '2018-11-20', null, 'Digital', 400, 200, 'Active', 'Kühllager'],
  ['Büro Lager', '3EMH0010473034', 'Lagerbüro', 3, 0.0, 0.0, '2018-11-20', null, 'Digital', 230, 50, 'Active', 'Lagerbüro']
];

electricMeters.forEach(meter => {
  insertElectricMeter.run(...meter);
});

console.log('✅ Electric meters inserted (21 meters)');

// Insert heat/gas meters (4 meters)
const insertHeatGasMeter = db.prepare(`
  INSERT INTO heat_gas_meters (name, number, location, facility_id, meter_type, unit, currentReading, previousReading, installationDate, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const heatGasMeters = [
  ['Hauptgebäude', '0807830324', 'Hauptgebäude', 1, 'heat', 'MWh', 1250.5, 1200.0, '2020-01-15', 'Active'],
  ['Werkstatt', '37902218r', 'Werkstatt', 2, 'heat', 'MWh', 850.2, 820.5, '2019-03-10', 'Active'],
  ['Polizei', '37912473', 'Polizeistation', 3, 'heat', 'MWh', 950.8, 920.3, '2018-11-20', 'Active'],
  ['Gas', '0804521495', 'Hauptgebäude', 1, 'gas', 'm³', 15420.0, 15200.0, '2019-05-15', 'Active']
];

heatGasMeters.forEach(meter => {
  insertHeatGasMeter.run(...meter);
});

console.log('✅ Heat/gas meters inserted (4 meters)');

// Verify data
const facilitiesCount = db.prepare('SELECT COUNT(*) as count FROM facilities').get().count;
const tasksCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
const electricMetersCount = db.prepare('SELECT COUNT(*) as count FROM electric_meters').get().count;
const heatGasMetersCount = db.prepare('SELECT COUNT(*) as count FROM heat_gas_meters').get().count;

console.log('\n📊 Database verification:');
console.log(`   - Facilities: ${facilitiesCount}`);
console.log(`   - Tasks: ${tasksCount}`);
console.log(`   - Electric Meters: ${electricMetersCount}`);
console.log(`   - Heat/Gas Meters: ${heatGasMetersCount}`);

db.close();
console.log('\n✅ Database reset completed successfully!');
console.log('🔄 Please restart the server to use the new database.');
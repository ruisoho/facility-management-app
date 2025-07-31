const Database = require('better-sqlite3');
const path = require('path');

// Create database directory if it doesn't exist
const dbPath = path.join(__dirname, '..', 'data', 'facility_management.db');
const fs = require('fs');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite database
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const createTables = () => {
  // Facilities table
  db.exec(`
    CREATE TABLE IF NOT EXISTS facilities (
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
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Comprehensive tasks table matching MongoDB schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      what TEXT NOT NULL,
      description TEXT,
      insert_date TEXT DEFAULT CURRENT_TIMESTAMP,
      category TEXT DEFAULT 'Other',
      what_to_do TEXT NOT NULL,
      priority TEXT DEFAULT 'Medium',
      responsible_type TEXT NOT NULL,
      responsible_name TEXT NOT NULL,
      responsible_phone TEXT,
      responsible_email TEXT,
      responsible_department TEXT,
      deadline TEXT NOT NULL,
      finished_date TEXT,
      status TEXT DEFAULT 'Pending',
      location_building TEXT,
      location_floor TEXT,
      location_room TEXT,
      location_description TEXT,
      estimated_hours INTEGER DEFAULT 0,
      estimated_minutes INTEGER DEFAULT 0,
      actual_hours INTEGER DEFAULT 0,
      actual_minutes INTEGER DEFAULT 0,
      estimated_cost REAL DEFAULT 0,
      actual_cost REAL DEFAULT 0,
      cost_currency TEXT DEFAULT 'EUR',
      notes TEXT,
      completion_notes TEXT,
      tags TEXT, -- JSON array as string
      related_maintenance_id INTEGER,
      is_recurring BOOLEAN DEFAULT 0,
      recurring_frequency TEXT,
      next_occurrence TEXT,
      facility_id INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (facility_id) REFERENCES facilities(id),
      FOREIGN KEY (related_maintenance_id) REFERENCES maintenance(id)
    )
  `);

  // Comprehensive maintenance table matching MongoDB schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      system TEXT NOT NULL,
      system_type TEXT DEFAULT 'Other',
      cycles TEXT DEFAULT 'Monthly',
      custom_cycle_days INTEGER,
      company_name TEXT NOT NULL,
      company_contact TEXT,
      company_phone TEXT,
      company_email TEXT,
      norms TEXT, -- JSON array as string
      last_maintenance TEXT NOT NULL,
      next_maintenance TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'Active',
      priority TEXT DEFAULT 'Medium',
      cost REAL DEFAULT 0,
      location_building TEXT,
      location_floor TEXT,
      location_room TEXT,
      location_description TEXT,
      facility_id INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    )
  `);

  // Comprehensive consumption table matching MongoDB schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS consumption (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      electricity_consumption REAL NOT NULL DEFAULT 0,
      electricity_unit TEXT DEFAULT 'kWh',
      electricity_cost REAL DEFAULT 0,
      electricity_rate REAL DEFAULT 0,
      electricity_peak_hours REAL DEFAULT 0,
      electricity_off_peak_hours REAL DEFAULT 0,
      gas_consumption REAL NOT NULL DEFAULT 0,
      gas_unit TEXT DEFAULT 'm³',
      gas_cost REAL DEFAULT 0,
      gas_rate REAL DEFAULT 0,
      gas_heating_value REAL DEFAULT 10.5,
      weather_temp_avg REAL,
      weather_temp_min REAL,
      weather_temp_max REAL,
      weather_humidity REAL,
      weather_conditions TEXT,
      notes TEXT,
      meter_electricity_previous REAL,
      meter_electricity_current REAL,
      meter_electricity_reader TEXT,
      meter_gas_previous REAL,
      meter_gas_current REAL,
      meter_gas_reader TEXT,
      verified BOOLEAN DEFAULT 0,
      verified_by TEXT,
      verified_at TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create electric_meters table
  db.exec(`
    CREATE TABLE IF NOT EXISTS electric_meters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      number TEXT UNIQUE NOT NULL,
      location TEXT NOT NULL,
      facility_id INTEGER,
      currentReading REAL DEFAULT 0.0,
      previousReading REAL DEFAULT 0.0,
      installationDate TEXT,
      lastReadingDate TEXT,
      meterType TEXT DEFAULT 'Digital',
      voltage INTEGER DEFAULT 230,
      maxCapacity REAL DEFAULT 100.0,
      status TEXT DEFAULT 'Active',
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    )
  `);

  // Create daily_readings table for tracking daily consumption
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meter_id INTEGER NOT NULL,
      reading_date TEXT NOT NULL,
      reading_value REAL NOT NULL,
      consumption REAL DEFAULT 0.0,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meter_id) REFERENCES electric_meters(id) ON DELETE CASCADE,
      UNIQUE(meter_id, reading_date)
    )
  `);

  // Add attachments table for tasks and maintenance
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      path TEXT NOT NULL,
      upload_date TEXT DEFAULT CURRENT_TIMESTAMP,
      size INTEGER,
      mimetype TEXT,
      description TEXT,
      entity_type TEXT NOT NULL, -- 'task' or 'maintenance'
      entity_id INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ SQLite tables created successfully');
};
const insertSampleData = () => {
  // Insert sample facilities first
  const facilityCount = db.prepare('SELECT COUNT(*) as count FROM facilities').get();
  
  if (facilityCount.count === 0) {
    const insertFacility = db.prepare(`
      INSERT INTO facilities (name, type, location, address, description, manager, contact, area, floors, yearBuilt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleFacilities = [
      {
        name: 'Main Office Building',
        type: 'Office',
        location: 'Downtown',
        address: '123 Business Ave, City Center',
        description: 'Primary office building housing administrative departments',
        manager: 'Sarah Johnson',
        contact: 'sarah.johnson@company.com',
        area: 5000.0,
        floors: 5,
        yearBuilt: 2010
      },
      {
        name: 'Manufacturing Plant A',
        type: 'Industrial',
        location: 'Industrial District',
        address: '456 Factory Rd, Industrial Zone',
        description: 'Main production facility for manufacturing operations',
        manager: 'Mike Rodriguez',
        contact: 'mike.rodriguez@company.com',
        area: 15000.0,
        floors: 2,
        yearBuilt: 2005
      },
      {
        name: 'Warehouse Complex',
        type: 'Storage',
        location: 'Logistics Hub',
        address: '789 Storage Blvd, Warehouse District',
        description: 'Central storage and distribution facility',
        manager: 'Lisa Chen',
        contact: 'lisa.chen@company.com',
        area: 8000.0,
        floors: 1,
        yearBuilt: 2015
      }
    ];

    sampleFacilities.forEach(facility => {
      insertFacility.run(
        facility.name,
        facility.type,
        facility.location,
        facility.address,
        facility.description,
        facility.manager,
        facility.contact,
        facility.area,
        facility.floors,
        facility.yearBuilt
      );
    });

    console.log('✅ Sample facilities inserted successfully');
  }

  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
  
  if (taskCount.count === 0) {
    const insertTask = db.prepare(`
      INSERT INTO tasks (title, description, category, priority, status, deadline, responsible_type, responsible_name, responsible_contact, estimatedCost, facility_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleTasks = [
      {
        title: 'HVAC System Inspection',
        description: 'Monthly inspection of HVAC system in Main Office Building',
        category: 'Maintenance',
        priority: 'High',
        status: 'In Progress',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_type: 'employee',
        responsible_name: 'John Smith',
        responsible_contact: 'john.smith@company.com',
        estimatedCost: 500,
        facility_id: 1
      },
      {
        title: 'Electrical Panel Maintenance',
        description: 'Quarterly maintenance of main electrical panel',
        category: 'Electrical',
        priority: 'Medium',
        status: 'Pending',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_type: 'company',
        responsible_name: 'ElectriCorp Services',
        responsible_contact: 'service@electricorp.com',
        estimatedCost: 750,
        facility_id: 2
      },
      {
        title: 'Fire Safety System Check',
        description: 'Annual fire safety system inspection and testing',
        category: 'Safety',
        priority: 'High',
        status: 'Completed',
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_type: 'company',
        responsible_name: 'SafeGuard Systems',
        responsible_contact: 'info@safeguard.com',
        estimatedCost: 1200,
        facility_id: 3
      }
    ];

    sampleTasks.forEach(task => {
      insertTask.run(
        task.title,
        task.description,
        task.category,
        task.priority,
        task.status,
        task.deadline,
        task.responsible_type,
        task.responsible_name,
        task.responsible_contact,
        task.estimatedCost,
        task.facility_id
      );
    });

    console.log('✅ Sample data inserted successfully');
  }

  // Insert building electric meters
  const meterCount = db.prepare('SELECT COUNT(*) as count FROM electric_meters').get();
  
  if (meterCount.count === 0) {
    const insertMeter = db.prepare(`
      INSERT INTO electric_meters (name, number, location, facility_id, currentReading, previousReading, installationDate, lastReadingDate, meterType, voltage, maxCapacity, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const buildingMeters = [
      {
        name: 'Main Building',
        number: '7269305',
        location: 'Hauptgebäude',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 400,
        maxCapacity: 250,
        status: 'Active',
        notes: 'Hauptzähler des Gebäudes'
      },
      {
        name: 'EG Links',
        number: '1DZG0061112423',
        location: 'Erdgeschoss Links',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: 'Erdgeschoss linker Bereich'
      },
      {
        name: 'EG Rechts',
        number: '1EMH0010473016',
        location: 'Erdgeschoss Rechts',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: 'Erdgeschoss rechter Bereich'
      },
      {
        name: '1.OG Rechts',
        number: '1LOG0057059180',
        location: '1. Obergeschoss Rechts',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: '1. OG rechter Bereich'
      },
      {
        name: '1.OG Links',
        number: '6063928',
        location: '1. Obergeschoss Links',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: '1. OG linker Bereich'
      },
      {
        name: '2.OG Recht',
        number: '6063399',
        location: '2. Obergeschoss Rechts',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: '2. OG rechter Bereich'
      },
      {
        name: '2.OG Links',
        number: '6064079',
        location: '2. Obergeschoss Links',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: '2. OG linker Bereich'
      },
      {
        name: '3.OG Rechts',
        number: '1EMH0010473024',
        location: '3. Obergeschoss Rechts',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: '3. OG rechter Bereich'
      },
      {
        name: '3.OG Links',
        number: '1EMH0010470265',
        location: '3. Obergeschoss Links',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: '3. OG linker Bereich'
      },
      {
        name: '4.OG Rechts',
        number: '1ESY1160739277',
        location: '4. Obergeschoss Rechts',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: '4. OG rechter Bereich'
      },
      {
        name: '4.OG Links',
        number: '1EMH0010470267',
        location: '4. Obergeschoss Links',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: '4. OG linker Bereich'
      },
      {
        name: '5.OG Rechts',
        number: '1ESY1161389511',
        location: '5. Obergeschoss Rechts',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: '5. OG rechter Bereich'
      },
      {
        name: '5.OG Links',
        number: 'ISK0091553779',
        location: '5. Obergeschoss Links',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: '5. OG linker Bereich'
      },
      {
        name: '6.OG',
        number: '7823173',
        location: '6. Obergeschoss',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: '6. Obergeschoss'
      },
      {
        name: '7.OG',
        number: '1SK0068681982',
        location: '7. Obergeschoss',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: '7. Obergeschoss'
      },
      {
        name: 'Keller',
        number: '34985661',
        location: 'Kellergeschoss',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 230,
        maxCapacity: 100,
        status: 'Active',
        notes: 'Kellerbereich'
      },
      {
        name: 'Hausanlage',
        number: '37645930',
        location: 'Hausanlage',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 400,
        maxCapacity: 200,
        status: 'Active',
        notes: 'Allgemeine Hausanlage'
      },
      {
        name: 'Aufzug',
        number: '37504581',
        location: 'Aufzug',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 400,
        maxCapacity: 60,
        status: 'Active',
        notes: 'Personenaufzug'
      },
      {
        name: 'Lastaufzug',
        number: '38015270',
        location: 'Lastaufzug',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 400,
        maxCapacity: 80,
        status: 'Active',
        notes: 'Lastenaufzug'
      },
      {
        name: 'Heizung',
        number: '5414490',
        location: 'Heizungsanlage',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 400,
        maxCapacity: 300,
        status: 'Active',
        notes: 'Zentrale Heizungsanlage'
      },
      {
        name: 'Lüftung',
        number: '8765432',
        location: 'Lüftungsanlage',
        facility_id: 1,
        currentReading: 0.0,
        previousReading: 0.0,
        installationDate: '2020-01-15',
        lastReadingDate: null,
        meterType: 'Digital',
        voltage: 400,
        maxCapacity: 150,
        status: 'Active',
        notes: 'Zentrale Lüftungsanlage'
      }
    ];

    buildingMeters.forEach(meter => {
      insertMeter.run(
        meter.name,
        meter.number,
        meter.location,
        meter.facility_id,
        meter.currentReading,
        meter.previousReading,
        meter.installationDate,
        meter.lastReadingDate,
        meter.meterType,
        meter.voltage,
        meter.maxCapacity,
        meter.status,
        meter.notes
      );
    });

    console.log('✅ Building electric meters inserted successfully (21 meters)');
  }
};

// Initialize database
createTables();
insertSampleData();

module.exports = db;
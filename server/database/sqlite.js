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

  // Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      priority TEXT DEFAULT 'Medium',
      status TEXT DEFAULT 'Pending',
      deadline TEXT,
      finishedDate TEXT,
      responsible_type TEXT,
      responsible_name TEXT,
      responsible_contact TEXT,
      estimatedCost REAL,
      actualCost REAL,
      facility_id INTEGER,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    )
  `);

  // Maintenance table
  db.exec(`
    CREATE TABLE IF NOT EXISTS maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment TEXT NOT NULL,
      type TEXT,
      description TEXT,
      scheduledDate TEXT,
      completedDate TEXT,
      status TEXT DEFAULT 'Scheduled',
      cost REAL,
      technician TEXT,
      facility_id INTEGER,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    )
  `);

  // Consumption table
  db.exec(`
    CREATE TABLE IF NOT EXISTS consumption (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      unit TEXT,
      date TEXT,
      location TEXT,
      cost REAL,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ SQLite tables created successfully');
};

// Insert sample data
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
};

// Initialize database
createTables();
insertSampleData();

module.exports = db;
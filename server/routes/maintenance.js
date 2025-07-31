const express = require('express');
const router = express.Router();
const db = require('../database/sqlite');

// GET all maintenance records
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      priority,
      system_type,
      facility_id,
      upcoming = false
    } = req.query;

    let query = 'SELECT * FROM maintenance';
    let countQuery = 'SELECT COUNT(*) as total FROM maintenance';
    const params = [];
    const countParams = [];
    const conditions = [];

    // Add filters
    if (status) {
      conditions.push('status = ?');
      params.push(status);
      countParams.push(status);
    }
    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
      countParams.push(priority);
    }
    if (system_type) {
      conditions.push('system_type = ?');
      params.push(system_type);
      countParams.push(system_type);
    }
    if (facility_id) {
      conditions.push('facility_id = ?');
      params.push(facility_id);
      countParams.push(facility_id);
    }
    if (upcoming === 'true') {
      conditions.push('next_maintenance <= date("now", "+30 days")');
      conditions.push('status != "Completed"');
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Sorting
    const validSortColumns = ['createdAt', 'next_maintenance', 'last_maintenance', 'priority', 'status', 'system'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortColumn} ${order}`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const maintenanceRecords = db.prepare(query).all(...params);
    const totalResult = db.prepare(countQuery).get(...countParams);
    const total = totalResult.total;

    // Transform data to match MongoDB format
    const transformedRecords = maintenanceRecords.map(record => ({
      _id: record.id.toString(),
      system: record.system,
      systemType: record.system_type,
      cycles: record.cycles,
      company: {
        name: record.company_name,
        contact: {
          phone: record.company_phone,
          email: record.company_email,
          address: record.company_address
        }
      },
      norms: record.norms,
      lastMaintenance: record.last_maintenance,
      nextMaintenance: record.next_maintenance,
      proofDocuments: record.proof_documents ? JSON.parse(record.proof_documents) : [],
      notes: record.notes,
      status: record.status,
      priority: record.priority,
      cost: {
        estimated: record.estimated_cost,
        actual: record.actual_cost,
        currency: record.cost_currency
      },
      location: {
        building: record.location_building,
        floor: record.location_floor,
        room: record.location_room,
        description: record.location_description
      },
      maintenanceType: record.maintenance_type,
      duration: {
        estimated: record.estimated_duration,
        actual: record.actual_duration
      },
      technician: {
        name: record.technician_name,
        contact: record.technician_contact,
        certification: record.technician_certification
      },
      equipmentDetails: {
        manufacturer: record.equipment_manufacturer,
        model: record.equipment_model,
        serialNumber: record.equipment_serial,
        installationDate: record.equipment_installation_date,
        warrantyExpiry: record.equipment_warranty_expiry
      },
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));

    res.json({
      data: {
        maintenance: transformedRecords,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET single maintenance record
router.get('/:id', async (req, res) => {
  try {
    const record = db.prepare('SELECT * FROM maintenance WHERE id = ?').get(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    // Get attachments
    const attachments = db.prepare('SELECT * FROM attachments WHERE entity_type = ? AND entity_id = ?')
      .all('maintenance', req.params.id);

    // Transform to MongoDB format
    const transformedRecord = {
      _id: record.id.toString(),
      system: record.system,
      systemType: record.system_type,
      cycles: record.cycles,
      company: {
        name: record.company_name,
        contact: {
          phone: record.company_phone,
          email: record.company_email,
          address: record.company_address
        }
      },
      norms: record.norms,
      lastMaintenance: record.last_maintenance,
      nextMaintenance: record.next_maintenance,
      proofDocuments: record.proof_documents ? JSON.parse(record.proof_documents) : [],
      notes: record.notes,
      status: record.status,
      priority: record.priority,
      cost: {
        estimated: record.estimated_cost,
        actual: record.actual_cost,
        currency: record.cost_currency
      },
      location: {
        building: record.location_building,
        floor: record.location_floor,
        room: record.location_room,
        description: record.location_description
      },
      maintenanceType: record.maintenance_type,
      duration: {
        estimated: record.estimated_duration,
        actual: record.actual_duration
      },
      technician: {
        name: record.technician_name,
        contact: record.technician_contact,
        certification: record.technician_certification
      },
      equipmentDetails: {
        manufacturer: record.equipment_manufacturer,
        model: record.equipment_model,
        serialNumber: record.equipment_serial,
        installationDate: record.equipment_installation_date,
        warrantyExpiry: record.equipment_warranty_expiry
      },
      attachments: attachments.map(att => ({
        filename: att.filename,
        originalName: att.original_name,
        path: att.path,
        uploadDate: att.upload_date,
        size: att.size,
        mimetype: att.mimetype,
        description: att.description
      })),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };

    res.json(transformedRecord);
  } catch (error) {
    console.error('Error fetching maintenance record:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST create new maintenance record
router.post('/', async (req, res) => {
  try {
    const {
      system,
      systemType,
      cycles,
      company,
      norms,
      lastMaintenance,
      nextMaintenance,
      proofDocuments = [],
      notes,
      status = 'Scheduled',
      priority = 'Medium',
      cost = {},
      location = {},
      maintenanceType,
      duration = {},
      technician = {},
      equipmentDetails = {},
      facility_id
    } = req.body;

    // Validation
    if (!system || !systemType || !cycles) {
      return res.status(400).json({ 
        message: 'Missing required fields: system, systemType, cycles' 
      });
    }

    const insertQuery = `
      INSERT INTO maintenance (
        system, system_type, cycles, company_name, company_phone, company_email,
        company_address, norms, last_maintenance, next_maintenance, proof_documents,
        notes, status, priority, estimated_cost, actual_cost, cost_currency,
        location_building, location_floor, location_room, location_description,
        maintenance_type, estimated_duration, actual_duration, technician_name,
        technician_contact, technician_certification, equipment_manufacturer,
        equipment_model, equipment_serial, equipment_installation_date,
        equipment_warranty_expiry, facility_id, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(insertQuery).run(
      system,
      systemType,
      cycles,
      company?.name,
      company?.contact?.phone,
      company?.contact?.email,
      company?.contact?.address,
      norms,
      lastMaintenance,
      nextMaintenance,
      proofDocuments.length > 0 ? JSON.stringify(proofDocuments) : null,
      notes,
      status,
      priority,
      cost.estimated || 0,
      cost.actual || 0,
      cost.currency || 'EUR',
      location.building,
      location.floor,
      location.room,
      location.description,
      maintenanceType,
      duration.estimated,
      duration.actual,
      technician.name,
      technician.contact,
      technician.certification,
      equipmentDetails.manufacturer,
      equipmentDetails.model,
      equipmentDetails.serialNumber,
      equipmentDetails.installationDate,
      equipmentDetails.warrantyExpiry,
      facility_id,
      new Date().toISOString()
    );

    // Fetch the created record
    const newRecord = db.prepare('SELECT * FROM maintenance WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({
      _id: newRecord.id.toString(),
      system: newRecord.system,
      systemType: newRecord.system_type,
      status: newRecord.status,
      priority: newRecord.priority,
      nextMaintenance: newRecord.next_maintenance,
      createdAt: newRecord.createdAt,
      updatedAt: newRecord.updatedAt
    });
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({ message: error.message });
  }
});

// PUT update maintenance record
router.put('/:id', async (req, res) => {
  try {
    const recordId = req.params.id;
    
    // Check if record exists
    const existing = db.prepare('SELECT * FROM maintenance WHERE id = ?').get(recordId);
    if (!existing) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    const {
      system,
      systemType,
      cycles,
      company,
      norms,
      lastMaintenance,
      nextMaintenance,
      proofDocuments,
      notes,
      status,
      priority,
      cost = {},
      location = {},
      maintenanceType,
      duration = {},
      technician = {},
      equipmentDetails = {},
      facility_id
    } = req.body;

    const updateQuery = `
      UPDATE maintenance SET
        system = COALESCE(?, system),
        system_type = COALESCE(?, system_type),
        cycles = COALESCE(?, cycles),
        company_name = COALESCE(?, company_name),
        company_phone = COALESCE(?, company_phone),
        company_email = COALESCE(?, company_email),
        company_address = COALESCE(?, company_address),
        norms = COALESCE(?, norms),
        last_maintenance = COALESCE(?, last_maintenance),
        next_maintenance = COALESCE(?, next_maintenance),
        proof_documents = COALESCE(?, proof_documents),
        notes = COALESCE(?, notes),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        estimated_cost = COALESCE(?, estimated_cost),
        actual_cost = COALESCE(?, actual_cost),
        cost_currency = COALESCE(?, cost_currency),
        location_building = COALESCE(?, location_building),
        location_floor = COALESCE(?, location_floor),
        location_room = COALESCE(?, location_room),
        location_description = COALESCE(?, location_description),
        maintenance_type = COALESCE(?, maintenance_type),
        estimated_duration = COALESCE(?, estimated_duration),
        actual_duration = COALESCE(?, actual_duration),
        technician_name = COALESCE(?, technician_name),
        technician_contact = COALESCE(?, technician_contact),
        technician_certification = COALESCE(?, technician_certification),
        equipment_manufacturer = COALESCE(?, equipment_manufacturer),
        equipment_model = COALESCE(?, equipment_model),
        equipment_serial = COALESCE(?, equipment_serial),
        equipment_installation_date = COALESCE(?, equipment_installation_date),
        equipment_warranty_expiry = COALESCE(?, equipment_warranty_expiry),
        facility_id = COALESCE(?, facility_id),
        updatedAt = ?
      WHERE id = ?
    `;

    db.prepare(updateQuery).run(
      system,
      systemType,
      cycles,
      company?.name,
      company?.contact?.phone,
      company?.contact?.email,
      company?.contact?.address,
      norms,
      lastMaintenance,
      nextMaintenance,
      proofDocuments ? JSON.stringify(proofDocuments) : null,
      notes,
      status,
      priority,
      cost.estimated,
      cost.actual,
      cost.currency,
      location.building,
      location.floor,
      location.room,
      location.description,
      maintenanceType,
      duration.estimated,
      duration.actual,
      technician.name,
      technician.contact,
      technician.certification,
      equipmentDetails.manufacturer,
      equipmentDetails.model,
      equipmentDetails.serialNumber,
      equipmentDetails.installationDate,
      equipmentDetails.warrantyExpiry,
      facility_id,
      new Date().toISOString(),
      recordId
    );

    // Fetch updated record
    const updatedRecord = db.prepare('SELECT * FROM maintenance WHERE id = ?').get(recordId);
    
    res.json({
      _id: updatedRecord.id.toString(),
      system: updatedRecord.system,
      status: updatedRecord.status,
      priority: updatedRecord.priority,
      nextMaintenance: updatedRecord.next_maintenance,
      updatedAt: updatedRecord.updatedAt
    });
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE maintenance record
router.delete('/:id', async (req, res) => {
  try {
    const recordId = req.params.id;
    
    // Check if record exists
    const existing = db.prepare('SELECT id FROM maintenance WHERE id = ?').get(recordId);
    if (!existing) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    // Delete associated attachments first
    db.prepare('DELETE FROM attachments WHERE entity_type = ? AND entity_id = ?').run('maintenance', recordId);
    
    // Delete the maintenance record
    db.prepare('DELETE FROM maintenance WHERE id = ?').run(recordId);
    
    res.json({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET maintenance statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM maintenance').get().count,
      scheduled: db.prepare('SELECT COUNT(*) as count FROM maintenance WHERE status = ?').get('Scheduled').count,
      inProgress: db.prepare('SELECT COUNT(*) as count FROM maintenance WHERE status = ?').get('In Progress').count,
      completed: db.prepare('SELECT COUNT(*) as count FROM maintenance WHERE status = ?').get('Completed').count,
      overdue: db.prepare("SELECT COUNT(*) as count FROM maintenance WHERE status != ? AND scheduledDate < date('now')").get('Completed').count,
      upcoming: db.prepare("SELECT COUNT(*) as count FROM maintenance WHERE scheduledDate BETWEEN date('now') AND date('now', '+30 days') AND status != ?").get('Completed').count
    };

    // Get maintenance by type
    const typeStats = db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM maintenance 
      GROUP BY type 
      ORDER BY count DESC
    `).all();

    // Get upcoming maintenance (next 30 days)
    const upcomingMaintenance = db.prepare(`
      SELECT id, equipment, scheduledDate, status
      FROM maintenance 
      WHERE scheduledDate BETWEEN date('now') AND date('now', '+30 days')
      AND status != 'Completed'
      ORDER BY scheduledDate ASC
      LIMIT 10
    `).all();

    // Get overdue maintenance
    const overdueMaintenance = db.prepare(`
      SELECT id, equipment, scheduledDate, status
      FROM maintenance 
      WHERE scheduledDate < date('now')
      AND status != 'Completed'
      ORDER BY scheduledDate ASC
      LIMIT 10
    `).all();

    res.json({
      summary: stats,
      typeBreakdown: typeStats,
      upcomingMaintenance: upcomingMaintenance.map(record => ({
        _id: record.id.toString(),
        system: record.equipment,
        nextMaintenance: record.scheduledDate,
        status: record.status
      })),
      overdueMaintenance: overdueMaintenance.map(record => ({
        _id: record.id.toString(),
        system: record.equipment,
        nextMaintenance: record.scheduledDate,
        status: record.status
      }))
    });
  } catch (error) {
    console.error('Error fetching maintenance statistics:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST complete maintenance
router.post('/:id/complete', async (req, res) => {
  try {
    const recordId = req.params.id;
    
    // Check if record exists
    const existing = db.prepare('SELECT * FROM maintenance WHERE id = ?').get(recordId);
    if (!existing) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    const { completionNotes, actualCost, actualDuration, nextMaintenanceDate } = req.body;
    const completionDate = new Date().toISOString();

    const updateQuery = `
      UPDATE maintenance SET
        status = 'Completed',
        last_maintenance = ?,
        next_maintenance = COALESCE(?, next_maintenance),
        notes = COALESCE(?, notes),
        actual_cost = COALESCE(?, actual_cost),
        actual_duration = COALESCE(?, actual_duration),
        updatedAt = ?
      WHERE id = ?
    `;

    db.prepare(updateQuery).run(
      completionDate,
      nextMaintenanceDate,
      completionNotes,
      actualCost,
      actualDuration,
      new Date().toISOString(),
      recordId
    );

    // Fetch updated record
    const updatedRecord = db.prepare('SELECT * FROM maintenance WHERE id = ?').get(recordId);
    
    res.json({
      _id: updatedRecord.id.toString(),
      status: updatedRecord.status,
      lastMaintenance: updatedRecord.last_maintenance,
      nextMaintenance: updatedRecord.next_maintenance,
      updatedAt: updatedRecord.updatedAt
    });
  } catch (error) {
    console.error('Error completing maintenance:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET maintenance by system type
router.get('/system/:systemType', async (req, res) => {
  try {
    const { systemType } = req.params;
    const { status, limit = 50 } = req.query;

    let query = 'SELECT * FROM maintenance WHERE system_type = ?';
    const params = [systemType];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY next_maintenance ASC LIMIT ?';
    params.push(parseInt(limit));

    const records = db.prepare(query).all(...params);

    const transformedRecords = records.map(record => ({
      _id: record.id.toString(),
      system: record.system,
      systemType: record.system_type,
      status: record.status,
      priority: record.priority,
      lastMaintenance: record.last_maintenance,
      nextMaintenance: record.next_maintenance,
      location: {
        building: record.location_building,
        floor: record.location_floor,
        room: record.location_room
      }
    }));

    res.json(transformedRecords);
  } catch (error) {
    console.error('Error fetching maintenance by system type:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
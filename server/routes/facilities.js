const express = require('express');
const router = express.Router();
const db = require('../database/sqlite');

// Helper function to format facility data
const formatFacility = (row) => {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    location: row.location,
    address: row.address,
    description: row.description,
    status: row.status,
    manager: row.manager,
    contact: row.contact,
    area: row.area,
    floors: row.floors,
    yearBuilt: row.yearBuilt,
    notes: row.notes,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
};

// GET all facilities
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'name', 
      sortOrder = 'asc',
      search = '',
      type = '',
      status = ''
    } = req.query;

    let query = 'SELECT * FROM facilities WHERE 1=1';
    const params = [];

    // Add search filter
    if (search) {
      query += ' AND (name LIKE ? OR location LIKE ? OR address LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add type filter
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    // Add status filter
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Add sorting
    const validSortFields = ['name', 'type', 'location', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${order}`;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const facilities = db.prepare(query).all(...params);
    const totalFacilities = db.prepare('SELECT COUNT(*) as count FROM facilities').get().count;

    const formattedFacilities = facilities.map(formatFacility);

    res.json({
      success: true,
      data: formattedFacilities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalFacilities,
        pages: Math.ceil(totalFacilities / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching facilities', 
      error: error.message 
    });
  }
});

// GET single facility
router.get('/:id', async (req, res) => {
  try {
    const facilityId = req.params.id;
    const facility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(facilityId);
    
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    res.json({ success: true, data: formatFacility(facility) });
  } catch (error) {
    console.error('Error fetching facility:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching facility', 
      error: error.message 
    });
  }
});

// POST create facility
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      location,
      address,
      description,
      status = 'Active',
      manager,
      contact,
      area,
      floors,
      yearBuilt,
      notes
    } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Facility name is required' 
      });
    }

    const insertFacility = db.prepare(`
      INSERT INTO facilities (
        name, type, location, address, description, status,
        manager, contact, area, floors, yearBuilt, notes,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const result = insertFacility.run(
      name,
      type,
      location,
      address,
      description,
      status,
      manager,
      contact,
      area,
      floors,
      yearBuilt,
      notes,
      now,
      now
    );

    const newFacility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({ success: true, data: formatFacility(newFacility) });
  } catch (error) {
    console.error('Error creating facility:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error creating facility', 
      error: error.message 
    });
  }
});

// PUT update facility
router.put('/:id', async (req, res) => {
  try {
    const facilityId = req.params.id;
    const updates = req.body;
    
    // Check if facility exists
    const existingFacility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(facilityId);
    if (!existingFacility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];
    
    const allowedFields = ['name', 'type', 'location', 'address', 'description', 'status', 'manager', 'contact', 'area', 'floors', 'yearBuilt', 'notes'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }
    
    updateFields.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(facilityId);
    
    const updateQuery = `UPDATE facilities SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(updateQuery).run(...params);
    
    const updatedFacility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(facilityId);
    res.json({ success: true, data: formatFacility(updatedFacility) });
  } catch (error) {
    console.error('Error updating facility:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating facility', 
      error: error.message 
    });
  }
});

// DELETE facility
router.delete('/:id', async (req, res) => {
  try {
    const facilityId = req.params.id;
    const { cascade } = req.query; // Allow cascade deletion via query parameter
    
    // Check if facility exists
    const existingFacility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(facilityId);
    if (!existingFacility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    // Check if facility has associated records in all related tables
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE facility_id = ?').get(facilityId).count;
    const maintenanceCount = db.prepare('SELECT COUNT(*) as count FROM maintenance WHERE facility_id = ?').get(facilityId).count;
    const electricMeterCount = db.prepare('SELECT COUNT(*) as count FROM electric_meters WHERE facility_id = ?').get(facilityId).count;
    const heatGasMeterCount = db.prepare('SELECT COUNT(*) as count FROM heat_gas_meters WHERE facility_id = ?').get(facilityId).count;
    
    const totalAssociatedRecords = taskCount + maintenanceCount + electricMeterCount + heatGasMeterCount;
    
    if (totalAssociatedRecords > 0 && cascade !== 'true') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete facility with associated records. This facility has ${taskCount} task(s), ${maintenanceCount} maintenance record(s), ${electricMeterCount} electric meter(s), and ${heatGasMeterCount} heat/gas meter(s). To delete anyway, use cascade deletion.`,
        details: {
          taskCount,
          maintenanceCount,
          electricMeterCount,
          heatGasMeterCount,
          totalRecords: totalAssociatedRecords,
          canCascade: true
        }
      });
    }

    // If cascade deletion is requested, delete associated records first
    if (cascade === 'true') {
      db.prepare('DELETE FROM tasks WHERE facility_id = ?').run(facilityId);
      db.prepare('DELETE FROM maintenance WHERE facility_id = ?').run(facilityId);
      db.prepare('DELETE FROM electric_meters WHERE facility_id = ?').run(facilityId);
      db.prepare('DELETE FROM heat_gas_meters WHERE facility_id = ?').run(facilityId);
      console.log(`🗑️ Cascade deleted ${taskCount} tasks, ${maintenanceCount} maintenance records, ${electricMeterCount} electric meters, and ${heatGasMeterCount} heat/gas meters for facility ${facilityId}`);
    }

    db.prepare('DELETE FROM facilities WHERE id = ?').run(facilityId);
    res.json({ 
      success: true, 
      message: cascade === 'true' 
        ? `Facility and ${totalAssociatedRecords} associated records deleted successfully` 
        : 'Facility deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting facility:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting facility', 
      error: error.message 
    });
  }
});

// GET facility tasks
router.get('/:id/tasks', async (req, res) => {
  try {
    const facilityId = req.params.id;
    const { page = 1, limit = 10 } = req.query;
    
    // Check if facility exists
    const facility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const tasks = db.prepare(`
      SELECT * FROM tasks 
      WHERE facility_id = ? 
      ORDER BY createdAt DESC 
      LIMIT ? OFFSET ?
    `).all(facilityId, parseInt(limit), offset);

    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE facility_id = ?').get(facilityId).count;

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalTasks,
        pages: Math.ceil(totalTasks / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching facility tasks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching facility tasks', 
      error: error.message 
    });
  }
});

// GET facility maintenance
router.get('/:id/maintenance', async (req, res) => {
  try {
    const facilityId = req.params.id;
    const { page = 1, limit = 10 } = req.query;
    
    // Check if facility exists
    const facility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const maintenance = db.prepare(`
      SELECT * FROM maintenance 
      WHERE facility_id = ? 
      ORDER BY createdAt DESC 
      LIMIT ? OFFSET ?
    `).all(facilityId, parseInt(limit), offset);

    const totalMaintenance = db.prepare('SELECT COUNT(*) as count FROM maintenance WHERE facility_id = ?').get(facilityId).count;

    res.json({
      success: true,
      data: maintenance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalMaintenance,
        pages: Math.ceil(totalMaintenance / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching facility maintenance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching facility maintenance', 
      error: error.message 
    });
  }
});

// GET facility statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const facilityId = req.params.id;
    
    // Check if facility exists
    const facility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE facility_id = ?').get(facilityId).count;
    const completedTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE facility_id = ? AND status = "Completed"').get(facilityId).count;
    const pendingTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE facility_id = ? AND status = "Pending"').get(facilityId).count;
    const overdueTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE facility_id = ? AND deadline < ? AND status NOT IN ("Completed", "Cancelled")').get(facilityId, new Date().toISOString()).count;
    
    const totalMaintenance = db.prepare('SELECT COUNT(*) as count FROM maintenance WHERE facility_id = ?').get(facilityId).count;
    const scheduledMaintenance = db.prepare('SELECT COUNT(*) as count FROM maintenance WHERE facility_id = ? AND status = "Scheduled"').get(facilityId).count;
    const completedMaintenance = db.prepare('SELECT COUNT(*) as count FROM maintenance WHERE facility_id = ? AND status = "Completed"').get(facilityId).count;

    res.json({
      success: true,
      data: {
        facility: formatFacility(facility),
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          overdue: overdueTasks
        },
        maintenance: {
          total: totalMaintenance,
          scheduled: scheduledMaintenance,
          completed: completedMaintenance
        }
      }
    });
  } catch (error) {
    console.error('Error fetching facility stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching facility statistics', 
      error: error.message 
    });
  }
});

module.exports = router;
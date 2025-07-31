const express = require('express');
const router = express.Router();
const db = require('../database/sqlite');

// Get all electric meters with facility information
router.get('/', (req, res) => {
  try {
    const { search, status, facility_id } = req.query;
    
    let query = `
      SELECT em.*, f.name as facility_name 
      FROM electric_meters em
      LEFT JOIN facilities f ON em.facility_id = f.id
      WHERE 1=1
    `;
    const params = [];
    
    if (search) {
      query += ` AND (em.name LIKE ? OR em.number LIKE ? OR em.location LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
      query += ` AND em.status = ?`;
      params.push(status);
    }
    
    if (facility_id) {
      query += ` AND em.facility_id = ?`;
      params.push(facility_id);
    }
    
    query += ` ORDER BY em.name`;
    
    const meters = db.prepare(query).all(...params);
    
    // Add consumption calculation for each meter
    const metersWithConsumption = meters.map(meter => ({
      ...meter,
      consumption: meter.currentReading - meter.previousReading,
      consumptionFormatted: (meter.currentReading - meter.previousReading).toFixed(2)
    }));
    
    res.json({
      success: true,
      data: metersWithConsumption
    });
  } catch (error) {
    console.error('Error fetching electric meters:', error);
    res.status(500).json({ 
      success: false,
      message: 'Fehler beim Laden der Stromzähler',
      error: error.message 
    });
  }
});

// GET single electric meter
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare(`
      SELECT em.*, f.name as facility_name 
      FROM electric_meters em 
      LEFT JOIN facilities f ON em.facility_id = f.id 
      WHERE em.id = ?
    `);
    const meter = stmt.get(id);

    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Stromzähler nicht gefunden'
      });
    }

    // Add consumption calculation
    meter.consumption = meter.currentReading - meter.previousReading;
    meter.consumptionFormatted = (meter.currentReading - meter.previousReading).toFixed(2);

    res.json({
      success: true,
      data: meter
    });
  } catch (error) {
    console.error('Error fetching electric meter:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Stromzählers',
      error: error.message
    });
  }
});

// POST create new electric meter
router.post('/', async (req, res) => {
  try {
    const {
      name,
      number,
      location,
      facility_id,
      currentReading = 0,
      previousReading = 0,
      installationDate,
      meterType = 'Digital',
      voltage = 230,
      maxCapacity = 100,
      status = 'Active',
      notes
    } = req.body;

    // Validate required fields
    if (!name || !number) {
      return res.status(400).json({
        success: false,
        message: 'Name und Zählernummer sind erforderlich'
      });
    }

    // Check if meter number already exists
    const existingMeter = db.prepare('SELECT id FROM electric_meters WHERE number = ?').get(number);
    if (existingMeter) {
      return res.status(400).json({
        success: false,
        message: 'Zählernummer bereits vorhanden'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO electric_meters (
        name, number, location, facility_id, currentReading, previousReading,
        installationDate, lastReadingDate, meterType, voltage, maxCapacity, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      number,
      location,
      facility_id,
      currentReading,
      previousReading,
      installationDate,
      new Date().toISOString().split('T')[0],
      meterType,
      voltage,
      maxCapacity,
      status,
      notes
    );

    // Get the created meter
    const newMeter = db.prepare(`
      SELECT em.*, f.name as facility_name 
      FROM electric_meters em 
      LEFT JOIN facilities f ON em.facility_id = f.id 
      WHERE em.id = ?
    `).get(result.lastInsertRowid);

    newMeter.consumption = newMeter.currentReading - newMeter.previousReading;

    res.status(201).json({
      success: true,
      message: 'Stromzähler erfolgreich erstellt',
      data: newMeter
    });
  } catch (error) {
    console.error('Error creating electric meter:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Stromzählers',
      error: error.message
    });
  }
});

// PUT update electric meter
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      number,
      location,
      facility_id,
      currentReading,
      previousReading,
      installationDate,
      meterType,
      voltage,
      maxCapacity,
      status,
      notes
    } = req.body;

    // Check if meter exists
    const existingMeter = db.prepare('SELECT * FROM electric_meters WHERE id = ?').get(id);
    if (!existingMeter) {
      return res.status(404).json({
        success: false,
        message: 'Stromzähler nicht gefunden'
      });
    }

    // Check if meter number already exists (excluding current meter)
    if (number && number !== existingMeter.number) {
      const duplicateMeter = db.prepare('SELECT id FROM electric_meters WHERE number = ? AND id != ?').get(number, id);
      if (duplicateMeter) {
        return res.status(400).json({
          success: false,
          message: 'Zählernummer bereits vorhanden'
        });
      }
    }

    // Update previous reading if current reading changed
    let updatedPreviousReading = previousReading;
    if (currentReading && currentReading !== existingMeter.currentReading) {
      updatedPreviousReading = existingMeter.currentReading;
    }

    const stmt = db.prepare(`
      UPDATE electric_meters SET
        name = COALESCE(?, name),
        number = COALESCE(?, number),
        location = COALESCE(?, location),
        facility_id = COALESCE(?, facility_id),
        currentReading = COALESCE(?, currentReading),
        previousReading = COALESCE(?, previousReading),
        installationDate = COALESCE(?, installationDate),
        lastReadingDate = CASE WHEN ? IS NOT NULL THEN ? ELSE lastReadingDate END,
        meterType = COALESCE(?, meterType),
        voltage = COALESCE(?, voltage),
        maxCapacity = COALESCE(?, maxCapacity),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const lastReadingDate = currentReading ? new Date().toISOString().split('T')[0] : null;

    stmt.run(
      name,
      number,
      location,
      facility_id,
      currentReading,
      updatedPreviousReading,
      installationDate,
      lastReadingDate,
      lastReadingDate,
      meterType,
      voltage,
      maxCapacity,
      status,
      notes,
      id
    );

    // Get updated meter
    const updatedMeter = db.prepare(`
      SELECT em.*, f.name as facility_name 
      FROM electric_meters em 
      LEFT JOIN facilities f ON em.facility_id = f.id 
      WHERE em.id = ?
    `).get(id);

    updatedMeter.consumption = updatedMeter.currentReading - updatedMeter.previousReading;

    res.json({
      success: true,
      message: 'Stromzähler erfolgreich aktualisiert',
      data: updatedMeter
    });
  } catch (error) {
    console.error('Error updating electric meter:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Stromzählers',
      error: error.message
    });
  }
});

// DELETE electric meter
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if meter exists
    const existingMeter = db.prepare('SELECT * FROM electric_meters WHERE id = ?').get(id);
    if (!existingMeter) {
      return res.status(404).json({
        success: false,
        message: 'Stromzähler nicht gefunden'
      });
    }

    const stmt = db.prepare('DELETE FROM electric_meters WHERE id = ?');
    stmt.run(id);

    res.json({
      success: true,
      message: 'Stromzähler erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Error deleting electric meter:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen des Stromzählers',
      error: error.message
    });
  }
});

// POST update meter reading
router.post('/:id/reading', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentReading } = req.body;

    if (!currentReading || currentReading < 0) {
      return res.status(400).json({
        success: false,
        message: 'Gültiger Zählerstand erforderlich'
      });
    }

    // Check if meter exists
    const existingMeter = db.prepare('SELECT * FROM electric_meters WHERE id = ?').get(id);
    if (!existingMeter) {
      return res.status(404).json({
        success: false,
        message: 'Stromzähler nicht gefunden'
      });
    }

    // Update meter reading
    const stmt = db.prepare(`
      UPDATE electric_meters SET
        previousReading = currentReading,
        currentReading = ?,
        lastReadingDate = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(currentReading, new Date().toISOString().split('T')[0], id);

    // Get updated meter
    const updatedMeter = db.prepare(`
      SELECT em.*, f.name as facility_name 
      FROM electric_meters em 
      LEFT JOIN facilities f ON em.facility_id = f.id 
      WHERE em.id = ?
    `).get(id);

    updatedMeter.consumption = updatedMeter.currentReading - updatedMeter.previousReading;

    res.json({
      success: true,
      message: 'Zählerstand erfolgreich aktualisiert',
      data: updatedMeter
    });
  } catch (error) {
    console.error('Error updating meter reading:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Zählerstands',
      error: error.message
    });
  }
});

// GET electric meter statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalMeters = db.prepare('SELECT COUNT(*) as count FROM electric_meters').get().count;
    const activeMeters = db.prepare('SELECT COUNT(*) as count FROM electric_meters WHERE status = \'Active\'').get().count;
    const standbyMeters = db.prepare('SELECT COUNT(*) as count FROM electric_meters WHERE status = \'Standby\'').get().count;
    
    const totalConsumption = db.prepare(`
      SELECT SUM(currentReading - previousReading) as total 
      FROM electric_meters 
      WHERE status = 'Active'
    `).get().total || 0;

    const avgConsumption = activeMeters > 0 ? totalConsumption / activeMeters : 0;

    const totalCurrentReading = db.prepare(`
      SELECT SUM(currentReading) as total 
      FROM electric_meters 
      WHERE status = 'Active'
    `).get().total || 0;

    // Get consumption by facility
    const facilityConsumption = db.prepare(`
      SELECT f.name, SUM(em.currentReading - em.previousReading) as consumption
      FROM electric_meters em
      LEFT JOIN facilities f ON em.facility_id = f.id
      WHERE em.status = 'Active'
      GROUP BY f.id, f.name
      ORDER BY consumption DESC
    `).all();

    // Get meters by type
    const metersByType = db.prepare(`
      SELECT meterType, COUNT(*) as count
      FROM electric_meters
      GROUP BY meterType
    `).all();

    res.json({
      success: true,
      data: {
        totalMeters,
        activeMeters,
        standbyMeters,
        totalConsumption: parseFloat(totalConsumption.toFixed(2)),
        avgConsumption: parseFloat(avgConsumption.toFixed(2)),
        totalCurrentReading: parseFloat(totalCurrentReading.toFixed(2)),
        facilityConsumption,
        metersByType
      }
    });
  } catch (error) {
    console.error('Error fetching electric meter statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Statistiken',
      error: error.message
    });
  }
});

module.exports = router;
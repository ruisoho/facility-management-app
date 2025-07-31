const express = require('express');
const router = express.Router();
const db = require('../database/sqlite');

// Conversion factor: 1 m³ gas ≈ 10.55 kWh ≈ 0.01055 MWh
const GAS_TO_MWH_CONVERSION = 0.01055;

// Initialize heat and gas meters data
const initializeHeatGasMeters = () => {
  try {
    // Create heat_gas_meters table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS heat_gas_meters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        number TEXT UNIQUE NOT NULL,
        location TEXT,
        facility_id INTEGER,
        meter_type TEXT NOT NULL, -- 'heat' or 'gas'
        unit TEXT NOT NULL, -- 'MWh' for heat, 'm3' for gas
        currentReading REAL DEFAULT 0,
        previousReading REAL DEFAULT 0,
        installationDate TEXT,
        lastReadingDate TEXT,
        status TEXT DEFAULT 'Active',
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (facility_id) REFERENCES facilities (id)
      )
    `);

    // Check if data already exists
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM heat_gas_meters').get().count;
    
    if (existingCount === 0) {
      // Insert the 4 meters as specified
      const insertStmt = db.prepare(`
        INSERT INTO heat_gas_meters (
          name, number, location, facility_id, meter_type, unit, 
          currentReading, previousReading, installationDate, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const meters = [
        {
          name: 'Hauptgebäude',
          number: '0807830324',
          location: 'Hauptgebäude',
          facility_id: 1,
          meter_type: 'heat',
          unit: 'MWh',
          currentReading: 1250.5,
          previousReading: 1200.0,
          installationDate: '2020-01-15',
          status: 'Active'
        },
        {
          name: 'Werkstatt',
          number: '37902218r',
          location: 'Werkstatt',
          facility_id: 2,
          meter_type: 'heat',
          unit: 'MWh',
          currentReading: 850.2,
          previousReading: 820.5,
          installationDate: '2019-03-10',
          status: 'Active'
        },
        {
          name: 'Polizei',
          number: '37912473',
          location: 'Polizeistation',
          facility_id: 3,
          meter_type: 'heat',
          unit: 'MWh',
          currentReading: 950.8,
          previousReading: 920.3,
          installationDate: '2018-11-20',
          status: 'Active'
        },
        {
          name: 'Gas',
          number: '0804521495',
          location: 'Hauptgebäude',
          facility_id: 1,
          meter_type: 'gas',
          unit: 'm³',
          currentReading: 15420.0,
          previousReading: 15200.0,
          installationDate: '2019-05-15',
          status: 'Active'
        }
      ];

      meters.forEach(meter => {
        insertStmt.run(
          meter.name, meter.number, meter.location, meter.facility_id,
          meter.meter_type, meter.unit, meter.currentReading, meter.previousReading,
          meter.installationDate, meter.status
        );
      });

      console.log('Heat and Gas meters initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing heat and gas meters:', error);
  }
};

// Initialize on module load
initializeHeatGasMeters();

// Get all heat and gas meters with facility information
router.get('/', (req, res) => {
  try {
    const { search, status, facility_id, meter_type } = req.query;
    
    let query = `
      SELECT hgm.*, f.name as facility_name 
      FROM heat_gas_meters hgm
      LEFT JOIN facilities f ON hgm.facility_id = f.id
      WHERE 1=1
    `;
    const params = [];
    
    if (search) {
      query += ` AND (hgm.name LIKE ? OR hgm.number LIKE ? OR hgm.location LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
      query += ` AND hgm.status = ?`;
      params.push(status);
    }
    
    if (facility_id) {
      query += ` AND hgm.facility_id = ?`;
      params.push(facility_id);
    }

    if (meter_type) {
      query += ` AND hgm.meter_type = ?`;
      params.push(meter_type);
    }
    
    query += ` ORDER BY hgm.name ASC`;
    
    const stmt = db.prepare(query);
    const meters = stmt.all(...params);
    
    // Calculate consumption and add conversion for gas meters
    const metersWithConsumption = meters.map(meter => {
      const consumption = meter.currentReading - meter.previousReading;
      let consumptionMWh = consumption;
      
      // Convert gas consumption from m³ to MWh for comparison
      if (meter.meter_type === 'gas') {
        consumptionMWh = consumption * GAS_TO_MWH_CONVERSION;
      }
      
      return {
        ...meter,
        consumption: parseFloat(consumption.toFixed(2)),
        consumptionMWh: parseFloat(consumptionMWh.toFixed(3)),
        conversionNote: meter.meter_type === 'gas' ? `${consumption} m³ = ${consumptionMWh.toFixed(3)} MWh` : null
      };
    });
    
    res.json({ 
      success: true, 
      data: metersWithConsumption 
    });
  } catch (error) {
    console.error('Error fetching heat/gas meters:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Fehler beim Laden der Wärme-/Gaszähler',
      error: error.message 
    });
  }
});

// GET single heat/gas meter
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare(`
      SELECT hgm.*, f.name as facility_name 
      FROM heat_gas_meters hgm 
      LEFT JOIN facilities f ON hgm.facility_id = f.id 
      WHERE hgm.id = ?
    `);
    const meter = stmt.get(id);

    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Zähler nicht gefunden'
      });
    }

    // Calculate consumption and conversion
    const consumption = meter.currentReading - meter.previousReading;
    let consumptionMWh = consumption;
    
    if (meter.meter_type === 'gas') {
      consumptionMWh = consumption * GAS_TO_MWH_CONVERSION;
    }

    const meterWithConsumption = {
      ...meter,
      consumption: parseFloat(consumption.toFixed(2)),
      consumptionMWh: parseFloat(consumptionMWh.toFixed(3)),
      conversionNote: meter.meter_type === 'gas' ? `${consumption} m³ = ${consumptionMWh.toFixed(3)} MWh` : null
    };

    res.json({
      success: true,
      data: meterWithConsumption
    });
  } catch (error) {
    console.error('Error fetching heat/gas meter:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Zählers',
      error: error.message
    });
  }
});

// POST create new heat/gas meter
router.post('/', async (req, res) => {
  try {
    const {
      name, number, location, facility_id, meter_type, unit,
      currentReading = 0, previousReading = 0, installationDate,
      status = 'Active', notes = ''
    } = req.body;

    // Validation
    if (!name || !number || !meter_type || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Name, Zählernummer, Zählertyp und Einheit sind erforderlich'
      });
    }

    // Check if meter number already exists
    const existingMeter = db.prepare('SELECT id FROM heat_gas_meters WHERE number = ?').get(number);
    if (existingMeter) {
      return res.status(400).json({
        success: false,
        message: 'Zählernummer bereits vorhanden'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO heat_gas_meters (
        name, number, location, facility_id, meter_type, unit,
        currentReading, previousReading, installationDate, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name, number, location, facility_id, meter_type, unit,
      currentReading, previousReading, installationDate, status, notes
    );

    // Get the created meter
    const newMeter = db.prepare(`
      SELECT hgm.*, f.name as facility_name 
      FROM heat_gas_meters hgm 
      LEFT JOIN facilities f ON hgm.facility_id = f.id 
      WHERE hgm.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Zähler erfolgreich erstellt',
      data: newMeter
    });
  } catch (error) {
    console.error('Error creating heat/gas meter:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Zählers',
      error: error.message
    });
  }
});

// POST reset all meter readings to 0
router.post('/reset-readings', async (req, res) => {
  try {
    const stmt = db.prepare(`
      UPDATE heat_gas_meters SET
        currentReading = 0,
        previousReading = 0,
        updatedAt = CURRENT_TIMESTAMP
    `);

    const result = stmt.run();

    res.json({
      success: true,
      message: `Alle Zählerstände wurden auf 0 zurückgesetzt (${result.changes} Zähler aktualisiert)`,
      changes: result.changes
    });
  } catch (error) {
    console.error('Error resetting meter readings:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Zurücksetzen der Zählerstände',
      error: error.message
    });
  }
});

// PUT update heat/gas meter
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, number, location, facility_id, meter_type, unit,
      currentReading, previousReading, installationDate,
      status, notes
    } = req.body;

    // Check if meter exists
    const existingMeter = db.prepare('SELECT * FROM heat_gas_meters WHERE id = ?').get(id);
    if (!existingMeter) {
      return res.status(404).json({
        success: false,
        message: 'Zähler nicht gefunden'
      });
    }

    const stmt = db.prepare(`
      UPDATE heat_gas_meters SET
        name = COALESCE(?, name),
        number = COALESCE(?, number),
        location = COALESCE(?, location),
        facility_id = COALESCE(?, facility_id),
        meter_type = COALESCE(?, meter_type),
        unit = COALESCE(?, unit),
        currentReading = COALESCE(?, currentReading),
        previousReading = COALESCE(?, previousReading),
        installationDate = COALESCE(?, installationDate),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      name, number, location, facility_id, meter_type, unit,
      currentReading, previousReading, installationDate,
      status, notes, id
    );

    // Get updated meter
    const updatedMeter = db.prepare(`
      SELECT hgm.*, f.name as facility_name 
      FROM heat_gas_meters hgm 
      LEFT JOIN facilities f ON hgm.facility_id = f.id 
      WHERE hgm.id = ?
    `).get(id);

    res.json({
      success: true,
      message: 'Zähler erfolgreich aktualisiert',
      data: updatedMeter
    });
  } catch (error) {
    console.error('Error updating heat/gas meter:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Zählers',
      error: error.message
    });
  }
});

// DELETE heat/gas meter
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if meter exists
    const existingMeter = db.prepare('SELECT * FROM heat_gas_meters WHERE id = ?').get(id);
    if (!existingMeter) {
      return res.status(404).json({
        success: false,
        message: 'Zähler nicht gefunden'
      });
    }

    const stmt = db.prepare('DELETE FROM heat_gas_meters WHERE id = ?');
    stmt.run(id);

    res.json({
      success: true,
      message: 'Zähler erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Error deleting heat/gas meter:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen des Zählers',
      error: error.message
    });
  }
});

// GET statistics overview
router.get('/stats/overview', async (req, res) => {
  try {
    const totalMeters = db.prepare('SELECT COUNT(*) as count FROM heat_gas_meters').get().count;
    const activeMeters = db.prepare('SELECT COUNT(*) as count FROM heat_gas_meters WHERE status = \'Active\'').get().count;
    const heatMeters = db.prepare('SELECT COUNT(*) as count FROM heat_gas_meters WHERE meter_type = \'heat\'').get().count;
    const gasMeters = db.prepare('SELECT COUNT(*) as count FROM heat_gas_meters WHERE meter_type = \'gas\'').get().count;
    
    // Calculate total consumption in MWh (including gas conversion)
    const meters = db.prepare('SELECT meter_type, currentReading, previousReading FROM heat_gas_meters WHERE status = \'Active\'').all();
    let totalConsumptionMWh = 0;
    
    meters.forEach(meter => {
      const consumption = meter.currentReading - meter.previousReading;
      if (meter.meter_type === 'heat') {
        totalConsumptionMWh += consumption;
      } else if (meter.meter_type === 'gas') {
        totalConsumptionMWh += consumption * GAS_TO_MWH_CONVERSION;
      }
    });

    const avgConsumption = activeMeters > 0 ? totalConsumptionMWh / activeMeters : 0;

    res.json({
      success: true,
      data: {
        totalMeters,
        activeMeters,
        heatMeters,
        gasMeters,
        totalConsumptionMWh: parseFloat(totalConsumptionMWh.toFixed(3)),
        avgConsumption: parseFloat(avgConsumption.toFixed(3)),
        conversionFactor: GAS_TO_MWH_CONVERSION
      }
    });
  } catch (error) {
    console.error('Error fetching heat/gas meter statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Statistiken',
      error: error.message
    });
  }
});

// POST add reading to heat/gas meter
router.post('/:id/readings', async (req, res) => {
  try {
    const { id } = req.params;
    const { reading_date, reading_value, notes = '' } = req.body;

    if (!reading_date || reading_value === undefined || reading_value < 0) {
      return res.status(400).json({
        success: false,
        message: 'Gültiges Ablesedatum und Zählerstand erforderlich'
      });
    }

    // Check if meter exists
    const existingMeter = db.prepare('SELECT * FROM heat_gas_meters WHERE id = ?').get(id);
    if (!existingMeter) {
      return res.status(404).json({
        success: false,
        message: 'Zähler nicht gefunden'
      });
    }

    // Update meter with new reading
    const updateStmt = db.prepare(`
      UPDATE heat_gas_meters SET
        previousReading = currentReading,
        currentReading = ?,
        lastReadingDate = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateStmt.run(reading_value, reading_date, id);

    // Insert into daily_readings table if it exists
    try {
      const insertReadingStmt = db.prepare(`
        INSERT INTO daily_readings (meter_id, meter_type, reading_date, reading_value, consumption, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const consumption = reading_value - existingMeter.currentReading;
      insertReadingStmt.run(id, 'heat_gas', reading_date, reading_value, consumption, notes);
    } catch (error) {
      console.log('Daily readings table not available, skipping insert');
    }

    // Get updated meter
    const updatedMeter = db.prepare(`
      SELECT hgm.*, f.name as facility_name 
      FROM heat_gas_meters hgm 
      LEFT JOIN facilities f ON hgm.facility_id = f.id 
      WHERE hgm.id = ?
    `).get(id);

    const consumption = updatedMeter.currentReading - updatedMeter.previousReading;
    let consumptionMWh = consumption;
    
    // Convert gas consumption to MWh for display
    if (updatedMeter.meter_type === 'gas') {
      consumptionMWh = consumption * GAS_TO_MWH_CONVERSION;
    }

    res.json({
      success: true,
      message: `Zählerstand erfolgreich hinzugefügt! Verbrauch: ${consumption.toFixed(2)} ${updatedMeter.unit}${updatedMeter.meter_type === 'gas' ? ` (${consumptionMWh.toFixed(3)} MWh)` : ''}`,
      data: updatedMeter,
      consumption: consumption,
      consumptionMWh: consumptionMWh
    });
  } catch (error) {
    console.error('Error adding reading to heat/gas meter:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Hinzufügen des Zählerstands',
      error: error.message
    });
  }
});

// GET consumption statistics
router.get('/stats/consumption', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Get meter consumption data
    const meters = db.prepare(`
      SELECT hgm.*, f.name as facility_name 
      FROM heat_gas_meters hgm
      LEFT JOIN facilities f ON hgm.facility_id = f.id
      WHERE hgm.status = 'Active'
      ORDER BY hgm.name
    `).all();

    const meterConsumption = meters.map(meter => {
      const consumption = meter.currentReading - meter.previousReading;
      let consumptionMWh = consumption;
      
      if (meter.meter_type === 'gas') {
        consumptionMWh = consumption * GAS_TO_MWH_CONVERSION;
      }
      
      return {
        name: meter.name,
        consumption: parseFloat(consumption.toFixed(2)),
        consumptionMWh: parseFloat(consumptionMWh.toFixed(3)),
        unit: meter.unit,
        meter_type: meter.meter_type
      };
    });

    // Generate daily trend data (mock data for now since we don't have historical readings)
    const dailyTrend = [];
    const startDate = new Date(start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const endDate = new Date(end_date || new Date());
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const totalDailyConsumption = meterConsumption.reduce((sum, meter) => {
        // Mock daily consumption as a fraction of total consumption
        const dailyFraction = (Math.random() * 0.1 + 0.05); // 5-15% of total per day
        return sum + (meter.consumptionMWh * dailyFraction);
      }, 0);
      
      dailyTrend.push({
        date: dateStr,
        consumption: parseFloat(totalDailyConsumption.toFixed(3))
      });
    }

    res.json({
      meterConsumption,
      dailyTrend
    });
  } catch (error) {
    console.error('Error fetching consumption statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Verbrauchsstatistiken',
      error: error.message
    });
  }
});

module.exports = router;
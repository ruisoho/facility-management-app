const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');

// GET all maintenance records
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      system, 
      company, 
      overdue, 
      upcoming,
      page = 1, 
      limit = 10,
      sortBy = 'nextMaintenance',
      sortOrder = 'asc'
    } = req.query;

    const query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by system (partial match)
    if (system) {
      query.system = { $regex: system, $options: 'i' };
    }
    
    // Filter by company (partial match)
    if (company) {
      query['company.name'] = { $regex: company, $options: 'i' };
    }
    
    // Filter overdue items
    if (overdue === 'true') {
      query.nextMaintenance = { $lt: new Date() };
      query.status = { $ne: 'Completed' };
    }
    
    // Filter upcoming items (next 30 days)
    if (upcoming === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query.nextMaintenance = { 
        $gte: new Date(), 
        $lte: thirtyDaysFromNow 
      };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const maintenanceRecords = await Maintenance.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Maintenance.countDocuments(query);

    res.json({
      maintenanceRecords,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single maintenance record
router.get('/:id', async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new maintenance record
router.post('/', async (req, res) => {
  try {
    const maintenance = new Maintenance(req.body);
    
    // Calculate next maintenance date if not provided
    if (!req.body.nextMaintenance) {
      maintenance.calculateNextMaintenance();
    }
    
    const savedMaintenance = await maintenance.save();
    res.status(201).json(savedMaintenance);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: error.message });
  }
});

// PUT update maintenance record
router.put('/:id', async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        maintenance[key] = req.body[key];
      }
    });

    // Recalculate next maintenance if cycle or last maintenance changed
    if (req.body.cycles || req.body.lastMaintenance || req.body.customCycleDays) {
      maintenance.calculateNextMaintenance();
    }

    const updatedMaintenance = await maintenance.save();
    res.json(updatedMaintenance);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: error.message });
  }
});

// DELETE maintenance record
router.delete('/:id', async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    await Maintenance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST mark maintenance as completed
router.post('/:id/complete', async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    maintenance.status = 'Completed';
    maintenance.lastMaintenance = new Date();
    maintenance.calculateNextMaintenance();
    
    if (req.body.notes) {
      maintenance.notes = req.body.notes;
    }
    
    if (req.body.cost) {
      maintenance.cost = req.body.cost;
    }

    const updatedMaintenance = await maintenance.save();
    res.json(updatedMaintenance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET maintenance statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const stats = await Promise.all([
      // Total maintenance records
      Maintenance.countDocuments(),
      
      // Active maintenance records
      Maintenance.countDocuments({ status: 'Active' }),
      
      // Overdue maintenance
      Maintenance.countDocuments({ 
        nextMaintenance: { $lt: today },
        status: { $ne: 'Completed' }
      }),
      
      // Upcoming maintenance (next 30 days)
      Maintenance.countDocuments({
        nextMaintenance: { 
          $gte: today, 
          $lte: thirtyDaysFromNow 
        }
      }),
      
      // Completed this month
      Maintenance.countDocuments({
        status: 'Completed',
        updatedAt: {
          $gte: new Date(today.getFullYear(), today.getMonth(), 1)
        }
      }),
      
      // By system type
      Maintenance.aggregate([
        { $group: { _id: '$systemType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // By priority
      Maintenance.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      total: stats[0],
      active: stats[1],
      overdue: stats[2],
      upcoming: stats[3],
      completedThisMonth: stats[4],
      bySystemType: stats[5],
      byPriority: stats[6]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET upcoming maintenance (dashboard)
router.get('/dashboard/upcoming', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));

    const upcomingMaintenance = await Maintenance.find({
      nextMaintenance: {
        $gte: today,
        $lte: futureDate
      },
      status: { $ne: 'Completed' }
    })
    .sort({ nextMaintenance: 1 })
    .limit(10);

    res.json(upcomingMaintenance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
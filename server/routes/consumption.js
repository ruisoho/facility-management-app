const express = require('express');
const router = express.Router();
const Consumption = require('../models/Consumption');

// Mock data for development when MongoDB is not available
const mockConsumptions = [
  {
    _id: '1',
    date: new Date('2024-01-15'),
    type: 'electricity',
    consumption: 150,
    previousConsumption: 120,
    cost: 45.50,
    verified: true,
    notes: 'Monthly reading'
  },
  {
    _id: '2',
    date: new Date('2024-01-10'),
    type: 'gas',
    consumption: 85,
    previousConsumption: 70,
    cost: 32.20,
    verified: false,
    notes: 'Estimated reading'
  }
];

const mockStats = {
  totalElectricity: 1250,
  totalGas: 850,
  monthlyElectricity: 150,
  monthlyGas: 85,
  averageDaily: 12.5,
  unverifiedCount: 1
};

// Helper function to check if MongoDB is connected
const isMongoConnected = () => {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
};

// GET all consumption records
router.get('/', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Return mock data when MongoDB is not available
      return res.json({
        data: {
          consumptions: mockConsumptions,
          totalPages: 1,
          currentPage: 1,
          total: mockConsumptions.length
        }
      });
    }

    const { 
      startDate, 
      endDate, 
      page = 1, 
      limit = 31,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const consumptionRecords = await Consumption.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Consumption.countDocuments(query);

    res.json({
      data: {
        consumptions: consumptionRecords,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET consumption stats
router.get('/stats', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Return mock stats when MongoDB is not available
      return res.json({
        data: mockStats
      });
    }

    // Real MongoDB stats logic would go here
    res.json({
      data: mockStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single consumption record
router.get('/:id', async (req, res) => {
  try {
    const consumption = await Consumption.findById(req.params.id);
    if (!consumption) {
      return res.status(404).json({ message: 'Consumption record not found' });
    }
    res.json(consumption);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET consumption by date
router.get('/date/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const consumption = await Consumption.findOne({ date });
    
    if (!consumption) {
      return res.status(404).json({ message: 'No consumption data found for this date' });
    }
    
    res.json(consumption);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new consumption record
router.post('/', async (req, res) => {
  try {
    const consumption = new Consumption(req.body);
    const savedConsumption = await consumption.save();
    res.status(201).json(savedConsumption);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Consumption record for this date already exists' 
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: error.message });
  }
});

// PUT update consumption record
router.put('/:id', async (req, res) => {
  try {
    const consumption = await Consumption.findById(req.params.id);
    if (!consumption) {
      return res.status(404).json({ message: 'Consumption record not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        consumption[key] = req.body[key];
      }
    });

    const updatedConsumption = await consumption.save();
    res.json(updatedConsumption);
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

// DELETE consumption record
router.delete('/:id', async (req, res) => {
  try {
    const consumption = await Consumption.findById(req.params.id);
    if (!consumption) {
      return res.status(404).json({ message: 'Consumption record not found' });
    }

    await Consumption.findByIdAndDelete(req.params.id);
    res.json({ message: 'Consumption record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET consumption analytics
router.get('/analytics/overview', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const today = new Date();
    let startDate, endDate;

    switch(period) {
      case 'week':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        endDate = today;
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    const analytics = await Consumption.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalElectricity: { $sum: '$electricity.consumption' },
          totalGas: { $sum: '$gas.consumption' },
          totalElectricityCost: { $sum: '$electricity.cost' },
          totalGasCost: { $sum: '$gas.cost' },
          avgElectricity: { $avg: '$electricity.consumption' },
          avgGas: { $avg: '$gas.consumption' },
          maxElectricity: { $max: '$electricity.consumption' },
          maxGas: { $max: '$gas.consumption' },
          minElectricity: { $min: '$electricity.consumption' },
          minGas: { $min: '$gas.consumption' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get daily breakdown for charts
    const dailyData = await Consumption.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    res.json({
      period,
      summary: analytics[0] || {},
      dailyData,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET monthly comparison
router.get('/analytics/monthly-comparison', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const monthlyData = await Consumption.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          month: { $first: { $month: '$date' } },
          totalElectricity: { $sum: '$electricity.consumption' },
          totalGas: { $sum: '$gas.consumption' },
          totalElectricityCost: { $sum: '$electricity.cost' },
          totalGasCost: { $sum: '$gas.cost' },
          avgElectricity: { $avg: '$electricity.consumption' },
          avgGas: { $avg: '$gas.consumption' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { month: 1 }
      }
    ]);

    res.json({
      year: parseInt(year),
      monthlyData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET consumption trends
router.get('/analytics/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    const trendData = await Consumption.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Calculate trends
    const electricityTrend = calculateTrend(trendData.map(d => d.electricity.consumption));
    const gasTrend = calculateTrend(trendData.map(d => d.gas.consumption));

    res.json({
      period: `${days} days`,
      data: trendData,
      trends: {
        electricity: electricityTrend,
        gas: gasTrend
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST verify consumption record
router.post('/:id/verify', async (req, res) => {
  try {
    const consumption = await Consumption.findById(req.params.id);
    if (!consumption) {
      return res.status(404).json({ message: 'Consumption record not found' });
    }

    consumption.verified = true;
    consumption.verifiedBy = req.body.verifiedBy || 'System';
    consumption.verifiedAt = new Date();

    const updatedConsumption = await consumption.save();
    res.json(updatedConsumption);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET consumption statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [todayData, yesterdayData, thisMonthData, lastMonthData] = await Promise.all([
      Consumption.findOne({ date: today }),
      Consumption.findOne({ date: yesterday }),
      Consumption.aggregate([
        { $match: { date: { $gte: thisMonth } } },
        { 
          $group: { 
            _id: null, 
            totalElectricity: { $sum: '$electricity.consumption' },
            totalGas: { $sum: '$gas.consumption' },
            totalCost: { $sum: { $add: ['$electricity.cost', '$gas.cost'] } }
          } 
        }
      ]),
      Consumption.aggregate([
        { $match: { date: { $gte: lastMonth, $lte: lastMonthEnd } } },
        { 
          $group: { 
            _id: null, 
            totalElectricity: { $sum: '$electricity.consumption' },
            totalGas: { $sum: '$gas.consumption' },
            totalCost: { $sum: { $add: ['$electricity.cost', '$gas.cost'] } }
          } 
        }
      ])
    ]);

    res.json({
      today: todayData,
      yesterday: yesterdayData,
      thisMonth: thisMonthData[0] || { totalElectricity: 0, totalGas: 0, totalCost: 0 },
      lastMonth: lastMonthData[0] || { totalElectricity: 0, totalGas: 0, totalCost: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to calculate trend
function calculateTrend(data) {
  if (data.length < 2) return { direction: 'stable', percentage: 0 };
  
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const percentage = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  return {
    direction: percentage > 5 ? 'increasing' : percentage < -5 ? 'decreasing' : 'stable',
    percentage: Math.round(percentage * 100) / 100
  };
}

module.exports = router;
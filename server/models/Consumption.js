const mongoose = require('mongoose');

const consumptionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  electricity: {
    consumption: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['kWh', 'MWh'],
      default: 'kWh'
    },
    cost: {
      type: Number,
      min: 0,
      default: 0
    },
    rate: {
      type: Number,
      min: 0,
      default: 0
    },
    peakHours: {
      type: Number,
      min: 0,
      default: 0
    },
    offPeakHours: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  gas: {
    consumption: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['m³', 'kWh', 'therms'],
      default: 'm³'
    },
    cost: {
      type: Number,
      min: 0,
      default: 0
    },
    rate: {
      type: Number,
      min: 0,
      default: 0
    },
    heatingValue: {
      type: Number,
      min: 0,
      default: 10.5 // kWh/m³ standard heating value
    }
  },
  weather: {
    temperature: {
      avg: Number,
      min: Number,
      max: Number
    },
    humidity: Number,
    conditions: String
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  meterReadings: {
    electricity: {
      previous: Number,
      current: Number,
      reader: String
    },
    gas: {
      previous: Number,
      current: Number,
      reader: String
    }
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: String,
    trim: true
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
consumptionSchema.index({ date: -1 });
consumptionSchema.index({ 'electricity.consumption': 1 });
consumptionSchema.index({ 'gas.consumption': 1 });
consumptionSchema.index({ verified: 1 });

// Virtual for total energy cost
consumptionSchema.virtual('totalCost').get(function() {
  return (this.electricity.cost || 0) + (this.gas.cost || 0);
});

// Virtual for electricity consumption in kWh (standardized)
consumptionSchema.virtual('electricityKWh').get(function() {
  if (this.electricity.unit === 'MWh') {
    return this.electricity.consumption * 1000;
  }
  return this.electricity.consumption;
});

// Virtual for gas consumption in kWh equivalent
consumptionSchema.virtual('gasKWhEquivalent').get(function() {
  if (this.gas.unit === 'm³') {
    return this.gas.consumption * this.gas.heatingValue;
  } else if (this.gas.unit === 'therms') {
    return this.gas.consumption * 29.3; // 1 therm = 29.3 kWh
  }
  return this.gas.consumption;
});

// Static method to get consumption data for a date range
consumptionSchema.statics.getConsumptionRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: 1 });
};

// Static method to get monthly aggregation
consumptionSchema.statics.getMonthlyAggregation = function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.aggregate([
    {
      $match: {
        date: {
          $gte: startDate,
          $lte: endDate
        }
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
};

// Method to calculate daily cost
consumptionSchema.methods.calculateCosts = function() {
  if (this.electricity.rate > 0) {
    this.electricity.cost = this.electricity.consumption * this.electricity.rate;
  }
  if (this.gas.rate > 0) {
    this.gas.cost = this.gas.consumption * this.gas.rate;
  }
};

// Pre-save middleware to calculate costs if rates are provided
consumptionSchema.pre('save', function(next) {
  this.calculateCosts();
  next();
});

module.exports = mongoose.model('Consumption', consumptionSchema);
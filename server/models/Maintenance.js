const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  system: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  systemType: {
    type: String,
    required: true,
    enum: ['HVAC', 'Electrical', 'Plumbing', 'Fire Safety', 'Security', 'Elevator', 'Generator', 'Other'],
    default: 'Other'
  },
  cycles: {
    type: String,
    required: true,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'Bi-Annual', 'Custom'],
    default: 'Monthly'
  },
  customCycleDays: {
    type: Number,
    min: 1,
    max: 3650, // Max 10 years
    required: function() {
      return this.cycles === 'Custom';
    }
  },
  company: {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    contact: {
      type: String,
      trim: true,
      maxlength: 100
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 100
    }
  },
  norms: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  lastMaintenance: {
    type: Date,
    required: true
  },
  nextMaintenance: {
    type: Date,
    required: true
  },
  proofDocuments: [{
    filename: String,
    originalName: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    size: Number,
    mimetype: String
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['Active', 'Overdue', 'Completed', 'Suspended'],
    default: 'Active'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  cost: {
    type: Number,
    min: 0,
    default: 0
  },
  location: {
    building: String,
    floor: String,
    room: String,
    description: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
maintenanceSchema.index({ nextMaintenance: 1 });
maintenanceSchema.index({ system: 1 });
maintenanceSchema.index({ status: 1 });
maintenanceSchema.index({ 'company.name': 1 });

// Virtual for days until next maintenance
maintenanceSchema.virtual('daysUntilNext').get(function() {
  const today = new Date();
  const nextDate = new Date(this.nextMaintenance);
  const diffTime = nextDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to calculate next maintenance date based on cycle
maintenanceSchema.methods.calculateNextMaintenance = function() {
  const lastDate = new Date(this.lastMaintenance);
  let nextDate = new Date(lastDate);

  switch(this.cycles) {
    case 'Daily':
      nextDate.setDate(lastDate.getDate() + 1);
      break;
    case 'Weekly':
      nextDate.setDate(lastDate.getDate() + 7);
      break;
    case 'Monthly':
      nextDate.setMonth(lastDate.getMonth() + 1);
      break;
    case 'Quarterly':
      nextDate.setMonth(lastDate.getMonth() + 3);
      break;
    case 'Semi-Annual':
      nextDate.setMonth(lastDate.getMonth() + 6);
      break;
    case 'Annual':
      nextDate.setFullYear(lastDate.getFullYear() + 1);
      break;
    case 'Bi-Annual':
      nextDate.setFullYear(lastDate.getFullYear() + 2);
      break;
    case 'Custom':
      nextDate.setDate(lastDate.getDate() + this.customCycleDays);
      break;
  }

  this.nextMaintenance = nextDate;
  return nextDate;
};

// Pre-save middleware to update status based on dates
maintenanceSchema.pre('save', function(next) {
  const today = new Date();
  const nextDate = new Date(this.nextMaintenance);
  
  if (nextDate < today && this.status === 'Active') {
    this.status = 'Overdue';
  }
  
  next();
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
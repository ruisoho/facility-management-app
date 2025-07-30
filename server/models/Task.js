const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  what: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  insertDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Maintenance',
      'Repair',
      'Inspection',
      'Cleaning',
      'Safety',
      'Security',
      'Administrative',
      'Emergency',
      'Preventive',
      'Corrective',
      'Other'
    ],
    default: 'Other'
  },
  whatToDo: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  priority: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical', 'Emergency'],
    default: 'Medium'
  },
  responsible: {
    type: {
      type: String,
      enum: ['Company', 'Employee'],
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    contact: {
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
    department: {
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  deadline: {
    type: Date,
    required: true
  },
  finishedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold', 'Overdue'],
    default: 'Pending'
  },
  location: {
    building: {
      type: String,
      trim: true,
      maxlength: 100
    },
    floor: {
      type: String,
      trim: true,
      maxlength: 50
    },
    room: {
      type: String,
      trim: true,
      maxlength: 50
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200
    }
  },
  estimatedDuration: {
    hours: {
      type: Number,
      min: 0,
      max: 999
    },
    minutes: {
      type: Number,
      min: 0,
      max: 59
    }
  },
  actualDuration: {
    hours: {
      type: Number,
      min: 0,
      max: 999
    },
    minutes: {
      type: Number,
      min: 0,
      max: 59
    }
  },
  cost: {
    estimated: {
      type: Number,
      min: 0,
      default: 0
    },
    actual: {
      type: Number,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      default: 'EUR',
      maxlength: 3
    }
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    size: Number,
    mimetype: String,
    description: String
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  completionNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  relatedMaintenance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintenance'
  },
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'],
      required: function() {
        return this.recurring.isRecurring;
      }
    },
    nextOccurrence: {
      type: Date,
      required: function() {
        return this.recurring.isRecurring;
      }
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
taskSchema.index({ deadline: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ category: 1 });
taskSchema.index({ 'responsible.name': 1 });
taskSchema.index({ insertDate: -1 });

// Virtual for days until deadline
taskSchema.virtual('daysUntilDeadline').get(function() {
  const today = new Date();
  const deadlineDate = new Date(this.deadline);
  const diffTime = deadlineDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for task duration in total minutes
taskSchema.virtual('estimatedTotalMinutes').get(function() {
  const hours = this.estimatedDuration?.hours || 0;
  const minutes = this.estimatedDuration?.minutes || 0;
  return (hours * 60) + minutes;
});

taskSchema.virtual('actualTotalMinutes').get(function() {
  const hours = this.actualDuration?.hours || 0;
  const minutes = this.actualDuration?.minutes || 0;
  return (hours * 60) + minutes;
});

// Virtual for completion percentage (if applicable)
taskSchema.virtual('isOverdue').get(function() {
  return new Date() > new Date(this.deadline) && this.status !== 'Completed';
});

// Static method to get tasks by status
taskSchema.statics.getTasksByStatus = function(status) {
  return this.find({ status }).sort({ deadline: 1 });
};

// Static method to get overdue tasks
taskSchema.statics.getOverdueTasks = function() {
  return this.find({
    deadline: { $lt: new Date() },
    status: { $nin: ['Completed', 'Cancelled'] }
  }).sort({ deadline: 1 });
};

// Static method to get tasks by priority
taskSchema.statics.getTasksByPriority = function(priority) {
  return this.find({ priority }).sort({ deadline: 1 });
};

// Method to mark task as completed
taskSchema.methods.markCompleted = function(completionNotes) {
  this.status = 'Completed';
  this.finishedDate = new Date();
  if (completionNotes) {
    this.completionNotes = completionNotes;
  }
  return this.save();
};

// Method to calculate next occurrence for recurring tasks
taskSchema.methods.calculateNextOccurrence = function() {
  if (!this.recurring.isRecurring) return null;

  const currentDate = this.recurring.nextOccurrence || this.deadline;
  const nextDate = new Date(currentDate);

  switch(this.recurring.frequency) {
    case 'Daily':
      nextDate.setDate(currentDate.getDate() + 1);
      break;
    case 'Weekly':
      nextDate.setDate(currentDate.getDate() + 7);
      break;
    case 'Monthly':
      nextDate.setMonth(currentDate.getMonth() + 1);
      break;
    case 'Quarterly':
      nextDate.setMonth(currentDate.getMonth() + 3);
      break;
    case 'Annual':
      nextDate.setFullYear(currentDate.getFullYear() + 1);
      break;
  }

  this.recurring.nextOccurrence = nextDate;
  return nextDate;
};

// Pre-save middleware to update status based on deadline
taskSchema.pre('save', function(next) {
  const today = new Date();
  const deadlineDate = new Date(this.deadline);
  
  if (deadlineDate < today && this.status === 'Pending') {
    this.status = 'Overdue';
  }
  
  next();
});

module.exports = mongoose.model('Task', taskSchema);
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      category, 
      responsible,
      overdue,
      upcoming,
      page = 1, 
      limit = 20,
      sortBy = 'deadline',
      sortOrder = 'asc'
    } = req.query;

    const query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by priority
    if (priority) {
      query.priority = priority;
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by responsible person/company
    if (responsible) {
      query['responsible.name'] = { $regex: responsible, $options: 'i' };
    }
    
    // Filter overdue tasks
    if (overdue === 'true') {
      query.deadline = { $lt: new Date() };
      query.status = { $nin: ['Completed', 'Cancelled'] };
    }
    
    // Filter upcoming tasks (next 7 days)
    if (upcoming === 'true') {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      query.deadline = { 
        $gte: new Date(), 
        $lte: sevenDaysFromNow 
      };
      query.status = { $nin: ['Completed', 'Cancelled'] };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const tasks = await Task.find(query)
      .populate('relatedMaintenance', 'system company.name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('relatedMaintenance', 'system company.name cycles');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new task
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    const savedTask = await task.save();
    
    // If it's a recurring task, calculate next occurrence
    if (savedTask.recurring.isRecurring) {
      savedTask.calculateNextOccurrence();
      await savedTask.save();
    }
    
    res.status(201).json(savedTask);
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

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        task[key] = req.body[key];
      }
    });

    // Recalculate next occurrence if recurring settings changed
    if (req.body.recurring && task.recurring.isRecurring) {
      task.calculateNextOccurrence();
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
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

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST mark task as completed
router.post('/:id/complete', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.markCompleted(req.body.completionNotes);
    
    // If it's a recurring task, create next occurrence
    if (task.recurring.isRecurring) {
      const nextTask = new Task({
        ...task.toObject(),
        _id: undefined,
        status: 'Pending',
        finishedDate: undefined,
        completionNotes: undefined,
        insertDate: new Date(),
        deadline: task.recurring.nextOccurrence
      });
      
      nextTask.calculateNextOccurrence();
      await nextTask.save();
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST update task status
router.post('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    
    // If marking as completed, set finished date
    if (status === 'Completed') {
      task.finishedDate = new Date();
    }
    
    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET task statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const stats = await Promise.all([
      // Total tasks
      Task.countDocuments(),
      
      // Tasks by status
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Tasks by priority
      Task.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Tasks by category
      Task.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Overdue tasks
      Task.countDocuments({ 
        deadline: { $lt: today },
        status: { $nin: ['Completed', 'Cancelled'] }
      }),
      
      // Upcoming tasks (next 7 days)
      Task.countDocuments({
        deadline: { 
          $gte: today, 
          $lte: sevenDaysFromNow 
        },
        status: { $nin: ['Completed', 'Cancelled'] }
      }),
      
      // Completed this month
      Task.countDocuments({
        status: 'Completed',
        finishedDate: {
          $gte: new Date(today.getFullYear(), today.getMonth(), 1)
        }
      }),
      
      // Tasks by responsible type
      Task.aggregate([
        { $group: { _id: '$responsible.type', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      total: stats[0],
      byStatus: stats[1],
      byPriority: stats[2],
      byCategory: stats[3],
      overdue: stats[4],
      upcoming: stats[5],
      completedThisMonth: stats[6],
      byResponsibleType: stats[7]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET dashboard tasks
router.get('/dashboard/summary', async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const [overdueTasks, todayTasks, upcomingTasks, highPriorityTasks] = await Promise.all([
      // Overdue tasks
      Task.find({ 
        deadline: { $lt: today },
        status: { $nin: ['Completed', 'Cancelled'] }
      })
      .sort({ deadline: 1 })
      .limit(5),
      
      // Tasks due today
      Task.find({
        deadline: {
          $gte: today,
          $lt: tomorrow
        },
        status: { $nin: ['Completed', 'Cancelled'] }
      })
      .sort({ priority: 1 })
      .limit(5),
      
      // Upcoming tasks (next 7 days)
      Task.find({
        deadline: { 
          $gte: tomorrow, 
          $lte: sevenDaysFromNow 
        },
        status: { $nin: ['Completed', 'Cancelled'] }
      })
      .sort({ deadline: 1 })
      .limit(10),
      
      // High priority tasks
      Task.find({
        priority: { $in: ['High', 'Critical', 'Emergency'] },
        status: { $nin: ['Completed', 'Cancelled'] }
      })
      .sort({ deadline: 1 })
      .limit(5)
    ]);

    res.json({
      overdue: overdueTasks,
      today: todayTasks,
      upcoming: upcomingTasks,
      highPriority: highPriorityTasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET tasks by responsible person/company
router.get('/responsible/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {
      'responsible.name': { $regex: name, $options: 'i' }
    };
    
    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .sort({ deadline: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      responsible: name
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST bulk update tasks
router.post('/bulk-update', async (req, res) => {
  try {
    const { taskIds, updates } = req.body;
    
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: 'Task IDs array is required' });
    }

    const result = await Task.updateMany(
      { _id: { $in: taskIds } },
      { $set: updates }
    );

    res.json({
      message: `${result.modifiedCount} tasks updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET recurring tasks
router.get('/recurring/list', async (req, res) => {
  try {
    const recurringTasks = await Task.find({
      'recurring.isRecurring': true
    }).sort({ 'recurring.nextOccurrence': 1 });

    res.json(recurringTasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
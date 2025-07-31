const express = require('express');
const router = express.Router();
const db = require('../database/sqlite');

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      priority,
      category,
      responsible_type,
      facility_id
    } = req.query;

    let query = 'SELECT * FROM tasks';
    let countQuery = 'SELECT COUNT(*) as total FROM tasks';
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
    if (category) {
      conditions.push('category = ?');
      params.push(category);
      countParams.push(category);
    }
    if (responsible_type) {
      conditions.push('responsible_type = ?');
      params.push(responsible_type);
      countParams.push(responsible_type);
    }
    if (facility_id) {
      conditions.push('facility_id = ?');
      params.push(facility_id);
      countParams.push(facility_id);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Sorting
    const validSortColumns = ['createdAt', 'deadline', 'priority', 'status', 'what'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortColumn} ${order}`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const tasks = db.prepare(query).all(...params);
    const totalResult = db.prepare(countQuery).get(...countParams);
    const total = totalResult.total;

    // Transform data to match MongoDB format
    const transformedTasks = tasks.map(task => ({
      _id: task.id.toString(),
      what: task.what,
      description: task.description,
      insertDate: task.createdAt,
      category: task.category,
      whatToDo: task.what_to_do,
      priority: task.priority,
      responsible: {
        type: task.responsible_type,
        name: task.responsible_name,
        contact: {
          phone: task.responsible_phone,
          email: task.responsible_email
        },
        department: task.responsible_department
      },
      deadline: task.deadline,
      finishedDate: task.finishedDate,
      status: task.status,
      location: {
        building: task.location_building,
        floor: task.location_floor,
        room: task.location_room,
        description: task.location_description
      },
      estimatedDuration: {
        hours: task.estimated_hours,
        minutes: task.estimated_minutes
      },
      actualDuration: {
        hours: task.actual_hours,
        minutes: task.actual_minutes
      },
      cost: {
        estimated: task.estimatedCost,
        actual: task.actualCost,
        currency: task.cost_currency
      },
      notes: task.notes,
      completionNotes: task.completion_notes,
      tags: task.tags ? JSON.parse(task.tags) : [],
      relatedMaintenance: task.related_maintenance_id,
      recurring: {
        isRecurring: Boolean(task.is_recurring),
        frequency: task.recurring_frequency,
        nextOccurrence: task.next_occurrence
      },
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));

    res.json({
      data: {
        data: transformedTasks,
        pagination: {
          pages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET single task
router.get('/:id', async (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get attachments
    const attachments = db.prepare('SELECT * FROM attachments WHERE entity_type = ? AND entity_id = ?')
      .all('task', req.params.id);

    // Transform to MongoDB format
    const transformedTask = {
      _id: task.id.toString(),
      what: task.title,
      description: task.description,
      insertDate: task.createdAt,
      category: task.category,
      whatToDo: task.what_to_do,
      priority: task.priority,
      responsible: {
        type: task.responsible_type,
        name: task.responsible_name,
        contact: {
          phone: task.responsible_phone,
          email: task.responsible_email
        },
        department: task.responsible_department
      },
      deadline: task.deadline,
      finishedDate: task.finishedDate,
      status: task.status,
      location: {
        building: task.location_building,
        floor: task.location_floor,
        room: task.location_room,
        description: task.location_description
      },
      estimatedDuration: {
        hours: task.estimated_hours,
        minutes: task.estimated_minutes
      },
      actualDuration: {
        hours: task.actual_hours,
        minutes: task.actual_minutes
      },
      cost: {
        estimated: task.estimatedCost,
        actual: task.actualCost,
        currency: task.cost_currency
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
      notes: task.notes,
      completionNotes: task.completion_notes,
      tags: task.tags ? JSON.parse(task.tags) : [],
      relatedMaintenance: task.related_maintenance_id,
      recurring: {
        isRecurring: Boolean(task.is_recurring),
        frequency: task.recurring_frequency,
        nextOccurrence: task.next_occurrence
      },
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };

    res.json(transformedTask);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST create new task
router.post('/', async (req, res) => {
  try {
    const {
      what,
      description,
      category = 'Other',
      whatToDo,
      priority = 'Medium',
      responsible,
      deadline,
      status = 'Pending',
      location = {},
      estimatedDuration = {},
      cost = {},
      notes,
      tags = [],
      relatedMaintenance,
      recurring = {},
      facility_id
    } = req.body;

    // Validation
    if (!what || !whatToDo || !responsible?.type || !responsible?.name || !deadline) {
      return res.status(400).json({ 
        message: 'Missing required fields: what, whatToDo, responsible (type, name), deadline' 
      });
    }

    const insertQuery = `
      INSERT INTO tasks (
        what, description, category, what_to_do, priority, responsible_type,
        responsible_name, responsible_phone, responsible_email, responsible_department,
        deadline, status, location_building, location_floor, location_room,
        location_description, estimated_hours, estimated_minutes, estimated_cost,
        cost_currency, notes, tags, related_maintenance_id, is_recurring,
        recurring_frequency, next_occurrence, facility_id, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(insertQuery).run(
      what,
      description,
      category,
      whatToDo,
      priority,
      responsible.type,
      responsible.name,
      responsible.contact?.phone,
      responsible.contact?.email,
      responsible.department,
      deadline,
      status,
      location.building,
      location.floor,
      location.room,
      location.description,
      estimatedDuration.hours || 0,
      estimatedDuration.minutes || 0,
      cost.estimated || 0,
      cost.currency || 'EUR',
      notes,
      tags.length > 0 ? JSON.stringify(tags) : null,
      relatedMaintenance,
      recurring.isRecurring ? 1 : 0,
      recurring.frequency,
      recurring.nextOccurrence,
      facility_id,
      new Date().toISOString()
    );

    // Fetch the created task
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({
      _id: newTask.id.toString(),
      what: newTask.what,
      description: newTask.description,
      category: newTask.category,
      priority: newTask.priority,
      status: newTask.status,
      deadline: newTask.deadline,
      responsible: {
        type: newTask.responsible_type,
        name: newTask.responsible_name
      },
      createdAt: newTask.createdAt,
      updatedAt: newTask.updatedAt
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: error.message });
  }
});

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Check if task exists
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!existing) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const {
      what,
      description,
      category,
      whatToDo,
      priority,
      responsible,
      deadline,
      finishedDate,
      status,
      location = {},
      estimatedDuration = {},
      actualDuration = {},
      cost = {},
      notes,
      completionNotes,
      tags = [],
      relatedMaintenance,
      recurring = {},
      facility_id
    } = req.body;

    const updateQuery = `
      UPDATE tasks SET
        what = COALESCE(?, what),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        what_to_do = COALESCE(?, what_to_do),
        priority = COALESCE(?, priority),
        responsible_type = COALESCE(?, responsible_type),
        responsible_name = COALESCE(?, responsible_name),
        responsible_phone = COALESCE(?, responsible_phone),
        responsible_email = COALESCE(?, responsible_email),
        responsible_department = COALESCE(?, responsible_department),
        deadline = COALESCE(?, deadline),
        finished_date = COALESCE(?, finished_date),
        status = COALESCE(?, status),
        location_building = COALESCE(?, location_building),
        location_floor = COALESCE(?, location_floor),
        location_room = COALESCE(?, location_room),
        location_description = COALESCE(?, location_description),
        estimated_hours = COALESCE(?, estimated_hours),
        estimated_minutes = COALESCE(?, estimated_minutes),
        actual_hours = COALESCE(?, actual_hours),
        actual_minutes = COALESCE(?, actual_minutes),
        estimated_cost = COALESCE(?, estimated_cost),
        actual_cost = COALESCE(?, actual_cost),
        cost_currency = COALESCE(?, cost_currency),
        notes = COALESCE(?, notes),
        completion_notes = COALESCE(?, completion_notes),
        tags = COALESCE(?, tags),
        related_maintenance_id = COALESCE(?, related_maintenance_id),
        is_recurring = COALESCE(?, is_recurring),
        recurring_frequency = COALESCE(?, recurring_frequency),
        next_occurrence = COALESCE(?, next_occurrence),
        facility_id = COALESCE(?, facility_id),
        updatedAt = ?
      WHERE id = ?
    `;

    db.prepare(updateQuery).run(
      what,
      description,
      category,
      whatToDo,
      priority,
      responsible?.type,
      responsible?.name,
      responsible?.contact?.phone,
      responsible?.contact?.email,
      responsible?.department,
      deadline,
      finishedDate,
      status,
      location.building,
      location.floor,
      location.room,
      location.description,
      estimatedDuration.hours,
      estimatedDuration.minutes,
      actualDuration.hours,
      actualDuration.minutes,
      cost.estimated,
      cost.actual,
      cost.currency,
      notes,
      completionNotes,
      tags.length > 0 ? JSON.stringify(tags) : null,
      relatedMaintenance,
      recurring.isRecurring !== undefined ? (recurring.isRecurring ? 1 : 0) : undefined,
      recurring.frequency,
      recurring.nextOccurrence,
      facility_id,
      new Date().toISOString(),
      taskId
    );

    // Fetch updated task
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    
    res.json({
      _id: updatedTask.id.toString(),
      what: updatedTask.what,
      status: updatedTask.status,
      priority: updatedTask.priority,
      deadline: updatedTask.deadline,
      updatedAt: updatedTask.updatedAt
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Check if task exists
    const existing = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
    if (!existing) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Delete associated attachments first
    db.prepare('DELETE FROM attachments WHERE entity_type = ? AND entity_id = ?').run('task', taskId);
    
    // Delete the task
    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET task statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM tasks').get().count,
      pending: db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('Pending').count,
      inProgress: db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('In Progress').count,
      completed: db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('Completed').count,
      overdue: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status != ? AND deadline < date('now')").get('Completed').count,
      highPriority: db.prepare('SELECT COUNT(*) as count FROM tasks WHERE priority IN (?, ?)').get('High', 'Critical').count
    };

    // Get tasks by category
    const categoryStats = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM tasks 
      GROUP BY category 
      ORDER BY count DESC
    `).all();

    // Get upcoming deadlines (next 7 days)
    const upcomingTasks = db.prepare(`
      SELECT id, what, deadline, priority, status
      FROM tasks 
      WHERE deadline BETWEEN date('now') AND date('now', '+7 days')
      AND status != 'Completed'
      ORDER BY deadline ASC
      LIMIT 10
    `).all();

    res.json({
      summary: stats,
      categoryBreakdown: categoryStats,
      upcomingDeadlines: upcomingTasks.map(task => ({
        _id: task.id.toString(),
        what: task.what,
        deadline: task.deadline,
        priority: task.priority,
        status: task.status
      }))
    });
  } catch (error) {
    console.error('Error fetching task statistics:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST complete task
router.post('/:id/complete', async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Check if task exists
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!existing) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { completionNotes, actualCost, actualDuration } = req.body;
    const finishedDate = new Date().toISOString();

    const updateQuery = `
      UPDATE tasks SET
        status = 'Completed',
        finished_date = ?,
        completion_notes = COALESCE(?, completion_notes),
        actual_cost = COALESCE(?, actual_cost),
        actual_hours = COALESCE(?, actual_hours),
        actual_minutes = COALESCE(?, actual_minutes),
        updatedAt = ?
      WHERE id = ?
    `;

    db.prepare(updateQuery).run(
      finishedDate,
      completionNotes,
      actualCost,
      actualDuration?.hours,
      actualDuration?.minutes,
      new Date().toISOString(),
      taskId
    );

    // Fetch updated task
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    
    res.json({
      _id: updatedTask.id.toString(),
      status: updatedTask.status,
      finishedDate: updatedTask.finished_date,
      completionNotes: updatedTask.completion_notes,
      updatedAt: updatedTask.updatedAt
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
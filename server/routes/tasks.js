const express = require('express');
const router = express.Router();
const db = require('../database/sqlite');

// Helper function to format task data
const formatTask = (row) => {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    location: row.location,
    priority: row.priority,
    status: row.status,
    deadline: row.deadline ? new Date(row.deadline) : null,
    finishedDate: row.finishedDate ? new Date(row.finishedDate) : null,
    responsible: {
      type: row.responsible_type,
      name: row.responsible_name,
      contact: row.responsible_contact
    },
    facility: row.facility_id ? {
      id: row.facility_id,
      name: row.facility_name,
      location: row.facility_location,
      type: row.facility_type
    } : null,
    facility_id: row.facility_id,
    estimatedCost: row.estimatedCost,
    actualCost: row.actualCost,
    notes: row.notes,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
};

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

    let query = `
      SELECT t.*, 
             f.name as facility_name, 
             f.location as facility_location, 
             f.type as facility_type
      FROM tasks t
      LEFT JOIN facilities f ON t.facility_id = f.id
      WHERE 1=1
    `;
    const params = [];
    
    // Filter by status
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    // Filter by priority
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }
    
    // Filter by category
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    // Filter by responsible person/company
    if (responsible) {
      query += ' AND responsible_name LIKE ?';
      params.push(`%${responsible}%`);
    }
    
    // Filter overdue tasks
    if (overdue === 'true') {
      query += ' AND deadline < ? AND status NOT IN ("Completed", "Cancelled")';
      params.push(new Date().toISOString());
    }
    
    // Filter upcoming tasks (next 7 days)
    if (upcoming === 'true') {
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);
      query += ' AND deadline BETWEEN ? AND ? AND status NOT IN ("Completed", "Cancelled")';
      params.push(today.toISOString(), sevenDaysFromNow.toISOString());
    }
    
    // Add sorting
    const validSortFields = ['deadline', 'createdAt', 'updatedAt', 'priority', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'deadline';
    const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${order}`;
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const tasks = db.prepare(query).all(...params);
    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
    
    const formattedTasks = tasks.map(formatTask);
    
    res.json({
      success: true,
      data: formattedTasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalTasks,
        pages: Math.ceil(totalTasks / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tasks', 
      error: error.message 
    });
  }
});

// GET single task
router.get('/:id', async (req, res) => {
  try {
    const task = db.prepare(`
    SELECT t.*, 
           f.name as facility_name, 
           f.location as facility_location, 
           f.type as facility_type
    FROM tasks t
    LEFT JOIN facilities f ON t.facility_id = f.id
    WHERE t.id = ?
  `).get(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    res.json({ success: true, data: formatTask(task) });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching task', 
      error: error.message 
    });
  }
});

// POST create task
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority = 'Medium',
      status = 'Pending',
      deadline,
      responsible,
      estimatedCost,
      notes
    } = req.body;

    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title is required' 
      });
    }

    const insertTask = db.prepare(`
      INSERT INTO tasks (
        title, description, category, priority, status, deadline,
        responsible_type, responsible_name, responsible_contact,
        estimatedCost, notes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const result = insertTask.run(
      title,
      description,
      category,
      priority,
      status,
      deadline,
      responsible?.type,
      responsible?.name,
      responsible?.contact,
      estimatedCost,
      notes,
      now,
      now
    );

    const newTask = db.prepare(`
      SELECT t.*, 
             f.name as facility_name, 
             f.location as facility_location, 
             f.type as facility_type
      FROM tasks t
      LEFT JOIN facilities f ON t.facility_id = f.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json({ success: true, data: formatTask(newTask) });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error creating task', 
      error: error.message 
    });
  }
});

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    
    // Check if task exists
    const existingTask = db.prepare(`
      SELECT t.*, 
             f.name as facility_name, 
             f.location as facility_location, 
             f.type as facility_type
      FROM tasks t
      LEFT JOIN facilities f ON t.facility_id = f.id
      WHERE t.id = ?
    `).get(taskId);
    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];
    
    const allowedFields = [
      'title', 'description', 'category', 'priority', 'status', 'deadline',
      'finishedDate', 'estimatedCost', 'actualCost', 'notes'
    ];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    });
    
    // Handle responsible object
    if (updates.responsible) {
      if (updates.responsible.type !== undefined) {
        updateFields.push('responsible_type = ?');
        params.push(updates.responsible.type);
      }
      if (updates.responsible.name !== undefined) {
        updateFields.push('responsible_name = ?');
        params.push(updates.responsible.name);
      }
      if (updates.responsible.contact !== undefined) {
        updateFields.push('responsible_contact = ?');
        params.push(updates.responsible.contact);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }
    
    // Add updatedAt
    updateFields.push('updatedAt = ?');
    params.push(new Date().toISOString());
    
    // Add WHERE clause parameter
    params.push(taskId);
    
    const updateQuery = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(updateQuery).run(...params);
    
    // Fetch updated task
    const updatedTask = db.prepare(`
      SELECT t.*, 
             f.name as facility_name, 
             f.location as facility_location, 
             f.type as facility_type
      FROM tasks t
      LEFT JOIN facilities f ON t.facility_id = f.id
      WHERE t.id = ?
    `).get(taskId);
    
    res.json({ success: true, data: formatTask(updatedTask) });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error updating task', 
      error: error.message 
    });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting task', 
      error: error.message 
    });
  }
});

// POST complete task
router.post('/:id/complete', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { notes } = req.body;
    
    const updateQuery = `
      UPDATE tasks 
      SET status = 'Completed', finishedDate = ?, notes = COALESCE(?, notes), updatedAt = ?
      WHERE id = ?
    `;
    
    const now = new Date().toISOString();
    const result = db.prepare(updateQuery).run(now, notes, now, taskId);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const updatedTask = db.prepare(`
      SELECT t.*, 
             f.name as facility_name, 
             f.location as facility_location, 
             f.type as facility_type
      FROM tasks t
      LEFT JOIN facilities f ON t.facility_id = f.id
      WHERE t.id = ?
    `).get(taskId);
    
    res.json({ success: true, data: formatTask(updatedTask) });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error completing task', 
      error: error.message 
    });
  }
});

// POST update task status
router.post('/:id/status', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    
    const updateQuery = 'UPDATE tasks SET status = ?, updatedAt = ? WHERE id = ?';
    const result = db.prepare(updateQuery).run(status, new Date().toISOString(), taskId);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const updatedTask = db.prepare(`
      SELECT t.*, 
             f.name as facility_name, 
             f.location as facility_location, 
             f.type as facility_type
      FROM tasks t
      LEFT JOIN facilities f ON t.facility_id = f.id
      WHERE t.id = ?
    `).get(taskId);
    
    res.json({ success: true, data: formatTask(updatedTask) });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating task status', 
      error: error.message 
    });
  }
});

// GET task statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const today = new Date().toISOString();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(new Date().getDate() + 7);
    const sevenDaysFromNowISO = sevenDaysFromNow.toISOString();
    
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const firstDayOfMonthISO = firstDayOfMonth.toISOString();
    
    // Total tasks
    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
    
    // Tasks by status
    const tasksByStatus = db.prepare(`
      SELECT status as _id, COUNT(*) as count 
      FROM tasks 
      GROUP BY status 
      ORDER BY count DESC
    `).all();
    
    // Tasks by priority
    const tasksByPriority = db.prepare(`
      SELECT priority as _id, COUNT(*) as count 
      FROM tasks 
      GROUP BY priority 
      ORDER BY count DESC
    `).all();
    
    // Tasks by category
    const tasksByCategory = db.prepare(`
      SELECT category as _id, COUNT(*) as count 
      FROM tasks 
      WHERE category IS NOT NULL
      GROUP BY category 
      ORDER BY count DESC
    `).all();
    
    // Overdue tasks
    const overdueTasks = db.prepare(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE deadline < ? AND status NOT IN ('Completed', 'Cancelled')
    `).get(today).count;
    
    // Upcoming tasks (next 7 days)
    const upcomingTasks = db.prepare(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE deadline BETWEEN ? AND ? AND status NOT IN ('Completed', 'Cancelled')
    `).get(today, sevenDaysFromNowISO).count;
    
    // Completed this month
    const completedThisMonth = db.prepare(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE status = 'Completed' AND finishedDate >= ?
    `).get(firstDayOfMonthISO).count;
    
    // Tasks by responsible type
    const tasksByResponsibleType = db.prepare(`
      SELECT responsible_type as _id, COUNT(*) as count 
      FROM tasks 
      WHERE responsible_type IS NOT NULL
      GROUP BY responsible_type
    `).all();
    
    res.json({
      success: true,
      data: {
        totalTasks,
        tasksByStatus,
        tasksByPriority,
        tasksByCategory,
        overdueTasks,
        upcomingTasks,
        completedThisMonth,
        tasksByResponsibleType
      }
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching task statistics', 
      error: error.message 
    });
  }
});

module.exports = router;
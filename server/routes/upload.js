const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/sqlite');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

// POST upload file for task
router.post('/task/:taskId', upload.single('file'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if task exists
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Insert attachment record
    const insertQuery = `
      INSERT INTO attachments (
        filename, original_name, path, size, mimetype, description,
        entity_type, entity_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(insertQuery).run(
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      description || '',
      'task',
      taskId
    );

    // Get the created attachment
    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      id: attachment.id,
      filename: attachment.filename,
      originalName: attachment.original_name,
      path: attachment.path,
      size: attachment.size,
      mimetype: attachment.mimetype,
      description: attachment.description,
      uploadDate: attachment.upload_date,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file for task:', error);
    
    // Clean up uploaded file if database operation failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: error.message });
  }
});

// POST upload file for maintenance
router.post('/maintenance/:maintenanceId', upload.single('file'), async (req, res) => {
  try {
    const { maintenanceId } = req.params;
    const { description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if maintenance record exists
    const maintenance = db.prepare('SELECT id FROM maintenance WHERE id = ?').get(maintenanceId);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    // Insert attachment record
    const insertQuery = `
      INSERT INTO attachments (
        filename, original_name, path, size, mimetype, description,
        entity_type, entity_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(insertQuery).run(
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      description || '',
      'maintenance',
      maintenanceId
    );

    // Get the created attachment
    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      id: attachment.id,
      filename: attachment.filename,
      originalName: attachment.original_name,
      path: attachment.path,
      size: attachment.size,
      mimetype: attachment.mimetype,
      description: attachment.description,
      uploadDate: attachment.upload_date,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file for maintenance:', error);
    
    // Clean up uploaded file if database operation failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: error.message });
  }
});

// POST upload multiple files
router.post('/multiple/:entityType/:entityId', upload.array('files', 5), async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { descriptions } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    if (!['task', 'maintenance'].includes(entityType)) {
      return res.status(400).json({ message: 'Invalid entity type' });
    }

    // Check if entity exists
    const tableName = entityType === 'task' ? 'tasks' : 'maintenance';
    const entity = db.prepare(`SELECT id FROM ${tableName} WHERE id = ?`).get(entityId);
    if (!entity) {
      return res.status(404).json({ message: `${entityType} not found` });
    }

    const uploadedFiles = [];
    const descriptionsArray = descriptions ? JSON.parse(descriptions) : [];

    // Insert each file
    const insertQuery = `
      INSERT INTO attachments (
        filename, original_name, path, size, mimetype, description,
        entity_type, entity_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const description = descriptionsArray[i] || '';

      try {
        const result = db.prepare(insertQuery).run(
          file.filename,
          file.originalname,
          file.path,
          file.size,
          file.mimetype,
          description,
          entityType,
          entityId
        );

        const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);
        
        uploadedFiles.push({
          id: attachment.id,
          filename: attachment.filename,
          originalName: attachment.original_name,
          path: attachment.path,
          size: attachment.size,
          mimetype: attachment.mimetype,
          description: attachment.description,
          uploadDate: attachment.upload_date
        });
      } catch (error) {
        console.error(`Error inserting file ${file.filename}:`, error);
        // Clean up the file if database operation failed
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.status(201).json({
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    
    // Clean up uploaded files if operation failed
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ message: error.message });
  }
});

// GET download file
router.get('/download/:attachmentId', async (req, res) => {
  try {
    const { attachmentId } = req.params;

    // Get attachment info
    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_name}"`);
    res.setHeader('Content-Type', attachment.mimetype);

    // Stream the file
    const fileStream = fs.createReadStream(attachment.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE file
router.delete('/:attachmentId', async (req, res) => {
  try {
    const { attachmentId } = req.params;

    // Get attachment info
    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete file from disk
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }

    // Delete from database
    db.prepare('DELETE FROM attachments WHERE id = ?').run(attachmentId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET files for entity
router.get('/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    if (!['task', 'maintenance'].includes(entityType)) {
      return res.status(400).json({ message: 'Invalid entity type' });
    }

    const attachments = db.prepare('SELECT * FROM attachments WHERE entity_type = ? AND entity_id = ? ORDER BY upload_date DESC')
      .all(entityType, entityId);

    const transformedAttachments = attachments.map(att => ({
      id: att.id,
      filename: att.filename,
      originalName: att.original_name,
      path: att.path,
      size: att.size,
      mimetype: att.mimetype,
      description: att.description,
      uploadDate: att.upload_date,
      downloadUrl: `/api/upload/download/${att.id}`
    }));

    res.json(transformedAttachments);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: error.message });
  }
});

// PUT update file description
router.put('/:attachmentId/description', async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const { description } = req.body;

    // Check if attachment exists
    const existing = db.prepare('SELECT id FROM attachments WHERE id = ?').get(attachmentId);
    if (!existing) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Update description
    db.prepare('UPDATE attachments SET description = ? WHERE id = ?').run(description || '', attachmentId);

    res.json({ message: 'File description updated successfully' });
  } catch (error) {
    console.error('Error updating file description:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET upload statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = {
      totalFiles: db.prepare('SELECT COUNT(*) as count FROM attachments').get().count,
      taskFiles: db.prepare('SELECT COUNT(*) as count FROM attachments WHERE entity_type = ?').get('task').count,
      maintenanceFiles: db.prepare('SELECT COUNT(*) as count FROM attachments WHERE entity_type = ?').get('maintenance').count,
      totalSize: db.prepare('SELECT SUM(size) as total FROM attachments').get().total || 0
    };

    // Get file types breakdown
    const fileTypes = db.prepare(`
      SELECT 
        CASE 
          WHEN mimetype LIKE 'image/%' THEN 'Images'
          WHEN mimetype LIKE 'application/pdf' THEN 'PDFs'
          WHEN mimetype LIKE 'application/vnd.ms-excel%' OR mimetype LIKE 'application/vnd.openxmlformats-officedocument.spreadsheetml%' THEN 'Spreadsheets'
          WHEN mimetype LIKE 'application/msword%' OR mimetype LIKE 'application/vnd.openxmlformats-officedocument.wordprocessingml%' THEN 'Documents'
          ELSE 'Others'
        END as type,
        COUNT(*) as count
      FROM attachments 
      GROUP BY type
      ORDER BY count DESC
    `).all();

    // Get recent uploads
    const recentUploads = db.prepare(`
      SELECT a.*, 
        CASE 
          WHEN a.entity_type = 'task' THEN t.what
          WHEN a.entity_type = 'maintenance' THEN m.system
        END as entity_name
      FROM attachments a
      LEFT JOIN tasks t ON a.entity_type = 'task' AND a.entity_id = t.id
      LEFT JOIN maintenance m ON a.entity_type = 'maintenance' AND a.entity_id = m.id
      ORDER BY a.upload_date DESC
      LIMIT 10
    `).all();

    res.json({
      summary: stats,
      fileTypeBreakdown: fileTypes,
      recentUploads: recentUploads.map(upload => ({
        id: upload.id,
        filename: upload.original_name,
        entityType: upload.entity_type,
        entityName: upload.entity_name,
        uploadDate: upload.upload_date,
        size: upload.size
      }))
    });
  } catch (error) {
    console.error('Error fetching upload statistics:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
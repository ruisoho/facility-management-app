const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const Task = require('../models/Task');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(uploadsDir, req.params.type || 'general');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, Word, Excel, and text files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// POST upload files for maintenance records
router.post('/maintenance/:id', upload.array('files', 5), async (req, res) => {
  try {
    const maintenanceId = req.params.id;
    const maintenance = await Maintenance.findById(maintenanceId);
    
    if (!maintenance) {
      // Clean up uploaded files if maintenance record doesn't exist
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        });
      }
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Add file information to maintenance record
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadDate: new Date()
    }));

    maintenance.proofDocuments.push(...uploadedFiles);
    await maintenance.save();

    res.json({
      message: `${req.files.length} file(s) uploaded successfully`,
      files: uploadedFiles,
      maintenanceId: maintenanceId
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    res.status(500).json({ message: error.message });
  }
});

// POST upload files for tasks
router.post('/task/:id', upload.array('files', 5), async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    
    if (!task) {
      // Clean up uploaded files if task doesn't exist
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        });
      }
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Add file information to task
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadDate: new Date(),
      description: req.body.description || ''
    }));

    task.attachments.push(...uploadedFiles);
    await task.save();

    res.json({
      message: `${req.files.length} file(s) uploaded successfully`,
      files: uploadedFiles,
      taskId: taskId
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    res.status(500).json({ message: error.message });
  }
});

// GET download file
router.get('/download/:type/:filename', (req, res) => {
  try {
    const { type, filename } = req.params;
    const filePath = path.join(uploadsDir, type, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Security check - ensure the file is within the uploads directory
    const resolvedPath = path.resolve(filePath);
    const uploadsPath = path.resolve(uploadsDir);
    
    if (!resolvedPath.startsWith(uploadsPath)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ message: 'Error downloading file' });
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET view file (for images and PDFs)
router.get('/view/:type/:filename', (req, res) => {
  try {
    const { type, filename } = req.params;
    const filePath = path.join(uploadsDir, type, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Security check
    const resolvedPath = path.resolve(filePath);
    const uploadsPath = path.resolve(uploadsDir);
    
    if (!resolvedPath.startsWith(uploadsPath)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Set appropriate content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE file from maintenance record
router.delete('/maintenance/:maintenanceId/file/:filename', async (req, res) => {
  try {
    const { maintenanceId, filename } = req.params;
    const maintenance = await Maintenance.findById(maintenanceId);
    
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    // Find and remove file from database
    const fileIndex = maintenance.proofDocuments.findIndex(doc => doc.filename === filename);
    if (fileIndex === -1) {
      return res.status(404).json({ message: 'File not found in maintenance record' });
    }

    const fileDoc = maintenance.proofDocuments[fileIndex];
    maintenance.proofDocuments.splice(fileIndex, 1);
    await maintenance.save();

    // Delete physical file
    if (fs.existsSync(fileDoc.path)) {
      fs.unlink(fileDoc.path, (err) => {
        if (err) console.error('Error deleting physical file:', err);
      });
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE file from task
router.delete('/task/:taskId/file/:filename', async (req, res) => {
  try {
    const { taskId, filename } = req.params;
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Find and remove file from database
    const fileIndex = task.attachments.findIndex(att => att.filename === filename);
    if (fileIndex === -1) {
      return res.status(404).json({ message: 'File not found in task' });
    }

    const fileDoc = task.attachments[fileIndex];
    task.attachments.splice(fileIndex, 1);
    await task.save();

    // Delete physical file
    if (fs.existsSync(fileDoc.path)) {
      fs.unlink(fileDoc.path, (err) => {
        if (err) console.error('Error deleting physical file:', err);
      });
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET file information
router.get('/info/:type/:filename', (req, res) => {
  try {
    const { type, filename } = req.params;
    const filePath = path.join(uploadsDir, type, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const stats = fs.statSync(filePath);
    
    res.json({
      filename: filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      type: type
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 5 files per upload.' });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ message: error.message });
  }
  
  res.status(500).json({ message: 'Upload error: ' + error.message });
});

module.exports = router;
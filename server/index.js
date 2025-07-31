const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Initialize SQLite database and startup system
const db = require('./database/sqlite');
const { initialize: initializeStartup } = require('./startup');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploaded documents
app.use('/uploads', express.static('uploads'));

// Run comprehensive startup checks
initializeStartup().catch(error => {
  console.error('🚨 CRITICAL: Startup failed, server may not function properly');
  console.error('Error details:', error.message);
  // Continue startup but log the issue
});

// Import routes (SQLite-based)
const maintenanceRoutes = require('./routes/maintenance');
const taskRoutes = require('./routes/tasks');
const facilitiesRoutes = require('./routes/facilities');
const uploadRoutes = require('./routes/upload');
const electricMetersRoutes = require('./routes/electric-meters');
const heatGasMetersRoutes = require('./routes/heat-gas-meters');

// API routes
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/electric-meters', electricMetersRoutes);
app.use('/api/heat-gas-meters', heatGasMetersRoutes);

// Health check endpoint with comprehensive system monitoring
app.get('/api/health', async (req, res) => {
  try {
    const { quickHealthCheck } = require('./startup');
    const healthResult = await quickHealthCheck();
    
    res.json({
      status: healthResult.healthy ? 'OK' : 'WARNING',
      healthy: healthResult.healthy,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      checks: healthResult.results || [],
      error: healthResult.error || null
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      healthy: false,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      error: error.message
    });
  }
});

// Simple health check endpoint for basic monitoring
app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});
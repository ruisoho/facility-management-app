const db = require('./database/sqlite');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive application startup and health check system
 * Ensures all database components are properly initialized and functioning
 */

class StartupManager {
  constructor() {
    this.healthChecks = [];
    this.initializationSteps = [];
  }

  // Add health check function
  addHealthCheck(name, checkFunction) {
    this.healthChecks.push({ name, check: checkFunction });
  }

  // Add initialization step
  addInitializationStep(name, stepFunction) {
    this.initializationSteps.push({ name, step: stepFunction });
  }

  // Run all health checks
  async runHealthChecks() {
    console.log('🔍 Running application health checks...');
    const results = [];

    for (const { name, check } of this.healthChecks) {
      try {
        const result = await check();
        console.log(`✅ ${name}: ${result.status}`);
        if (result.details) {
          console.log(`   ${result.details}`);
        }
        results.push({ name, success: true, ...result });
      } catch (error) {
        console.error(`❌ ${name}: FAILED - ${error.message}`);
        results.push({ name, success: false, error: error.message });
      }
    }

    return results;
  }

  // Run initialization steps
  async runInitialization() {
    console.log('🚀 Running application initialization...');

    for (const { name, step } of this.initializationSteps) {
      try {
        console.log(`🔄 ${name}...`);
        await step();
        console.log(`✅ ${name} completed`);
      } catch (error) {
        console.error(`❌ ${name} failed: ${error.message}`);
        throw error;
      }
    }
  }

  // Generate health report
  generateHealthReport(results) {
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log('\n📊 HEALTH CHECK SUMMARY');
    console.log('========================');
    console.log(`Total Checks: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('🎉 All systems operational!');
      return true;
    } else {
      console.log('⚠️  Some systems require attention');
      return false;
    }
  }
}

// Create startup manager instance
const startup = new StartupManager();

// Database connectivity check
startup.addHealthCheck('Database Connection', () => {
  try {
    const result = db.prepare('SELECT 1 as test').get();
    return {
      status: 'Connected',
      details: 'SQLite database is accessible'
    };
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
});

// Facilities table check
startup.addHealthCheck('Facilities Data', () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM facilities').get().count;
  if (count < 3) {
    throw new Error(`Insufficient facilities data: ${count} found, expected at least 3`);
  }
  return {
    status: 'OK',
    details: `${count} facilities found`
  };
});

// Electric meters check
startup.addHealthCheck('Electric Meters Data', () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM electric_meters').get().count;
  if (count < 20) {
    throw new Error(`Insufficient electric meters: ${count} found, expected at least 20`);
  }
  return {
    status: 'OK',
    details: `${count} electric meters found`
  };
});

// Heat/Gas meters check
startup.addHealthCheck('Heat/Gas Meters Data', () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM heat_gas_meters').get().count;
  if (count < 4) {
    throw new Error(`Insufficient heat/gas meters: ${count} found, expected at least 4`);
  }
  return {
    status: 'OK',
    details: `${count} heat/gas meters found`
  };
});

// Tasks data check
startup.addHealthCheck('Tasks Data', () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  return {
    status: 'OK',
    details: `${count} tasks found`
  };
});

// Foreign key integrity check
startup.addHealthCheck('Foreign Key Integrity', () => {
  // Check electric meters have valid facility references
  const invalidElectric = db.prepare(`
    SELECT COUNT(*) as count 
    FROM electric_meters em 
    LEFT JOIN facilities f ON em.facility_id = f.id 
    WHERE f.id IS NULL AND em.facility_id IS NOT NULL
  `).get().count;
  
  // Check heat/gas meters have valid facility references
  const invalidHeatGas = db.prepare(`
    SELECT COUNT(*) as count 
    FROM heat_gas_meters hgm 
    LEFT JOIN facilities f ON hgm.facility_id = f.id 
    WHERE f.id IS NULL AND hgm.facility_id IS NOT NULL
  `).get().count;
  
  if (invalidElectric > 0 || invalidHeatGas > 0) {
    throw new Error(`Foreign key violations found: ${invalidElectric} electric, ${invalidHeatGas} heat/gas`);
  }
  
  return {
    status: 'OK',
    details: 'All foreign key constraints satisfied'
  };
});

// API endpoints check (basic structure)
startup.addHealthCheck('API Routes Structure', () => {
  const routes = [
    './routes/facilities.js',
    './routes/electric-meters.js',
    './routes/heat-gas-meters.js',
    './routes/tasks.js',
    './routes/maintenance.js'
  ];
  
  const missing = routes.filter(route => !fs.existsSync(path.join(__dirname, route)));
  
  if (missing.length > 0) {
    throw new Error(`Missing route files: ${missing.join(', ')}`);
  }
  
  return {
    status: 'OK',
    details: `All ${routes.length} route files present`
  };
});

// Data consistency check
startup.addHealthCheck('Data Consistency', () => {
  const issues = [];
  
  // Check for meters without readings
  const electricNoReadings = db.prepare(`
    SELECT COUNT(*) as count 
    FROM electric_meters 
    WHERE currentReading = 0 AND previousReading = 0
  `).get().count;
  
  const heatGasNoReadings = db.prepare(`
    SELECT COUNT(*) as count 
    FROM heat_gas_meters 
    WHERE currentReading = 0 AND previousReading = 0
  `).get().count;
  
  return {
    status: 'OK',
    details: `Electric meters with no readings: ${electricNoReadings}, Heat/Gas meters with no readings: ${heatGasNoReadings}`
  };
});

// Export the startup manager
module.exports = {
  startup,
  
  // Main startup function
  async initialize() {
    console.log('🔧 FACILITY MANAGEMENT SYSTEM STARTUP');
    console.log('=====================================\n');
    
    try {
      // Run health checks
      const results = await startup.runHealthChecks();
      const allHealthy = startup.generateHealthReport(results);
      
      if (!allHealthy) {
        console.log('\n⚠️  Some health checks failed, but continuing startup...');
      }
      
      console.log('\n✅ Startup completed successfully!');
      console.log('🌐 Application is ready to serve requests\n');
      
      return { success: true, healthResults: results };
      
    } catch (error) {
      console.error('\n❌ STARTUP FAILED:', error.message);
      console.error('🛑 Application cannot start properly\n');
      throw error;
    }
  },
  
  // Quick health check for runtime monitoring
  async quickHealthCheck() {
    try {
      const results = await startup.runHealthChecks();
      return {
        healthy: results.every(r => r.success),
        results: results
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
};
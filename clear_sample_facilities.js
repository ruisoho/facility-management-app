const Database = require('better-sqlite3');
const path = require('path');

// Connect to the existing database
const dbPath = path.join(__dirname, 'server', 'data', 'facility_management.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

const clearSampleFacilities = () => {
  try {
    console.log('🧹 Clearing sample facilities...');
    
    // Start transaction for atomic operations
    const transaction = db.transaction(() => {
      // First, get the current facilities to see what we're removing
      const currentFacilities = db.prepare('SELECT id, name FROM facilities').all();
      console.log('Current facilities:', currentFacilities.map(f => `${f.id}: ${f.name}`).join(', '));
      
      // Check for dependent records before deletion
      const tasksWithFacilities = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE facility_id IS NOT NULL').get().count;
      const electricMetersWithFacilities = db.prepare('SELECT COUNT(*) as count FROM electric_meters WHERE facility_id IS NOT NULL').get().count;
      const heatGasMetersWithFacilities = db.prepare('SELECT COUNT(*) as count FROM heat_gas_meters WHERE facility_id IS NOT NULL').get().count;
      
      console.log(`📊 Dependent records found:`);
      console.log(`   - Tasks with facilities: ${tasksWithFacilities}`);
      console.log(`   - Electric meters with facilities: ${electricMetersWithFacilities}`);
      console.log(`   - Heat/Gas meters with facilities: ${heatGasMetersWithFacilities}`);
      
      // Update all dependent records to remove facility associations
      if (tasksWithFacilities > 0) {
        const updateTasks = db.prepare('UPDATE tasks SET facility_id = NULL WHERE facility_id IS NOT NULL');
        const tasksResult = updateTasks.run();
        console.log(`✅ Updated ${tasksResult.changes} tasks to remove facility associations`);
      }
      
      if (electricMetersWithFacilities > 0) {
        const updateElectricMeters = db.prepare('UPDATE electric_meters SET facility_id = NULL WHERE facility_id IS NOT NULL');
        const electricResult = updateElectricMeters.run();
        console.log(`✅ Updated ${electricResult.changes} electric meters to remove facility associations`);
      }
      
      if (heatGasMetersWithFacilities > 0) {
        const updateHeatGasMeters = db.prepare('UPDATE heat_gas_meters SET facility_id = NULL WHERE facility_id IS NOT NULL');
        const heatGasResult = updateHeatGasMeters.run();
        console.log(`✅ Updated ${heatGasResult.changes} heat/gas meters to remove facility associations`);
      }
      
      // Now delete all facilities
      const deleteFacilities = db.prepare('DELETE FROM facilities');
      const deleteResult = deleteFacilities.run();
      console.log(`✅ Deleted ${deleteResult.changes} facilities`);
      
      // Reset the auto-increment counter
      db.prepare('DELETE FROM sqlite_sequence WHERE name = \'facilities\'').run();
      console.log('✅ Reset facility ID counter');
    });
    
    // Execute the transaction
    transaction();
    
    // Verify the cleanup
    const remainingFacilities = db.prepare('SELECT COUNT(*) as count FROM facilities').get().count;
    console.log(`📊 Verification: ${remainingFacilities} facilities remaining`);
    
    if (remainingFacilities === 0) {
      console.log('🎉 Sample facilities cleared successfully!');
      console.log('💡 You can now add your own real facilities through the web interface.');
    } else {
      console.warn('⚠️  Some facilities may still remain in the database.');
    }
    
  } catch (error) {
    console.error('❌ Error clearing sample facilities:', error);
    throw error;
  } finally {
    db.close();
  }
};

// Run the cleanup
clearSampleFacilities();
const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'server', 'data', 'facility_management.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

const resetMeterFacilities = () => {
  console.log('🔄 Resetting all meter facility associations...');
  
  try {
    // Start transaction
    const transaction = db.transaction(() => {
      // Check current state
      const electricMetersWithFacilities = db.prepare('SELECT COUNT(*) as count FROM electric_meters WHERE facility_id IS NOT NULL').get().count;
      const heatGasMetersWithFacilities = db.prepare('SELECT COUNT(*) as count FROM heat_gas_meters WHERE facility_id IS NOT NULL').get().count;
      
      console.log('📊 Current meter facility associations:');
      console.log(`   - Electric meters with facilities: ${electricMetersWithFacilities}`);
      console.log(`   - Heat/Gas meters with facilities: ${heatGasMetersWithFacilities}`);
      
      if (electricMetersWithFacilities === 0 && heatGasMetersWithFacilities === 0) {
        console.log('✅ All meters already have no facility associations!');
        return;
      }
      
      // Update electric meters to remove facility associations
      if (electricMetersWithFacilities > 0) {
        const updateElectricMeters = db.prepare('UPDATE electric_meters SET facility_id = NULL WHERE facility_id IS NOT NULL');
        const electricResult = updateElectricMeters.run();
        console.log(`✅ Updated ${electricResult.changes} electric meters to remove facility associations`);
      }
      
      // Update heat/gas meters to remove facility associations
      if (heatGasMetersWithFacilities > 0) {
        const updateHeatGasMeters = db.prepare('UPDATE heat_gas_meters SET facility_id = NULL WHERE facility_id IS NOT NULL');
        const heatGasResult = updateHeatGasMeters.run();
        console.log(`✅ Updated ${heatGasResult.changes} heat/gas meters to remove facility associations`);
      }
    });
    
    // Execute the transaction
    transaction();
    
    // Verify the reset
    const remainingElectricAssociations = db.prepare('SELECT COUNT(*) as count FROM electric_meters WHERE facility_id IS NOT NULL').get().count;
    const remainingHeatGasAssociations = db.prepare('SELECT COUNT(*) as count FROM heat_gas_meters WHERE facility_id IS NOT NULL').get().count;
    
    console.log('📊 Verification after reset:');
    console.log(`   - Electric meters with facilities: ${remainingElectricAssociations}`);
    console.log(`   - Heat/Gas meters with facilities: ${remainingHeatGasAssociations}`);
    
    if (remainingElectricAssociations === 0 && remainingHeatGasAssociations === 0) {
      console.log('🎉 All meter facility associations reset successfully!');
      console.log('💡 You can now manually assign facilities to each meter through the web interface.');
    } else {
      console.log('⚠️  Some meter facility associations may still exist.');
    }
    
  } catch (error) {
    console.error('❌ Error resetting meter facilities:', error.message);
    throw error;
  } finally {
    db.close();
  }
};

// Execute the reset
resetMeterFacilities();
// Master License Keys for BillSutra
// KEEP THIS FILE SECURE - DO NOT SHARE OR COMMIT TO GIT!
// These keys give FULL ACCESS to BillSutra

const { generateLicenseKey } = require('./license-utils');

/**
 * MASTER LICENSE KEYS
 * Generated on: November 26, 2025
 * 
 * These keys provide FULL access without expiry for demonstration,
 * testing, and emergency use.
 * 
 * SECURITY WARNING:
 * - Store this file in a secure location
 * - Never share these keys publicly
 * - Never commit to GitHub/Git
 * - Only share with trusted team members
 */

// Generate master keys for different purposes
const MASTER_KEYS = {
  
  // DEMO KEY - For demonstrations and testing
  // Valid for 10 years, unlimited rooms
  DEMO: generateLicenseKey({
    hotelName: 'BillSutra Demo',
    email: 'demo@billsutra.com',
    type: 'ENTERPRISE',
    machineId: null  // Not bound to any machine
  }),
  
  // DEVELOPER KEY - For your development and testing
  // Valid for 10 years, unlimited rooms
  DEVELOPER: generateLicenseKey({
    hotelName: 'BillSutra Development',
    email: 'dev@billsutra.com',
    type: 'ENTERPRISE',
    machineId: null
  }),
  
  // SUPPORT KEY - For customer support and troubleshooting
  // Valid for 10 years, unlimited rooms
  SUPPORT: generateLicenseKey({
    hotelName: 'BillSutra Support',
    email: 'support@billsutra.com',
    type: 'ENTERPRISE',
    machineId: null
  }),
  
  // EMERGENCY KEY - Backup key in case of issues
  // Valid for 10 years, unlimited rooms
  EMERGENCY: generateLicenseKey({
    hotelName: 'BillSutra Emergency Access',
    email: 'emergency@billsutra.com',
    type: 'ENTERPRISE',
    machineId: null
  })
};

// Print keys in a formatted way
console.log('\n' + '='.repeat(80));
console.log('🔐 BILLSUTRA MASTER LICENSE KEYS');
console.log('Generated:', new Date().toLocaleString('en-IN'));
console.log('='.repeat(80));

console.log('\n📋 DEMO KEY (For demonstrations)');
console.log('-'.repeat(80));
console.log(MASTER_KEYS.DEMO);
console.log('-'.repeat(80));

console.log('\n💻 DEVELOPER KEY (For your testing)');
console.log('-'.repeat(80));
console.log(MASTER_KEYS.DEVELOPER);
console.log('-'.repeat(80));

console.log('\n🛠️ SUPPORT KEY (For customer support)');
console.log('-'.repeat(80));
console.log(MASTER_KEYS.SUPPORT);
console.log('-'.repeat(80));

console.log('\n🚨 EMERGENCY KEY (Backup access)');
console.log('-'.repeat(80));
console.log(MASTER_KEYS.EMERGENCY);
console.log('-'.repeat(80));

console.log('\n⚠️  SECURITY WARNINGS:');
console.log('   - NEVER share these keys publicly');
console.log('   - NEVER commit this file to Git/GitHub');
console.log('   - Store in secure password manager (1Password, LastPass, Bitwarden)');
console.log('   - Only share with trusted team members under NDA');
console.log('   - These keys work on ANY computer (not machine-bound)');
console.log('   - Valid for 365 days from generation date');
console.log('');
console.log('💡 USAGE:');
console.log('   - Use DEMO key for sales demonstrations');
console.log('   - Use DEVELOPER key for your own testing');
console.log('   - Use SUPPORT key when helping customers remotely');
console.log('   - Use EMERGENCY key if other keys are lost/compromised');
console.log('');
console.log('📝 CUSTOMER LICENSES:');
console.log('   - For paying customers, always generate unique keys using:');
console.log('     node generate-license.js');
console.log('   - Bind to their Machine ID for security');
console.log('   - Track in your customer database');
console.log('\n' + '='.repeat(80) + '\n');

// Export for programmatic use if needed
module.exports = MASTER_KEYS;

// License Key Generator CLI Tool
// Run this to generate license keys for customers

const { generateLicenseKey, generateTrialKey, validateLicenseKey, LICENSE_TYPES } = require('./license-utils');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function generateKey() {
  console.log('\n=== BillSutra License Key Generator ===\n');
  
  const hotelName = await question('Hotel Name: ');
  const email = await question('Customer Email: ');
  
  console.log('\nLicense Types:');
  console.log('1. TRIAL (30 days, 10 rooms)');
  console.log('2. BASIC (1 year, 20 rooms) - ₹9,999');
  console.log('3. PROFESSIONAL (1 year, 50 rooms) - ₹19,999');
  console.log('4. ENTERPRISE (1 year, unlimited rooms) - ₹39,999');
  
  const typeChoice = await question('\nSelect type (1-4): ');
  
  const typeMap = {
    '1': 'TRIAL',
    '2': 'BASIC',
    '3': 'PROFESSIONAL',
    '4': 'ENTERPRISE'
  };
  
  const type = typeMap[typeChoice] || 'TRIAL';
  
  const bindMachine = await question('Bind to specific machine? (y/n): ');
  let machineId = null;
  
  if (bindMachine.toLowerCase() === 'y') {
    machineId = await question('Machine ID: ');
  }
  
  try {
    const licenseKey = generateLicenseKey({
      hotelName,
      email,
      type,
      machineId
    });
    
    const licenseInfo = LICENSE_TYPES[type];
    
    console.log('\n========================================');
    console.log('LICENSE KEY GENERATED SUCCESSFULLY!');
    console.log('========================================\n');
    console.log(`Hotel Name: ${hotelName}`);
    console.log(`Email: ${email}`);
    console.log(`Type: ${licenseInfo.name}`);
    console.log(`Max Rooms: ${licenseInfo.maxRooms}`);
    console.log(`Valid For: ${licenseInfo.validDays} days`);
    console.log(`Features: ${licenseInfo.features.join(', ')}`);
    if (machineId) {
      console.log(`Bound to Machine: ${machineId.substring(0, 16)}...`);
    }
    console.log('\n--- LICENSE KEY ---');
    console.log(licenseKey);
    console.log('-------------------\n');
    console.log('Send this key to the customer via email.');
    console.log('They will enter it when first launching BillSutra.\n');
    
  } catch (error) {
    console.error('\nError generating license:', error.message);
  }
  
  const another = await question('Generate another key? (y/n): ');
  if (another.toLowerCase() === 'y') {
    await generateKey();
  } else {
    rl.close();
  }
}

async function validateKey() {
  console.log('\n=== License Key Validator ===\n');
  
  const licenseKey = await question('Enter license key: ');
  const machineId = await question('Machine ID (optional): ');
  
  const validation = validateLicenseKey(licenseKey, machineId || null);
  
  console.log('\n========================================');
  if (validation.valid) {
    console.log('✅ LICENSE KEY IS VALID');
    console.log('========================================\n');
    console.log(`Hotel Name: ${validation.data.hotelName}`);
    console.log(`Email: ${validation.data.email}`);
    console.log(`Type: ${validation.data.type}`);
    console.log(`Max Rooms: ${validation.data.maxRooms}`);
    console.log(`Days Remaining: ${validation.daysRemaining}`);
    console.log(`Issued: ${new Date(validation.data.issuedDate).toLocaleDateString()}`);
    console.log(`Expires: ${new Date(validation.data.expiryDate).toLocaleDateString()}`);
    console.log(`Features: ${validation.data.features.join(', ')}`);
  } else {
    console.log('❌ LICENSE KEY IS INVALID');
    console.log('========================================\n');
    if (validation.expired) {
      console.log('Reason: License has expired');
    }
    if (!validation.machineValid) {
      console.log('Reason: Machine ID does not match');
    }
    if (validation.error) {
      console.log(`Error: ${validation.error}`);
    }
  }
  console.log('');
  
  rl.close();
}

async function main() {
  console.log('\nBillSutra License Manager');
  console.log('1. Generate License Key');
  console.log('2. Validate License Key');
  
  const choice = await question('\nSelect option (1-2): ');
  
  if (choice === '1') {
    await generateKey();
  } else if (choice === '2') {
    await validateKey();
  } else {
    console.log('Invalid option');
    rl.close();
  }
}

// Run the CLI
main().catch(console.error);

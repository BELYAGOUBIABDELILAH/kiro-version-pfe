/**
 * Firebase Security Rules Validation Script
 * 
 * This script performs basic validation checks on Firebase security rules files
 * to catch common syntax errors before deployment.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateRulesFile(filePath, rulesType) {
  log(`\n📋 Validating ${rulesType} rules: ${filePath}`, 'blue');
  
  if (!fs.existsSync(filePath)) {
    log(`❌ Error: File not found: ${filePath}`, 'red');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let isValid = true;

  // Check 1: File is not empty
  if (content.trim().length === 0) {
    log('❌ Error: Rules file is empty', 'red');
    return false;
  }

  // Check 2: Contains rules_version declaration
  if (!content.includes("rules_version = '2'")) {
    log("⚠️  Warning: Missing or incorrect rules_version declaration", 'yellow');
    isValid = false;
  }

  // Check 3: Contains service declaration
  const servicePattern = rulesType === 'Firestore' 
    ? /service cloud\.firestore/
    : /service firebase\.storage/;
  
  if (!servicePattern.test(content)) {
    log(`❌ Error: Missing service declaration for ${rulesType}`, 'red');
    return false;
  }

  // Check 4: Balanced braces
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    log(`❌ Error: Unbalanced braces (${openBraces} open, ${closeBraces} close)`, 'red');
    return false;
  }

  // Check 5: Contains match statements
  if (!content.includes('match /')) {
    log('⚠️  Warning: No match statements found', 'yellow');
  }

  // Check 6: Contains allow statements
  if (!content.includes('allow ')) {
    log('⚠️  Warning: No allow statements found', 'yellow');
  }

  // Check 7: Check for common mistakes
  const commonMistakes = [
    { pattern: /allow\s+read\s*,\s*write\s*;/, message: 'Consider splitting read/write rules for better security' },
    { pattern: /if\s+true\s*;/, message: 'Found "if true" - ensure this is intentional for public access' },
    { pattern: /==\s*null/, message: 'Found null comparison - ensure proper null handling' }
  ];

  commonMistakes.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      log(`ℹ️  Info: ${message}`, 'yellow');
    }
  });

  if (isValid) {
    log(`✅ ${rulesType} rules validation passed`, 'green');
  }

  return isValid;
}

function validateFirebaseConfig() {
  log('\n📋 Validating firebase.json configuration', 'blue');
  
  const configPath = path.join(__dirname, 'firebase.json');
  
  if (!fs.existsSync(configPath)) {
    log('❌ Error: firebase.json not found', 'red');
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Check Firestore configuration
    if (!config.firestore || !config.firestore.rules) {
      log('⚠️  Warning: Firestore rules not configured in firebase.json', 'yellow');
    } else {
      log(`✅ Firestore rules configured: ${config.firestore.rules}`, 'green');
    }

    // Check Storage configuration
    if (!config.storage || !config.storage.rules) {
      log('⚠️  Warning: Storage rules not configured in firebase.json', 'yellow');
    } else {
      log(`✅ Storage rules configured: ${config.storage.rules}`, 'green');
    }

    return true;
  } catch (error) {
    log(`❌ Error parsing firebase.json: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('🔍 Firebase Security Rules Validation', 'blue');
  log('=====================================\n', 'blue');

  let allValid = true;

  // Validate firebase.json
  allValid = validateFirebaseConfig() && allValid;

  // Validate Firestore rules
  const firestoreRulesPath = path.join(__dirname, 'firestore.rules');
  allValid = validateRulesFile(firestoreRulesPath, 'Firestore') && allValid;

  // Validate Storage rules
  const storageRulesPath = path.join(__dirname, 'storage.rules');
  allValid = validateRulesFile(storageRulesPath, 'Storage') && allValid;

  // Summary
  log('\n=====================================', 'blue');
  if (allValid) {
    log('✅ All validation checks passed!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Test rules with Firebase emulator: firebase emulators:start');
    log('2. Deploy rules: firebase deploy --only firestore:rules,storage:rules');
    process.exit(0);
  } else {
    log('❌ Validation failed. Please fix the errors above.', 'red');
    process.exit(1);
  }
}

// Run validation
main();

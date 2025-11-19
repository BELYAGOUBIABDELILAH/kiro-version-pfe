const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CityHealth Platform - Production Deployment\n');
console.log('='.repeat(50));

const startTime = Date.now();

// Step 1: Pre-deployment checks
console.log('\n📋 Step 1: Pre-deployment checks...');

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('  ✓ Firebase CLI installed');
} catch (error) {
  console.error('  ❌ Firebase CLI not found. Install with: npm install -g firebase-tools');
  process.exit(1);
}

// Check if user is logged in
try {
  execSync('firebase projects:list', { stdio: 'pipe' });
  console.log('  ✓ Firebase authenticated');
} catch (error) {
  console.error('  ❌ Not authenticated. Run: firebase login');
  process.exit(1);
}

// Check if dist directory exists
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  console.error('  ❌ dist/ directory not found. Run: npm run build');
  process.exit(1);
}
console.log('  ✓ Build directory exists');

// Step 2: Run tests
console.log('\n📋 Step 2: Running tests...');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('  ✓ All tests passed');
} catch (error) {
  console.error('  ❌ Tests failed. Fix tests before deploying.');
  process.exit(1);
}

// Step 3: Deploy Firestore rules and indexes
console.log('\n📋 Step 3: Deploying Firestore rules and indexes...');
try {
  execSync('firebase deploy --only firestore', { stdio: 'inherit' });
  console.log('  ✓ Firestore rules and indexes deployed');
} catch (error) {
  console.error('  ❌ Failed to deploy Firestore rules');
  process.exit(1);
}

// Step 4: Deploy Storage rules
console.log('\n📋 Step 4: Deploying Storage rules...');
try {
  execSync('firebase deploy --only storage', { stdio: 'inherit' });
  console.log('  ✓ Storage rules deployed');
} catch (error) {
  console.error('  ❌ Failed to deploy Storage rules');
  process.exit(1);
}

// Step 5: Deploy Functions (if any)
console.log('\n📋 Step 5: Deploying Cloud Functions...');
const functionsDir = path.join(__dirname, '..', 'functions');
if (fs.existsSync(functionsDir)) {
  try {
    execSync('firebase deploy --only functions', { stdio: 'inherit' });
    console.log('  ✓ Cloud Functions deployed');
  } catch (error) {
    console.error('  ⚠️  Warning: Failed to deploy Cloud Functions');
  }
} else {
  console.log('  ⚠️  No functions directory found, skipping');
}

// Step 6: Deploy Hosting
console.log('\n📋 Step 6: Deploying to Firebase Hosting...');
try {
  // Use production config
  const prodConfig = path.join(__dirname, '..', 'firebase.production.json');
  if (fs.existsSync(prodConfig)) {
    execSync(`firebase deploy --only hosting --config ${prodConfig}`, { stdio: 'inherit' });
  } else {
    execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  }
  console.log('  ✓ Hosting deployed');
} catch (error) {
  console.error('  ❌ Failed to deploy hosting');
  process.exit(1);
}

// Step 7: Get deployment URL
console.log('\n📋 Step 7: Getting deployment URL...');
let deploymentUrl = '';
try {
  const projectInfo = execSync('firebase projects:list --json', { encoding: 'utf8' });
  const projects = JSON.parse(projectInfo);
  const currentProject = projects.result.find(p => p.id === projects.activeProject);
  
  if (currentProject) {
    deploymentUrl = `https://${currentProject.id}.web.app`;
    console.log(`  ✓ Deployment URL: ${deploymentUrl}`);
  }
} catch (error) {
  console.log('  ⚠️  Could not determine deployment URL');
}

// Step 8: Run smoke tests
if (deploymentUrl) {
  console.log('\n📋 Step 8: Running smoke tests...');
  try {
    execSync(`SITE_URL=${deploymentUrl} node build-scripts/smoke-tests.js`, { 
      stdio: 'inherit',
      env: { ...process.env, SITE_URL: deploymentUrl }
    });
    console.log('  ✓ Smoke tests passed');
  } catch (error) {
    console.error('  ⚠️  Warning: Some smoke tests failed. Please verify manually.');
  }
}

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

console.log('\n' + '='.repeat(50));
console.log(`✅ Deployment complete in ${duration}s`);
if (deploymentUrl) {
  console.log(`\n🌐 Your site is live at: ${deploymentUrl}`);
}
console.log('\n💡 Next steps:');
console.log('   - Verify all functionality works in production');
console.log('   - Check Firebase Console for errors');
console.log('   - Monitor performance and analytics');
console.log('   - Set up custom domain if needed');
console.log('='.repeat(50) + '\n');

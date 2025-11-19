const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building CityHealth Platform for Production\n');
console.log('='.repeat(50));

const startTime = Date.now();

// Step 1: Clean
console.log('\n📋 Step 1: Cleaning previous build...');
execSync('node build-scripts/clean.js', { stdio: 'inherit' });

// Step 2: Minify CSS
console.log('📋 Step 2: Minifying CSS...');
execSync('node build-scripts/minify-css.js', { stdio: 'inherit' });

// Step 3: Minify JS
console.log('📋 Step 3: Minifying JavaScript...');
execSync('node build-scripts/minify-js.js', { stdio: 'inherit' });

// Step 4: Optimize Images
console.log('📋 Step 4: Optimizing images...');
execSync('node build-scripts/optimize-images.js', { stdio: 'inherit' });

// Step 5: Copy other files
console.log('📋 Step 5: Copying other files...');
const distDir = path.join(__dirname, '..', 'dist');

// Copy HTML files
const htmlFiles = ['index.html'];
const pagesDir = path.join(__dirname, '..', 'pages');
const componentsDir = path.join(__dirname, '..', 'components');

// Copy root HTML
htmlFiles.forEach(file => {
  const src = path.join(__dirname, '..', file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Copied ${file}`);
  }
});

// Copy pages
if (fs.existsSync(pagesDir)) {
  const distPagesDir = path.join(distDir, 'pages');
  fs.mkdirSync(distPagesDir, { recursive: true });
  fs.readdirSync(pagesDir).forEach(file => {
    if (file.endsWith('.html')) {
      fs.copyFileSync(
        path.join(pagesDir, file),
        path.join(distPagesDir, file)
      );
      console.log(`  ✓ Copied pages/${file}`);
    }
  });
}

// Copy components
if (fs.existsSync(componentsDir)) {
  const distComponentsDir = path.join(distDir, 'components');
  fs.mkdirSync(distComponentsDir, { recursive: true });
  fs.readdirSync(componentsDir).forEach(file => {
    if (file.endsWith('.html')) {
      fs.copyFileSync(
        path.join(componentsDir, file),
        path.join(distComponentsDir, file)
      );
      console.log(`  ✓ Copied components/${file}`);
    }
  });
}

// Copy locales
const localesDir = path.join(__dirname, '..', 'assets', 'locales');
if (fs.existsSync(localesDir)) {
  const distLocalesDir = path.join(distDir, 'assets', 'locales');
  fs.mkdirSync(distLocalesDir, { recursive: true });
  fs.readdirSync(localesDir).forEach(file => {
    fs.copyFileSync(
      path.join(localesDir, file),
      path.join(distLocalesDir, file)
    );
    console.log(`  ✓ Copied locales/${file}`);
  });
}

// Copy service worker
const swPath = path.join(__dirname, '..', 'service-worker.js');
if (fs.existsSync(swPath)) {
  fs.copyFileSync(swPath, path.join(distDir, 'service-worker.js'));
  console.log('  ✓ Copied service-worker.js');
}

// Copy manifest
const manifestPath = path.join(__dirname, '..', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  fs.copyFileSync(manifestPath, path.join(distDir, 'manifest.json'));
  console.log('  ✓ Copied manifest.json');
}

// Step 6: Create production Firebase config
console.log('\n📋 Step 6: Creating production Firebase config...');
const firebaseConfigPath = path.join(__dirname, '..', 'assets', 'js', 'firebase-config.js');
const distFirebaseConfigPath = path.join(distDir, 'assets', 'js', 'firebase-config.js');

if (fs.existsSync(firebaseConfigPath)) {
  let config = fs.readFileSync(firebaseConfigPath, 'utf8');
  
  // Remove any development-specific code
  config = config.replace(/\/\/ Development only[\s\S]*?\/\/ End development/g, '');
  
  fs.writeFileSync(distFirebaseConfigPath, config);
  console.log('  ✓ Created production firebase-config.js');
}

// Step 7: Generate build info
console.log('\n📋 Step 7: Generating build info...');
const buildInfo = {
  version: require('../package.json').version,
  buildDate: new Date().toISOString(),
  environment: 'production'
};

fs.writeFileSync(
  path.join(distDir, 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);
console.log('  ✓ Created build-info.json');

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

console.log('\n' + '='.repeat(50));
console.log(`✅ Build complete in ${duration}s`);
console.log(`📦 Output directory: dist/`);
console.log('\n💡 Next steps:');
console.log('   - Review the dist/ directory');
console.log('   - Test the production build locally');
console.log('   - Deploy with: npm run deploy');
console.log('='.repeat(50) + '\n');

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning build artifacts...');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
  console.log('✓ Removed existing dist directory');
}

fs.mkdirSync(distDir, { recursive: true });
console.log('✓ Created fresh dist directory');

console.log('✅ Clean complete\n');

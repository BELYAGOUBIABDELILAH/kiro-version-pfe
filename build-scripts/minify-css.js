const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

console.log('🎨 Minifying CSS files...');

const cssDir = path.join(__dirname, '..', 'assets', 'css');
const distCssDir = path.join(__dirname, '..', 'dist', 'assets', 'css');

// Create output directory
fs.mkdirSync(distCssDir, { recursive: true });

// Get all CSS files
const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));

let totalOriginalSize = 0;
let totalMinifiedSize = 0;

cssFiles.forEach(file => {
  const inputPath = path.join(cssDir, file);
  const outputPath = path.join(distCssDir, file);
  
  const input = fs.readFileSync(inputPath, 'utf8');
  const originalSize = Buffer.byteLength(input, 'utf8');
  
  const output = new CleanCSS({
    level: 2,
    compatibility: 'ie11'
  }).minify(input);
  
  if (output.errors.length > 0) {
    console.error(`❌ Error minifying ${file}:`, output.errors);
    return;
  }
  
  const minifiedSize = Buffer.byteLength(output.styles, 'utf8');
  const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
  
  fs.writeFileSync(outputPath, output.styles);
  
  totalOriginalSize += originalSize;
  totalMinifiedSize += minifiedSize;
  
  console.log(`  ✓ ${file}: ${(originalSize / 1024).toFixed(1)}KB → ${(minifiedSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
});

const totalSavings = ((1 - totalMinifiedSize / totalOriginalSize) * 100).toFixed(1);
console.log(`\n✅ CSS minification complete: ${(totalOriginalSize / 1024).toFixed(1)}KB → ${(totalMinifiedSize / 1024).toFixed(1)}KB (${totalSavings}% reduction)\n`);

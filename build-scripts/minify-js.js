const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

console.log('📦 Minifying JavaScript files...');

const jsDir = path.join(__dirname, '..', 'assets', 'js');
const distJsDir = path.join(__dirname, '..', 'dist', 'assets', 'js');

// Create output directory
fs.mkdirSync(distJsDir, { recursive: true });

// Get all JS files
const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));

let totalOriginalSize = 0;
let totalMinifiedSize = 0;

async function minifyFiles() {
  for (const file of jsFiles) {
    const inputPath = path.join(jsDir, file);
    const outputPath = path.join(distJsDir, file);
    
    const input = fs.readFileSync(inputPath, 'utf8');
    const originalSize = Buffer.byteLength(input, 'utf8');
    
    // Remove console.log statements and minify
    const result = await minify(input, {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info']
      },
      mangle: {
        toplevel: false,
        keep_fnames: false
      },
      format: {
        comments: false
      }
    });
    
    if (result.error) {
      console.error(`❌ Error minifying ${file}:`, result.error);
      continue;
    }
    
    const minifiedSize = Buffer.byteLength(result.code, 'utf8');
    const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
    
    fs.writeFileSync(outputPath, result.code);
    
    totalOriginalSize += originalSize;
    totalMinifiedSize += minifiedSize;
    
    console.log(`  ✓ ${file}: ${(originalSize / 1024).toFixed(1)}KB → ${(minifiedSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
  }
  
  const totalSavings = ((1 - totalMinifiedSize / totalOriginalSize) * 100).toFixed(1);
  console.log(`\n✅ JS minification complete: ${(totalOriginalSize / 1024).toFixed(1)}KB → ${(totalMinifiedSize / 1024).toFixed(1)}KB (${totalSavings}% reduction)\n`);
}

minifyFiles().catch(console.error);

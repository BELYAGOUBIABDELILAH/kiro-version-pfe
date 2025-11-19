const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

console.log('🖼️  Optimizing images...');

const imagesDir = path.join(__dirname, '..', 'assets', 'images');
const distImagesDir = path.join(__dirname, '..', 'dist', 'assets', 'images');

// Create output directory
fs.mkdirSync(distImagesDir, { recursive: true });

let totalOriginalSize = 0;
let totalOptimizedSize = 0;

async function optimizeImages() {
  if (!fs.existsSync(imagesDir)) {
    console.log('⚠️  No images directory found, skipping image optimization');
    return;
  }

  const imageFiles = fs.readdirSync(imagesDir).filter(file => 
    /\.(jpg|jpeg|png|webp|svg)$/i.test(file)
  );

  if (imageFiles.length === 0) {
    console.log('⚠️  No images found to optimize');
    return;
  }

  for (const file of imageFiles) {
    const inputPath = path.join(imagesDir, file);
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);
    
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;
    
    try {
      // For SVG, just copy
      if (ext === '.svg') {
        fs.copyFileSync(inputPath, path.join(distImagesDir, file));
        console.log(`  ✓ ${file}: copied (SVG)`);
        continue;
      }
      
      // Optimize and create WebP version
      const outputPath = path.join(distImagesDir, file);
      const webpPath = path.join(distImagesDir, `${baseName}.webp`);
      
      // Optimize original format
      await sharp(inputPath)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .png({ quality: 85, compressionLevel: 9 })
        .toFile(outputPath);
      
      // Create WebP version
      await sharp(inputPath)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(webpPath);
      
      const optimizedStats = fs.statSync(outputPath);
      const optimizedSize = optimizedStats.size;
      const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
      
      totalOriginalSize += originalSize;
      totalOptimizedSize += optimizedSize;
      
      console.log(`  ✓ ${file}: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${savings}% smaller) + WebP`);
    } catch (error) {
      console.error(`  ❌ Error optimizing ${file}:`, error.message);
    }
  }
  
  if (totalOriginalSize > 0) {
    const totalSavings = ((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(1);
    console.log(`\n✅ Image optimization complete: ${(totalOriginalSize / 1024).toFixed(1)}KB → ${(totalOptimizedSize / 1024).toFixed(1)}KB (${totalSavings}% reduction)\n`);
  }
}

optimizeImages().catch(console.error);

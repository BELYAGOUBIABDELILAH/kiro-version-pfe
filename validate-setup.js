/**
 * Setup Validation Script
 * Vérifie que tous les fichiers nécessaires sont présents et correctement configurés
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CityHealth - Validation de la Configuration\n');

let errors = 0;
let warnings = 0;
let success = 0;

/**
 * Check if file exists
 */
function checkFile(filePath, required = true) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✓ ${filePath}`);
    success++;
    return true;
  } else {
    if (required) {
      console.log(`✗ ${filePath} - MANQUANT (REQUIS)`);
      errors++;
    } else {
      console.log(`⚠ ${filePath} - Manquant (optionnel)`);
      warnings++;
    }
    return false;
  }
}

/**
 * Check file content for specific string
 */
function checkFileContent(filePath, searchString, shouldContain = true) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`✗ ${filePath} - Fichier manquant`);
    errors++;
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const contains = content.includes(searchString);

  if (shouldContain && contains) {
    console.log(`✓ ${filePath} contient "${searchString}"`);
    success++;
    return true;
  } else if (!shouldContain && !contains) {
    console.log(`✓ ${filePath} ne contient pas "${searchString}"`);
    success++;
    return true;
  } else if (shouldContain && !contains) {
    console.log(`✗ ${filePath} ne contient pas "${searchString}" (REQUIS)`);
    errors++;
    return false;
  } else {
    console.log(`⚠ ${filePath} contient encore "${searchString}" (devrait être remplacé)`);
    warnings++;
    return false;
  }
}

console.log('📄 Vérification des fichiers principaux...\n');

// Core files
checkFile('index.html');
checkFile('package.json');
checkFile('firebase.json');
checkFile('dev-server.js');

console.log('\n📦 Vérification des composants...\n');

// Components
checkFile('components/navbar.html');
checkFile('components/footer.html');
checkFile('components/chatbot-widget.html');
checkFile('components/search-bar.html');

console.log('\n📄 Vérification des pages...\n');

// Pages
checkFile('pages/home.html');
checkFile('pages/search-results.html');
checkFile('pages/auth.html');
checkFile('pages/profile.html');
checkFile('pages/emergency.html');

console.log('\n🔧 Vérification des modules JavaScript...\n');

// Core JS modules
checkFile('assets/js/app.js');
checkFile('assets/js/router.js');
checkFile('assets/js/components-loader.js');
checkFile('assets/js/firebase-config.js');
checkFile('assets/js/i18n.js');
checkFile('assets/js/auth.js');
checkFile('assets/js/search.js');

console.log('\n🎨 Vérification des styles CSS...\n');

// CSS files
checkFile('assets/css/main.css');
checkFile('assets/css/themes.css');
checkFile('assets/css/components.css');
checkFile('assets/css/responsive.css');

console.log('\n🖼️ Vérification des images...\n');

// Images
checkFile('assets/images/default-provider.svg', false);
checkFile('assets/images/icon.svg', false);

console.log('\n🔍 Vérification du contenu des fichiers critiques...\n');

// Check router.js is fixed
checkFileContent('assets/js/router.js', 'return new RegExp(`^${pattern}$`);', true);
checkFileContent('assets/js/router.js', '<file name="assets/js/router.js"', false);

// Check components-loader is in index.html
checkFileContent('index.html', 'components-loader.js', true);

// Check Firebase config (should warn if not configured)
checkFileContent('assets/js/firebase-config.js', 'YOUR_API_KEY', false);

console.log('\n📊 Résumé de la Validation\n');
console.log('═'.repeat(50));
console.log(`✓ Succès:        ${success}`);
console.log(`⚠ Avertissements: ${warnings}`);
console.log(`✗ Erreurs:       ${errors}`);
console.log('═'.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('\n🎉 Configuration parfaite! Tous les fichiers sont présents et correctement configurés.');
  console.log('\n🚀 Vous pouvez lancer l\'application avec: node dev-server.js');
  process.exit(0);
} else if (errors === 0) {
  console.log('\n✅ Configuration valide avec quelques avertissements.');
  console.log('⚠️  Certains fichiers optionnels sont manquants mais l\'application devrait fonctionner.');
  console.log('\n🚀 Vous pouvez lancer l\'application avec: node dev-server.js');
  process.exit(0);
} else {
  console.log('\n❌ Configuration incomplète. Veuillez corriger les erreurs ci-dessus.');
  console.log('\n📖 Consultez GUIDE_DEMARRAGE_RAPIDE.md pour plus d\'informations.');
  process.exit(1);
}

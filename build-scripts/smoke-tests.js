const https = require('https');
const http = require('http');

console.log('🧪 Running smoke tests...\n');

const SITE_URL = process.env.SITE_URL || 'http://localhost:5000';
const tests = [];

// Helper function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

// Test 1: Homepage loads
tests.push({
  name: 'Homepage loads successfully',
  test: async () => {
    const response = await makeRequest(SITE_URL);
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
    if (!response.body.includes('CityHealth')) {
      throw new Error('Homepage does not contain expected content');
    }
  }
});

// Test 2: Security headers present
tests.push({
  name: 'Security headers are present',
  test: async () => {
    const response = await makeRequest(SITE_URL);
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];
    
    const missingHeaders = requiredHeaders.filter(
      header => !response.headers[header]
    );
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
    }
  }
});

// Test 3: Service worker exists
tests.push({
  name: 'Service worker is accessible',
  test: async () => {
    const response = await makeRequest(`${SITE_URL}/service-worker.js`);
    if (response.statusCode !== 200) {
      throw new Error(`Service worker not found: ${response.statusCode}`);
    }
  }
});

// Test 4: Manifest exists
tests.push({
  name: 'Web app manifest is accessible',
  test: async () => {
    const response = await makeRequest(`${SITE_URL}/manifest.json`);
    if (response.statusCode !== 200) {
      throw new Error(`Manifest not found: ${response.statusCode}`);
    }
    
    try {
      const manifest = JSON.parse(response.body);
      if (!manifest.name || !manifest.short_name) {
        throw new Error('Manifest missing required fields');
      }
    } catch (e) {
      throw new Error(`Invalid manifest JSON: ${e.message}`);
    }
  }
});

// Test 5: Static assets load
tests.push({
  name: 'CSS files are accessible',
  test: async () => {
    const response = await makeRequest(`${SITE_URL}/assets/css/main.css`);
    if (response.statusCode !== 200 && response.statusCode !== 304) {
      throw new Error(`CSS not found: ${response.statusCode}`);
    }
  }
});

tests.push({
  name: 'JavaScript files are accessible',
  test: async () => {
    const response = await makeRequest(`${SITE_URL}/assets/js/app.js`);
    if (response.statusCode !== 200 && response.statusCode !== 304) {
      throw new Error(`JavaScript not found: ${response.statusCode}`);
    }
  }
});

// Test 6: Pages are accessible
tests.push({
  name: 'Search page is accessible',
  test: async () => {
    const response = await makeRequest(`${SITE_URL}/pages/search-results.html`);
    if (response.statusCode !== 200) {
      throw new Error(`Search page not found: ${response.statusCode}`);
    }
  }
});

// Test 7: Locales are accessible
tests.push({
  name: 'Translation files are accessible',
  test: async () => {
    const languages = ['en', 'ar', 'fr'];
    for (const lang of languages) {
      const response = await makeRequest(`${SITE_URL}/assets/locales/${lang}.json`);
      if (response.statusCode !== 200 && response.statusCode !== 304) {
        throw new Error(`${lang}.json not found: ${response.statusCode}`);
      }
      
      try {
        JSON.parse(response.body);
      } catch (e) {
        throw new Error(`Invalid JSON in ${lang}.json`);
      }
    }
  }
});

// Run all tests
async function runTests() {
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test.test();
      console.log(`✅ ${test.name}`);
      passed++;
    } catch (error) {
      console.error(`❌ ${test.name}`);
      console.error(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`Tests: ${passed} passed, ${failed} failed, ${tests.length} total`);
  console.log('='.repeat(50) + '\n');
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error running smoke tests:', error);
  process.exit(1);
});

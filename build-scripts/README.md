# Build Scripts

This directory contains automated build and deployment scripts for the CityHealth Platform.

## Scripts Overview

### build.js
Main build orchestration script that runs all build steps in sequence.

**Usage:**
```bash
npm run build
```

**What it does:**
1. Cleans previous build artifacts
2. Minifies CSS files
3. Minifies JavaScript files
4. Optimizes images
5. Copies HTML, components, and locales
6. Creates production Firebase config
7. Generates build info

**Output:** `dist/` directory with production-ready files

### clean.js
Removes previous build artifacts and creates fresh dist directory.

**Usage:**
```bash
npm run prebuild
# or directly
node build-scripts/clean.js
```

### minify-css.js
Minifies all CSS files using clean-css.

**Features:**
- Level 2 optimization
- IE11 compatibility
- Shows size reduction statistics

**Usage:**
```bash
npm run build:css
```

**Expected reduction:** 30-50%

### minify-js.js
Minifies JavaScript files using Terser.

**Features:**
- Removes console.log statements
- Removes debugger statements
- Mangles variable names
- Removes comments
- Shows size reduction statistics

**Usage:**
```bash
npm run build:js
```

**Expected reduction:** 40-60%

### optimize-images.js
Optimizes images using Sharp.

**Features:**
- Resizes to max 2000px (maintains aspect ratio)
- Compresses with quality 85
- Creates WebP versions automatically
- Copies SVG files as-is
- Shows size reduction statistics

**Usage:**
```bash
npm run build:images
```

**Expected reduction:** 50-70%

### deploy.js
Automated deployment script with pre-flight checks.

**Usage:**
```bash
npm run deploy
```

**What it does:**
1. Verifies Firebase CLI installed
2. Checks authentication
3. Verifies build exists
4. Runs tests
5. Deploys Firestore rules
6. Deploys Storage rules
7. Deploys Cloud Functions
8. Deploys Hosting
9. Runs smoke tests

**Requirements:**
- Firebase CLI installed: `npm install -g firebase-tools`
- Authenticated: `firebase login`
- Build completed: `npm run build`

### smoke-tests.js
Post-deployment verification tests.

**Usage:**
```bash
SITE_URL=https://your-site.web.app npm run smoke-test
```

**Tests:**
- Homepage loads successfully
- Security headers present
- Service worker accessible
- Web app manifest valid
- CSS files accessible
- JavaScript files accessible
- Pages accessible
- Translation files valid

**Exit codes:**
- 0: All tests passed
- 1: One or more tests failed

## NPM Scripts

All scripts can be run via npm:

```bash
# Full build
npm run build

# Individual build steps
npm run build:css
npm run build:js
npm run build:images

# Clean build artifacts
npm run prebuild

# Full deployment
npm run deploy

# Deploy hosting only
npm run deploy:hosting

# Deploy rules only
npm run deploy:rules

# Run smoke tests
npm run smoke-test

# Test production build locally
npm run serve:dist
```

## Build Output

The build process creates a `dist/` directory with:

```
dist/
├── assets/
│   ├── css/           # Minified CSS
│   ├── js/            # Minified JS (console.log removed)
│   ├── images/        # Optimized images + WebP versions
│   └── locales/       # Translation files
├── pages/             # HTML pages
├── components/        # HTML components
├── index.html         # Main entry point
├── service-worker.js  # Service worker
├── manifest.json      # Web app manifest
└── build-info.json    # Build metadata
```

## Performance Metrics

Typical size reductions:

| Asset Type | Original | Optimized | Reduction |
|------------|----------|-----------|-----------|
| CSS        | 100 KB   | 50-70 KB  | 30-50%    |
| JavaScript | 200 KB   | 80-120 KB | 40-60%    |
| Images     | 500 KB   | 150-250 KB| 50-70%    |

## Development vs Production

### Development (firebase.json)
- Public directory: `.` (root)
- Includes all files
- No minification
- Console logs present

### Production (firebase.production.json)
- Public directory: `dist/`
- Excludes test files
- Minified assets
- Console logs removed
- Optimized images
- Security headers

## Troubleshooting

### Build fails
```bash
# Check Node.js version
node --version  # Should be 14+

# Clean and rebuild
npm run prebuild
npm run build
```

### Minification errors
```bash
# Test individual steps
npm run build:css
npm run build:js
npm run build:images
```

### Deployment fails
```bash
# Check Firebase CLI
firebase --version

# Re-authenticate
firebase login

# Check project
firebase projects:list
```

### Smoke tests fail
```bash
# Test locally first
npm run serve:dist
SITE_URL=http://localhost:5000 npm run smoke-test
```

## Dependencies

Required npm packages:
- `terser` - JavaScript minification
- `clean-css` - CSS minification
- `sharp` - Image optimization

Install with:
```bash
npm install
```

## Environment Variables

### SITE_URL
Used by smoke tests to specify the site to test.

```bash
# Local testing
SITE_URL=http://localhost:5000 npm run smoke-test

# Production testing
SITE_URL=https://your-site.web.app npm run smoke-test
```

## CI/CD Integration

These scripts are designed to work in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Build
  run: npm run build

- name: Test
  run: npm test

- name: Deploy
  run: npm run deploy
  env:
    FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

## Best Practices

1. **Always build before deploying**
   ```bash
   npm run build
   npm run deploy:hosting
   ```

2. **Test locally before production**
   ```bash
   npm run build
   npm run serve:dist
   ```

3. **Run tests before deploying**
   ```bash
   npm test
   npm run build
   npm run deploy
   ```

4. **Monitor after deployment**
   - Check Firebase Console
   - Run smoke tests
   - Review error logs

## Support

For issues or questions:
- See `DEPLOYMENT_GUIDE.md` for detailed documentation
- See `DEPLOYMENT_QUICK_START.md` for quick reference
- Check Firebase Console for deployment logs

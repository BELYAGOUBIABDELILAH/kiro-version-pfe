# CityHealth Platform - Deployment Quick Start

## Prerequisites

Install required dependencies:
```bash
npm install
```

Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

Login to Firebase:
```bash
firebase login
```

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

Deploy everything with one command:
```bash
npm run deploy
```

This will:
- ✅ Build production bundle
- ✅ Run tests
- ✅ Deploy Firestore rules
- ✅ Deploy Storage rules
- ✅ Deploy Cloud Functions
- ✅ Deploy to Hosting
- ✅ Run smoke tests

### Option 2: Step-by-Step Deployment

```bash
# 1. Build production bundle
npm run build

# 2. Test locally (optional)
npm run serve:dist

# 3. Deploy rules
npm run deploy:rules

# 4. Deploy hosting
npm run deploy:hosting

# 5. Run smoke tests
SITE_URL=https://your-site.web.app npm run smoke-test
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build production bundle |
| `npm run build:css` | Minify CSS only |
| `npm run build:js` | Minify JavaScript only |
| `npm run build:images` | Optimize images only |
| `npm run deploy` | Full automated deployment |
| `npm run deploy:hosting` | Deploy hosting only |
| `npm run deploy:rules` | Deploy Firestore/Storage rules only |
| `npm run smoke-test` | Run smoke tests |
| `npm run serve:dist` | Test production build locally |
| `npm test` | Run unit tests |

## Build Output

The build process creates a `dist/` directory with:
- Minified CSS and JavaScript
- Optimized images (with WebP versions)
- Production Firebase configuration
- All HTML pages and components
- Translation files
- Service worker and manifest

## What Gets Optimized

### CSS
- Minified and compressed
- Unused styles removed
- Typically 30-50% size reduction

### JavaScript
- Minified with Terser
- Console logs removed
- Debug code stripped
- Typically 40-60% size reduction

### Images
- Resized to max 2000px
- Compressed with quality 85
- WebP versions created
- Typically 50-70% size reduction

## Deployment Checklist

Before deploying:
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Local testing done: `npm run serve:dist`
- [ ] Firebase project configured
- [ ] Security rules reviewed

After deploying:
- [ ] Site loads correctly
- [ ] Authentication works
- [ ] Search functionality works
- [ ] Admin dashboard accessible
- [ ] Performance is acceptable (Lighthouse > 90)

## Troubleshooting

**"Firebase CLI not found"**
```bash
npm install -g firebase-tools
```

**"Not authenticated"**
```bash
firebase login
```

**"dist/ directory not found"**
```bash
npm run build
```

**"Tests failed"**
```bash
npm test
# Fix failing tests before deploying
```

**Site not updating after deployment**
- Wait 5-10 minutes for CDN cache
- Hard refresh browser (Ctrl+Shift+R)
- Check Firebase Console for deployment status

## Rollback

If something goes wrong:
```bash
firebase hosting:rollback
```

Or use Firebase Console:
1. Go to Hosting > Release history
2. Click "Rollback" on previous version

## Custom Domain Setup

1. In Firebase Console, go to Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., cityhealth.dz)
4. Add DNS records provided by Firebase
5. Wait 24-48 hours for SSL provisioning

## Monitoring

After deployment, monitor:
- Firebase Console > Hosting (traffic, errors)
- Firebase Console > Performance (load times)
- Firebase Console > Analytics (user behavior)

## Support

For detailed information, see:
- `DEPLOYMENT_GUIDE.md` - Complete deployment documentation
- `DEPLOYMENT_CHECKLIST.md` - Pre/post deployment checklist
- Firebase Console - Real-time monitoring and logs

## Production URL

After deployment, your site will be available at:
```
https://[your-project-id].web.app
https://[your-project-id].firebaseapp.com
```

Custom domain (if configured):
```
https://yourdomain.com
```

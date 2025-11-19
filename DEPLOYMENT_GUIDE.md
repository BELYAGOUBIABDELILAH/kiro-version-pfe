# CityHealth Platform - Deployment Guide

## Firebase Hosting Setup

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created
- Authenticated with Firebase: `firebase login`

### Initial Setup

1. **Initialize Firebase Project** (if not already done)
   ```bash
   firebase init hosting
   ```

2. **Configure Custom Domain**
   
   To set up a custom domain with SSL:
   
   ```bash
   firebase hosting:channel:deploy production
   ```
   
   Then in Firebase Console:
   - Go to Hosting section
   - Click "Add custom domain"
   - Enter your domain (e.g., cityhealth.dz)
   - Follow DNS configuration instructions
   - SSL certificate will be automatically provisioned

3. **DNS Configuration**
   
   Add these DNS records to your domain provider:
   
   ```
   Type: A
   Name: @
   Value: [Firebase IP addresses provided in console]
   
   Type: A
   Name: www
   Value: [Firebase IP addresses provided in console]
   ```

4. **Enable CDN**
   
   Firebase Hosting automatically uses Google's global CDN. To verify:
   - Check response headers for `x-cache` and `cf-cache-status`
   - Content is automatically distributed to edge locations worldwide

### Deployment Commands

**Deploy to Production:**
```bash
firebase deploy --only hosting
```

**Deploy with Functions:**
```bash
firebase deploy
```

**Deploy to Preview Channel:**
```bash
firebase hosting:channel:deploy preview
```

### Security Headers

The following security headers are configured in `firebase.json`:
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - Enables XSS filtering
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

### Cache Configuration

- **Static Assets** (images, CSS, JS): 1 year cache with immutable flag
- **HTML Files**: No cache to ensure fresh content
- **Service Worker**: No cache to ensure updates are applied

### URL Configuration

- **Clean URLs**: Enabled (removes .html extensions)
- **Trailing Slashes**: Disabled for consistency
- **Redirects**: /home → / (301 permanent redirect)

### Monitoring

After deployment, monitor:
- Firebase Console > Hosting > Usage
- Performance metrics in Firebase Performance Monitoring
- Error logs in Firebase Console

### Rollback

To rollback to a previous version:
```bash
firebase hosting:rollback
```

Or in Firebase Console:
- Go to Hosting > Release history
- Click "Rollback" on desired version

## Custom Domain SSL

Firebase automatically provisions and renews SSL certificates for custom domains using Let's Encrypt. This process typically takes 24-48 hours after DNS propagation.

### Verification Steps

1. Check DNS propagation: `nslookup yourdomain.com`
2. Verify SSL certificate: Visit `https://yourdomain.com`
3. Check certificate details in browser (should show valid Let's Encrypt cert)

## CDN and Performance

Firebase Hosting CDN features:
- Automatic global distribution
- HTTP/2 support
- Brotli compression
- Automatic SSL/TLS
- DDoS protection

### Performance Optimization

The hosting configuration includes:
- Long-term caching for static assets
- Compression for text-based files
- Security headers for protection
- Clean URLs for better SEO

## Troubleshooting

**Issue: Custom domain not working**
- Verify DNS records are correct
- Wait for DNS propagation (up to 48 hours)
- Check Firebase Console for domain status

**Issue: SSL certificate not provisioning**
- Ensure DNS is properly configured
- Wait 24-48 hours after DNS setup
- Check Firebase Console for certificate status

**Issue: Old content showing after deployment**
- Clear browser cache
- Check cache headers are correct
- Verify deployment completed successfully

## Production Checklist

Before deploying to production:
- [ ] Firebase project configured
- [ ] Custom domain DNS configured
- [ ] SSL certificate provisioned
- [ ] Security rules deployed
- [ ] Environment variables set
- [ ] Analytics configured
- [ ] Performance monitoring enabled
- [ ] Error tracking enabled
- [ ] Backup strategy in place


## Production Deployment Process

### Automated Deployment

The platform includes automated deployment scripts for a streamlined process:

```bash
# Full deployment (recommended)
npm run deploy
```

This command will:
1. Run pre-deployment checks
2. Build the production bundle
3. Run all tests
4. Deploy Firestore rules and indexes
5. Deploy Storage rules
6. Deploy Cloud Functions
7. Deploy to Firebase Hosting
8. Run smoke tests

### Manual Deployment Steps

If you prefer manual control:

```bash
# 1. Build production bundle
npm run build

# 2. Test locally
npm run serve:dist

# 3. Deploy rules first
npm run deploy:rules

# 4. Deploy hosting
npm run deploy:hosting

# 5. Run smoke tests
SITE_URL=https://your-site.web.app npm run smoke-test
```

### Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All tests pass: `npm test`
- [ ] Build completes successfully: `npm run build`
- [ ] Local testing completed: `npm run serve:dist`
- [ ] Firebase Security Rules reviewed
- [ ] Environment variables configured
- [ ] Analytics and monitoring enabled
- [ ] Backup of current production data
- [ ] Team notified of deployment

### Post-Deployment Verification

After deployment, verify:

1. **Homepage loads correctly**
   - Visit your production URL
   - Check all sections render properly
   - Verify images and assets load

2. **Authentication works**
   - Test user registration
   - Test login/logout
   - Verify OAuth providers

3. **Search functionality**
   - Perform test searches
   - Apply filters
   - Check results display

4. **Provider profiles**
   - View provider details
   - Check maps integration
   - Verify image galleries

5. **Admin dashboard**
   - Access admin panel
   - Check verification queue
   - Test moderation features

6. **Performance**
   - Run Lighthouse audit
   - Check page load times
   - Verify CDN is working

7. **Security**
   - Verify HTTPS is enforced
   - Check security headers
   - Test Firebase Security Rules

### Monitoring After Deployment

Monitor these metrics in Firebase Console:

- **Hosting Usage**: Traffic, bandwidth, requests
- **Performance**: Page load times, API response times
- **Analytics**: User behavior, popular features
- **Errors**: JavaScript errors, failed requests
- **Firestore**: Read/write operations, query performance

### Rollback Procedure

If issues are detected after deployment:

```bash
# Quick rollback via Firebase Console
# Go to Hosting > Release history > Click "Rollback"

# Or via CLI
firebase hosting:rollback
```

### Deployment Environments

**Development**: Local testing with Firebase emulators
```bash
firebase emulators:start
```

**Staging**: Preview channel for testing
```bash
firebase hosting:channel:deploy staging
```

**Production**: Live site
```bash
npm run deploy
```

### Continuous Deployment

For automated deployments, integrate with CI/CD:

**GitHub Actions Example:**
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
```

### Troubleshooting Deployment Issues

**Build fails:**
- Check Node.js version compatibility
- Verify all dependencies installed: `npm ci`
- Review build logs for specific errors

**Tests fail:**
- Run tests locally: `npm test`
- Fix failing tests before deploying
- Check test environment configuration

**Deployment fails:**
- Verify Firebase authentication: `firebase login`
- Check project permissions
- Review Firebase quota limits

**Site not updating:**
- Clear CDN cache (wait 5-10 minutes)
- Hard refresh browser (Ctrl+Shift+R)
- Check deployment completed successfully

**Performance issues:**
- Review Lighthouse report
- Check Firebase Performance Monitoring
- Optimize images and assets
- Review Firestore query efficiency

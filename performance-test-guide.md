# Performance Testing Guide

## Overview
This guide provides comprehensive performance testing procedures for the CityHealth platform to ensure optimal load times and user experience, particularly on mobile devices and slower connections.

## Performance Goals (Requirement 17.4)

### Target Metrics
- **First Contentful Paint (FCP):** < 1.5 seconds
- **Largest Contentful Paint (LCP):** < 2.5 seconds
- **Time to Interactive (TTI):** < 3 seconds
- **Total Blocking Time (TBT):** < 200ms
- **Cumulative Layout Shift (CLS):** < 0.1
- **Lighthouse Performance Score:** > 90

### Mobile Performance
- **3G Connection Load Time:** < 3 seconds
- **Page Size:** < 1MB (initial load)
- **JavaScript Bundle:** < 300KB
- **CSS Bundle:** < 100KB

## Testing Tools

### 1. Chrome DevTools Lighthouse

**How to Run:**
1. Open Chrome DevTools (F12)
2. Navigate to "Lighthouse" tab
3. Select device type (Mobile/Desktop)
4. Select categories (Performance, Accessibility, Best Practices, SEO)
5. Click "Analyze page load"

**Test Configuration:**
- Device: Mobile (Moto G4)
- Network: Simulated 4G
- CPU: 4x slowdown

### 2. WebPageTest

**How to Run:**
1. Visit https://www.webpagetest.org/
2. Enter site URL
3. Select test location (closest to target users)
4. Select browser (Chrome)
5. Select connection speed (3G, 4G, Cable)
6. Run test

**Test Configurations:**
- Location: Europe (closest to Algeria)
- Browser: Chrome
- Connection: 3G, 4G
- Number of runs: 3 (for average)

### 3. Firebase Performance Monitoring

**Setup:**
```javascript
// Already implemented in assets/js/performance-monitoring.js
const perf = firebase.performance();

// Custom traces
const trace = perf.trace('page_load');
trace.start();
// ... page load logic
trace.stop();
```

**Metrics to Monitor:**
- Page load times
- API response times
- Custom performance traces
- Network request durations

## Performance Testing Procedures

### Test 1: Lighthouse Audit

**Pages to Test:**
- [ ] Homepage (/)
- [ ] Search Results (/search-results)
- [ ] Provider Profile (/profile/:id)
- [ ] Provider Dashboard (/provider-dashboard)
- [ ] Admin Dashboard (/admin-dashboard)

**Test Steps:**
1. Open page in incognito mode
2. Open DevTools > Lighthouse
3. Select "Mobile" device
4. Select all categories
5. Click "Analyze page load"
6. Document results

**Success Criteria:**
- Performance score > 90
- FCP < 1.5s
- LCP < 2.5s
- TTI < 3s
- CLS < 0.1

### Test 2: 3G Mobile Connection Test

**Using Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Select "Slow 3G" from throttling dropdown
4. Reload page
5. Measure load time

**Using WebPageTest:**
1. Enter site URL
2. Select "3G" connection
3. Select "Mobile" device
4. Run test
5. Review filmstrip and metrics

**Success Criteria:**
- Page fully loaded < 3 seconds
- Content visible < 2 seconds
- Interactive < 3 seconds

### Test 3: Firebase Query Performance

**Test Procedure:**
1. Open browser console
2. Enable Firebase performance monitoring
3. Perform search queries
4. Check query execution times
5. Review Firebase console for metrics

**Queries to Test:**
```javascript
// Search query
db.collection('providers')
  .where('serviceType', '==', 'clinic')
  .where('city', '==', 'Sidi Bel Abbès')
  .orderBy('rating', 'desc')
  .limit(20)
  .get();

// Emergency providers query
db.collection('providers')
  .where('available24_7', '==', true)
  .orderBy('rating', 'desc')
  .limit(10)
  .get();

// Provider profile query
db.collection('providers')
  .doc(providerId)
  .get();
```

**Success Criteria:**
- Query execution < 500ms
- Results returned < 1 second
- Proper indexing in place
- No missing index warnings

### Test 4: Image Loading Performance

**Test Procedure:**
1. Navigate to pages with images
2. Open Network tab
3. Check image sizes and load times
4. Verify lazy loading works
5. Check WebP format usage

**Pages to Test:**
- Homepage (hero images, ads)
- Search Results (provider thumbnails)
- Provider Profile (photo gallery)

**Success Criteria:**
- Images < 200KB each
- WebP format used with fallbacks
- Lazy loading implemented
- Images load progressively

### Test 5: JavaScript Bundle Size

**Test Procedure:**
1. Open DevTools > Network tab
2. Filter by "JS"
3. Load page
4. Check total JavaScript size
5. Identify large bundles

**Analysis:**
```bash
# If using webpack or similar
npm run build
# Check dist/bundle sizes
```

**Success Criteria:**
- Total JS < 300KB (gzipped)
- Code splitting implemented
- Unused code removed
- Third-party libraries optimized

### Test 6: CSS Bundle Size

**Test Procedure:**
1. Open DevTools > Network tab
2. Filter by "CSS"
3. Load page
4. Check total CSS size

**Success Criteria:**
- Total CSS < 100KB (gzipped)
- Unused CSS removed
- Critical CSS inlined
- Non-critical CSS deferred

## Performance Optimization Checklist

### Images
- [ ] Images compressed and optimized
- [ ] WebP format used with fallbacks
- [ ] Lazy loading implemented
- [ ] Responsive images (srcset)
- [ ] Image dimensions specified
- [ ] No oversized images

### JavaScript
- [ ] Code minified
- [ ] Unused code removed
- [ ] Code splitting implemented
- [ ] Async/defer attributes used
- [ ] Third-party scripts optimized
- [ ] Service worker caching

### CSS
- [ ] CSS minified
- [ ] Unused CSS removed
- [ ] Critical CSS inlined
- [ ] Non-critical CSS deferred
- [ ] CSS animations optimized

### Fonts
- [ ] Font files optimized
- [ ] Font display: swap used
- [ ] Only necessary font weights loaded
- [ ] Font subsetting considered

### Firebase
- [ ] Composite indexes created
- [ ] Query results limited
- [ ] Pagination implemented
- [ ] Caching strategy in place
- [ ] Security rules optimized

### Caching
- [ ] Service worker implemented
- [ ] Static assets cached
- [ ] Cache-Control headers set
- [ ] CDN used for static assets

### Network
- [ ] HTTP/2 enabled
- [ ] Gzip/Brotli compression enabled
- [ ] DNS prefetch for external domains
- [ ] Preconnect for critical resources
- [ ] Resource hints used

## Performance Testing Results Template

### Page: [Page Name]
**Date Tested:** [Date]
**Tester:** [Name]
**Device:** [Mobile/Desktop]
**Connection:** [3G/4G/Cable]

### Lighthouse Scores
- Performance: [Score]/100
- Accessibility: [Score]/100
- Best Practices: [Score]/100
- SEO: [Score]/100

### Core Web Vitals
- FCP: [Time]s (Target: < 1.5s)
- LCP: [Time]s (Target: < 2.5s)
- TTI: [Time]s (Target: < 3s)
- TBT: [Time]ms (Target: < 200ms)
- CLS: [Score] (Target: < 0.1)

### Resource Sizes
- Total Page Size: [Size]KB
- JavaScript: [Size]KB
- CSS: [Size]KB
- Images: [Size]KB
- Fonts: [Size]KB

### Load Times
- DOMContentLoaded: [Time]s
- Load Event: [Time]s
- Fully Loaded: [Time]s

### Firebase Performance
- Search Query: [Time]ms
- Profile Load: [Time]ms
- Image Upload: [Time]ms

### Issues Found
1. [Description]
   - Impact: [High/Medium/Low]
   - Recommendation: [How to fix]

### Overall Status: [Pass/Fail]

## Optimization Recommendations

### High Priority (Fix Immediately)
Issues that significantly impact user experience:
- Page load time > 5 seconds
- LCP > 4 seconds
- TTI > 5 seconds
- JavaScript errors blocking rendering
- Missing critical resources

### Medium Priority (Fix Soon)
Issues that moderately impact performance:
- Page load time 3-5 seconds
- LCP 2.5-4 seconds
- Large JavaScript bundles
- Unoptimized images
- Missing caching headers

### Low Priority (Fix When Possible)
Minor optimizations:
- Further image compression
- Additional code splitting
- Font optimization
- Third-party script optimization

## Continuous Performance Monitoring

### During Development
- Run Lighthouse on every major change
- Monitor bundle sizes
- Test on slow connections
- Profile JavaScript performance
- Check Firebase query performance

### Before Release
- Complete performance audit on all pages
- Test on real mobile devices
- Test on 3G connections
- Verify all optimizations in place
- Document baseline metrics

### After Release
- Monitor Firebase Performance Monitoring
- Track Core Web Vitals in production
- Set up performance budgets
- Alert on performance regressions
- Regular performance audits (monthly)

## Performance Budget

Set and enforce performance budgets:

```javascript
// Example performance budget
{
  "budgets": [
    {
      "resourceSizes": [
        { "resourceType": "script", "budget": 300 },
        { "resourceType": "stylesheet", "budget": 100 },
        { "resourceType": "image", "budget": 500 },
        { "resourceType": "total", "budget": 1000 }
      ]
    },
    {
      "timings": [
        { "metric": "first-contentful-paint", "budget": 1500 },
        { "metric": "largest-contentful-paint", "budget": 2500 },
        { "metric": "interactive", "budget": 3000 }
      ]
    }
  ]
}
```

## Real User Monitoring (RUM)

### Firebase Performance Monitoring
Already implemented in the platform:
- Automatic page load tracking
- Custom trace measurements
- Network request monitoring
- Real user metrics collection

### Metrics to Track
- Page load times by page
- API response times
- User interactions
- Error rates
- Geographic performance
- Device performance
- Connection type performance

## Testing Schedule

### Daily (During Development)
- Lighthouse audits on changed pages
- Bundle size checks

### Weekly
- Full performance audit
- Firebase query performance review
- Image optimization check

### Monthly (After Release)
- Comprehensive performance testing
- Real user metrics analysis
- Performance budget review
- Optimization opportunities identification

## Tools and Resources

### Browser Tools
- Chrome DevTools
- Firefox Developer Tools
- Safari Web Inspector

### Online Tools
- WebPageTest (https://www.webpagetest.org/)
- GTmetrix (https://gtmetrix.com/)
- PageSpeed Insights (https://pagespeed.web.dev/)

### Firebase Tools
- Firebase Performance Monitoring Console
- Firebase Emulator Suite

### Analysis Tools
- Lighthouse CI
- Bundle Analyzer
- Coverage Tool (Chrome DevTools)

## Success Metrics

### Overall Goals
- ✅ Lighthouse Performance Score > 90
- ✅ All Core Web Vitals in "Good" range
- ✅ 3G load time < 3 seconds
- ✅ Firebase queries < 500ms
- ✅ No performance regressions

### User Experience Goals
- Fast initial page load
- Smooth scrolling and interactions
- Quick search results
- Responsive UI on all devices
- Minimal layout shifts

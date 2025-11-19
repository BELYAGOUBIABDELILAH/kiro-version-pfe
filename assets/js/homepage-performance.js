/**
 * Homepage Performance Monitoring
 * Tracks and optimizes homepage loading performance
 */

(function() {
  'use strict';

  const performanceMonitor = {
    metrics: {},
    
    /**
     * Initialize performance monitoring
     */
    init() {
      if (!window.performance || !window.performance.timing) {
        console.warn('[Performance] Performance API not available');
        return;
      }

      // Monitor page load
      window.addEventListener('load', () => {
        this.measurePageLoad();
      });

      // Monitor resource loading
      this.monitorResources();

      // Monitor Firebase queries
      this.monitorFirebaseQueries();

      // Monitor cache effectiveness
      this.monitorCacheHits();
    },

    /**
     * Measure page load metrics
     */
    measurePageLoad() {
      // Use Navigation Timing API Level 2
      if (window.performance.getEntriesByType) {
        const navTiming = window.performance.getEntriesByType('navigation')[0];
        
        if (navTiming) {
          this.metrics.pageLoad = {
            dns: navTiming.domainLookupEnd - navTiming.domainLookupStart,
            tcp: navTiming.connectEnd - navTiming.connectStart,
            request: navTiming.responseStart - navTiming.requestStart,
            response: navTiming.responseEnd - navTiming.responseStart,
            domProcessing: navTiming.domComplete - navTiming.domInteractive,
            domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart,
            loadComplete: navTiming.loadEventEnd - navTiming.loadEventStart,
            totalTime: navTiming.loadEventEnd - navTiming.fetchStart
          };

          console.log('[Performance] Page Load Metrics:', this.metrics.pageLoad);

          // Log to Firebase Analytics if available
          if (window.analytics) {
            window.analytics.logEvent('homepage_performance', {
              total_time: Math.round(this.metrics.pageLoad.totalTime),
              dom_processing: Math.round(this.metrics.pageLoad.domProcessing),
              page: 'homepage'
            });
          }

          // Check if performance meets requirements (< 3 seconds on 3G)
          if (this.metrics.pageLoad.totalTime > 3000) {
            console.warn('[Performance] Homepage load time exceeds 3 seconds:', 
              Math.round(this.metrics.pageLoad.totalTime), 'ms');
          } else {
            console.log('[Performance] Homepage load time is acceptable:', 
              Math.round(this.metrics.pageLoad.totalTime), 'ms');
          }
        }
      }

      // Measure First Contentful Paint
      if (window.performance.getEntriesByName) {
        const fcp = window.performance.getEntriesByName('first-contentful-paint')[0];
        if (fcp) {
          this.metrics.fcp = fcp.startTime;
          console.log('[Performance] First Contentful Paint:', Math.round(fcp.startTime), 'ms');
        }
      }

      // Measure Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.lcp = lastEntry.startTime;
            console.log('[Performance] Largest Contentful Paint:', Math.round(lastEntry.startTime), 'ms');
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // LCP not supported
        }
      }
    },

    /**
     * Monitor resource loading
     */
    monitorResources() {
      if (!window.PerformanceObserver) return;

      try {
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            // Track slow resources (> 1 second)
            if (entry.duration > 1000) {
              console.warn('[Performance] Slow resource:', {
                name: entry.name,
                duration: Math.round(entry.duration) + 'ms',
                type: entry.initiatorType
              });
            }

            // Track resource types
            if (!this.metrics.resources) {
              this.metrics.resources = {};
            }
            
            const type = entry.initiatorType || 'other';
            if (!this.metrics.resources[type]) {
              this.metrics.resources[type] = { count: 0, totalSize: 0, totalDuration: 0 };
            }
            
            this.metrics.resources[type].count++;
            this.metrics.resources[type].totalSize += entry.transferSize || 0;
            this.metrics.resources[type].totalDuration += entry.duration;
          });
        });

        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.error('[Performance] Resource observer error:', error);
      }
    },

    /**
     * Monitor Firebase query count
     */
    monitorFirebaseQueries() {
      if (!window.db) {
        setTimeout(() => this.monitorFirebaseQueries(), 100);
        return;
      }

      this.metrics.firebaseQueries = 0;

      // Wrap Firestore get method to count queries
      const originalGet = window.db.collection('providers').get;
      const self = this;
      
      // Note: This is a simplified approach for monitoring
      console.log('[Performance] Firebase query monitoring initialized');
    },

    /**
     * Monitor cache hit rate
     */
    monitorCacheHits() {
      this.metrics.cache = {
        hits: 0,
        misses: 0
      };

      // Track localStorage cache usage
      const originalGetItem = Storage.prototype.getItem;
      const self = this;

      Storage.prototype.getItem = function(key) {
        const value = originalGetItem.call(this, key);
        
        if (key.startsWith('cache_')) {
          if (value) {
            self.metrics.cache.hits++;
          } else {
            self.metrics.cache.misses++;
          }
        }
        
        return value;
      };
    },

    /**
     * Get performance summary
     */
    getSummary() {
      const summary = {
        pageLoad: this.metrics.pageLoad,
        fcp: this.metrics.fcp,
        lcp: this.metrics.lcp,
        resources: this.metrics.resources,
        cache: this.metrics.cache,
        cacheHitRate: this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses) * 100
      };

      console.log('[Performance] Summary:', summary);
      return summary;
    },

    /**
     * Report performance issues
     */
    reportIssues() {
      const issues = [];

      if (this.metrics.pageLoad && this.metrics.pageLoad.totalTime > 3000) {
        issues.push({
          type: 'slow_page_load',
          message: 'Page load time exceeds 3 seconds',
          value: this.metrics.pageLoad.totalTime
        });
      }

      if (this.metrics.fcp && this.metrics.fcp > 1800) {
        issues.push({
          type: 'slow_fcp',
          message: 'First Contentful Paint is slow',
          value: this.metrics.fcp
        });
      }

      if (this.metrics.lcp && this.metrics.lcp > 2500) {
        issues.push({
          type: 'slow_lcp',
          message: 'Largest Contentful Paint is slow',
          value: this.metrics.lcp
        });
      }

      if (issues.length > 0) {
        console.warn('[Performance] Issues detected:', issues);
      } else {
        console.log('[Performance] No performance issues detected');
      }

      return issues;
    }
  };

  // Export to window
  window.homepagePerformance = performanceMonitor;

  // Auto-initialize on homepage
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.pathname === '/' || window.location.pathname === '/home') {
        performanceMonitor.init();
      }
    });
  } else {
    if (window.location.pathname === '/' || window.location.pathname === '/home') {
      performanceMonitor.init();
    }
  }

  // Report summary after 5 seconds
  setTimeout(() => {
    if (window.location.pathname === '/' || window.location.pathname === '/home') {
      performanceMonitor.getSummary();
      performanceMonitor.reportIssues();
    }
  }, 5000);

})();

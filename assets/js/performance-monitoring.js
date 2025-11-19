/**
 * Firebase Performance Monitoring Module
 * 
 * This module handles performance monitoring for the CityHealth platform
 * including page load times, API response times, and custom performance metrics.
 */

const PerformanceMonitoring = {
  perf: null,
  traces: new Map(),
  
  /**
   * Initialize Firebase Performance Monitoring
   */
  init() {
    if (typeof firebase === 'undefined' || !firebase.performance) {
      console.warn('Firebase Performance Monitoring not available');
      return false;
    }
    
    try {
      this.perf = firebase.performance();
      console.log('Performance Monitoring initialized');
      
      // Track initial page load
      this.trackPageLoad();
      
      // Set up automatic performance tracking
      this.setupAutomaticTracking();
      
      return true;
    } catch (error) {
      console.error('Error initializing Performance Monitoring:', error);
      return false;
    }
  },

  /**
   * Track page load performance
   */
  trackPageLoad() {
    if (!this.perf) return;
    
    try {
      // Use modern Navigation Timing API Level 2
      if (window.performance && window.performance.getEntriesByType) {
        const navigationEntries = window.performance.getEntriesByType('navigation');
        if (navigationEntries && navigationEntries.length > 0) {
          const navigation = navigationEntries[0];
          const loadTime = navigation.loadEventEnd - navigation.fetchStart;
          const domReadyTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;
          const firstByteTime = navigation.responseStart - navigation.requestStart;
          
          console.log('Page Load Metrics:', {
            loadTime: `${Math.round(loadTime)}ms`,
            domReadyTime: `${Math.round(domReadyTime)}ms`,
            firstByteTime: `${Math.round(firstByteTime)}ms`
          });
          
          // Log custom metrics to Firebase Performance
          if (loadTime > 0) {
            this.recordCustomMetric('page_load_time', Math.round(loadTime));
          }
          if (domReadyTime > 0) {
            this.recordCustomMetric('dom_ready_time', Math.round(domReadyTime));
          }
          if (firstByteTime > 0) {
            this.recordCustomMetric('time_to_first_byte', Math.round(firstByteTime));
          }
        }
      }
      
      // Track First Contentful Paint (FCP) and Largest Contentful Paint (LCP)
      if (window.PerformanceObserver) {
        try {
          // Track paint metrics
          const paintObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                this.recordCustomMetric('first_contentful_paint', Math.round(entry.startTime));
                console.log('First Contentful Paint:', `${Math.round(entry.startTime)}ms`);
              }
            }
          });
          paintObserver.observe({ entryTypes: ['paint'] });
          
          // Track Largest Contentful Paint
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.recordCustomMetric('largest_contentful_paint', Math.round(lastEntry.startTime));
            console.log('Largest Contentful Paint:', `${Math.round(lastEntry.startTime)}ms`);
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Track First Input Delay (FID)
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const fid = entry.processingStart - entry.startTime;
              this.recordCustomMetric('first_input_delay', Math.round(fid));
              console.log('First Input Delay:', `${Math.round(fid)}ms`);
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
          
          // Track Cumulative Layout Shift (CLS)
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
          
          // Record CLS after page load
          window.addEventListener('load', () => {
            setTimeout(() => {
              this.recordCustomMetric('cumulative_layout_shift', Math.round(clsValue * 1000));
              console.log('Cumulative Layout Shift:', clsValue.toFixed(3));
            }, 1000);
          });
        } catch (error) {
          console.warn('PerformanceObserver not fully supported:', error);
        }
      }
    } catch (error) {
      console.error('Error tracking page load:', error);
    }
  },

  /**
   * Set up automatic performance tracking
   */
  setupAutomaticTracking() {
    // Track route changes
    window.addEventListener('routeChanged', (event) => {
      const { path } = event.detail || {};
      if (path) {
        this.trackRouteChange(path);
      }
    });
    
    // Track resource loading
    this.trackResourceLoading();
  },

  /**
   * Track route change performance
   * @param {string} path - Route path
   */
  trackRouteChange(path) {
    if (!this.perf) return;
    
    try {
      const traceName = `route_${path.replace(/\//g, '_')}`;
      const trace = this.perf.trace(traceName);
      trace.start();
      
      // Stop trace after a short delay to capture rendering time
      setTimeout(() => {
        trace.stop();
        console.log('Route change tracked:', path);
      }, 100);
    } catch (error) {
      console.error('Error tracking route change:', error);
    }
  },

  /**
   * Track resource loading performance
   */
  trackResourceLoading() {
    if (!window.PerformanceObserver) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            // Track slow resources (> 1 second)
            if (entry.duration > 1000) {
              console.warn('Slow resource:', entry.name, `${entry.duration}ms`);
              this.recordCustomMetric('slow_resource_load', entry.duration);
            }
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource tracking not supported:', error);
    }
  },

  /**
   * Start a custom trace
   * @param {string} traceName - Name of the trace
   * @returns {Object} Trace object
   */
  startTrace(traceName) {
    if (!this.perf) return null;
    
    try {
      const trace = this.perf.trace(traceName);
      trace.start();
      this.traces.set(traceName, trace);
      console.log('Trace started:', traceName);
      return trace;
    } catch (error) {
      console.error('Error starting trace:', error);
      return null;
    }
  },

  /**
   * Stop a custom trace
   * @param {string} traceName - Name of the trace
   */
  stopTrace(traceName) {
    if (!this.perf) return;
    
    try {
      const trace = this.traces.get(traceName);
      if (trace) {
        trace.stop();
        this.traces.delete(traceName);
        console.log('Trace stopped:', traceName);
      }
    } catch (error) {
      console.error('Error stopping trace:', error);
    }
  },

  /**
   * Add metric to a trace
   * @param {string} traceName - Name of the trace
   * @param {string} metricName - Name of the metric
   * @param {number} value - Metric value
   */
  addTraceMetric(traceName, metricName, value) {
    if (!this.perf) return;
    
    try {
      const trace = this.traces.get(traceName);
      if (trace) {
        trace.putMetric(metricName, value);
        console.log('Metric added to trace:', traceName, metricName, value);
      }
    } catch (error) {
      console.error('Error adding trace metric:', error);
    }
  },

  /**
   * Add attribute to a trace
   * @param {string} traceName - Name of the trace
   * @param {string} attributeName - Name of the attribute
   * @param {string} value - Attribute value
   */
  addTraceAttribute(traceName, attributeName, value) {
    if (!this.perf) return;
    
    try {
      const trace = this.traces.get(traceName);
      if (trace) {
        trace.putAttribute(attributeName, value);
        console.log('Attribute added to trace:', traceName, attributeName, value);
      }
    } catch (error) {
      console.error('Error adding trace attribute:', error);
    }
  },

  /**
   * Track Firestore query performance
   * @param {string} collection - Collection name
   * @param {string} operation - Operation type (read, write, etc.)
   * @returns {Function} Function to call when operation completes
   */
  trackFirestoreQuery(collection, operation = 'read') {
    const traceName = `firestore_${collection}_${operation}`;
    const startTime = Date.now();
    this.startTrace(traceName);
    
    return () => {
      const duration = Date.now() - startTime;
      this.addTraceMetric(traceName, 'duration', duration);
      this.addTraceAttribute(traceName, 'collection', collection);
      this.addTraceAttribute(traceName, 'operation', operation);
      this.stopTrace(traceName);
      
      console.log(`Firestore ${operation} on ${collection}:`, `${duration}ms`);
    };
  },

  /**
   * Track API call performance
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @returns {Function} Function to call when API call completes
   */
  trackAPICall(endpoint, method = 'GET') {
    const traceName = `api_${method}_${endpoint.replace(/\//g, '_')}`;
    const startTime = Date.now();
    this.startTrace(traceName);
    
    return (success = true) => {
      const duration = Date.now() - startTime;
      this.addTraceMetric(traceName, 'duration', duration);
      this.addTraceAttribute(traceName, 'endpoint', endpoint);
      this.addTraceAttribute(traceName, 'method', method);
      this.addTraceAttribute(traceName, 'success', success.toString());
      this.stopTrace(traceName);
      
      console.log(`API ${method} ${endpoint}:`, `${duration}ms`, success ? 'success' : 'failed');
    };
  },

  /**
   * Track search performance
   * @param {Object} params - Search parameters
   * @returns {Function} Function to call when search completes
   */
  trackSearch(params = {}) {
    const traceName = 'search_query';
    const startTime = Date.now();
    this.startTrace(traceName);
    
    return (resultCount = 0) => {
      const duration = Date.now() - startTime;
      this.addTraceMetric(traceName, 'duration', duration);
      this.addTraceMetric(traceName, 'result_count', resultCount);
      this.addTraceAttribute(traceName, 'has_filters', Object.keys(params).length > 0 ? 'true' : 'false');
      this.stopTrace(traceName);
      
      console.log('Search completed:', `${duration}ms`, `${resultCount} results`);
    };
  },

  /**
   * Track image loading performance
   * @param {string} imageUrl - Image URL
   * @returns {Function} Function to call when image loads
   */
  trackImageLoad(imageUrl) {
    const traceName = `image_load_${Date.now()}`;
    const startTime = Date.now();
    this.startTrace(traceName);
    
    return () => {
      const duration = Date.now() - startTime;
      this.addTraceMetric(traceName, 'duration', duration);
      this.addTraceAttribute(traceName, 'url', imageUrl);
      this.stopTrace(traceName);
      
      if (duration > 2000) {
        console.warn('Slow image load:', imageUrl, `${duration}ms`);
      }
    };
  },

  /**
   * Record a custom metric
   * @param {string} metricName - Name of the metric
   * @param {number} value - Metric value
   */
  recordCustomMetric(metricName, value) {
    if (!this.perf) return;
    
    try {
      // Create a trace for the custom metric
      const trace = this.perf.trace(metricName);
      trace.start();
      trace.putMetric(metricName, value);
      trace.stop();
      
      console.log('Custom metric recorded:', metricName, value);
    } catch (error) {
      console.error('Error recording custom metric:', error);
    }
  },

  /**
   * Track component render time
   * @param {string} componentName - Name of the component
   * @returns {Function} Function to call when render completes
   */
  trackComponentRender(componentName) {
    const traceName = `render_${componentName}`;
    const startTime = Date.now();
    this.startTrace(traceName);
    
    return () => {
      const duration = Date.now() - startTime;
      this.addTraceMetric(traceName, 'duration', duration);
      this.addTraceAttribute(traceName, 'component', componentName);
      this.stopTrace(traceName);
      
      if (duration > 500) {
        console.warn('Slow component render:', componentName, `${duration}ms`);
      }
    };
  },

  /**
   * Get performance metrics summary
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    if (!window.performance || !window.performance.getEntriesByType) {
      return null;
    }
    
    const navigationEntries = window.performance.getEntriesByType('navigation');
    if (!navigationEntries || navigationEntries.length === 0) {
      return null;
    }
    
    const navigation = navigationEntries[0];
    
    return {
      pageLoadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
      domReadyTime: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
      firstByteTime: Math.round(navigation.responseStart - navigation.requestStart),
      dnsLookupTime: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
      tcpConnectionTime: Math.round(navigation.connectEnd - navigation.connectStart),
      serverResponseTime: Math.round(navigation.responseEnd - navigation.requestStart),
      domProcessingTime: Math.round(navigation.domComplete - navigation.domInteractive),
      resourceLoadTime: Math.round(navigation.loadEventEnd - navigation.domContentLoadedEventEnd),
      transferSize: navigation.transferSize || 0,
      encodedBodySize: navigation.encodedBodySize || 0,
      decodedBodySize: navigation.decodedBodySize || 0
    };
  },

  /**
   * Log performance metrics to console
   */
  logPerformanceMetrics() {
    const metrics = this.getPerformanceMetrics();
    if (metrics) {
      console.table(metrics);
    }
  }
};

// Initialize performance monitoring when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    PerformanceMonitoring.init();
  });
} else {
  PerformanceMonitoring.init();
}

// Export for use in other modules
window.PerformanceMonitoring = PerformanceMonitoring;

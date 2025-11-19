// Performance Optimization Module for CityHealth Platform
// Handles service worker registration, resource hints, and performance monitoring

(function() {
  'use strict';

  // Performance configuration
  const config = {
    enableServiceWorker: true,
    enableResourceHints: true,
    enablePerformanceMonitoring: true,
    criticalResources: [
      '/assets/css/main.css',
      '/assets/css/themes.css',
      '/assets/css/homepage.css',
      '/assets/js/app.js',
      '/assets/js/firebase-config.js',
      '/assets/js/homepage.js'
    ],
    prefetchResources: [
      '/components/search-bar.html',
      '/pages/search-results.html'
    ]
  };

  // Service Worker registration
  async function registerServiceWorker() {
    if (!config.enableServiceWorker || !('serviceWorker' in navigator)) {
      console.log('[Performance] Service Worker not supported or disabled');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('[Performance] Service Worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('[Performance] New Service Worker available');
            
            // Optionally notify user about update
            showUpdateNotification();
          }
        });
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

    } catch (error) {
      console.error('[Performance] Service Worker registration failed:', error);
    }
  }

  // Show update notification
  function showUpdateNotification() {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="alert alert-info alert-dismissible fade show" role="alert">
        <strong>Update Available!</strong> A new version is available.
        <button type="button" class="btn btn-sm btn-primary ms-2" onclick="window.location.reload()">
          Refresh
        </button>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    
    document.body.appendChild(notification);
  }

  // Add resource hints for better performance
  function addResourceHints() {
    if (!config.enableResourceHints) {
      return;
    }

    const head = document.head;

    // DNS prefetch for external resources
    const dnsPrefetchUrls = [
      'https://www.gstatic.com',
      'https://firebasestorage.googleapis.com',
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ];

    dnsPrefetchUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = url;
      head.appendChild(link);
    });

    // Preconnect to critical origins
    const preconnectUrls = [
      'https://www.gstatic.com',
      'https://firebasestorage.googleapis.com'
    ];

    preconnectUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      link.crossOrigin = 'anonymous';
      head.appendChild(link);
    });
  }

  // Preload critical resources
  function preloadCriticalResources() {
    const head = document.head;

    config.criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      
      if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
        link.as = 'image';
      }
      
      link.href = resource;
      head.appendChild(link);
    });
  }

  // Monitor performance metrics
  function monitorPerformance() {
    if (!config.enablePerformanceMonitoring || !window.performance) {
      return;
    }

    // Wait for page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        const connectTime = perfData.responseEnd - perfData.requestStart;
        const renderTime = perfData.domComplete - perfData.domLoading;

        console.log('[Performance] Metrics:', {
          pageLoadTime: `${pageLoadTime}ms`,
          connectTime: `${connectTime}ms`,
          renderTime: `${renderTime}ms`
        });

        // Log to Firebase Analytics if available
        if (window.analytics) {
          analytics.logEvent('performance_metrics', {
            page_load_time: pageLoadTime,
            connect_time: connectTime,
            render_time: renderTime
          });
        }

        // Check if performance is acceptable (< 3 seconds on 3G)
        if (pageLoadTime > 3000) {
          console.warn('[Performance] Page load time exceeds 3 seconds');
        }
      }, 0);
    });

    // Monitor resource loading
    if (window.PerformanceObserver) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 1000) {
              console.warn('[Performance] Slow resource:', entry.name, `${entry.duration}ms`);
            }
          });
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.error('[Performance] PerformanceObserver error:', error);
      }
    }
  }

  // Optimize images on upload
  function optimizeImage(file, maxWidth = 1200, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if needed
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Defer non-critical scripts
  function deferNonCriticalScripts() {
    const scripts = document.querySelectorAll('script[data-defer]');
    
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      newScript.src = script.src;
      newScript.defer = true;
      
      if (script.dataset.module) {
        newScript.type = 'module';
      }
      
      document.body.appendChild(newScript);
      script.remove();
    });
  }

  // Check connection quality
  function getConnectionQuality() {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        return {
          effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
          downlink: connection.downlink, // Mbps
          rtt: connection.rtt, // Round trip time in ms
          saveData: connection.saveData // Data saver mode
        };
      }
    }
    
    return null;
  }

  // Adapt content based on connection
  function adaptToConnection() {
    const connection = getConnectionQuality();
    
    if (!connection) {
      return;
    }

    console.log('[Performance] Connection:', connection);

    // Reduce quality on slow connections
    if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g' || connection.saveData) {
      console.log('[Performance] Slow connection detected, optimizing...');
      
      // Disable auto-play features
      document.body.classList.add('slow-connection');
      
      // Reduce image quality
      document.documentElement.style.setProperty('--image-quality', '0.7');
      
      // Notify user
      if (connection.saveData) {
        console.log('[Performance] Data saver mode enabled');
      }
    }
  }

  // Initialize performance optimizations
  function init() {
    console.log('[Performance] Initializing optimizations...');
    
    // Register service worker
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', registerServiceWorker);
    } else {
      registerServiceWorker();
    }

    // Add resource hints
    addResourceHints();

    // Monitor performance
    monitorPerformance();

    // Adapt to connection quality
    adaptToConnection();

    // Defer non-critical scripts
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', deferNonCriticalScripts);
    } else {
      deferNonCriticalScripts();
    }

    console.log('[Performance] Initialization complete');
  }

  // Public API
  window.performance = window.performance || {};
  window.performanceOptimization = {
    init,
    registerServiceWorker,
    optimizeImage,
    getConnectionQuality,
    adaptToConnection,
    preloadCriticalResources
  };

  // Auto-initialize
  init();

})();

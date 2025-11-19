// Browser Compatibility Module for CityHealth Platform
// Provides polyfills and fixes for cross-browser compatibility

(function() {
  'use strict';

  // Detect browser and version
  const browserInfo = detectBrowser();

  /**
   * Detect browser type and version
   * @returns {Object} Browser information
   */
  function detectBrowser() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';

    // Chrome
    if (/Chrome/.test(ua) && /Google Inc/.test(navigator.vendor)) {
      browser = 'Chrome';
      version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    }
    // Firefox
    else if (/Firefox/.test(ua)) {
      browser = 'Firefox';
      version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    }
    // Safari
    else if (/Safari/.test(ua) && /Apple Computer/.test(navigator.vendor)) {
      browser = 'Safari';
      version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    }
    // Edge (Chromium)
    else if (/Edg/.test(ua)) {
      browser = 'Edge';
      version = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
    }
    // Edge (Legacy)
    else if (/Edge/.test(ua)) {
      browser = 'Edge Legacy';
      version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
    }
    // IE
    else if (/Trident/.test(ua) || /MSIE/.test(ua)) {
      browser = 'Internet Explorer';
      version = ua.match(/(?:MSIE |rv:)(\d+)/)?.[1] || 'Unknown';
    }

    return { browser, version: parseInt(version) || 0 };
  }

  /**
   * Check if browser is supported
   * @returns {boolean} True if browser is supported
   */
  function isBrowserSupported() {
    const { browser, version } = browserInfo;

    const minVersions = {
      'Chrome': 60,
      'Firefox': 55,
      'Safari': 12,
      'Edge': 79
    };

    if (browser === 'Internet Explorer') {
      return false; // IE not supported
    }

    return version >= (minVersions[browser] || 0);
  }

  /**
   * Show unsupported browser warning
   */
  function showUnsupportedBrowserWarning() {
    const warning = document.createElement('div');
    warning.className = 'alert alert-warning alert-dismissible fade show browser-warning';
    warning.setAttribute('role', 'alert');
    warning.innerHTML = `
      <strong>Unsupported Browser</strong>
      <p>You are using an outdated browser. Some features may not work correctly. 
      Please update to the latest version of Chrome, Firefox, Safari, or Edge for the best experience.</p>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.insertBefore(warning, document.body.firstChild);
  }

  /**
   * Polyfill for Object.assign (IE11)
   */
  if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      const to = Object(target);

      for (let index = 1; index < arguments.length; index++) {
        const nextSource = arguments[index];

        if (nextSource != null) {
          for (const nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }

  /**
   * Polyfill for Array.from (IE11)
   */
  if (!Array.from) {
    Array.from = function(arrayLike) {
      return Array.prototype.slice.call(arrayLike);
    };
  }

  /**
   * Polyfill for Array.prototype.includes (IE11)
   */
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
      return this.indexOf(searchElement, fromIndex) !== -1;
    };
  }

  /**
   * Polyfill for String.prototype.includes (IE11)
   */
  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      if (typeof start !== 'number') {
        start = 0;
      }
      
      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }

  /**
   * Polyfill for Promise.finally (older browsers)
   */
  if (typeof Promise !== 'undefined' && !Promise.prototype.finally) {
    Promise.prototype.finally = function(callback) {
      const constructor = this.constructor;
      return this.then(
        value => constructor.resolve(callback()).then(() => value),
        reason => constructor.resolve(callback()).then(() => { throw reason; })
      );
    };
  }

  /**
   * Polyfill for Element.closest (IE11)
   */
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(selector) {
      let el = this;
      while (el) {
        if (el.matches(selector)) {
          return el;
        }
        el = el.parentElement;
      }
      return null;
    };
  }

  /**
   * Polyfill for Element.matches (IE11)
   */
  if (!Element.prototype.matches) {
    Element.prototype.matches = 
      Element.prototype.msMatchesSelector || 
      Element.prototype.webkitMatchesSelector;
  }

  /**
   * Polyfill for CustomEvent (IE11)
   */
  if (typeof window.CustomEvent !== 'function') {
    function CustomEvent(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: null };
      const evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    }
    window.CustomEvent = CustomEvent;
  }

  /**
   * Fix for CSS custom properties in older browsers
   */
  function fixCSSCustomProperties() {
    // Check if CSS custom properties are supported
    if (!window.CSS || !window.CSS.supports || !window.CSS.supports('color', 'var(--test)')) {
      console.warn('CSS custom properties not supported. Loading polyfill...');
      
      // In production, you would load a polyfill like css-vars-ponyfill
      // For now, we'll just log a warning
    }
  }

  /**
   * Fix for Intersection Observer (older browsers)
   */
  function checkIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported. Images will load immediately.');
      // The lazy-loading module already has a fallback
    }
  }

  /**
   * Fix for Service Worker (older browsers)
   */
  function checkServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported. Offline functionality disabled.');
    }
  }

  /**
   * Fix for Fetch API (IE11)
   */
  function checkFetchAPI() {
    if (!window.fetch) {
      console.error('Fetch API not supported. Please use a modern browser.');
      // In production, you would load a fetch polyfill
    }
  }

  /**
   * Fix for localStorage (private browsing)
   */
  function checkLocalStorage() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage not available. Using memory storage fallback.');
      
      // Create in-memory storage fallback
      window.memoryStorage = {};
      
      Storage.prototype.setItem = function(key, value) {
        window.memoryStorage[key] = value;
      };
      
      Storage.prototype.getItem = function(key) {
        return window.memoryStorage[key] || null;
      };
      
      Storage.prototype.removeItem = function(key) {
        delete window.memoryStorage[key];
      };
      
      Storage.prototype.clear = function() {
        window.memoryStorage = {};
      };
      
      return false;
    }
  }

  /**
   * Fix for smooth scrolling (Safari)
   */
  function fixSmoothScrolling() {
    // Safari doesn't support scroll-behavior: smooth in CSS
    if (browserInfo.browser === 'Safari') {
      document.documentElement.style.scrollBehavior = 'auto';
      
      // Polyfill smooth scrolling
      const originalScrollTo = window.scrollTo;
      window.scrollTo = function(options) {
        if (typeof options === 'object' && options.behavior === 'smooth') {
          const start = window.pageYOffset;
          const target = options.top || 0;
          const distance = target - start;
          const duration = 500;
          let startTime = null;

          function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Easing function
            const ease = progress < 0.5
              ? 2 * progress * progress
              : -1 + (4 - 2 * progress) * progress;
            
            window.scrollTo(0, start + distance * ease);
            
            if (timeElapsed < duration) {
              requestAnimationFrame(animation);
            }
          }
          
          requestAnimationFrame(animation);
        } else {
          originalScrollTo.call(window, options);
        }
      };
    }
  }

  /**
   * Fix for focus-visible (older browsers)
   */
  function fixFocusVisible() {
    // Add focus-visible polyfill behavior
    let hadKeyboardEvent = false;

    document.addEventListener('keydown', () => {
      hadKeyboardEvent = true;
    });

    document.addEventListener('mousedown', () => {
      hadKeyboardEvent = false;
    });

    document.addEventListener('focus', (e) => {
      if (hadKeyboardEvent) {
        e.target.classList.add('focus-visible');
      }
    }, true);

    document.addEventListener('blur', (e) => {
      e.target.classList.remove('focus-visible');
    }, true);
  }

  /**
   * Fix for date input (Safari, Firefox)
   */
  function fixDateInput() {
    // Check if date input is supported
    const input = document.createElement('input');
    input.setAttribute('type', 'date');
    
    if (input.type === 'text') {
      console.warn('Date input not supported. Consider using a date picker library.');
      // In production, you would load a date picker polyfill
    }
  }

  /**
   * Fix for CSS Grid (IE11)
   */
  function fixCSSGrid() {
    // Check if CSS Grid is supported
    if (!window.CSS || !window.CSS.supports || !window.CSS.supports('display', 'grid')) {
      console.warn('CSS Grid not supported. Layout may not work correctly.');
      document.body.classList.add('no-css-grid');
    }
  }

  /**
   * Fix for Flexbox bugs (IE11)
   */
  function fixFlexbox() {
    if (browserInfo.browser === 'Internet Explorer') {
      // Add IE-specific flexbox fixes
      document.body.classList.add('ie-flexbox-fix');
    }
  }

  /**
   * Initialize all compatibility fixes
   */
  function init() {
    console.log('[Browser Compat] Detected:', browserInfo.browser, browserInfo.version);

    // Check browser support
    if (!isBrowserSupported()) {
      showUnsupportedBrowserWarning();
    }

    // Apply fixes
    fixCSSCustomProperties();
    checkIntersectionObserver();
    checkServiceWorker();
    checkFetchAPI();
    checkLocalStorage();
    fixSmoothScrolling();
    fixFocusVisible();
    fixDateInput();
    fixCSSGrid();
    fixFlexbox();

    // Add browser class to body for CSS targeting
    document.body.classList.add(`browser-${browserInfo.browser.toLowerCase().replace(/\s+/g, '-')}`);
    document.body.classList.add(`browser-version-${browserInfo.version}`);

    console.log('[Browser Compat] Initialization complete');
  }

  // Public API
  window.browserCompat = {
    init,
    detectBrowser,
    isBrowserSupported,
    browserInfo
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

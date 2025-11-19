// Lazy Loading Module for CityHealth Platform
// Implements lazy loading for images and other resources

(function() {
  'use strict';

  // Lazy loading configuration
  const config = {
    rootMargin: '50px 0px', // Start loading 50px before entering viewport
    threshold: 0.01,
    enableWebP: true
  };

  // Check WebP support
  let webpSupported = false;
  
  function checkWebPSupport() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = function() {
        webpSupported = (webP.height === 2);
        resolve(webpSupported);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  // Initialize WebP check
  checkWebPSupport();

  // Intersection Observer for lazy loading
  let imageObserver;

  function initImageObserver() {
    if ('IntersectionObserver' in window) {
      imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            loadImage(img);
            observer.unobserve(img);
          }
        });
      }, config);
    }
  }

  // Load image with WebP fallback
  function loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    if (!src && !srcset) {
      return;
    }

    // Handle WebP conversion for Firebase Storage URLs
    if (webpSupported && config.enableWebP && src && src.includes('firebasestorage')) {
      const webpSrc = convertToWebP(src);
      
      // Try loading WebP first
      const testImg = new Image();
      testImg.onload = function() {
        setImageSource(img, webpSrc, srcset);
      };
      testImg.onerror = function() {
        // Fallback to original format
        setImageSource(img, src, srcset);
      };
      testImg.src = webpSrc;
    } else {
      setImageSource(img, src, srcset);
    }
  }

  // Set image source and handle loading states
  function setImageSource(img, src, srcset) {
    // Add loading class
    img.classList.add('lazy-loading');
    
    // Set sources
    if (srcset) {
      img.srcset = srcset;
    }
    if (src) {
      img.src = src;
    }

    // Handle load completion
    img.onload = function() {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
      
      // Remove data attributes
      delete img.dataset.src;
      delete img.dataset.srcset;
    };

    // Handle load error
    img.onerror = function() {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
      
      // Set placeholder or default image
      if (img.dataset.fallback) {
        img.src = img.dataset.fallback;
      }
    };
  }

  // Convert image URL to WebP format
  function convertToWebP(url) {
    // For Firebase Storage, we can request WebP format
    // This is a simplified approach - adjust based on your storage setup
    return url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  // Observe images for lazy loading
  function observeImages(container = document) {
    if (!imageObserver) {
      initImageObserver();
    }

    const lazyImages = container.querySelectorAll('img[data-src], img[data-srcset]');
    
    if (imageObserver) {
      lazyImages.forEach((img) => {
        imageObserver.observe(img);
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      lazyImages.forEach((img) => {
        loadImage(img);
      });
    }
  }

  // Lazy load background images
  function observeBackgrounds(container = document) {
    if (!imageObserver) {
      initImageObserver();
    }

    const lazyBackgrounds = container.querySelectorAll('[data-bg]');
    
    if (imageObserver) {
      const bgObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target;
            const bgUrl = element.dataset.bg;
            
            if (bgUrl) {
              element.style.backgroundImage = `url('${bgUrl}')`;
              element.classList.add('lazy-loaded');
              delete element.dataset.bg;
            }
            
            observer.unobserve(element);
          }
        });
      }, config);

      lazyBackgrounds.forEach((element) => {
        bgObserver.observe(element);
      });
    } else {
      // Fallback
      lazyBackgrounds.forEach((element) => {
        const bgUrl = element.dataset.bg;
        if (bgUrl) {
          element.style.backgroundImage = `url('${bgUrl}')`;
          element.classList.add('lazy-loaded');
          delete element.dataset.bg;
        }
      });
    }
  }

  // Preload critical images
  function preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  // Preload multiple images
  function preloadImages(urls) {
    return Promise.all(urls.map(url => preloadImage(url)));
  }

  // Initialize lazy loading on page load
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        observeImages();
        observeBackgrounds();
      });
    } else {
      observeImages();
      observeBackgrounds();
    }
  }

  // Public API
  window.lazyLoading = {
    init,
    observeImages,
    observeBackgrounds,
    preloadImage,
    preloadImages,
    checkWebPSupport,
    isWebPSupported: () => webpSupported
  };

  // Auto-initialize
  init();

})();

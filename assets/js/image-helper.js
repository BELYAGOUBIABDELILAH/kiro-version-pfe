// Image Helper Module for CityHealth Platform
// Provides utilities for creating lazy-loaded images with WebP support

(function() {
  'use strict';

  /**
   * Create a lazy-loaded image element
   * @param {Object} options - Image options
   * @param {string} options.src - Image source URL
   * @param {string} options.alt - Alt text for accessibility
   * @param {string} options.className - CSS classes
   * @param {string} options.fallback - Fallback image URL
   * @param {boolean} options.eager - Load immediately without lazy loading
   * @returns {HTMLImageElement} Image element
   */
  function createLazyImage(options) {
    const {
      src,
      alt = '',
      className = '',
      fallback = '/assets/images/placeholder.png',
      eager = false
    } = options;

    const img = document.createElement('img');
    img.alt = alt;
    img.className = className;

    if (eager) {
      // Load immediately
      img.src = src;
    } else {
      // Lazy load
      img.dataset.src = src;
      if (fallback) {
        img.dataset.fallback = fallback;
      }
      
      // Add placeholder class
      img.classList.add('image-placeholder');
      
      // Set a low-quality placeholder or solid color
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E';
    }

    return img;
  }

  /**
   * Create a picture element with WebP support and lazy loading
   * @param {Object} options - Picture options
   * @param {string} options.src - Image source URL (fallback)
   * @param {string} options.webpSrc - WebP source URL
   * @param {string} options.alt - Alt text
   * @param {string} options.className - CSS classes
   * @param {boolean} options.eager - Load immediately
   * @returns {HTMLPictureElement} Picture element
   */
  function createResponsivePicture(options) {
    const {
      src,
      webpSrc,
      alt = '',
      className = '',
      eager = false
    } = options;

    const picture = document.createElement('picture');

    // WebP source
    if (webpSrc) {
      const webpSource = document.createElement('source');
      webpSource.type = 'image/webp';
      
      if (eager) {
        webpSource.srcset = webpSrc;
      } else {
        webpSource.dataset.srcset = webpSrc;
      }
      
      picture.appendChild(webpSource);
    }

    // Fallback image
    const img = createLazyImage({
      src,
      alt,
      className,
      eager
    });

    picture.appendChild(img);

    return picture;
  }

  /**
   * Convert existing images to lazy loading
   * @param {HTMLElement} container - Container element
   */
  function convertToLazyLoading(container = document) {
    const images = container.querySelectorAll('img:not([data-src]):not([data-no-lazy])');
    
    images.forEach(img => {
      if (img.src && !img.dataset.src) {
        const originalSrc = img.src;
        img.dataset.src = originalSrc;
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E';
        img.classList.add('image-placeholder');
      }
    });

    // Trigger lazy loading observer
    if (window.lazyLoading) {
      window.lazyLoading.observeImages(container);
    }
  }

  /**
   * Create provider card image with lazy loading
   * @param {Object} provider - Provider data
   * @returns {HTMLElement} Image element
   */
  function createProviderImage(provider) {
    const imageUrl = provider.images && provider.images.length > 0
      ? provider.images[0]
      : '/assets/images/default-provider.png';

    return createLazyImage({
      src: imageUrl,
      alt: `${provider.name} - ${provider.type}`,
      className: 'provider-card-image',
      fallback: '/assets/images/default-provider.png'
    });
  }

  /**
   * Preload critical images
   * @param {Array<string>} urls - Array of image URLs
   */
  function preloadCriticalImages(urls) {
    if (window.lazyLoading && window.lazyLoading.preloadImages) {
      return window.lazyLoading.preloadImages(urls);
    }

    // Fallback preloading
    return Promise.all(
      urls.map(url => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      })
    );
  }

  /**
   * Get optimized image URL for Firebase Storage
   * @param {string} url - Original image URL
   * @param {Object} options - Optimization options
   * @param {number} options.width - Target width
   * @param {number} options.height - Target height
   * @param {string} options.format - Target format (webp, jpeg, png)
   * @returns {string} Optimized image URL
   */
  function getOptimizedImageUrl(url, options = {}) {
    const { width, height, format = 'webp' } = options;

    // For Firebase Storage URLs, we can add transformation parameters
    if (url.includes('firebasestorage.googleapis.com')) {
      const urlObj = new URL(url);
      
      // Add transformation parameters
      if (width) urlObj.searchParams.set('width', width);
      if (height) urlObj.searchParams.set('height', height);
      if (format) urlObj.searchParams.set('format', format);
      
      return urlObj.toString();
    }

    return url;
  }

  /**
   * Create responsive image srcset
   * @param {string} baseUrl - Base image URL
   * @param {Array<number>} widths - Array of widths for srcset
   * @returns {string} srcset string
   */
  function createSrcset(baseUrl, widths = [320, 640, 960, 1280]) {
    return widths
      .map(width => {
        const url = getOptimizedImageUrl(baseUrl, { width });
        return `${url} ${width}w`;
      })
      .join(', ');
  }

  // Public API
  window.imageHelper = {
    createLazyImage,
    createResponsivePicture,
    convertToLazyLoading,
    createProviderImage,
    preloadCriticalImages,
    getOptimizedImageUrl,
    createSrcset
  };

})();

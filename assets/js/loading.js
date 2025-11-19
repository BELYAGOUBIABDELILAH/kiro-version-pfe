/**
 * Loading Indicators Module
 * Provides various loading states and indicators
 */

const LoadingIndicator = {
  // Active loaders tracking
  activeLoaders: new Set(),

  /**
   * Initialize loading indicator module
   */
  init() {
    console.log('Loading indicator module initialized');
  },

  /**
   * Show global loading overlay
   * @param {string} message - Optional loading message
   * @returns {string} - Loader ID
   */
  showGlobalLoader(message = null) {
    const loaderId = Utils.generateId('loader');
    this.activeLoaders.add(loaderId);

    let overlay = document.getElementById('global-loading-overlay');
    
    if (!overlay) {
      overlay = Utils.createElement('div', {
        id: 'global-loading-overlay',
        className: 'loading-overlay',
        role: 'status',
        'aria-live': 'polite',
        'aria-busy': 'true'
      });

      const spinner = Utils.createElement('div', {
        className: 'loading-spinner-container'
      });

      const spinnerElement = Utils.createElement('div', {
        className: 'loading-spinner',
        'aria-label': this.translate('common.loading')
      });

      spinner.appendChild(spinnerElement);

      if (message) {
        const messageElement = Utils.createElement('div', {
          className: 'loading-message'
        }, message);
        spinner.appendChild(messageElement);
      }

      overlay.appendChild(spinner);
      document.body.appendChild(overlay);
    }

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    return loaderId;
  },

  /**
   * Hide global loading overlay
   * @param {string} loaderId - Loader ID to remove
   */
  hideGlobalLoader(loaderId = null) {
    if (loaderId) {
      this.activeLoaders.delete(loaderId);
    }

    // Only hide if no active loaders
    if (this.activeLoaders.size === 0) {
      const overlay = document.getElementById('global-loading-overlay');
      if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
        
        setTimeout(() => {
          if (this.activeLoaders.size === 0) {
            overlay.remove();
          }
        }, 300);
      }
    }
  },

  /**
   * Show inline spinner in element
   * @param {HTMLElement|string} target - Target element or selector
   * @param {Object} options - Spinner options
   * @returns {HTMLElement} - Spinner element
   */
  showSpinner(target, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    
    if (!element) {
      console.warn('Target element not found for spinner');
      return null;
    }

    const config = {
      size: 'medium', // small, medium, large
      color: 'primary',
      message: null,
      replace: false, // Replace content or append
      ...options
    };

    const spinner = Utils.createElement('div', {
      className: `spinner-inline spinner-${config.size} spinner-${config.color}`,
      role: 'status',
      'aria-live': 'polite',
      'aria-label': this.translate('common.loading')
    });

    const spinnerElement = Utils.createElement('div', {
      className: 'spinner-circle'
    });

    spinner.appendChild(spinnerElement);

    if (config.message) {
      const messageElement = Utils.createElement('div', {
        className: 'spinner-message'
      }, config.message);
      spinner.appendChild(messageElement);
    }

    if (config.replace) {
      element.innerHTML = '';
    }

    element.appendChild(spinner);
    return spinner;
  },

  /**
   * Hide spinner from element
   * @param {HTMLElement|string} target - Target element or selector
   */
  hideSpinner(target) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    
    if (!element) return;

    const spinners = element.querySelectorAll('.spinner-inline');
    spinners.forEach(spinner => spinner.remove());
  },

  /**
   * Show skeleton screen
   * @param {HTMLElement|string} target - Target element or selector
   * @param {Object} options - Skeleton options
   */
  showSkeleton(target, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    
    if (!element) {
      console.warn('Target element not found for skeleton');
      return;
    }

    const config = {
      type: 'card', // card, list, text, custom
      count: 1,
      ...options
    };

    element.innerHTML = '';
    element.classList.add('skeleton-container');

    for (let i = 0; i < config.count; i++) {
      const skeleton = this.createSkeleton(config.type);
      element.appendChild(skeleton);
    }
  },

  /**
   * Create skeleton element based on type
   * @param {string} type - Skeleton type
   * @returns {HTMLElement} - Skeleton element
   */
  createSkeleton(type) {
    const skeleton = Utils.createElement('div', {
      className: 'skeleton',
      'aria-hidden': 'true'
    });

    switch (type) {
      case 'card':
        skeleton.innerHTML = `
          <div class="skeleton-image"></div>
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-line-title"></div>
            <div class="skeleton-line skeleton-line-text"></div>
            <div class="skeleton-line skeleton-line-text short"></div>
          </div>
        `;
        break;

      case 'list':
        skeleton.innerHTML = `
          <div class="skeleton-list-item">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-list-content">
              <div class="skeleton-line skeleton-line-title"></div>
              <div class="skeleton-line skeleton-line-text short"></div>
            </div>
          </div>
        `;
        break;

      case 'text':
        skeleton.innerHTML = `
          <div class="skeleton-line skeleton-line-text"></div>
          <div class="skeleton-line skeleton-line-text"></div>
          <div class="skeleton-line skeleton-line-text short"></div>
        `;
        break;

      default:
        skeleton.innerHTML = `
          <div class="skeleton-line"></div>
        `;
    }

    return skeleton;
  },

  /**
   * Hide skeleton screen
   * @param {HTMLElement|string} target - Target element or selector
   */
  hideSkeleton(target) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    
    if (!element) return;

    element.classList.remove('skeleton-container');
    const skeletons = element.querySelectorAll('.skeleton');
    skeletons.forEach(skeleton => skeleton.remove());
  },

  /**
   * Show progress bar
   * @param {HTMLElement|string} target - Target element or selector
   * @param {number} progress - Progress percentage (0-100)
   * @param {Object} options - Progress bar options
   * @returns {HTMLElement} - Progress bar element
   */
  showProgress(target, progress = 0, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    
    if (!element) {
      console.warn('Target element not found for progress bar');
      return null;
    }

    const config = {
      label: null,
      showPercentage: true,
      color: 'primary',
      ...options
    };

    let progressBar = element.querySelector('.progress-bar-container');
    
    if (!progressBar) {
      progressBar = Utils.createElement('div', {
        className: 'progress-bar-container',
        role: 'progressbar',
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': progress.toString()
      });

      if (config.label) {
        const label = Utils.createElement('div', {
          className: 'progress-label'
        }, config.label);
        progressBar.appendChild(label);
      }

      const track = Utils.createElement('div', {
        className: 'progress-track'
      });

      const fill = Utils.createElement('div', {
        className: `progress-fill progress-${config.color}`
      });

      track.appendChild(fill);
      progressBar.appendChild(track);

      if (config.showPercentage) {
        const percentage = Utils.createElement('div', {
          className: 'progress-percentage'
        }, `${Math.round(progress)}%`);
        progressBar.appendChild(percentage);
      }

      element.appendChild(progressBar);
    }

    this.updateProgress(progressBar, progress);
    return progressBar;
  },

  /**
   * Update progress bar
   * @param {HTMLElement} progressBar - Progress bar element
   * @param {number} progress - Progress percentage (0-100)
   */
  updateProgress(progressBar, progress) {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    
    progressBar.setAttribute('aria-valuenow', clampedProgress.toString());
    
    const fill = progressBar.querySelector('.progress-fill');
    if (fill) {
      fill.style.width = `${clampedProgress}%`;
    }

    const percentage = progressBar.querySelector('.progress-percentage');
    if (percentage) {
      percentage.textContent = `${Math.round(clampedProgress)}%`;
    }
  },

  /**
   * Hide progress bar
   * @param {HTMLElement|string} target - Target element or selector
   */
  hideProgress(target) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    
    if (!element) return;

    const progressBar = element.querySelector('.progress-bar-container');
    if (progressBar) {
      progressBar.remove();
    }
  },

  /**
   * Show button loading state
   * @param {HTMLElement|string} button - Button element or selector
   * @param {string} loadingText - Optional loading text
   */
  showButtonLoading(button, loadingText = null) {
    const element = typeof button === 'string' ? document.querySelector(button) : button;
    
    if (!element) return;

    // Store original content
    if (!element.dataset.originalContent) {
      element.dataset.originalContent = element.innerHTML;
    }

    element.disabled = true;
    element.classList.add('btn-loading');

    const spinner = Utils.createElement('span', {
      className: 'btn-spinner',
      'aria-hidden': 'true'
    });

    const text = loadingText || this.translate('common.loading');
    const textElement = Utils.createElement('span', {}, text);

    element.innerHTML = '';
    element.appendChild(spinner);
    element.appendChild(textElement);
  },

  /**
   * Hide button loading state
   * @param {HTMLElement|string} button - Button element or selector
   */
  hideButtonLoading(button) {
    const element = typeof button === 'string' ? document.querySelector(button) : button;
    
    if (!element) return;

    element.disabled = false;
    element.classList.remove('btn-loading');

    if (element.dataset.originalContent) {
      element.innerHTML = element.dataset.originalContent;
      delete element.dataset.originalContent;
    }
  },

  /**
   * Show loading state during navigation
   */
  showNavigationLoading() {
    const loader = document.getElementById('navigation-loader');
    
    if (loader) {
      loader.classList.add('show');
    } else {
      const newLoader = Utils.createElement('div', {
        id: 'navigation-loader',
        className: 'navigation-loader show',
        role: 'status',
        'aria-live': 'polite'
      });

      const bar = Utils.createElement('div', {
        className: 'navigation-loader-bar'
      });

      newLoader.appendChild(bar);
      document.body.appendChild(newLoader);
    }
  },

  /**
   * Hide loading state after navigation
   */
  hideNavigationLoading() {
    const loader = document.getElementById('navigation-loader');
    
    if (loader) {
      loader.classList.remove('show');
      setTimeout(() => {
        if (!loader.classList.contains('show')) {
          loader.remove();
        }
      }, 300);
    }
  },

  /**
   * Wrap async operation with loading indicator
   * @param {Function} operation - Async operation
   * @param {Object} options - Loading options
   * @returns {Promise} - Operation result
   */
  async withLoading(operation, options = {}) {
    const config = {
      type: 'global', // global, spinner, skeleton, button
      target: null,
      message: null,
      ...options
    };

    let loaderId;

    try {
      // Show loading
      switch (config.type) {
        case 'global':
          loaderId = this.showGlobalLoader(config.message);
          break;
        case 'spinner':
          if (config.target) {
            this.showSpinner(config.target, { message: config.message });
          }
          break;
        case 'skeleton':
          if (config.target) {
            this.showSkeleton(config.target, config);
          }
          break;
        case 'button':
          if (config.target) {
            this.showButtonLoading(config.target, config.message);
          }
          break;
      }

      // Execute operation
      const result = await operation();
      return result;

    } finally {
      // Hide loading
      switch (config.type) {
        case 'global':
          this.hideGlobalLoader(loaderId);
          break;
        case 'spinner':
          if (config.target) {
            this.hideSpinner(config.target);
          }
          break;
        case 'skeleton':
          if (config.target) {
            this.hideSkeleton(config.target);
          }
          break;
        case 'button':
          if (config.target) {
            this.hideButtonLoading(config.target);
          }
          break;
      }
    }
  },

  /**
   * Translate loading message
   * @param {string} key - Translation key
   * @returns {string} - Translated message
   */
  translate(key) {
    if (window.i18n && window.i18n.translate) {
      return window.i18n.translate(key);
    }
    
    const fallbacks = {
      'common.loading': 'Loading...'
    };

    return fallbacks[key] || key;
  }
};

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => LoadingIndicator.init());
} else {
  LoadingIndicator.init();
}

// Export for use in other modules
window.LoadingIndicator = LoadingIndicator;

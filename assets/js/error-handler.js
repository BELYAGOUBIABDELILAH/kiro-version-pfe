/**
 * Error Handler Module
 * Global error handling and user-friendly error display
 */

const ErrorHandler = {
  // Error types
  ErrorTypes: {
    NETWORK: 'network',
    AUTH: 'auth',
    PERMISSION: 'permission',
    VALIDATION: 'validation',
    NOT_FOUND: 'not_found',
    SERVER: 'server',
    UNKNOWN: 'unknown'
  },

  // Retry configuration
  retryConfig: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  },

  // Online/offline status
  isOnline: navigator.onLine,

  /**
   * Initialize error handler
   */
  init() {
    // Global error handler for uncaught errors
    window.addEventListener('error', (event) => {
      console.error('Uncaught error:', event.error);
      this.logError(event.error, { type: 'uncaught' });
      this.showError(this.getErrorMessage(event.error));
    });

    // Global handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.logError(event.reason, { type: 'unhandled_promise' });
      this.showError(this.getErrorMessage(event.reason));
    });

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.hideOfflineIndicator();
      this.showSuccess(this.translate('error.back_online'));
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineIndicator();
    });

    // Check initial online status
    if (!this.isOnline) {
      this.showOfflineIndicator();
    }

    console.log('Error handler initialized');
  },

  /**
   * Handle error with automatic retry logic
   * @param {Function} operation - Async operation to execute
   * @param {Object} options - Retry options
   * @returns {Promise} - Result of operation
   */
  async withRetry(operation, options = {}) {
    const config = { ...this.retryConfig, ...options };
    let lastError;
    let delay = config.initialDelay;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain error types
        if (this.shouldNotRetry(error)) {
          throw error;
        }

        // Last attempt failed
        if (attempt === config.maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
        await Utils.wait(delay);
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }

    // All retries failed
    this.logError(lastError, { retries: config.maxRetries });
    throw lastError;
  },

  /**
   * Check if error should not be retried
   * @param {Error} error - Error object
   * @returns {boolean} - True if should not retry
   */
  shouldNotRetry(error) {
    // Don't retry auth errors
    if (error.code && error.code.includes('auth/')) {
      return true;
    }

    // Don't retry permission errors
    if (error.code === 'permission-denied') {
      return true;
    }

    // Don't retry validation errors
    if (error.code === 'invalid-argument') {
      return true;
    }

    // Don't retry not found errors
    if (error.code === 'not-found') {
      return true;
    }

    return false;
  },

  /**
   * Get error type from error object
   * @param {Error} error - Error object
   * @returns {string} - Error type
   */
  getErrorType(error) {
    if (!error) return this.ErrorTypes.UNKNOWN;

    // Network errors
    if (!navigator.onLine || error.message?.includes('network') || error.message?.includes('fetch')) {
      return this.ErrorTypes.NETWORK;
    }

    // Firebase auth errors
    if (error.code && error.code.includes('auth/')) {
      return this.ErrorTypes.AUTH;
    }

    // Permission errors
    if (error.code === 'permission-denied') {
      return this.ErrorTypes.PERMISSION;
    }

    // Not found errors
    if (error.code === 'not-found') {
      return this.ErrorTypes.NOT_FOUND;
    }

    // Validation errors
    if (error.code === 'invalid-argument' || error.name === 'ValidationError') {
      return this.ErrorTypes.VALIDATION;
    }

    // Server errors
    if (error.code && (error.code.includes('unavailable') || error.code.includes('internal'))) {
      return this.ErrorTypes.SERVER;
    }

    return this.ErrorTypes.UNKNOWN;
  },

  /**
   * Get user-friendly error message
   * @param {Error} error - Error object
   * @returns {string} - User-friendly message
   */
  getErrorMessage(error) {
    const errorType = this.getErrorType(error);

    // Check for specific Firebase error codes
    if (error.code) {
      const message = this.getFirebaseErrorMessage(error.code);
      if (message) return message;
    }

    // Generic messages by type
    switch (errorType) {
      case this.ErrorTypes.NETWORK:
        return this.translate('error.network');
      case this.ErrorTypes.AUTH:
        return this.translate('error.auth');
      case this.ErrorTypes.PERMISSION:
        return this.translate('error.permission');
      case this.ErrorTypes.VALIDATION:
        return this.translate('error.validation');
      case this.ErrorTypes.NOT_FOUND:
        return this.translate('error.not_found');
      case this.ErrorTypes.SERVER:
        return this.translate('error.server');
      default:
        return this.translate('error.unknown');
    }
  },

  /**
   * Get Firebase-specific error message
   * @param {string} code - Firebase error code
   * @returns {string|null} - Error message or null
   */
  getFirebaseErrorMessage(code) {
    const messages = {
      // Auth errors
      'auth/email-already-in-use': this.translate('error.email_in_use'),
      'auth/invalid-email': this.translate('error.invalid_email'),
      'auth/user-not-found': this.translate('error.user_not_found'),
      'auth/wrong-password': this.translate('error.wrong_password'),
      'auth/weak-password': this.translate('error.weak_password'),
      'auth/too-many-requests': this.translate('error.too_many_requests'),
      'auth/network-request-failed': this.translate('error.network'),
      
      // Firestore errors
      'permission-denied': this.translate('error.permission'),
      'not-found': this.translate('error.not_found'),
      'already-exists': this.translate('error.already_exists'),
      'resource-exhausted': this.translate('error.quota_exceeded'),
      'unavailable': this.translate('error.service_unavailable'),
      
      // Storage errors
      'storage/unauthorized': this.translate('error.permission'),
      'storage/canceled': this.translate('error.upload_canceled'),
      'storage/unknown': this.translate('error.upload_failed')
    };

    return messages[code] || null;
  },

  /**
   * Show error message to user
   * @param {string|Error} error - Error message or object
   * @param {Object} options - Display options
   */
  showError(error, options = {}) {
    const message = typeof error === 'string' ? error : this.getErrorMessage(error);
    const config = {
      duration: 5000,
      dismissible: true,
      ...options
    };

    this.showNotification(message, 'error', config);
  },

  /**
   * Show success message to user
   * @param {string} message - Success message
   * @param {Object} options - Display options
   */
  showSuccess(message, options = {}) {
    const config = {
      duration: 3000,
      dismissible: true,
      ...options
    };

    this.showNotification(message, 'success', config);
  },

  /**
   * Show warning message to user
   * @param {string} message - Warning message
   * @param {Object} options - Display options
   */
  showWarning(message, options = {}) {
    const config = {
      duration: 4000,
      dismissible: true,
      ...options
    };

    this.showNotification(message, 'warning', config);
  },

  /**
   * Show info message to user
   * @param {string} message - Info message
   * @param {Object} options - Display options
   */
  showInfo(message, options = {}) {
    const config = {
      duration: 3000,
      dismissible: true,
      ...options
    };

    this.showNotification(message, 'info', config);
  },

  /**
   * Show notification to user
   * @param {string} message - Notification message
   * @param {string} type - Notification type (error, success, warning, info)
   * @param {Object} options - Display options
   */
  showNotification(message, type = 'info', options = {}) {
    const container = this.getNotificationContainer();
    
    const notification = Utils.createElement('div', {
      className: `notification notification-${type}`,
      role: 'alert',
      'aria-live': type === 'error' ? 'assertive' : 'polite'
    });

    const content = Utils.createElement('div', {
      className: 'notification-content'
    }, message);

    notification.appendChild(content);

    // Add dismiss button if dismissible
    if (options.dismissible) {
      const dismissBtn = Utils.createElement('button', {
        className: 'notification-dismiss',
        'aria-label': this.translate('common.close')
      }, '×');

      dismissBtn.addEventListener('click', () => {
        this.dismissNotification(notification);
      });

      notification.appendChild(dismissBtn);
    }

    // Add to container
    container.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto dismiss if duration specified
    if (options.duration) {
      setTimeout(() => {
        this.dismissNotification(notification);
      }, options.duration);
    }

    // Announce to screen readers
    this.announceToScreenReader(message);
  },

  /**
   * Dismiss notification
   * @param {HTMLElement} notification - Notification element
   */
  dismissNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  },

  /**
   * Get or create notification container
   * @returns {HTMLElement} - Notification container
   */
  getNotificationContainer() {
    let container = document.getElementById('notification-container');
    
    if (!container) {
      container = Utils.createElement('div', {
        id: 'notification-container',
        className: 'notification-container',
        'aria-live': 'polite',
        'aria-atomic': 'true'
      });
      document.body.appendChild(container);
    }

    return container;
  },

  /**
   * Show offline indicator
   */
  showOfflineIndicator() {
    let indicator = document.getElementById('offline-indicator');
    
    if (!indicator) {
      indicator = Utils.createElement('div', {
        id: 'offline-indicator',
        className: 'offline-indicator',
        role: 'status',
        'aria-live': 'polite'
      }, `
        <span class="offline-icon">📡</span>
        <span class="offline-text">${this.translate('error.offline')}</span>
      `);
      document.body.appendChild(indicator);
    }

    indicator.classList.add('show');
    this.announceToScreenReader(this.translate('error.offline'));
  },

  /**
   * Hide offline indicator
   */
  hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.classList.remove('show');
      setTimeout(() => indicator.remove(), 300);
    }
  },

  /**
   * Log error to Firebase Analytics
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  logError(error, context = {}) {
    try {
      const errorData = {
        message: error.message || 'Unknown error',
        stack: error.stack || '',
        code: error.code || '',
        type: this.getErrorType(error),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        ...context
      };

      // Log to console in development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.error('Error logged:', errorData);
      }

      // Log to Firebase Analytics if available
      if (window.analytics) {
        window.analytics.logEvent('error', {
          error_message: errorData.message,
          error_type: errorData.type,
          error_code: errorData.code
        });
      }

      // Store recent errors for debugging
      this.storeRecentError(errorData);
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  },

  /**
   * Store recent error in session storage
   * @param {Object} errorData - Error data
   */
  storeRecentError(errorData) {
    try {
      const recentErrors = Utils.getSessionStorage('recent_errors', []);
      recentErrors.unshift(errorData);
      
      // Keep only last 10 errors
      if (recentErrors.length > 10) {
        recentErrors.pop();
      }

      Utils.setSessionStorage('recent_errors', recentErrors);
    } catch (error) {
      console.error('Failed to store recent error:', error);
    }
  },

  /**
   * Get recent errors from session storage
   * @returns {Array} - Recent errors
   */
  getRecentErrors() {
    return Utils.getSessionStorage('recent_errors', []);
  },

  /**
   * Clear recent errors
   */
  clearRecentErrors() {
    Utils.removeStorage('recent_errors');
  },

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   */
  announceToScreenReader(message) {
    let liveRegion = document.getElementById('aria-live-region');
    
    if (!liveRegion) {
      liveRegion = Utils.createElement('div', {
        id: 'aria-live-region',
        className: 'sr-only',
        'aria-live': 'polite',
        'aria-atomic': 'true'
      });
      document.body.appendChild(liveRegion);
    }

    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  },

  /**
   * Translate error message
   * @param {string} key - Translation key
   * @returns {string} - Translated message
   */
  translate(key) {
    if (window.i18n && window.i18n.translate) {
      return window.i18n.translate(key);
    }
    
    // Fallback messages
    const fallbacks = {
      'error.network': 'Network error. Please check your connection and try again.',
      'error.auth': 'Authentication error. Please sign in again.',
      'error.permission': 'You do not have permission to perform this action.',
      'error.validation': 'Please check your input and try again.',
      'error.not_found': 'The requested resource was not found.',
      'error.server': 'Server error. Please try again later.',
      'error.unknown': 'An unexpected error occurred. Please try again.',
      'error.offline': 'You are currently offline. Some features may not be available.',
      'error.back_online': 'You are back online.',
      'error.email_in_use': 'This email is already in use.',
      'error.invalid_email': 'Please enter a valid email address.',
      'error.user_not_found': 'User not found.',
      'error.wrong_password': 'Incorrect password.',
      'error.weak_password': 'Password is too weak. Please use a stronger password.',
      'error.too_many_requests': 'Too many attempts. Please try again later.',
      'error.already_exists': 'This resource already exists.',
      'error.quota_exceeded': 'Quota exceeded. Please try again later.',
      'error.service_unavailable': 'Service temporarily unavailable. Please try again.',
      'error.upload_canceled': 'Upload was canceled.',
      'error.upload_failed': 'Upload failed. Please try again.',
      'common.close': 'Close'
    };

    return fallbacks[key] || key;
  }
};

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ErrorHandler.init());
} else {
  ErrorHandler.init();
}

// Export for use in other modules
window.ErrorHandler = ErrorHandler;

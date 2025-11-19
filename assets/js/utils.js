/**
 * Utility Functions Module
 * Common helper functions used throughout the application
 */

const Utils = {
  /**
   * Debounce function - delays execution until after wait time has elapsed
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Debounced function
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function - limits execution to once per wait period
   * @param {Function} func - Function to throttle
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Throttled function
   */
  throttle(func, wait = 300) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, wait);
      }
    };
  },

  /**
   * Format date to localized string
   * @param {Date|string|number} date - Date to format
   * @param {string} locale - Locale code (e.g., 'ar', 'fr', 'en')
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} - Formatted date string
   */
  formatDate(date, locale = 'en', options = {}) {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const formatOptions = { ...defaultOptions, ...options };
    
    try {
      return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateObj.toLocaleDateString();
    }
  },

  /**
   * Format time to localized string
   * @param {Date|string|number} date - Date/time to format
   * @param {string} locale - Locale code
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} - Formatted time string
   */
  formatTime(date, locale = 'en', options = {}) {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit'
    };

    const formatOptions = { ...defaultOptions, ...options };
    
    try {
      return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
    } catch (error) {
      console.error('Time formatting error:', error);
      return dateObj.toLocaleTimeString();
    }
  },

  /**
   * Format date and time together
   * @param {Date|string|number} date - Date/time to format
   * @param {string} locale - Locale code
   * @returns {string} - Formatted date and time string
   */
  formatDateTime(date, locale = 'en') {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.error('DateTime formatting error:', error);
      return dateObj.toLocaleString();
    }
  },

  /**
   * Format relative time (e.g., "2 hours ago")
   * @param {Date|string|number} date - Date to format
   * @param {string} locale - Locale code
   * @returns {string} - Relative time string
   */
  formatRelativeTime(date, locale = 'en') {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);

    const units = [
      { name: 'year', seconds: 31536000 },
      { name: 'month', seconds: 2592000 },
      { name: 'week', seconds: 604800 },
      { name: 'day', seconds: 86400 },
      { name: 'hour', seconds: 3600 },
      { name: 'minute', seconds: 60 },
      { name: 'second', seconds: 1 }
    ];

    for (const unit of units) {
      const interval = Math.floor(diffInSeconds / unit.seconds);
      if (interval >= 1) {
        try {
          const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
          return rtf.format(-interval, unit.name);
        } catch (error) {
          return `${interval} ${unit.name}${interval > 1 ? 's' : ''} ago`;
        }
      }
    }

    return 'just now';
  },

  /**
   * Get element by ID safely
   * @param {string} id - Element ID
   * @returns {HTMLElement|null} - Element or null
   */
  getElement(id) {
    return document.getElementById(id);
  },

  /**
   * Query selector with error handling
   * @param {string} selector - CSS selector
   * @param {HTMLElement} parent - Parent element (optional)
   * @returns {HTMLElement|null} - Element or null
   */
  querySelector(selector, parent = document) {
    try {
      return parent.querySelector(selector);
    } catch (error) {
      console.error('Query selector error:', error);
      return null;
    }
  },

  /**
   * Query all elements with error handling
   * @param {string} selector - CSS selector
   * @param {HTMLElement} parent - Parent element (optional)
   * @returns {NodeList} - NodeList of elements
   */
  querySelectorAll(selector, parent = document) {
    try {
      return parent.querySelectorAll(selector);
    } catch (error) {
      console.error('Query selector all error:', error);
      return [];
    }
  },

  /**
   * Add class to element
   * @param {HTMLElement} element - Target element
   * @param {string|Array<string>} className - Class name(s) to add
   */
  addClass(element, className) {
    if (!element) return;
    
    if (Array.isArray(className)) {
      element.classList.add(...className);
    } else {
      element.classList.add(className);
    }
  },

  /**
   * Remove class from element
   * @param {HTMLElement} element - Target element
   * @param {string|Array<string>} className - Class name(s) to remove
   */
  removeClass(element, className) {
    if (!element) return;
    
    if (Array.isArray(className)) {
      element.classList.remove(...className);
    } else {
      element.classList.remove(className);
    }
  },

  /**
   * Toggle class on element
   * @param {HTMLElement} element - Target element
   * @param {string} className - Class name to toggle
   * @returns {boolean} - True if class is now present
   */
  toggleClass(element, className) {
    if (!element) return false;
    return element.classList.toggle(className);
  },

  /**
   * Show element
   * @param {HTMLElement} element - Element to show
   */
  show(element) {
    if (!element) return;
    element.style.display = '';
    element.removeAttribute('hidden');
  },

  /**
   * Hide element
   * @param {HTMLElement} element - Element to hide
   */
  hide(element) {
    if (!element) return;
    element.style.display = 'none';
  },

  /**
   * Create element with attributes and content
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string|HTMLElement} content - Element content
   * @returns {HTMLElement} - Created element
   */
  createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });

    if (typeof content === 'string') {
      element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      element.appendChild(content);
    }

    return element;
  },

  /**
   * Local Storage wrapper - set item
   * @param {string} key - Storage key
   * @param {*} value - Value to store (will be JSON stringified)
   * @returns {boolean} - Success status
   */
  setStorage(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('LocalStorage set error:', error);
      return false;
    }
  },

  /**
   * Local Storage wrapper - get item
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} - Retrieved value or default
   */
  getStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return defaultValue;
    }
  },

  /**
   * Local Storage wrapper - remove item
   * @param {string} key - Storage key
   * @returns {boolean} - Success status
   */
  removeStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('LocalStorage remove error:', error);
      return false;
    }
  },

  /**
   * Local Storage wrapper - clear all
   * @returns {boolean} - Success status
   */
  clearStorage() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('LocalStorage clear error:', error);
      return false;
    }
  },

  /**
   * Session Storage wrapper - set item
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} - Success status
   */
  setSessionStorage(key, value) {
    try {
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('SessionStorage set error:', error);
      return false;
    }
  },

  /**
   * Session Storage wrapper - get item
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} - Retrieved value or default
   */
  getSessionStorage(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('SessionStorage get error:', error);
      return defaultValue;
    }
  },

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} html - HTML string to sanitize
   * @returns {string} - Sanitized HTML
   */
  sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  },

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHTML(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  },

  /**
   * Generate unique ID
   * @param {string} prefix - Optional prefix
   * @returns {string} - Unique ID
   */
  generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Deep clone an object
   * @param {*} obj - Object to clone
   * @returns {*} - Cloned object
   */
  deepClone(obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      console.error('Deep clone error:', error);
      return obj;
    }
  },

  /**
   * Check if value is empty
   * @param {*} value - Value to check
   * @returns {boolean} - True if empty
   */
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number (Algerian format)
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - True if valid
   */
  isValidPhone(phone) {
    // Algerian phone format: +213 followed by 9 digits
    const phoneRegex = /^(\+213|0)[5-7]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  /**
   * Format phone number for display
   * @param {string} phone - Phone number
   * @returns {string} - Formatted phone number
   */
  formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('213')) {
      return `+213 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
    }
    if (cleaned.startsWith('0')) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  },

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} - Success status
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Clipboard copy error:', error);
      // Fallback method
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  },

  /**
   * Scroll to element smoothly
   * @param {HTMLElement|string} target - Element or selector
   * @param {Object} options - Scroll options
   */
  scrollTo(target, options = {}) {
    const element = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;
    
    if (!element) return;

    const defaultOptions = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    };

    element.scrollIntoView({ ...defaultOptions, ...options });
  },

  /**
   * Wait for specified time
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} - Promise that resolves after wait time
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}

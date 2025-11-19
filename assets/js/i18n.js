/**
 * Internationalization (i18n) Module
 * Handles multilingual support for Arabic, French, and English
 */

class I18n {
  constructor() {
    this.currentLanguage = 'en';
    this.translations = {};
    this.supportedLanguages = ['ar', 'fr', 'en'];
    this.rtlLanguages = ['ar'];
    this.fallbackLanguage = 'en';
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * Initialize i18n system
   */
  async init() {
    // Load saved language preference or detect from browser
    const savedLanguage = this.getSavedLanguage();
    const language = savedLanguage || this.detectBrowserLanguage();
    
    await this.setLanguage(language);
  }

  /**
   * Get saved language from localStorage
   * @returns {string|null} - Saved language code or null
   */
  getSavedLanguage() {
    try {
      return localStorage.getItem('language');
    } catch (error) {
      console.error('Error reading language preference:', error);
      return null;
    }
  }

  /**
   * Save language preference to localStorage
   * @param {string} language - Language code to save
   */
  saveLanguage(language) {
    try {
      localStorage.setItem('language', language);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }

  /**
   * Detect browser language
   * @returns {string} - Detected language code
   */
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    // Return if supported, otherwise fallback
    return this.supportedLanguages.includes(langCode) 
      ? langCode 
      : this.fallbackLanguage;
  }

  /**
   * Set current language and load translations
   * @param {string} language - Language code (ar, fr, en)
   * @returns {Promise<boolean>} - Success status
   */
  async setLanguage(language) {
    if (!this.supportedLanguages.includes(language)) {
      console.warn(`Language ${language} not supported, using fallback`);
      language = this.fallbackLanguage;
    }

    try {
      // Load translations if not already loaded
      if (!this.translations[language]) {
        await this.loadTranslations(language);
      }

      // Update current language
      this.currentLanguage = language;

      // Save preference
      this.saveLanguage(language);

      // Update document attributes
      this.updateDocumentLanguage(language);

      // Update RTL layout if needed
      this.updateRTL(language);

      // Translate all elements on page
      this.translatePage();

      // Dispatch language change event
      this.dispatchLanguageChange(language);

      return true;
    } catch (error) {
      console.error('Error setting language:', error);
      return false;
    }
  }

  /**
   * Load translation file for a language
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Translation object
   */
  async loadTranslations(language) {
    try {
      const response = await fetch(`assets/locales/${language}.json`);
      
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${language}`);
      }

      const translations = await response.json();
      this.translations[language] = translations;
      
      return translations;
    } catch (error) {
      console.error(`Error loading translations for ${language}:`, error);
      
      // Load fallback if not already loaded
      if (language !== this.fallbackLanguage && !this.translations[this.fallbackLanguage]) {
        return await this.loadTranslations(this.fallbackLanguage);
      }
      
      throw error;
    }
  }

  /**
   * Get translation for a key
   * @param {string} key - Translation key (e.g., 'nav.home')
   * @param {Object} params - Optional parameters for interpolation
   * @returns {string} - Translated string
   */
  translate(key, params = {}) {
    const keys = key.split('.');
    let translation = this.translations[this.currentLanguage];

    // Navigate through nested keys
    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k];
      } else {
        translation = undefined;
        break;
      }
    }

    // Fallback to English if translation not found
    if (translation === undefined && this.currentLanguage !== this.fallbackLanguage) {
      let fallback = this.translations[this.fallbackLanguage];
      for (const k of keys) {
        if (fallback && typeof fallback === 'object') {
          fallback = fallback[k];
        } else {
          fallback = undefined;
          break;
        }
      }
      translation = fallback;
    }

    // If still not found, return the key itself
    if (translation === undefined) {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }

    // Interpolate parameters
    if (typeof translation === 'string' && Object.keys(params).length > 0) {
      translation = this.interpolate(translation, params);
    }

    return translation;
  }

  /**
   * Interpolate parameters into translation string
   * @param {string} text - Translation text with placeholders
   * @param {Object} params - Parameters to interpolate
   * @returns {string} - Interpolated string
   */
  interpolate(text, params) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Get current language
   * @returns {string} - Current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get all supported languages
   * @returns {Array<string>} - Array of language codes
   */
  getSupportedLanguages() {
    return [...this.supportedLanguages];
  }

  /**
   * Check if language is RTL
   * @param {string} language - Language code
   * @returns {boolean} - True if RTL
   */
  isRTL(language = this.currentLanguage) {
    return this.rtlLanguages.includes(language);
  }

  /**
   * Update document language attributes
   * @param {string} language - Language code
   */
  updateDocumentLanguage(language) {
    document.documentElement.lang = language;
  }

  /**
   * Update RTL layout
   * @param {string} language - Language code
   */
  updateRTL(language) {
    const isRTL = this.isRTL(language);
    
    if (isRTL) {
      document.documentElement.setAttribute('dir', 'rtl');
      document.body.classList.add('rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.body.classList.remove('rtl');
    }
  }

  /**
   * Translate all elements on the page
   */
  translatePage() {
    // Translate elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.translate(key);
      
      // Update text content
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        if (element.type === 'submit' || element.type === 'button') {
          element.value = translation;
        } else {
          element.placeholder = translation;
        }
      } else {
        element.textContent = translation;
      }
    });

    // Translate elements with data-i18n-placeholder attribute
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    
    placeholderElements.forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translation = this.translate(key);
      element.placeholder = translation;
    });

    // Translate elements with data-i18n-title attribute
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    
    titleElements.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const translation = this.translate(key);
      element.title = translation;
    });

    // Translate elements with data-i18n-aria-label attribute
    const ariaElements = document.querySelectorAll('[data-i18n-aria-label]');
    
    ariaElements.forEach(element => {
      const key = element.getAttribute('data-i18n-aria-label');
      const translation = this.translate(key);
      element.setAttribute('aria-label', translation);
    });
  }

  /**
   * Translate a single element
   * @param {HTMLElement} element - Element to translate
   */
  translateElement(element) {
    if (!element) return;

    // Translate text content
    const textKey = element.getAttribute('data-i18n');
    if (textKey) {
      const translation = this.translate(textKey);
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        if (element.type === 'submit' || element.type === 'button') {
          element.value = translation;
        } else {
          element.placeholder = translation;
        }
      } else {
        element.textContent = translation;
      }
    }

    // Translate placeholder
    const placeholderKey = element.getAttribute('data-i18n-placeholder');
    if (placeholderKey) {
      element.placeholder = this.translate(placeholderKey);
    }

    // Translate title
    const titleKey = element.getAttribute('data-i18n-title');
    if (titleKey) {
      element.title = this.translate(titleKey);
    }

    // Translate aria-label
    const ariaKey = element.getAttribute('data-i18n-aria-label');
    if (ariaKey) {
      element.setAttribute('aria-label', this.translate(ariaKey));
    }
  }

  /**
   * Dispatch language change event
   * @param {string} language - New language code
   */
  dispatchLanguageChange(language) {
    window.dispatchEvent(new CustomEvent('language-change', {
      detail: { 
        language,
        isRTL: this.isRTL(language)
      }
    }));
  }

  /**
   * Format number according to current locale
   * @param {number} number - Number to format
   * @param {Object} options - Intl.NumberFormat options
   * @returns {string} - Formatted number
   */
  formatNumber(number, options = {}) {
    try {
      return new Intl.NumberFormat(this.currentLanguage, options).format(number);
    } catch (error) {
      console.error('Number formatting error:', error);
      return number.toString();
    }
  }

  /**
   * Format currency according to current locale
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: DZD for Algerian Dinar)
   * @returns {string} - Formatted currency
   */
  formatCurrency(amount, currency = 'DZD') {
    try {
      return new Intl.NumberFormat(this.currentLanguage, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return `${amount} ${currency}`;
    }
  }

  /**
   * Get language name in its native form
   * @param {string} language - Language code
   * @returns {string} - Language name
   */
  getLanguageName(language) {
    const names = {
      'ar': 'العربية',
      'fr': 'Français',
      'en': 'English'
    };
    return names[language] || language;
  }
}

// Create and export i18n instance
const i18n = new I18n();

// Add global translate function for convenience
window.t = (key, params) => i18n.translate(key, params);

// Listen for components-loaded event to reapply translations and RTL
document.addEventListener('components-loaded', () => {
  if (window.i18n) {
    console.log('Reapplying translations and RTL to loaded components');
    window.i18n.translatePage();
    window.i18n.updateRTL(window.i18n.getCurrentLanguage());
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}

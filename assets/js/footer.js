/**
 * Footer Component Module
 * Handles footer functionality including language switching and dynamic year
 */

class Footer {
  constructor() {
    this.init();
  }

  /**
   * Initialize footer functionality
   */
  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  /**
   * Setup footer event listeners and initial state
   */
  setup() {
    // Set current year
    this.setCurrentYear();
    
    // Setup language buttons
    this.setupLanguageButtons();
  }

  /**
   * Set current year in copyright
   */
  setCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  /**
   * Setup language selector buttons in footer
   */
  setupLanguageButtons() {
    const langButtons = document.querySelectorAll('.footer-lang-btn');
    
    if (!langButtons.length) return;
    
    // Set initial active state
    const currentLang = window.i18n ? window.i18n.getCurrentLanguage() : 'en';
    this.updateLanguageButtons(currentLang);
    
    // Add click handlers
    langButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const lang = button.getAttribute('data-lang');
        
        if (window.i18n) {
          await window.i18n.setLanguage(lang);
          this.updateLanguageButtons(lang);
        }
      });
    });
    
    // Listen for language change events from navbar
    window.addEventListener('language-change', (e) => {
      this.updateLanguageButtons(e.detail.language);
    });
  }

  /**
   * Update language button active states
   * @param {string} lang - Current language code
   */
  updateLanguageButtons(lang) {
    const langButtons = document.querySelectorAll('.footer-lang-btn');
    
    langButtons.forEach(button => {
      const buttonLang = button.getAttribute('data-lang');
      
      if (buttonLang === lang) {
        button.classList.add('active');
        button.setAttribute('aria-current', 'true');
      } else {
        button.classList.remove('active');
        button.removeAttribute('aria-current');
      }
    });
  }
}

// Initialize footer when script loads
const footer = new Footer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = footer;
}

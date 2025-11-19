/**
 * Theme Module
 * Handles dark mode toggle and theme persistence
 */

const Theme = {
  STORAGE_KEY: 'cityhealth-theme',
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark'
  },
  initialized: false,

  /**
   * Initialize theme system
   */
  init() {
    if (this.initialized) {
      console.log('Theme already initialized');
      return;
    }
    
    console.log('Initializing theme system...');
    this.initialized = true;
    
    // Load saved theme or detect system preference
    const savedTheme = this.getSavedTheme();
    const systemTheme = this.getSystemPreference();
    const initialTheme = savedTheme || systemTheme;
    
    // Apply initial theme
    this.applyTheme(initialTheme);
    
    // Set up theme toggle button
    this.setupThemeToggle();
    
    // Listen for system theme changes
    this.watchSystemPreference();
    
    console.log(`Theme initialized: ${initialTheme}`);
  },

  /**
   * Get saved theme from localStorage
   * @returns {string|null} - Saved theme or null
   */
  getSavedTheme() {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error reading theme from localStorage:', error);
      return null;
    }
  },

  /**
   * Save theme to localStorage
   * @param {string} theme - Theme to save
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  },

  /**
   * Get system color scheme preference
   * @returns {string} - 'light' or 'dark'
   */
  getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return this.THEMES.DARK;
    }
    return this.THEMES.LIGHT;
  },

  /**
   * Apply theme to document
   * @param {string} theme - Theme to apply ('light' or 'dark')
   */
  applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === this.THEMES.DARK) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
    
    // Update toggle button icon
    this.updateToggleIcon(theme);
    
    // Save theme preference
    this.saveTheme(theme);
    
    // Dispatch custom event for other modules
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  },

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === this.THEMES.DARK ? this.THEMES.LIGHT : this.THEMES.DARK;
    this.applyTheme(newTheme);
  },

  /**
   * Get current active theme
   * @returns {string} - Current theme
   */
  getCurrentTheme() {
    const root = document.documentElement;
    const dataTheme = root.getAttribute('data-theme');
    return dataTheme || this.THEMES.LIGHT;
  },

  /**
   * Update theme toggle button icon
   * @param {string} theme - Current theme
   */
  updateToggleIcon(theme) {
    const toggleButton = document.getElementById('theme-toggle');
    if (!toggleButton) return;
    
    const icon = toggleButton.querySelector('i');
    if (!icon) return;
    
    // Update icon based on theme
    if (theme === this.THEMES.DARK) {
      icon.className = 'bi bi-sun-fill';
      toggleButton.setAttribute('aria-label', 'Switch to light mode');
    } else {
      icon.className = 'bi bi-moon-fill';
      toggleButton.setAttribute('aria-label', 'Switch to dark mode');
    }
  },

  /**
   * Set up theme toggle button event listener
   */
  setupThemeToggle() {
    const toggleButton = document.getElementById('theme-toggle');
    if (!toggleButton) {
      console.warn('Theme toggle button not found');
      return;
    }
    
    // Remove existing listeners to avoid duplicates
    const newButton = toggleButton.cloneNode(true);
    toggleButton.parentNode.replaceChild(newButton, toggleButton);
    
    // Add click event listener
    newButton.addEventListener('click', () => {
      this.toggleTheme();
    });
    
    // Add keyboard support
    newButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  },

  /**
   * Watch for system theme preference changes
   */
  watchSystemPreference() {
    if (!window.matchMedia) return;
    
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Listen for changes
    darkModeQuery.addEventListener('change', (e) => {
      // Only apply system preference if user hasn't set a preference
      const savedTheme = this.getSavedTheme();
      if (!savedTheme) {
        const newTheme = e.matches ? this.THEMES.DARK : this.THEMES.LIGHT;
        this.applyTheme(newTheme);
      }
    });
  },

  /**
   * Reapply theme after components are loaded
   */
  reapplyTheme() {
    const currentTheme = this.getCurrentTheme();
    this.updateToggleIcon(currentTheme);
    this.setupThemeToggle();
  }
};

// Wait for components to be loaded before initializing
document.addEventListener('components-loaded', () => {
  Theme.init();
});

// Also initialize on DOMContentLoaded as fallback
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for components-loader to finish
    setTimeout(() => {
      if (!Theme.initialized) {
        Theme.init();
      }
    }, 100);
  });
} else {
  // If DOM already loaded, wait for components
  setTimeout(() => {
    if (!Theme.initialized) {
      Theme.init();
    }
  }, 100);
}

// Export for use in other modules
window.Theme = Theme;

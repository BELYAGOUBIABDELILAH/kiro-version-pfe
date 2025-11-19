/**
 * Navbar Component Module
 * Handles navbar functionality including language switching, theme toggle, and authentication state
 * Requirements: 4.1, 4.3
 */

class Navbar {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  /**
   * Initialize navbar functionality
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
   * Setup navbar event listeners and initial state
   */
  async setup() {
    // Setup language selector
    this.setupLanguageSelector();
    
    // Theme toggle is handled by theme.js - no setup needed here
    
    // Setup authentication state observer
    this.setupAuthObserver();
    
    // Setup logout button
    this.setupLogoutButton();
    
    // Setup mobile menu close on navigation
    this.setupMobileMenuClose();
  }

  /**
   * Setup language selector dropdown
   */
  setupLanguageSelector() {
    const languageOptions = document.querySelectorAll('.language-option');
    const currentLanguageLabel = document.getElementById('current-language-label');
    
    if (!languageOptions.length) return;
    
    // Set initial language
    const currentLang = window.i18n ? window.i18n.getCurrentLanguage() : 'en';
    this.updateLanguageUI(currentLang);
    
    // Add click handlers to language options
    languageOptions.forEach(option => {
      option.addEventListener('click', async (e) => {
        const lang = option.getAttribute('data-lang');
        
        if (window.i18n) {
          await window.i18n.setLanguage(lang);
          this.updateLanguageUI(lang);
        }
      });
    });
    
    // Listen for language change events
    window.addEventListener('language-change', (e) => {
      this.updateLanguageUI(e.detail.language);
    });
  }

  /**
   * Update language UI to show current selection
   * @param {string} lang - Current language code
   */
  updateLanguageUI(lang) {
    const currentLanguageLabel = document.getElementById('current-language-label');
    const languageOptions = document.querySelectorAll('.language-option');
    
    // Update label
    const languageNames = {
      'en': 'English',
      'ar': 'العربية',
      'fr': 'Français'
    };
    
    if (currentLanguageLabel) {
      currentLanguageLabel.textContent = languageNames[lang] || 'English';
    }
    
    // Update checkmarks
    languageOptions.forEach(option => {
      const optionLang = option.getAttribute('data-lang');
      const checkIcon = option.querySelector('.language-check');
      
      if (checkIcon) {
        if (optionLang === lang) {
          checkIcon.classList.remove('d-none');
          option.classList.add('active');
        } else {
          checkIcon.classList.add('d-none');
          option.classList.remove('active');
        }
      }
    });
  }

  // Theme toggle is now handled entirely by theme.js
  // No theme-related methods needed in navbar.js

  /**
   * Setup authentication state observer
   */
  setupAuthObserver() {
    if (!window.authModule) {
      console.warn('Auth module not loaded');
      return;
    }
    
    // Observe auth state changes
    window.authModule.onAuthStateChanged((user) => {
      this.currentUser = user;
      this.updateAuthUI(user);
    });
  }

  /**
   * Update UI based on authentication state
   * @param {Object|null} user - Current user object or null
   */
  updateAuthUI(user) {
    const loggedOutItems = document.querySelectorAll('[data-auth-state="logged-out"]');
    const loggedInItems = document.querySelectorAll('[data-auth-state="logged-in"]');
    const roleMenuItems = document.querySelectorAll('.role-menu-item');
    
    if (user) {
      // User is logged in
      loggedOutItems.forEach(item => item.classList.add('d-none'));
      loggedInItems.forEach(item => item.classList.remove('d-none'));
      
      // Update user display
      this.updateUserDisplay(user);
      
      // Show role-specific menu items
      roleMenuItems.forEach(item => {
        const itemRole = item.getAttribute('data-role');
        if (itemRole === user.role || user.role === 'admin') {
          item.classList.remove('d-none');
        } else {
          item.classList.add('d-none');
        }
      });
    } else {
      // User is logged out
      loggedOutItems.forEach(item => item.classList.remove('d-none'));
      loggedInItems.forEach(item => item.classList.add('d-none'));
      
      // Hide all role-specific items
      roleMenuItems.forEach(item => item.classList.add('d-none'));
    }
  }

  /**
   * Update user display in navbar
   * @param {Object} user - User object
   */
  updateUserDisplay(user) {
    const userAvatar = document.getElementById('user-avatar');
    const userIconPlaceholder = document.querySelector('.user-icon-placeholder');
    const userDisplayName = document.getElementById('user-display-name');
    
    // Update display name
    if (userDisplayName) {
      userDisplayName.textContent = user.displayName || user.email.split('@')[0];
    }
    
    // Update avatar
    if (user.photoURL && userAvatar) {
      userAvatar.src = user.photoURL;
      userAvatar.alt = `${user.displayName || 'User'} avatar`;
      userAvatar.style.display = 'block';
      if (userIconPlaceholder) {
        userIconPlaceholder.style.display = 'none';
      }
    } else {
      if (userAvatar) {
        userAvatar.style.display = 'none';
      }
      if (userIconPlaceholder) {
        userIconPlaceholder.style.display = 'block';
      }
    }
  }

  /**
   * Setup logout button
   */
  setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (!window.authModule) {
        console.error('Auth module not loaded');
        return;
      }
      
      try {
        // Show loading state
        logoutBtn.disabled = true;
        logoutBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Logging out...';
        
        // Sign out
        await window.authModule.signOut();
        
        // Redirect to home
        if (window.router) {
          window.router.navigate('/');
        } else {
          window.location.href = '/';
        }
        
      } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
        
        // Reset button
        logoutBtn.disabled = false;
        if (window.i18n) {
          logoutBtn.innerHTML = `<i class="bi bi-box-arrow-right" aria-hidden="true"></i> ${window.i18n.translate('nav.logout')}`;
        } else {
          logoutBtn.innerHTML = '<i class="bi bi-box-arrow-right" aria-hidden="true"></i> Logout';
        }
      }
    });
  }

  /**
   * Setup mobile menu close on navigation
   */
  setupMobileMenuClose() {
    const navLinks = document.querySelectorAll('.navbar-nav a[data-route]');
    const navbarCollapse = document.getElementById('navbarNav');
    
    if (!navbarCollapse) return;
    
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        // Close mobile menu on navigation
        if (window.innerWidth < 992) { // Bootstrap lg breakpoint
          const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
          if (bsCollapse) {
            bsCollapse.hide();
          }
        }
      });
    });
  }
}

// Initialize navbar when script loads
const navbar = new Navbar();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = navbar;
}

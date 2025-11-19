/**
 * Accessibility Module
 * Enhances accessibility features across the application
 */

const Accessibility = {
  /**
   * Initialize accessibility features
   */
  init() {
    console.log('Initializing accessibility features...');
    
    // Enhance focus indicators
    this.enhanceFocusIndicators();
    
    // Set up keyboard navigation
    this.setupKeyboardNavigation();
    
    // Add ARIA labels to dynamic content
    this.enhanceAriaLabels();
    
    // Set up focus trap for modals
    this.setupModalFocusTrap();
    
    // Announce dynamic content changes
    this.setupLiveRegions();
    
    console.log('Accessibility features initialized');
  },

  /**
   * Enhance focus indicators for keyboard navigation
   */
  enhanceFocusIndicators() {
    // Add focus-visible class support for better focus indicators
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  },

  /**
   * Set up keyboard navigation shortcuts
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Escape key closes modals and dropdowns
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }
      
      // Skip to main content with Ctrl+/
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        this.skipToMainContent();
      }
    });
  },

  /**
   * Handle Escape key press
   */
  handleEscapeKey() {
    // Close open modals
    const openModals = document.querySelectorAll('.modal.show');
    openModals.forEach(modal => {
      const closeButton = modal.querySelector('[data-bs-dismiss="modal"]');
      if (closeButton) {
        closeButton.click();
      }
    });

    // Close chatbot if open
    const chatbotWindow = document.querySelector('.chatbot-window.active');
    if (chatbotWindow) {
      const closeButton = chatbotWindow.querySelector('.chatbot-close');
      if (closeButton) {
        closeButton.click();
      }
    }

    // Close autocomplete dropdown
    const autocomplete = document.getElementById('autocomplete-dropdown');
    if (autocomplete && autocomplete.style.display !== 'none') {
      autocomplete.style.display = 'none';
    }
  },

  /**
   * Skip to main content
   */
  skipToMainContent() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  /**
   * Enhance ARIA labels throughout the application
   */
  enhanceAriaLabels() {
    // Add ARIA labels to images without alt text
    this.addImageAltText();
    
    // Add ARIA labels to icon-only buttons
    this.addButtonLabels();
    
    // Add ARIA labels to form controls
    this.addFormLabels();
    
    // Add ARIA labels to navigation
    this.addNavigationLabels();
  },

  /**
   * Add alt text to images that don't have it
   */
  addImageAltText() {
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      // Try to get meaningful alt text from context
      const parent = img.closest('[data-provider-name]');
      if (parent) {
        img.alt = `${parent.dataset.providerName} image`;
      } else {
        img.alt = 'Image';
      }
    });
  },

  /**
   * Add ARIA labels to icon-only buttons
   */
  addButtonLabels() {
    // Find buttons with only icons
    const iconButtons = document.querySelectorAll('button:not([aria-label])');
    iconButtons.forEach(button => {
      const icon = button.querySelector('i[class*="bi-"]');
      if (icon && !button.textContent.trim()) {
        // Try to infer label from icon class
        const iconClass = icon.className;
        let label = 'Button';
        
        if (iconClass.includes('search')) label = 'Search';
        else if (iconClass.includes('heart')) label = 'Favorite';
        else if (iconClass.includes('close') || iconClass.includes('x')) label = 'Close';
        else if (iconClass.includes('menu')) label = 'Menu';
        else if (iconClass.includes('chat')) label = 'Chat';
        else if (iconClass.includes('phone')) label = 'Call';
        else if (iconClass.includes('envelope')) label = 'Email';
        else if (iconClass.includes('map')) label = 'View on map';
        
        button.setAttribute('aria-label', label);
      }
    });
  },

  /**
   * Add ARIA labels to form controls
   */
  addFormLabels() {
    // Ensure all form inputs have associated labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach(input => {
      const label = input.closest('.form-group')?.querySelector('label');
      if (label && label.htmlFor === input.id) {
        // Label is properly associated
        return;
      }
      
      // Add aria-label based on placeholder or name
      if (input.placeholder) {
        input.setAttribute('aria-label', input.placeholder);
      } else if (input.name) {
        input.setAttribute('aria-label', input.name.replace(/-/g, ' '));
      }
    });
  },

  /**
   * Add ARIA labels to navigation elements
   */
  addNavigationLabels() {
    // Add role and aria-label to navigation
    const navs = document.querySelectorAll('nav:not([aria-label])');
    navs.forEach((nav, index) => {
      if (nav.classList.contains('navbar')) {
        nav.setAttribute('aria-label', 'Main navigation');
      } else {
        nav.setAttribute('aria-label', `Navigation ${index + 1}`);
      }
    });

    // Add aria-current to active nav links
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath || (currentPath === '/' && href === '/')) {
        link.setAttribute('aria-current', 'page');
      }
    });
  },

  /**
   * Set up focus trap for modals
   */
  setupModalFocusTrap() {
    // Listen for modal show events
    document.addEventListener('shown.bs.modal', (e) => {
      const modal = e.target;
      this.trapFocus(modal);
    });
  },

  /**
   * Trap focus within an element
   * @param {HTMLElement} element - Element to trap focus within
   */
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    // Focus first element
    firstFocusable.focus();
    
    // Handle tab key
    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };
    
    element.addEventListener('keydown', handleTab);
    
    // Remove listener when modal is hidden
    element.addEventListener('hidden.bs.modal', () => {
      element.removeEventListener('keydown', handleTab);
    }, { once: true });
  },

  /**
   * Set up ARIA live regions for dynamic content
   */
  setupLiveRegions() {
    // Create a live region for announcements if it doesn't exist
    if (!document.getElementById('aria-live-region')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-region';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
  },

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    const liveRegion = document.getElementById('aria-live-region');
    if (!liveRegion) {
      this.setupLiveRegions();
      return this.announce(message, priority);
    }
    
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  },

  /**
   * Make an element focusable
   * @param {HTMLElement} element - Element to make focusable
   */
  makeFocusable(element) {
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  },

  /**
   * Remove element from tab order
   * @param {HTMLElement} element - Element to remove from tab order
   */
  makeUnfocusable(element) {
    element.setAttribute('tabindex', '-1');
  },

  /**
   * Check if element is visible
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} - True if visible
   */
  isVisible(element) {
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
  },

  /**
   * Get all focusable elements within a container
   * @param {HTMLElement} container - Container element
   * @returns {Array<HTMLElement>} - Array of focusable elements
   */
  getFocusableElements(container) {
    const selector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const elements = Array.from(container.querySelectorAll(selector));
    return elements.filter(el => this.isVisible(el));
  }
};

// Initialize accessibility features when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Accessibility.init());
} else {
  Accessibility.init();
}

// Export for use in other modules
window.Accessibility = Accessibility;

/**
 * Modal Component Module
 * Reusable modal with accessibility features
 * Requirements: 3.3, 16.2
 */

class Modal {
  constructor() {
    this.modal = null;
    this.backdrop = null;
    this.isOpen = false;
    this.focusedElementBeforeModal = null;
    this.focusableElements = [];
    this.firstFocusableElement = null;
    this.lastFocusableElement = null;
  }

  /**
   * Initialize modal
   * @param {Object} options - Modal configuration options
   * @param {string} options.title - Modal title
   * @param {string|HTMLElement} options.content - Modal body content
   * @param {Array} options.buttons - Array of button configurations
   * @param {boolean} options.closeOnBackdrop - Close modal on backdrop click
   * @param {boolean} options.closeOnEscape - Close modal on Escape key
   * @param {Function} options.onClose - Callback when modal closes
   */
  init(options = {}) {
    const {
      title = 'Modal',
      content = '',
      buttons = [],
      closeOnBackdrop = true,
      closeOnEscape = true,
      onClose = null
    } = options;

    // Create modal elements if they don't exist
    this.createModalElements();

    // Set title
    const titleElement = this.modal.querySelector('#modal-title');
    if (titleElement) {
      titleElement.textContent = title;
    }

    // Set content
    const bodyElement = this.modal.querySelector('#modal-body');
    if (bodyElement) {
      if (typeof content === 'string') {
        bodyElement.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        bodyElement.innerHTML = '';
        bodyElement.appendChild(content);
      }
    }

    // Set footer buttons
    const footerElement = this.modal.querySelector('#modal-footer');
    if (footerElement) {
      footerElement.innerHTML = '';
      
      if (buttons.length > 0) {
        buttons.forEach(buttonConfig => {
          const button = this.createButton(buttonConfig);
          footerElement.appendChild(button);
        });
      }
    }


    // Setup event listeners
    this.setupEventListeners(closeOnBackdrop, closeOnEscape, onClose);

    // Open modal
    this.open();
  }

  /**
   * Create modal DOM elements
   */
  createModalElements() {
    // Check if modal already exists
    this.modal = document.getElementById('modal');
    this.backdrop = document.getElementById('modal-backdrop');

    if (!this.modal || !this.backdrop) {
      // Create backdrop
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'modal-backdrop';
      this.backdrop.id = 'modal-backdrop';
      this.backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(this.backdrop);

      // Create modal
      this.modal = document.createElement('div');
      this.modal.className = 'modal';
      this.modal.id = 'modal';
      this.modal.setAttribute('role', 'dialog');
      this.modal.setAttribute('aria-modal', 'true');
      this.modal.setAttribute('aria-labelledby', 'modal-title');
      this.modal.setAttribute('aria-hidden', 'true');

      this.modal.innerHTML = `
        <div class="modal-dialog" role="document">
          <div class="modal-header">
            <h2 class="modal-title" id="modal-title">Modal Title</h2>
            <button type="button" class="modal-close" id="modal-close" aria-label="Close modal">
              <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </div>
          <div class="modal-body" id="modal-body"></div>
          <div class="modal-footer" id="modal-footer"></div>
        </div>
      `;

      document.body.appendChild(this.modal);
    }
  }


  /**
   * Create button element
   * @param {Object} config - Button configuration
   * @returns {HTMLElement} - Button element
   */
  createButton(config) {
    const {
      text = 'Button',
      className = 'btn btn-primary',
      onClick = null,
      closeOnClick = true
    } = config;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;

    button.addEventListener('click', () => {
      if (onClick) {
        onClick();
      }
      if (closeOnClick) {
        this.close();
      }
    });

    return button;
  }

  /**
   * Setup event listeners
   * @param {boolean} closeOnBackdrop - Close on backdrop click
   * @param {boolean} closeOnEscape - Close on Escape key
   * @param {Function} onClose - Close callback
   */
  setupEventListeners(closeOnBackdrop, closeOnEscape, onClose) {
    // Close button
    const closeButton = this.modal.querySelector('#modal-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.close());
    }

    // Backdrop click
    if (closeOnBackdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }

    // Escape key
    if (closeOnEscape) {
      this.handleEscapeKey = (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      };
      document.addEventListener('keydown', this.handleEscapeKey);
    }

    // Store close callback
    this.onCloseCallback = onClose;
  }


  /**
   * Open modal
   */
  open() {
    if (this.isOpen) return;

    // Store currently focused element
    this.focusedElementBeforeModal = document.activeElement;

    // Show modal and backdrop
    this.modal.classList.add('active');
    this.backdrop.classList.add('active');
    this.modal.setAttribute('aria-hidden', 'false');
    this.backdrop.setAttribute('aria-hidden', 'false');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Setup focus trap
    this.setupFocusTrap();

    // Focus first focusable element
    if (this.firstFocusableElement) {
      this.firstFocusableElement.focus();
    }

    this.isOpen = true;

    // Announce to screen readers
    this.announceToScreenReader('Modal opened');
  }

  /**
   * Close modal
   */
  close() {
    if (!this.isOpen) return;

    // Hide modal and backdrop
    this.modal.classList.remove('active');
    this.backdrop.classList.remove('active');
    this.modal.setAttribute('aria-hidden', 'true');
    this.backdrop.setAttribute('aria-hidden', 'true');

    // Restore body scroll
    document.body.style.overflow = '';

    // Remove event listeners
    if (this.handleEscapeKey) {
      document.removeEventListener('keydown', this.handleEscapeKey);
    }
    if (this.handleFocusTrap) {
      document.removeEventListener('keydown', this.handleFocusTrap);
    }

    // Restore focus
    if (this.focusedElementBeforeModal) {
      this.focusedElementBeforeModal.focus();
    }

    this.isOpen = false;

    // Call close callback
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }

    // Announce to screen readers
    this.announceToScreenReader('Modal closed');
  }


  /**
   * Setup focus trap for accessibility
   */
  setupFocusTrap() {
    // Get all focusable elements
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    this.focusableElements = Array.from(
      this.modal.querySelectorAll(focusableSelectors.join(','))
    );

    this.firstFocusableElement = this.focusableElements[0];
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];

    // Handle Tab key for focus trap
    this.handleFocusTrap = (e) => {
      if (e.key !== 'Tab' || !this.isOpen) return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === this.firstFocusableElement) {
          e.preventDefault();
          this.lastFocusableElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === this.lastFocusableElement) {
          e.preventDefault();
          this.firstFocusableElement.focus();
        }
      }
    };

    document.addEventListener('keydown', this.handleFocusTrap);
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   */
  announceToScreenReader(message) {
    let liveRegion = document.getElementById('aria-live-region');
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }

    liveRegion.textContent = message;
  }

  /**
   * Destroy modal
   */
  destroy() {
    if (this.isOpen) {
      this.close();
    }

    if (this.modal) {
      this.modal.remove();
    }
    if (this.backdrop) {
      this.backdrop.remove();
    }
  }
}

// Create global modal instance
window.Modal = Modal;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Modal;
}

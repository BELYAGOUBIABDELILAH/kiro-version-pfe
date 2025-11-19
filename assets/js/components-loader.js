/**
 * Components Loader Module
 * Loads and injects reusable HTML components (navbar, footer, etc.)
 */

(function() {
  'use strict';

  const ComponentsLoader = {
    /**
     * Load a component from file and inject into container
     * @param {string} componentPath - Path to component HTML file
     * @param {string} containerId - ID of container element
     * @returns {Promise<boolean>} - Success status
     */
    async loadComponent(componentPath, containerId) {
      try {
        const container = document.getElementById(containerId);
        if (!container) {
          console.warn(`Container not found: ${containerId}`);
          return false;
        }

        const response = await fetch(componentPath);
        if (!response.ok) {
          throw new Error(`Failed to load component: ${componentPath} (${response.status})`);
        }

        const html = await response.text();
        container.innerHTML = html;

        console.log(`✓ Component loaded: ${componentPath}`);
        return true;
      } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
        return false;
      }
    },

    /**
     * Load all core components (navbar, footer)
     * @returns {Promise<void>}
     */
    async loadCoreComponents() {
      console.log('Loading core components...');

      try {
        // Load navbar
        await this.loadComponent('/components/navbar.html', 'navbar-container');

        // Load footer
        await this.loadComponent('/components/footer.html', 'footer-container');

        // Dispatch event to notify components are loaded
        document.dispatchEvent(new CustomEvent('components-loaded'));

        console.log('✓ All core components loaded');
      } catch (error) {
        console.error('Error loading core components:', error);
      }
    },

    /**
     * Initialize components loader
     */
    init() {
      // Load components when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.loadCoreComponents());
      } else {
        this.loadCoreComponents();
      }
    }
  };

  // Auto-initialize
  ComponentsLoader.init();

  // Export for use in other modules
  window.ComponentsLoader = ComponentsLoader;
})();

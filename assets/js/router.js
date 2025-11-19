/**
 * Router Module - Client-side navigation system
 * Handles route registration, navigation, and page content loading
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.contentContainer = null;
    
    // Initialize router when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * Initialize the router
   */
  init() {
    this.contentContainer = document.getElementById('app-content') || document.body;
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
      this.handlePopState(event);
    });

    // Intercept link clicks for client-side navigation
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[data-route]');
      if (link) {
        event.preventDefault();
        const path = link.getAttribute('href') || link.getAttribute('data-route');
        this.navigate(path);
      }
    });

    // Don't load initial route yet - wait for routes to be registered
    console.log('Router initialized, waiting for routes to be registered...');
  }

  /**
   * Start routing - called after routes are registered
   */
  start() {
    console.log('Router starting with', this.routes.size, 'registered routes');
    // Load initial route
    this.loadRoute(window.location.pathname);
  }

  /**
   * Register a route with its handler
   * @param {string} path - Route path (e.g., '/', '/search', '/profile/:id')
   * @param {Function|Object} handler - Route handler function or config object
   */
  registerRoute(path, handler) {
    const routeConfig = typeof handler === 'function' 
      ? { handler, template: null }
      : handler;
    
    this.routes.set(path, {
      pattern: this.pathToRegex(path),
      handler: routeConfig.handler,
      template: routeConfig.template,
      params: this.extractParamNames(path)
    });
    
    console.log('Route registered:', path);
  }

  /**
   * Convert path pattern to regex for matching
   * @param {string} path - Path pattern with optional params (e.g., '/profile/:id')
   * @returns {RegExp} - Regular expression for matching
   */
  pathToRegex(path) {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:\w+/g, '([^/]+)');
    return new RegExp(`^${pattern}$`);
  }

  /**
   * Extract parameter names from path pattern
   * @param {string} path - Path pattern
   * @returns {Array<string>} - Array of parameter names
   */
  extractParamNames(path) {
    const matches = path.match(/:\w+/g);
    return matches ? matches.map(param => param.slice(1)) : [];
  }

  /**
   * Navigate to a new route
   * @param {string} path - Path to navigate to
   * @param {Object} state - Optional state object
   */
  navigate(path, state = {}) {
    if (this.currentRoute === path) {
      return;
    }

    // Update browser history
    window.history.pushState(state, '', path);
    
    // Load the route
    this.loadRoute(path, state);
  }

  /**
   * Handle browser back/forward navigation
   * @param {PopStateEvent} event - PopState event
   */
  handlePopState(event) {
    const path = window.location.pathname;
    this.loadRoute(path, event.state || {});
  }

  /**
   * Load and render a route
   * @param {string} path - Path to load
   * @param {Object} state - Optional state object
   */
  async loadRoute(path, state = {}) {
    console.log('Loading route:', path);
    
    // Find matching route
    const matchedRoute = this.matchRoute(path);
    
    if (!matchedRoute) {
      this.handleNotFound(path);
      return;
    }

    const { route, params } = matchedRoute;
    this.currentRoute = path;

    try {
      // Show loading state using LoadingIndicator module
      if (window.LoadingIndicator) {
        window.LoadingIndicator.showNavigationLoading();
      } else {
        this.showLoading();
      }

      // Load page content
      let content;
      if (route.template) {
        console.log('Loading template:', route.template);
        content = await this.loadTemplate(route.template);
      }

      // Execute route handler
      if (route.handler) {
        const result = await route.handler({ params, state, path });
        if (result) {
          content = result;
        }
      }

      // Render content
      if (content) {
        this.updatePageContent(content);
      }

      // Scroll to top
      window.scrollTo(0, 0);

      // Dispatch route change event
      this.dispatchRouteChange(path, params, state);

    } catch (error) {
      console.error('Error loading route:', error);
      this.handleError(error);
    } finally {
      // Hide loading state
      if (window.LoadingIndicator) {
        window.LoadingIndicator.hideNavigationLoading();
      } else {
        this.hideLoading();
      }
    }
  }

  /**
   * Match a path against registered routes
   * @param {string} path - Path to match
   * @returns {Object|null} - Matched route and params, or null
   */
  matchRoute(path) {
    console.log('Matching path:', path, 'against', this.routes.size, 'routes');
    
    for (const [routePath, route] of this.routes) {
      console.log('Testing route:', routePath, 'pattern:', route.pattern);
      const match = path.match(route.pattern);
      if (match) {
        console.log('✓ Route matched:', routePath);
        const params = {};
        route.params.forEach((paramName, index) => {
          params[paramName] = match[index + 1];
        });
        return { route, params };
      }
    }
    
    console.warn('✗ No route matched for path:', path);
    return null;
  }

  /**
   * Load HTML template from file
   * @param {string} templatePath - Path to template file
   * @returns {Promise<string>} - Template HTML content
   */
  async loadTemplate(templatePath) {
    try {
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${templatePath} (${response.status})`);
      }
      return await response.text();
    } catch (error) {
      console.error('Template loading error:', error);
      throw error;
    }
  }

  /**
   * Update page content
   * @param {string|HTMLElement} content - Content to render
   */
  updatePageContent(content) {
    if (!this.contentContainer) {
      console.error('Content container not found');
      return;
    }

    if (typeof content === 'string') {
      this.contentContainer.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.contentContainer.innerHTML = '';
      this.contentContainer.appendChild(content);
    }

    // Re-initialize any dynamic components in the new content
    this.initializePageComponents();
  }

  /**
   * Initialize components in the current page
   */
  initializePageComponents() {
    // Dispatch event for other modules to initialize their components
    document.dispatchEvent(new CustomEvent('page-loaded', {
      detail: { path: this.currentRoute }
    }));
  }

  /**
   * Get current route path
   * @returns {string} - Current route path
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    const loader = document.getElementById('page-loader');
    if (loader) {
      loader.classList.add('active');
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    const loader = document.getElementById('page-loader');
    if (loader) {
      loader.classList.remove('active');
    }
  }

  /**
   * Handle 404 - Route not found
   * @param {string} path - Path that wasn't found
   */
  handleNotFound(path) {
    console.warn(`Route not found: ${path}`);
    this.updatePageContent(`
      <div class="container text-center py-5">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <p class="text-muted">Path: ${path}</p>
        <a href="/" data-route class="btn btn-primary">Go Home</a>
      </div>
    `);
  }

  /**
   * Handle routing errors
   * @param {Error} error - Error object
   */
  handleError(error) {
    console.error('Routing error:', error);
    this.updatePageContent(`
      <div class="container text-center py-5">
        <h1>Error</h1>
        <p>Something went wrong while loading the page.</p>
        <p class="text-muted">${error.message}</p>
        <a href="/" data-route class="btn btn-primary">Go Home</a>
      </div>
    `);
  }

  /**
   * Dispatch route change event
   * @param {string} path - New route path
   * @param {Object} params - Route parameters
   * @param {Object} state - Route state
   */
  dispatchRouteChange(path, params, state) {
    window.dispatchEvent(new CustomEvent('route-change', {
      detail: { path, params, state }
    }));
    
    // Also dispatch for analytics tracking
    window.dispatchEvent(new CustomEvent('routeChanged', {
      detail: { path, params, state }
    }));
  }

  /**
   * Reload current route
   */
  reload() {
    if (this.currentRoute) {
      this.loadRoute(this.currentRoute);
    }
  }
}

// Create and export router instance
const router = new Router();

// Make router globally available
window.router = router;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = router;
}

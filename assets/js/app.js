/**
 * Main Application Entry Point
 * 
 * This module initializes the CityHealth application and coordinates
 * all other modules.
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('CityHealth Platform initializing...');
  
  // Initialize application
  initializeApp();
});

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    // Check if Firebase is initialized (warn but don't block)
    if (!window.auth || !window.db) {
      console.warn('⚠️ Firebase not configured - running in demo mode');
      console.warn('To enable full functionality, configure Firebase in assets/js/firebase-config.js');
    }
    
    // Initialize i18n
    if (window.i18n && window.i18n.init) {
      await window.i18n.init();
    }
    
    // Load chatbot widget
    await loadChatbotWidget();
    
    // Register routes (ALWAYS do this, even without Firebase)
    registerRoutes();
    
    // Initialize authentication router
    if (window.authRouter) {
      console.log('Auth router initialized');
    }
    
    console.log('✅ Application initialized successfully');
    
  } catch (error) {
    console.error('Error initializing application:', error);
    showError('An error occurred while starting the application.');
  }
}

/**
 * Register application routes
 */
function registerRoutes() {
  if (!window.router) {
    console.warn('Router not available');
    return;
  }
  
  console.log('Registering application routes...');
  
  // Home page
  window.router.registerRoute('/', {
    template: '/pages/home.html',
    handler: async () => {
      console.log('Loading home page');
    }
  });

  // Alias for home page
  window.router.registerRoute('/home', {
    template: '/pages/home.html',
    handler: async () => {
      console.log('Loading home page (alias)');
    }
  });
  
  // Favorites page
  window.router.registerRoute('/favorites', {
    template: '/pages/favorites.html',
    handler: async () => {
      console.log('Loading favorites page');
    }
  });

  // Alias for home page
  window.router.registerRoute('/home', {
    template: '/pages/home.html',
    handler: async () => {
      console.log('Loading home page (alias)');
    }
  });
  
  // Favorites page
  window.router.registerRoute('/favorites', {
    template: '/pages/favorites.html',
    handler: async () => {
      console.log('Loading favorites page');
    }
  });
  
  // Authentication page
  window.router.registerRoute('/auth', {
    template: '/pages/auth.html',
    handler: async () => {
      console.log('Loading auth page');
      // Initialize auth UI if available
      if (window.authUI && window.authUI.initAuthUI) {
        setTimeout(() => window.authUI.initAuthUI(), 100);
      }
    }
  });
  
  // Search results page
  window.router.registerRoute('/search', {
    template: '/pages/search-results.html',
    handler: async ({ params, state }) => {
      console.log('Loading search page', params, state);
    }
  });
  
  // Provider profile page
  window.router.registerRoute('/profile/:id', {
    template: '/pages/profile.html',
    handler: async ({ params }) => {
      console.log('Loading profile page for provider:', params.id);
    }
  });
  
  // Provider dashboard (protected)
  window.router.registerRoute('/provider-dashboard', {
    template: '/pages/provider-dashboard.html',
    handler: async () => {
      // Check authentication and role
      if (!window.authRouter || !window.authRouter.requireRole('provider')) {
        return;
      }
      console.log('Loading provider dashboard');
    }
  });
  
  // Admin dashboard (protected)
  window.router.registerRoute('/admin', {
    template: '/pages/admin-dashboard.html',
    handler: async () => {
      // Check authentication and role
      if (!window.authRouter || !window.authRouter.requireRole('admin')) {
        return;
      }
      console.log('Loading admin dashboard');
    }
  });
  
  // Emergency page
  window.router.registerRoute('/emergency', {
    template: '/pages/emergency.html',
    handler: async () => {
      console.log('Loading emergency page');
    }
  });
  
  console.log('Routes registered successfully');
  
  // Start the router now that routes are registered
  if (window.router.start) {
    window.router.start();
  }
}

/**
 * Load chatbot widget component
 */
async function loadChatbotWidget() {
  try {
    const container = document.getElementById('chatbot-container');
    if (!container) {
      console.warn('Chatbot container not found');
      return;
    }
    
    const response = await fetch('/components/chatbot-widget.html');
    if (!response.ok) {
      throw new Error('Failed to load chatbot widget');
    }
    
    const html = await response.text();
    container.innerHTML = html;
    
    console.log('Chatbot widget loaded successfully');
  } catch (error) {
    console.error('Error loading chatbot widget:', error);
  }
}

/**
 * Show error message to user
 */
function showError(message) {
  const mainContent = document.getElementById('app-content') || document.getElementById('page-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">Error</h4>
          <p>${message}</p>
        </div>
      </div>
    `;
  }
}

/**
 * Show loading indicator
 */
function showLoading() {
  const loader = document.getElementById('page-loader');
  if (loader) {
    loader.classList.add('active');
  }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  const loader = document.getElementById('page-loader');
  if (loader) {
    loader.classList.remove('active');
  }
}

// Export for use in other modules
window.app = {
  showError,
  showLoading,
  hideLoading
};

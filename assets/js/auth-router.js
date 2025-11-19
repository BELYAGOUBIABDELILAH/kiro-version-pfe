/**
 * Authentication Router Module
 * 
 * Handles role-based routing, protected routes, and authentication state management.
 * Implements middleware for route protection and automatic redirects based on user roles.
 * 
 * Requirements: 5.1, 5.3, 8.1
 */

/**
 * Authentication Router class
 */
class AuthRouter {
  constructor() {
    this.currentUser = null;
    this.protectedRoutes = new Map();
    this.publicRoutes = new Set(['/auth', '/', '/search', '/emergency', '/profile']);
    this.roleRedirects = {
      'citizen': '/',
      'provider': '/provider-dashboard',
      'admin': '/admin'
    };
    
    // Initialize auth state observer
    this.initAuthStateObserver();
  }

  /**
   * Initialize authentication state observer
   */
  initAuthStateObserver() {
    if (!window.authModule) {
      console.error('Auth module not loaded');
      return;
    }

    // Set up auth state observer
    window.authModule.onAuthStateChanged((user) => {
      this.currentUser = user;
      this.handleAuthStateChange(user);
    });
  }

  /**
   * Handle authentication state changes
   * @param {Object|null} user - Current user or null if signed out
   */
  handleAuthStateChange(user) {
    const currentPath = window.location.pathname;
    
    // If user signed out and on protected route, redirect to home
    if (!user && this.isProtectedRoute(currentPath)) {
      this.redirectToAuth(currentPath);
      return;
    }
    
    // If user signed in and on auth page, redirect to appropriate dashboard
    if (user && currentPath === '/auth') {
      this.redirectToDashboard(user.role);
      return;
    }
    
    // Update UI based on auth state
    this.updateUIForAuthState(user);
    
    // Dispatch auth state change event
    window.dispatchEvent(new CustomEvent('auth-state-changed', {
      detail: { user }
    }));
  }

  /**
   * Register a protected route
   * @param {string} path - Route path
   * @param {string|Array<string>} allowedRoles - Allowed role(s) for this route
   */
  registerProtectedRoute(path, allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    this.protectedRoutes.set(path, roles);
  }

  /**
   * Check if a route is protected
   * @param {string} path - Route path
   * @returns {boolean} - True if route is protected
   */
  isProtectedRoute(path) {
    // Check exact match
    if (this.protectedRoutes.has(path)) {
      return true;
    }
    
    // Check pattern match (e.g., /profile/:id)
    for (const [routePath] of this.protectedRoutes) {
      if (this.matchRoutePath(path, routePath)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if user has access to a route
   * @param {string} path - Route path
   * @param {Object} user - User object
   * @returns {boolean} - True if user has access
   */
  canAccessRoute(path, user = this.currentUser) {
    if (!user) {
      return this.publicRoutes.has(path) || !this.isProtectedRoute(path);
    }
    
    // Admin has access to everything
    if (user.role === 'admin') {
      return true;
    }
    
    // Check if route is protected
    const allowedRoles = this.getRouteRoles(path);
    if (!allowedRoles) {
      return true; // Public route
    }
    
    return allowedRoles.includes(user.role);
  }

  /**
   * Get allowed roles for a route
   * @param {string} path - Route path
   * @returns {Array<string>|null} - Allowed roles or null if public
   */
  getRouteRoles(path) {
    // Check exact match
    if (this.protectedRoutes.has(path)) {
      return this.protectedRoutes.get(path);
    }
    
    // Check pattern match
    for (const [routePath, roles] of this.protectedRoutes) {
      if (this.matchRoutePath(path, routePath)) {
        return roles;
      }
    }
    
    return null;
  }

  /**
   * Match route path with pattern
   * @param {string} path - Actual path
   * @param {string} pattern - Route pattern
   * @returns {boolean} - True if matches
   */
  matchRoutePath(path, pattern) {
    const regex = pattern.replace(/:\w+/g, '[^/]+');
    return new RegExp(`^${regex}$`).test(path);
  }

  /**
   * Middleware to check route access before navigation
   * @param {string} path - Target path
   * @returns {boolean} - True if navigation should proceed
   */
  checkRouteAccess(path) {
    // Check if user can access route
    if (!this.canAccessRoute(path)) {
      // Redirect to auth page if not authenticated
      if (!this.currentUser) {
        this.redirectToAuth(path);
        return false;
      }
      
      // Redirect to appropriate dashboard if wrong role
      this.redirectToDashboard(this.currentUser.role);
      return false;
    }
    
    return true;
  }

  /**
   * Redirect to authentication page
   * @param {string} returnUrl - URL to return to after login
   */
  redirectToAuth(returnUrl = null) {
    const authPath = '/auth';
    
    if (returnUrl && returnUrl !== authPath) {
      // Store return URL in session storage
      sessionStorage.setItem('returnUrl', returnUrl);
    }
    
    if (window.router) {
      window.router.navigate(authPath);
    } else {
      window.location.href = authPath;
    }
  }

  /**
   * Redirect to appropriate dashboard based on user role
   * @param {string} role - User role
   */
  redirectToDashboard(role) {
    const dashboardPath = this.roleRedirects[role] || '/';
    
    // Check if there's a return URL
    const returnUrl = sessionStorage.getItem('returnUrl');
    if (returnUrl) {
      sessionStorage.removeItem('returnUrl');
      
      // Only redirect to return URL if user has access
      if (this.canAccessRoute(returnUrl, this.currentUser)) {
        if (window.router) {
          window.router.navigate(returnUrl);
        } else {
          window.location.href = returnUrl;
        }
        return;
      }
    }
    
    // Redirect to role-based dashboard
    if (window.router) {
      window.router.navigate(dashboardPath);
    } else {
      window.location.href = dashboardPath;
    }
  }

  /**
   * Update UI elements based on authentication state
   * @param {Object|null} user - Current user or null
   */
  updateUIForAuthState(user) {
    // Update navigation menu
    this.updateNavigation(user);
    
    // Update user profile display
    this.updateUserProfile(user);
  }

  /**
   * Update navigation menu based on auth state
   * @param {Object|null} user - Current user or null
   */
  updateNavigation(user) {
    // Show/hide auth-related nav items
    const loginBtn = document.querySelector('[data-auth="login"]');
    const registerBtn = document.querySelector('[data-auth="register"]');
    const logoutBtn = document.querySelector('[data-auth="logout"]');
    const dashboardBtn = document.querySelector('[data-auth="dashboard"]');
    
    if (user) {
      // User is authenticated
      if (loginBtn) loginBtn.classList.add('d-none');
      if (registerBtn) registerBtn.classList.add('d-none');
      if (logoutBtn) logoutBtn.classList.remove('d-none');
      if (dashboardBtn) {
        dashboardBtn.classList.remove('d-none');
        // Update dashboard link based on role
        const dashboardLink = dashboardBtn.querySelector('a');
        if (dashboardLink) {
          dashboardLink.href = this.roleRedirects[user.role] || '/';
        }
      }
    } else {
      // User is not authenticated
      if (loginBtn) loginBtn.classList.remove('d-none');
      if (registerBtn) registerBtn.classList.remove('d-none');
      if (logoutBtn) logoutBtn.classList.add('d-none');
      if (dashboardBtn) dashboardBtn.classList.add('d-none');
    }
  }

  /**
   * Update user profile display
   * @param {Object|null} user - Current user or null
   */
  updateUserProfile(user) {
    const userNameElement = document.querySelector('[data-user="name"]');
    const userEmailElement = document.querySelector('[data-user="email"]');
    const userPhotoElement = document.querySelector('[data-user="photo"]');
    
    if (user) {
      if (userNameElement) {
        userNameElement.textContent = user.displayName || user.email;
      }
      if (userEmailElement) {
        userEmailElement.textContent = user.email;
      }
      if (userPhotoElement && user.photoURL) {
        userPhotoElement.src = user.photoURL;
      }
    }
  }

  /**
   * Get current authenticated user
   * @returns {Object|null} - Current user or null
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} - True if authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean} - True if user has role
   */
  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }

  /**
   * Require authentication for current page
   * Redirects to auth page if not authenticated
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      this.redirectToAuth(window.location.pathname);
      return false;
    }
    return true;
  }

  /**
   * Require specific role for current page
   * Redirects to appropriate page if user doesn't have role
   * @param {string|Array<string>} requiredRole - Required role(s)
   */
  requireRole(requiredRole) {
    if (!this.requireAuth()) {
      return false;
    }
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!roles.includes(this.currentUser.role) && this.currentUser.role !== 'admin') {
      this.redirectToDashboard(this.currentUser.role);
      return false;
    }
    
    return true;
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    try {
      await window.authModule.signOut();
      
      // Redirect to home page
      if (window.router) {
        window.router.navigate('/');
      } else {
        window.location.href = '/';
      }
      
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to sign out. Please try again.');
    }
  }
}

// Create and export auth router instance
const authRouter = new AuthRouter();

// Register protected routes
authRouter.registerProtectedRoute('/provider-dashboard', 'provider');
authRouter.registerProtectedRoute('/admin', 'admin');
authRouter.registerProtectedRoute('/profile', ['citizen', 'provider']);

// Set up logout button handler
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.querySelector('[data-auth="logout"]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      authRouter.handleLogout();
    });
  }
});

// Integrate with router if available
if (window.router) {
  // Add navigation middleware
  window.addEventListener('route-change', (event) => {
    const { path } = event.detail;
    authRouter.checkRouteAccess(path);
  });
}

// Export for use in other modules
window.authRouter = authRouter;


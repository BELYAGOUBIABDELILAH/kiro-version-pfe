/**
 * Firebase Analytics Module
 * 
 * This module handles all analytics tracking for the CityHealth platform
 * including page views, user interactions, search queries, and custom events.
 */

const Analytics = {
  /**
   * Initialize Firebase Analytics
   */
  init() {
    if (!window.analytics) {
      console.warn('Firebase Analytics not initialized');
      return false;
    }
    
    console.log('Analytics module initialized');
    
    // Track initial page view
    this.trackPageView(window.location.pathname);
    
    // Set up automatic page view tracking on navigation
    this.setupNavigationTracking();
    
    return true;
  },

  /**
   * Set up automatic navigation tracking
   */
  setupNavigationTracking() {
    // Listen for router navigation events
    window.addEventListener('routeChanged', (event) => {
      const { path, params } = event.detail || {};
      this.trackPageView(path, params);
    });
    
    // Fallback: Listen for popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      this.trackPageView(window.location.pathname);
    });
  },

  /**
   * Track page view
   * @param {string} path - Page path
   * @param {Object} params - Additional parameters
   */
  trackPageView(path, params = {}) {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().logEvent('page_view', {
        page_path: path,
        page_title: document.title,
        page_location: window.location.href,
        ...params
      });
      
      console.log('Page view tracked:', path);
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  },

  /**
   * Track search query
   * @param {string} query - Search query text
   * @param {Object} filters - Applied filters
   * @param {number} resultCount - Number of results
   */
  trackSearch(query, filters = {}, resultCount = 0) {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().logEvent('search', {
        search_term: query,
        search_filters: JSON.stringify(filters),
        result_count: resultCount,
        timestamp: new Date().toISOString()
      });
      
      console.log('Search tracked:', query, resultCount, 'results');
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  },

  /**
   * Track provider profile view
   * @param {string} providerId - Provider ID
   * @param {string} providerName - Provider name
   * @param {string} providerType - Provider type
   */
  trackProfileView(providerId, providerName, providerType) {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().logEvent('view_item', {
        item_id: providerId,
        item_name: providerName,
        item_category: providerType,
        content_type: 'provider_profile'
      });
      
      console.log('Profile view tracked:', providerId);
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  },

  /**
   * Track favorite action
   * @param {string} providerId - Provider ID
   * @param {string} action - 'add' or 'remove'
   */
  trackFavorite(providerId, action) {
    if (!window.analytics) return;
    
    try {
      const eventName = action === 'add' ? 'add_to_favorites' : 'remove_from_favorites';
      
      firebase.analytics().logEvent(eventName, {
        provider_id: providerId,
        timestamp: new Date().toISOString()
      });
      
      console.log('Favorite action tracked:', action, providerId);
    } catch (error) {
      console.error('Error tracking favorite:', error);
    }
  },

  /**
   * Track chatbot interaction
   * @param {string} message - User message
   * @param {string} intent - Detected intent
   * @param {string} language - Message language
   */
  trackChatbotMessage(message, intent, language) {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().logEvent('chatbot_interaction', {
        message_length: message.length,
        intent: intent,
        language: language,
        timestamp: new Date().toISOString()
      });
      
      console.log('Chatbot interaction tracked:', intent);
    } catch (error) {
      console.error('Error tracking chatbot interaction:', error);
    }
  },

  /**
   * Track user authentication
   * @param {string} method - Auth method ('email', 'google')
   * @param {string} action - 'sign_up' or 'sign_in'
   */
  trackAuth(method, action) {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().logEvent(action, {
        method: method
      });
      
      console.log('Auth tracked:', action, method);
    } catch (error) {
      console.error('Error tracking auth:', error);
    }
  },

  /**
   * Track verification request
   * @param {string} providerId - Provider ID
   * @param {string} type - 'new' or 'claim'
   */
  trackVerificationRequest(providerId, type) {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().logEvent('verification_request', {
        provider_id: providerId,
        request_type: type,
        timestamp: new Date().toISOString()
      });
      
      console.log('Verification request tracked:', type);
    } catch (error) {
      console.error('Error tracking verification request:', error);
    }
  },

  /**
   * Track ad creation
   * @param {string} adId - Ad ID
   * @param {string} adType - Ad type ('text' or 'image')
   */
  trackAdCreation(adId, adType) {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().logEvent('ad_created', {
        ad_id: adId,
        ad_type: adType,
        timestamp: new Date().toISOString()
      });
      
      console.log('Ad creation tracked:', adId);
    } catch (error) {
      console.error('Error tracking ad creation:', error);
    }
  },

  /**
   * Track language change
   * @param {string} language - New language code
   */
  trackLanguageChange(language) {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().logEvent('language_change', {
        language: language,
        timestamp: new Date().toISOString()
      });
      
      console.log('Language change tracked:', language);
    } catch (error) {
      console.error('Error tracking language change:', error);
    }
  },

  /**
   * Track theme change
   * @param {string} theme - New theme ('light' or 'dark')
   */
  trackThemeChange(theme) {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().logEvent('theme_change', {
        theme: theme,
        timestamp: new Date().toISOString()
      });
      
      console.log('Theme change tracked:', theme);
    } catch (error) {
      console.error('Error tracking theme change:', error);
    }
  },

  /**
   * Track emergency section access
   */
  trackEmergencyAccess() {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().logEvent('emergency_access', {
        timestamp: new Date().toISOString()
      });
      
      console.log('Emergency access tracked');
    } catch (error) {
      console.error('Error tracking emergency access:', error);
    }
  },

  /**
   * Track filter application
   * @param {Object} filters - Applied filters
   * @param {number} resultCount - Number of results after filtering
   */
  trackFilterApplication(filters, resultCount) {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().logEvent('filter_applied', {
        filters: JSON.stringify(filters),
        result_count: resultCount,
        timestamp: new Date().toISOString()
      });
      
      console.log('Filter application tracked:', filters);
    } catch (error) {
      console.error('Error tracking filter application:', error);
    }
  },

  /**
   * Track profile update
   * @param {string} providerId - Provider ID
   * @param {Array<string>} updatedFields - List of updated field names
   */
  trackProfileUpdate(providerId, updatedFields) {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().logEvent('profile_updated', {
        provider_id: providerId,
        updated_fields: updatedFields.join(','),
        field_count: updatedFields.length,
        timestamp: new Date().toISOString()
      });
      
      console.log('Profile update tracked:', providerId);
    } catch (error) {
      console.error('Error tracking profile update:', error);
    }
  },

  /**
   * Track custom event
   * @param {string} eventName - Event name
   * @param {Object} params - Event parameters
   */
  trackCustomEvent(eventName, params = {}) {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().logEvent(eventName, {
        ...params,
        timestamp: new Date().toISOString()
      });
      
      console.log('Custom event tracked:', eventName);
    } catch (error) {
      console.error('Error tracking custom event:', error);
    }
  },

  /**
   * Set user properties
   * @param {Object} properties - User properties
   */
  setUserProperties(properties) {
    if (!window.analytics) return;
    
    try {
      Object.entries(properties).forEach(([key, value]) => {
        firebase.analytics().setUserProperties({ [key]: value });
      });
      
      console.log('User properties set:', properties);
    } catch (error) {
      console.error('Error setting user properties:', error);
    }
  },

  /**
   * Set user ID
   * @param {string} userId - User ID
   */
  setUserId(userId) {
    if (!window.analytics) return;
    
    try {
      firebase.analytics().setUserId(userId);
      console.log('User ID set:', userId);
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  }
};

// Initialize analytics when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    Analytics.init();
  });
} else {
  Analytics.init();
}

// Export for use in other modules
window.Analytics = Analytics;

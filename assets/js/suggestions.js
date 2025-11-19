/**
 * Smart Suggestions Module
 * Provides AI-powered provider suggestions based on user behavior and context
 */

class Suggestions {
  constructor() {
    this.db = window.db;
    this.dismissedSuggestions = this.loadDismissedSuggestions();
    this.userInteractions = this.loadUserInteractions();
  }

  /**
   * Get smart suggestions for the user
   * @param {Object} context - User context (location, preferences, etc.)
   * @returns {Promise<Array>} - Array of suggested providers with reasons
   */
  async getSuggestions(context = {}) {
    try {
      const suggestions = [];
      const suggestionReasons = [];

      // Get search history from localStorage
      const searchHistory = this.getSearchHistory();

      // Strategy 1: Based on recent search history
      if (searchHistory.length > 0) {
        const historyBased = await this.getSuggestionsFromHistory(searchHistory);
        historyBased.forEach(provider => {
          if (!this.isDismissed(provider.id)) {
            suggestions.push({
              ...provider,
              reason: 'Based on your recent searches',
              reasonIcon: 'bi-clock-history'
            });
          }
        });
      }

      // Strategy 2: Popular providers (high ratings and view counts)
      const popular = await this.getPopularProviders(5);
      popular.forEach(provider => {
        if (!this.isDismissed(provider.id) && !suggestions.find(s => s.id === provider.id)) {
          suggestions.push({
            ...provider,
            reason: 'Highly rated by users',
            reasonIcon: 'bi-star-fill'
          });
        }
      });

      // Strategy 3: Based on user location if available
      if (context.userLocation) {
        const nearby = await this.getNearbyProviders(context.userLocation, 3);
        nearby.forEach(provider => {
          if (!this.isDismissed(provider.id) && !suggestions.find(s => s.id === provider.id)) {
            suggestions.push({
              ...provider,
              reason: 'Near your location',
              reasonIcon: 'bi-geo-alt-fill'
            });
          }
        });
      }

      // Strategy 4: Based on user interactions (favorites, views)
      const interactionBased = await this.getSuggestionsFromInteractions();
      interactionBased.forEach(provider => {
        if (!this.isDismissed(provider.id) && !suggestions.find(s => s.id === provider.id)) {
          suggestions.push({
            ...provider,
            reason: 'Similar to providers you viewed',
            reasonIcon: 'bi-eye-fill'
          });
        }
      });

      // Strategy 5: Emergency providers (always useful)
      const emergency = await this.getEmergencyProviders(2);
      emergency.forEach(provider => {
        if (!this.isDismissed(provider.id) && !suggestions.find(s => s.id === provider.id)) {
          suggestions.push({
            ...provider,
            reason: 'Available 24/7 for emergencies',
            reasonIcon: 'bi-exclamation-triangle-fill'
          });
        }
      });

      // Limit to 10 suggestions and shuffle for variety
      const finalSuggestions = this.shuffleArray(suggestions).slice(0, 10);

      return finalSuggestions;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Get suggestions based on search history
   * @param {Array} searchHistory - User's search history
   * @returns {Promise<Array>} - Suggested providers
   */
  async getSuggestionsFromHistory(searchHistory) {
    try {
      const recentSearch = searchHistory[0];
      let query = this.db.collection('providers')
        .where('verified', '==', true);

      // Apply filters from most recent search
      if (recentSearch.serviceType && recentSearch.serviceType !== 'all') {
        query = query.where('type', '==', recentSearch.serviceType);
      }

      if (recentSearch.location && recentSearch.location !== 'all') {
        query = query.where('city', '==', recentSearch.location);
      }

      query = query.orderBy('rating', 'desc').limit(3);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting history-based suggestions:', error);
      return [];
    }
  }

  /**
   * Get popular providers
   * @param {number} limit - Number of providers to fetch
   * @returns {Promise<Array>} - Popular providers
   */
  async getPopularProviders(limit = 5) {
    try {
      const snapshot = await this.db.collection('providers')
        .where('verified', '==', true)
        .orderBy('rating', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching popular providers:', error);
      return [];
    }
  }

  /**
   * Get nearby providers based on location
   * @param {string} location - User location (city)
   * @param {number} limit - Number of providers to fetch
   * @returns {Promise<Array>} - Nearby providers
   */
  async getNearbyProviders(location, limit = 3) {
    try {
      const snapshot = await this.db.collection('providers')
        .where('verified', '==', true)
        .where('city', '==', location)
        .orderBy('rating', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching nearby providers:', error);
      return [];
    }
  }

  /**
   * Get suggestions based on user interactions
   * @returns {Promise<Array>} - Suggested providers
   */
  async getSuggestionsFromInteractions() {
    try {
      const viewedProviders = this.userInteractions.viewed || [];
      
      if (viewedProviders.length === 0) {
        return [];
      }

      // Get the most recently viewed provider
      const recentProvider = viewedProviders[0];
      
      // Find similar providers (same type)
      const snapshot = await this.db.collection('providers')
        .where('verified', '==', true)
        .where('type', '==', recentProvider.type)
        .orderBy('rating', 'desc')
        .limit(3)
        .get();

      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(provider => provider.id !== recentProvider.id);
    } catch (error) {
      console.error('Error getting interaction-based suggestions:', error);
      return [];
    }
  }

  /**
   * Get emergency providers (24/7 available)
   * @param {number} limit - Number of providers to fetch
   * @returns {Promise<Array>} - Emergency providers
   */
  async getEmergencyProviders(limit = 2) {
    try {
      const snapshot = await this.db.collection('providers')
        .where('verified', '==', true)
        .where('available24_7', '==', true)
        .orderBy('rating', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching emergency providers:', error);
      return [];
    }
  }

  /**
   * Dismiss a suggestion
   * @param {string} providerId - Provider ID to dismiss
   */
  dismissSuggestion(providerId) {
    if (!this.dismissedSuggestions.includes(providerId)) {
      this.dismissedSuggestions.push(providerId);
      this.saveDismissedSuggestions();
    }
  }

  /**
   * Check if a suggestion is dismissed
   * @param {string} providerId - Provider ID
   * @returns {boolean} - True if dismissed
   */
  isDismissed(providerId) {
    return this.dismissedSuggestions.includes(providerId);
  }

  /**
   * Track user interaction with a provider
   * @param {string} providerId - Provider ID
   * @param {string} type - Interaction type (viewed, favorited, etc.)
   * @param {Object} providerData - Provider data
   */
  trackInteraction(providerId, type, providerData = {}) {
    if (!this.userInteractions[type]) {
      this.userInteractions[type] = [];
    }

    // Add to beginning of array (most recent first)
    this.userInteractions[type].unshift({
      id: providerId,
      type: providerData.type,
      timestamp: Date.now()
    });

    // Keep only last 10 interactions per type
    this.userInteractions[type] = this.userInteractions[type].slice(0, 10);

    this.saveUserInteractions();
  }

  /**
   * Get search history from localStorage
   * @returns {Array} - Search history
   */
  getSearchHistory() {
    try {
      const history = localStorage.getItem('searchHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error reading search history:', error);
      return [];
    }
  }

  /**
   * Load dismissed suggestions from localStorage
   * @returns {Array} - Dismissed provider IDs
   */
  loadDismissedSuggestions() {
    try {
      const dismissed = localStorage.getItem('dismissedSuggestions');
      return dismissed ? JSON.parse(dismissed) : [];
    } catch (error) {
      console.error('Error loading dismissed suggestions:', error);
      return [];
    }
  }

  /**
   * Save dismissed suggestions to localStorage
   */
  saveDismissedSuggestions() {
    try {
      localStorage.setItem('dismissedSuggestions', JSON.stringify(this.dismissedSuggestions));
    } catch (error) {
      console.error('Error saving dismissed suggestions:', error);
    }
  }

  /**
   * Load user interactions from localStorage
   * @returns {Object} - User interactions
   */
  loadUserInteractions() {
    try {
      const interactions = localStorage.getItem('userInteractions');
      return interactions ? JSON.parse(interactions) : { viewed: [], favorited: [] };
    } catch (error) {
      console.error('Error loading user interactions:', error);
      return { viewed: [], favorited: [] };
    }
  }

  /**
   * Save user interactions to localStorage
   */
  saveUserInteractions() {
    try {
      localStorage.setItem('userInteractions', JSON.stringify(this.userInteractions));
    } catch (error) {
      console.error('Error saving user interactions:', error);
    }
  }

  /**
   * Clear dismissed suggestions (for testing or user preference)
   */
  clearDismissedSuggestions() {
    this.dismissedSuggestions = [];
    this.saveDismissedSuggestions();
  }

  /**
   * Shuffle array for variety in suggestions
   * @param {Array} array - Array to shuffle
   * @returns {Array} - Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Create and export suggestions instance
const suggestions = new Suggestions();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = suggestions;
}


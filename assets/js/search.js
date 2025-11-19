/**
 * Search Module
 * Handles healthcare provider search with Firestore queries
 */

class Search {
  constructor() {
    this.db = window.db;
    this.currentPage = 1;
    this.pageSize = 20;
    this.lastVisible = null;
    this.searchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Search providers with service type and location filters
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query text
   * @param {string} params.serviceType - Provider type filter
   * @param {string} params.location - City/location filter
   * @param {Object} params.filters - Additional filters
   * @param {number} params.page - Page number for pagination
   * @param {boolean} params.showLoading - Whether to show loading indicator (default: true)
   * @param {Array<string>} params.fields - Specific fields to retrieve (optional, for optimization)
   * @returns {Promise<Object>} - Search results with providers and metadata
   */
  async searchProviders(params = {}) {
    const {
      query = '',
      serviceType = '',
      location = '',
      filters = {},
      page = 1,
      showLoading = true,
      fields = null
    } = params;

    // Show skeleton loading for search results
    const resultsContainer = document.getElementById('results-container');
    if (showLoading && resultsContainer && window.LoadingIndicator) {
      window.LoadingIndicator.showSkeleton(resultsContainer, {
        type: 'card',
        count: 3
      });
    }

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(params);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Build Firestore query
      let firestoreQuery = this.db.collection('providers');

      // Filter by verified providers only
      firestoreQuery = firestoreQuery.where('verified', '==', true);

      // Apply service type filter
      if (serviceType && serviceType !== 'all') {
        firestoreQuery = firestoreQuery.where('type', '==', serviceType);
      }

      // Apply location filter
      if (location && location !== 'all') {
        firestoreQuery = firestoreQuery.where('city', '==', location);
      }

      // Apply additional filters
      if (filters.accessibility === true) {
        firestoreQuery = firestoreQuery.where('accessibility', '==', true);
      }

      if (filters.homeVisits === true) {
        firestoreQuery = firestoreQuery.where('homeVisits', '==', true);
      }

      if (filters.available24_7 === true) {
        firestoreQuery = firestoreQuery.where('available24_7', '==', true);
      }

      // Sort by rating (descending) and then by name
      firestoreQuery = firestoreQuery.orderBy('rating', 'desc');

      // Handle pagination - use cursor-based pagination for better performance
      const paginationKey = this.getPaginationKey(params);
      if (page > 1) {
        const cursor = this.getPaginationCursor(paginationKey, page - 1);
        if (cursor) {
          firestoreQuery = firestoreQuery.startAfter(cursor);
        }
      }

      // Limit results
      firestoreQuery = firestoreQuery.limit(this.pageSize);

      // Execute query with field selection if specified
      const startTime = Date.now();

      // Track Firestore query performance
      const stopTracking = window.PerformanceMonitoring
        ? window.PerformanceMonitoring.trackFirestoreQuery('providers', 'search')
        : null;

      const snapshot = await firestoreQuery.get();
      const queryTime = Date.now() - startTime;

      // Stop performance tracking
      if (stopTracking) {
        stopTracking();
      }

      // Store pagination cursor for next page
      if (!snapshot.empty) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        this.setPaginationCursor(paginationKey, page, lastDoc);
      }

      // Extract provider data with optional field selection
      let providers = snapshot.docs.map(doc => {
        const data = doc.data();

        // If specific fields requested, return only those fields
        if (fields && Array.isArray(fields)) {
          const filteredData = { id: doc.id };
          fields.forEach(field => {
            if (data[field] !== undefined) {
              filteredData[field] = data[field];
            }
          });
          return filteredData;
        }

        // Otherwise return all data
        return {
          id: doc.id,
          ...data
        };
      });

      // Apply client-side text search if query provided
      if (query && query.trim()) {
        providers = this.filterByQuery(providers, query);
      }

      // Sort by relevance if query provided
      if (query && query.trim()) {
        providers = this.sortByRelevance(providers, query);
      }

      // Prepare result object
      const result = {
        providers,
        total: providers.length,
        page,
        pageSize: this.pageSize,
        hasMore: snapshot.docs.length === this.pageSize,
        queryTime,
        filters: {
          query,
          serviceType,
          location,
          ...filters
        }
      };

      // Cache results
      this.addToCache(cacheKey, result);

      // Track search in analytics
      if (window.Analytics) {
        window.Analytics.trackSearch(query, filters, providers.length);
      }

      return result;
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to search providers. Please try again.');
    } finally {
      // Hide skeleton loading
      if (showLoading && resultsContainer && window.LoadingIndicator) {
        window.LoadingIndicator.hideSkeleton(resultsContainer);
      }
    }
  }

  /**
   * Filter providers by text query (client-side)
   * @param {Array} providers - Provider list
   * @param {string} query - Search query
   * @returns {Array} - Filtered providers
   */
  filterByQuery(providers, query) {
    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    return providers.filter(provider => {
      const searchableText = [
        provider.name || '',
        provider.nameAr || '',
        provider.nameFr || '',
        provider.specialty || '',
        provider.specialtyAr || '',
        provider.specialtyFr || '',
        provider.address?.street || '',
        provider.address?.city || '',
        provider.type || ''
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  /**
   * Sort providers by relevance to query
   * @param {Array} providers - Provider list
   * @param {string} query - Search query
   * @returns {Array} - Sorted providers
   */
  sortByRelevance(providers, query) {
    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    return providers.map(provider => {
      let score = 0;

      // Calculate relevance score
      searchTerms.forEach(term => {
        // Name matches (highest priority)
        if (provider.name?.toLowerCase().includes(term)) score += 10;
        if (provider.nameAr?.includes(term)) score += 10;
        if (provider.nameFr?.toLowerCase().includes(term)) score += 10;

        // Specialty matches
        if (provider.specialty?.toLowerCase().includes(term)) score += 5;
        if (provider.specialtyAr?.includes(term)) score += 5;
        if (provider.specialtyFr?.toLowerCase().includes(term)) score += 5;

        // Type matches
        if (provider.type?.toLowerCase().includes(term)) score += 3;

        // Location matches
        if (provider.address?.city?.toLowerCase().includes(term)) score += 2;
      });

      // Boost verified providers
      if (provider.verified) score += 1;

      // Boost higher rated providers
      score += (provider.rating || 0) * 0.5;

      return { ...provider, relevanceScore: score };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get emergency providers (24/7 available)
   * @returns {Promise<Array>} - Emergency providers
   */
  async getEmergencyProviders() {
    try {
      const snapshot = await this.db.collection('providers')
        .where('verified', '==', true)
        .where('available24_7', '==', true)
        .orderBy('rating', 'desc')
        .limit(10)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching emergency providers:', error);
      throw new Error('Failed to load emergency providers.');
    }
  }

  /**
   * Get popular providers
   * @param {number} limit - Number of providers to fetch
   * @param {Array<string>} fields - Specific fields to retrieve (optional)
   * @returns {Promise<Array>} - Popular providers
   */
  async getPopularProviders(limit = 10, fields = null) {
    try {
      // Check cache first
      const cacheKey = `popular_${limit}_${fields ? fields.join(',') : 'all'}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const snapshot = await this.db.collection('providers')
        .where('verified', '==', true)
        .orderBy('rating', 'desc')
        .orderBy('viewCount', 'desc')
        .limit(limit)
        .get();

      const providers = snapshot.docs.map(doc => {
        const data = doc.data();

        // If specific fields requested, return only those fields
        if (fields && Array.isArray(fields)) {
          const filteredData = { id: doc.id };
          fields.forEach(field => {
            if (data[field] !== undefined) {
              filteredData[field] = data[field];
            }
          });
          return filteredData;
        }

        return {
          id: doc.id,
          ...data
        };
      });

      // Cache results
      this.addToCache(cacheKey, providers);

      return providers;
    } catch (error) {
      console.error('Error fetching popular providers:', error);
      return [];
    }
  }

  /**
   * Get AI-powered smart suggestions (deprecated - use suggestions module)
   * @param {Object} context - User context (search history, location, etc.)
   * @returns {Promise<Array>} - Suggested providers
   * @deprecated Use window.suggestions.getSuggestions() instead
   */
  async getSuggestions(context = {}) {
    // Delegate to the suggestions module if available
    if (window.suggestions && window.suggestions.getSuggestions) {
      return window.suggestions.getSuggestions(context);
    }

    // Fallback implementation
    try {
      const suggestions = [];

      // Get search history from localStorage
      const searchHistory = this.getSearchHistory();

      // If user has search history, suggest based on that
      if (searchHistory.length > 0) {
        const recentSearch = searchHistory[0];
        const historyBased = await this.searchProviders({
          serviceType: recentSearch.serviceType,
          location: recentSearch.location,
          page: 1
        });
        suggestions.push(...historyBased.providers.slice(0, 3));
      }

      // Add popular providers
      const popular = await this.getPopularProviders(5);
      suggestions.push(...popular);

      // If user location is available, suggest nearby providers
      if (context.userLocation) {
        const nearby = await this.searchProviders({
          location: context.userLocation,
          page: 1
        });
        suggestions.push(...nearby.providers.slice(0, 3));
      }

      // Remove duplicates and limit to 10
      const uniqueSuggestions = this.removeDuplicates(suggestions);
      return uniqueSuggestions.slice(0, 10);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Get service types for autocomplete
   * @returns {Promise<Array>} - Service types
   */
  async getServiceTypes() {
    try {
      // Get unique service types from providers
      const snapshot = await this.db.collection('providers')
        .where('verified', '==', true)
        .get();

      const types = new Set();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.type) types.add(data.type);
      });

      return Array.from(types).sort();
    } catch (error) {
      console.error('Error fetching service types:', error);
      // Return default types
      return ['clinic', 'hospital', 'doctor', 'pharmacy', 'lab'];
    }
  }

  /**
   * Get available cities for location filter
   * @returns {Promise<Array>} - Cities
   */
  async getCities() {
    try {
      const snapshot = await this.db.collection('providers')
        .where('verified', '==', true)
        .get();

      const cities = new Set();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.city) cities.add(data.city);
      });

      return Array.from(cities).sort();
    } catch (error) {
      console.error('Error fetching cities:', error);
      return ['Sidi Bel Abbès'];
    }
  }

  /**
   * Save search to history
   * @param {Object} searchParams - Search parameters
   */
  saveSearchHistory(searchParams) {
    try {
      const history = this.getSearchHistory();

      // Add new search to beginning
      history.unshift({
        ...searchParams,
        timestamp: Date.now()
      });

      // Keep only last 10 searches
      const trimmed = history.slice(0, 10);

      localStorage.setItem('searchHistory', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  /**
   * Get search history
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
   * Clear search history
   */
  clearSearchHistory() {
    try {
      localStorage.removeItem('searchHistory');
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }

  /**
   * Reset pagination
   */
  resetPagination() {
    this.currentPage = 1;
    this.lastVisible = null;
    this.paginationCursors = new Map();
  }

  /**
   * Generate pagination key from search parameters
   * @param {Object} params - Search parameters
   * @returns {string} - Pagination key
   */
  getPaginationKey(params) {
    const { query, serviceType, location, filters } = params;
    return JSON.stringify({ query, serviceType, location, filters });
  }

  /**
   * Get pagination cursor for a specific page
   * @param {string} key - Pagination key
   * @param {number} page - Page number
   * @returns {Object|null} - Firestore document snapshot or null
   */
  getPaginationCursor(key, page) {
    if (!this.paginationCursors) {
      this.paginationCursors = new Map();
    }

    const cursors = this.paginationCursors.get(key);
    if (cursors && cursors[page]) {
      return cursors[page];
    }

    return null;
  }

  /**
   * Set pagination cursor for a specific page
   * @param {string} key - Pagination key
   * @param {number} page - Page number
   * @param {Object} cursor - Firestore document snapshot
   */
  setPaginationCursor(key, page, cursor) {
    if (!this.paginationCursors) {
      this.paginationCursors = new Map();
    }

    let cursors = this.paginationCursors.get(key);
    if (!cursors) {
      cursors = {};
      this.paginationCursors.set(key, cursors);
    }

    cursors[page] = cursor;

    // Limit stored cursors to prevent memory issues
    if (Object.keys(cursors).length > 20) {
      const oldestPage = Math.min(...Object.keys(cursors).map(Number));
      delete cursors[oldestPage];
    }
  }

  /**
   * Generate cache key from search parameters
   * @param {Object} params - Search parameters
   * @returns {string} - Cache key
   */
  getCacheKey(params) {
    return JSON.stringify(params);
  }

  /**
   * Get results from cache
   * @param {string} key - Cache key
   * @returns {Object|null} - Cached results or null
   */
  getFromCache(key) {
    const cached = this.searchCache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // Remove expired cache
    if (cached) {
      this.searchCache.delete(key);
    }

    return null;
  }

  /**
   * Add results to cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  addToCache(key, data) {
    this.searchCache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.searchCache.size > 50) {
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.searchCache.clear();
  }

  /**
   * Remove duplicate providers from array
   * @param {Array} providers - Provider array
   * @returns {Array} - Unique providers
   */
  removeDuplicates(providers) {
    const seen = new Set();
    return providers.filter(provider => {
      if (seen.has(provider.id)) {
        return false;
      }
      seen.add(provider.id);
      return true;
    });
  }

  /**
   * Batch get multiple providers by IDs
   * @param {Array<string>} providerIds - Array of provider IDs
   * @param {Array<string>} fields - Specific fields to retrieve (optional)
   * @returns {Promise<Array>} - Array of providers
   */
  async batchGetProviders(providerIds, fields = null) {
    try {
      if (!providerIds || providerIds.length === 0) {
        return [];
      }

      // Firestore has a limit of 10 documents per batch get
      // Split into chunks of 10
      const chunks = [];
      for (let i = 0; i < providerIds.length; i += 10) {
        chunks.push(providerIds.slice(i, i + 10));
      }

      const allProviders = [];

      for (const chunk of chunks) {
        const promises = chunk.map(id =>
          this.db.collection('providers').doc(id).get()
        );

        const snapshots = await Promise.all(promises);

        snapshots.forEach(snapshot => {
          if (snapshot.exists) {
            const data = snapshot.data();

            // If specific fields requested, return only those fields
            if (fields && Array.isArray(fields)) {
              const filteredData = { id: snapshot.id };
              fields.forEach(field => {
                if (data[field] !== undefined) {
                  filteredData[field] = data[field];
                }
              });
              allProviders.push(filteredData);
            } else {
              allProviders.push({
                id: snapshot.id,
                ...data
              });
            }
          }
        });
      }

      return allProviders;
    } catch (error) {
      console.error('Error batch getting providers:', error);
      throw new Error('Failed to fetch providers.');
    }
  }

  /**
   * Batch update multiple providers (requires admin privileges)
   * @param {Array<Object>} updates - Array of {id, data} objects
   * @returns {Promise<Object>} - Result with success and error counts
   */
  async batchUpdateProviders(updates) {
    try {
      if (!updates || updates.length === 0) {
        return { success: 0, errors: [] };
      }

      // Firestore batch has a limit of 500 operations
      const batchSize = 500;
      const results = {
        success: 0,
        errors: []
      };

      for (let i = 0; i < updates.length; i += batchSize) {
        const chunk = updates.slice(i, i + batchSize);
        const batch = this.db.batch();

        chunk.forEach(update => {
          const docRef = this.db.collection('providers').doc(update.id);
          batch.update(docRef, {
            ...update.data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });

        try {
          await batch.commit();
          results.success += chunk.length;
        } catch (error) {
          console.error('Batch update error:', error);
          chunk.forEach(update => {
            results.errors.push({
              id: update.id,
              error: error.message
            });
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error batch updating providers:', error);
      throw new Error('Failed to batch update providers.');
    }
  }

  /**
   * Increment view count for a provider (optimized write)
   * @param {string} providerId - Provider ID
   * @returns {Promise<void>}
   */
  async incrementViewCount(providerId) {
    try {
      await this.db.collection('providers').doc(providerId).update({
        viewCount: firebase.firestore.FieldValue.increment(1),
        lastViewedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Prefetch next page for better UX
   * @param {Object} params - Search parameters
   * @returns {Promise<void>}
   */
  async prefetchNextPage(params) {
    try {
      const nextPageParams = {
        ...params,
        page: (params.page || 1) + 1,
        showLoading: false
      };

      // Prefetch in background without blocking
      this.searchProviders(nextPageParams).catch(error => {
        console.warn('Prefetch failed:', error);
      });
    } catch (error) {
      console.warn('Error prefetching next page:', error);
    }
  }
}

// Create and export search instance
const search = new Search();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = search;
}

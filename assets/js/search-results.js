/**
 * Search Results Page Module
 * Handles search results display, filtering, and pagination
 */

class SearchResults {
  constructor() {
    this.resultsContainer = null;
    this.loadingIndicator = null;
    this.resultsCount = null;
    this.paginationContainer = null;
    this.currentResults = [];
    this.currentFilters = {};
    this.currentPage = 1;
    
    this.init();
  }

  /**
   * Initialize search results page
   */
  async init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      await this.setup();
    }
  }

  /**
   * Setup search results page
   */
  async setup() {
    // Get DOM elements
    this.resultsContainer = document.getElementById('results-container');
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.resultsCount = document.getElementById('results-count');
    this.paginationContainer = document.getElementById('pagination-container');

    if (!this.resultsContainer) {
      console.warn('Search results container not found');
      return;
    }

    // Load search bar component
    await this.loadSearchBar();

    // Attach filter event listeners
    this.attachFilterListeners();

    // Listen for search submissions
    window.addEventListener('search-submit', (e) => {
      this.handleSearch(e.detail);
    });

    // Load initial search from session storage
    const savedSearch = sessionStorage.getItem('currentSearch');
    if (savedSearch) {
      const params = JSON.parse(savedSearch);
      await this.performSearch(params);
    }
  }

  /**
   * Load search bar component into page
   */
  async loadSearchBar() {
    const container = document.getElementById('search-bar-container');
    if (!container) return;

    try {
      const response = await fetch('components/search-bar.html');
      const html = await response.text();
      container.innerHTML = html;

      // Initialize search bar after loading
      if (window.searchBar) {
        await window.searchBar.setup();
      }
    } catch (error) {
      console.error('Error loading search bar:', error);
    }
  }

  /**
   * Attach event listeners to filter checkboxes
   */
  attachFilterListeners() {
    // Get all filter checkboxes
    const filterCheckboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
    
    filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.handleFilterChange();
      });
    });

    // Clear filters button
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }
  }

  /**
   * Handle filter changes
   */
  async handleFilterChange() {
    // Get current search params
    const savedSearch = sessionStorage.getItem('currentSearch');
    if (!savedSearch) return;

    const params = JSON.parse(savedSearch);
    
    // Update filters
    params.filters = this.getActiveFilters();

    // Perform search with new filters
    await this.performSearch(params);
  }

  /**
   * Get active filters from checkboxes
   * @returns {Object} - Active filters
   */
  getActiveFilters() {
    const filters = {};

    // Service type filters
    const typeFilters = [];
    ['clinic', 'hospital', 'doctor', 'pharmacy', 'lab'].forEach(type => {
      const checkbox = document.getElementById(`filter-${type}`);
      if (checkbox && checkbox.checked) {
        typeFilters.push(type);
      }
    });
    if (typeFilters.length > 0) {
      filters.types = typeFilters;
    }

    // Feature filters
    const accessibilityCheckbox = document.getElementById('filter-accessibility');
    if (accessibilityCheckbox && accessibilityCheckbox.checked) {
      filters.accessibility = true;
    }

    const homeVisitsCheckbox = document.getElementById('filter-homeVisits');
    if (homeVisitsCheckbox && homeVisitsCheckbox.checked) {
      filters.homeVisits = true;
    }

    const emergencyCheckbox = document.getElementById('filter-emergency');
    if (emergencyCheckbox && emergencyCheckbox.checked) {
      filters.available24_7 = true;
    }

    return filters;
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    // Uncheck all filter checkboxes
    const filterCheckboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    // Perform search without filters
    await this.handleFilterChange();
  }

  /**
   * Handle search submission
   * @param {Object} params - Search parameters
   */
  async handleSearch(params) {
    await this.performSearch(params);
  }

  /**
   * Perform search with given parameters
   * @param {Object} params - Search parameters
   */
  async performSearch(params) {
    try {
      // Show loading indicator
      this.showLoading();

      // Reset pagination
      this.currentPage = 1;
      if (window.search) {
        window.search.resetPagination();
      }

      // Perform search
      const results = await window.search.searchProviders({
        ...params,
        page: this.currentPage
      });

      // Apply client-side filters if needed
      let filteredResults = results.providers;
      if (params.filters && params.filters.types) {
        filteredResults = filteredResults.filter(provider => 
          params.filters.types.includes(provider.type)
        );
      }

      // Store results
      this.currentResults = filteredResults;
      this.currentFilters = params.filters || {};

      // Display results
      this.displayResults(filteredResults);

      // Update results count
      this.updateResultsCount(filteredResults.length);

      // Update pagination
      this.updatePagination(results.hasMore);

      // Hide loading indicator
      this.hideLoading();

      // Save search to session
      sessionStorage.setItem('currentSearch', JSON.stringify(params));
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Failed to perform search. Please try again.');
      this.hideLoading();
    }
  }

  /**
   * Display search results
   * @param {Array} providers - Provider list
   */
  displayResults(providers) {
    if (!this.resultsContainer) return;

    // Clear previous results
    this.resultsContainer.innerHTML = '';

    // Show empty state if no results
    if (providers.length === 0) {
      this.showEmptyState();
      return;
    }

    // Create provider cards
    providers.forEach(provider => {
      const card = this.createProviderCard(provider);
      this.resultsContainer.appendChild(card);
    });
  }

  /**
   * Create provider card element
   * @param {Object} provider - Provider data
   * @returns {HTMLElement} - Provider card element
   */
  createProviderCard(provider) {
    const card = document.createElement('div');
    card.className = 'provider-card';
    card.setAttribute('data-provider-id', provider.id);
    card.setAttribute('role', 'article');

    // Get current language for multilingual support
    const currentLang = window.i18n?.getCurrentLanguage() || 'en';
    const providerName = this.getLocalizedField(provider, 'name', currentLang);
    const providerSpecialty = this.getLocalizedField(provider, 'specialty', currentLang);

    // Card content
    card.innerHTML = `
      <div class="row">
        <div class="col-md-3">
          ${provider.images && provider.images.length > 0 ? `
            <img src="${provider.images[0]}" alt="${providerName}" class="provider-card-image">
          ` : `
            <div class="provider-card-image-placeholder">
              <i class="bi bi-building"></i>
            </div>
          `}
        </div>
        <div class="col-md-9">
          <div class="provider-card-content">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h3 class="provider-card-title mb-0">${providerName}</h3>
              ${provider.verified ? `
                <span class="badge badge-success">
                  <i class="bi bi-check-circle-fill"></i> 
                  <span data-i18n="profile.verified">Verified</span>
                </span>
              ` : ''}
            </div>
            
            ${providerSpecialty ? `
              <p class="text-muted mb-2">${providerSpecialty}</p>
            ` : ''}
            
            <div class="provider-card-info mb-3">
              <span class="provider-card-badge">
                <i class="bi bi-building"></i>
                <span>${this.getServiceTypeName(provider.type, currentLang)}</span>
              </span>
              
              ${provider.city || provider.address?.city ? `
                <span class="provider-card-badge">
                  <i class="bi bi-geo-alt"></i>
                  <span>${provider.city || provider.address.city}</span>
                </span>
              ` : ''}
              
              ${provider.rating ? `
                <span class="provider-card-badge">
                  <i class="bi bi-star-fill text-warning"></i>
                  <span>${provider.rating.toFixed(1)}</span>
                </span>
              ` : ''}
              
              ${provider.accessibility ? `
                <span class="provider-card-badge badge-info">
                  <i class="bi bi-universal-access"></i>
                  <span data-i18n="profile.accessible">Accessible</span>
                </span>
              ` : ''}
              
              ${provider.homeVisits ? `
                <span class="provider-card-badge badge-info">
                  <i class="bi bi-house"></i>
                  <span data-i18n="profile.homeVisits">Home Visits</span>
                </span>
              ` : ''}
              
              ${provider.available24_7 ? `
                <span class="provider-card-badge badge-danger">
                  <i class="bi bi-clock"></i>
                  <span data-i18n="profile.emergency">24/7</span>
                </span>
              ` : ''}
            </div>
            
            ${provider.address?.street ? `
              <p class="mb-2">
                <i class="bi bi-geo-alt"></i> ${provider.address.street}
              </p>
            ` : ''}
            
            ${provider.phone ? `
              <p class="mb-2">
                <i class="bi bi-telephone"></i> ${provider.phone}
              </p>
            ` : ''}
            
            <div class="mt-3">
              <button class="btn btn-primary btn-sm view-profile-btn" data-provider-id="${provider.id}">
                <i class="bi bi-eye"></i> View Profile
              </button>
              <button class="btn btn-outline-primary btn-sm favorite-btn ms-2" data-provider-id="${provider.id}">
                <i class="bi bi-heart"></i> Favorite
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    const viewBtn = card.querySelector('.view-profile-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
        this.viewProviderProfile(provider.id);
      });
    }

    const favoriteBtn = card.querySelector('.favorite-btn');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', () => {
        this.toggleFavorite(provider.id);
      });
    }

    // Make card clickable
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      // Don't navigate if clicking on buttons
      if (!e.target.closest('button')) {
        this.viewProviderProfile(provider.id);
      }
    });

    return card;
  }

  /**
   * Get localized field value
   * @param {Object} provider - Provider object
   * @param {string} field - Field name
   * @param {string} lang - Language code
   * @returns {string} - Localized value
   */
  getLocalizedField(provider, field, lang) {
    if (lang === 'ar' && provider[`${field}Ar`]) {
      return provider[`${field}Ar`];
    }
    if (lang === 'fr' && provider[`${field}Fr`]) {
      return provider[`${field}Fr`];
    }
    return provider[field] || '';
  }

  /**
   * Get service type name in current language
   * @param {string} type - Service type code
   * @param {string} lang - Language code
   * @returns {string} - Localized service type name
   */
  getServiceTypeName(type, lang) {
    const names = {
      clinic: { en: 'Clinic', fr: 'Clinique', ar: 'عيادة' },
      hospital: { en: 'Hospital', fr: 'Hôpital', ar: 'مستشفى' },
      doctor: { en: 'Doctor', fr: 'Médecin', ar: 'طبيب' },
      pharmacy: { en: 'Pharmacy', fr: 'Pharmacie', ar: 'صيدلية' },
      lab: { en: 'Laboratory', fr: 'Laboratoire', ar: 'مختبر' }
    };

    return names[type]?.[lang] || type;
  }

  /**
   * Show empty state when no results found
   */
  showEmptyState() {
    if (!this.resultsContainer) return;

    const currentLang = window.i18n?.getCurrentLanguage() || 'en';
    const noResultsText = window.i18n?.translate('search.noResults') || 'No results found. Try different search terms.';

    this.resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="bi bi-search"></i>
        </div>
        <h3 class="empty-state-title">No Results Found</h3>
        <p class="empty-state-description">${noResultsText}</p>
        <button class="btn btn-primary" onclick="window.searchBar?.clear()">
          Clear Search
        </button>
      </div>
    `;
  }

  /**
   * Update results count display
   * @param {number} count - Number of results
   */
  updateResultsCount(count) {
    if (!this.resultsCount) return;

    const currentLang = window.i18n?.getCurrentLanguage() || 'en';
    const resultsText = window.i18n?.translate('search.resultsCount') || 'results found';

    this.resultsCount.textContent = `${count} ${resultsText}`;
  }

  /**
   * Update pagination controls
   * @param {boolean} hasMore - Whether there are more results
   */
  updatePagination(hasMore) {
    if (!this.paginationContainer) return;

    // Clear previous pagination
    this.paginationContainer.innerHTML = '';

    if (!hasMore && this.currentPage === 1) {
      return; // No pagination needed
    }

    const pagination = document.createElement('nav');
    pagination.setAttribute('aria-label', 'Search results pagination');

    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';

    // Previous button
    if (this.currentPage > 1) {
      const prevLi = document.createElement('li');
      prevLi.className = 'page-item';
      prevLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Previous">
          <span aria-hidden="true">&laquo;</span>
        </a>
      `;
      prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadPage(this.currentPage - 1);
      });
      ul.appendChild(prevLi);
    }

    // Current page
    const currentLi = document.createElement('li');
    currentLi.className = 'page-item active';
    currentLi.innerHTML = `<span class="page-link">${this.currentPage}</span>`;
    ul.appendChild(currentLi);

    // Next button
    if (hasMore) {
      const nextLi = document.createElement('li');
      nextLi.className = 'page-item';
      nextLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Next">
          <span aria-hidden="true">&raquo;</span>
        </a>
      `;
      nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadPage(this.currentPage + 1);
      });
      ul.appendChild(nextLi);
    }

    pagination.appendChild(ul);
    this.paginationContainer.appendChild(pagination);
  }

  /**
   * Load specific page of results
   * @param {number} page - Page number
   */
  async loadPage(page) {
    this.currentPage = page;

    const savedSearch = sessionStorage.getItem('currentSearch');
    if (savedSearch) {
      const params = JSON.parse(savedSearch);
      params.page = page;
      await this.performSearch(params);
    }

    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * View provider profile
   * @param {string} providerId - Provider ID
   */
  viewProviderProfile(providerId) {
    // Navigate to profile page
    if (window.router) {
      window.router.navigate(`/profile/${providerId}`);
    } else {
      window.location.href = `pages/profile.html?id=${providerId}`;
    }
  }

  /**
   * Toggle favorite status for provider
   * @param {string} providerId - Provider ID
   */
  async toggleFavorite(providerId) {
    // Check if user is authenticated
    if (!window.auth || !window.auth.currentUser) {
      // Show login prompt
      alert('Please sign in to add favorites');
      if (window.router) {
        window.router.navigate('/auth');
      }
      return;
    }

    try {
      // TODO: Implement favorite toggle logic
      console.log('Toggle favorite for provider:', providerId);
      
      // Show success message
      this.showSuccess('Added to favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      this.showError('Failed to update favorites');
    }
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'block';
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'none';
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    // TODO: Implement proper error notification
    console.error(message);
    alert(message);
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    // TODO: Implement proper success notification
    console.log(message);
  }
}

// Create and export search results instance
const searchResults = new SearchResults();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = searchResults;
}

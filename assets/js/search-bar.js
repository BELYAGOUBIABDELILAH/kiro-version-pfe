/**
 * Search Bar Component Module
 * Handles search bar interactions, autocomplete, and form submission
 */

class SearchBar {
  constructor() {
    this.searchForm = null;
    this.searchQueryInput = null;
    this.serviceTypeSelect = null;
    this.locationSelect = null;
    this.autocompleteDropdown = null;
    this.autocompleteList = null;
    this.debounceTimer = null;
    this.debounceDelay = 300;
    this.serviceTypes = [];
    this.cities = [];
    
    this.init();
  }

  /**
   * Initialize search bar component
   */
  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      await this.setup();
    }
  }

  /**
   * Setup search bar elements and event listeners
   */
  async setup() {
    // Get DOM elements
    this.searchForm = document.getElementById('search-form');
    this.searchQueryInput = document.getElementById('search-query');
    this.serviceTypeSelect = document.getElementById('service-type');
    this.locationSelect = document.getElementById('location');
    this.autocompleteDropdown = document.getElementById('autocomplete-dropdown');
    this.autocompleteList = document.getElementById('autocomplete-list');

    if (!this.searchForm) {
      console.warn('Search form not found on page');
      return;
    }

    // Load service types and cities
    await this.loadServiceTypes();
    await this.loadCities();

    // Attach event listeners
    this.attachEventListeners();

    // Load saved search from session storage
    this.loadSavedSearch();
  }

  /**
   * Attach event listeners to search bar elements
   */
  attachEventListeners() {
    // Form submission
    if (this.searchForm) {
      this.searchForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Debounced search query input
    if (this.searchQueryInput) {
      this.searchQueryInput.addEventListener('input', (e) => {
        this.handleQueryInput(e);
      });

      // Hide autocomplete on blur (with delay for click handling)
      this.searchQueryInput.addEventListener('blur', () => {
        setTimeout(() => this.hideAutocomplete(), 200);
      });

      // Show autocomplete on focus if there's text
      this.searchQueryInput.addEventListener('focus', () => {
        if (this.searchQueryInput.value.trim()) {
          this.handleQueryInput({ target: this.searchQueryInput });
        }
      });
    }

    // Service type change
    if (this.serviceTypeSelect) {
      this.serviceTypeSelect.addEventListener('change', () => {
        this.saveCurrentSearch();
      });
    }

    // Location change
    if (this.locationSelect) {
      this.locationSelect.addEventListener('change', () => {
        this.saveCurrentSearch();
      });
    }

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.searchForm?.contains(e.target)) {
        this.hideAutocomplete();
      }
    });

    // Listen for language changes to update options
    window.addEventListener('language-change', () => {
      this.updateTranslations();
    });
  }

  /**
   * Handle search query input with debouncing
   * @param {Event} event - Input event
   */
  handleQueryInput(event) {
    const query = event.target.value.trim();

    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Hide autocomplete if query is empty
    if (!query) {
      this.hideAutocomplete();
      return;
    }

    // Debounce autocomplete
    this.debounceTimer = setTimeout(() => {
      this.showAutocomplete(query);
    }, this.debounceDelay);
  }

  /**
   * Show autocomplete suggestions
   * @param {string} query - Search query
   */
  async showAutocomplete(query) {
    if (!this.autocompleteList || !this.autocompleteDropdown) return;

    try {
      // Get suggestions based on query
      const suggestions = await this.getAutocompleteSuggestions(query);

      // Clear previous suggestions
      this.autocompleteList.innerHTML = '';

      if (suggestions.length === 0) {
        this.hideAutocomplete();
        return;
      }

      // Create suggestion items
      suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.className = 'autocomplete-item';
        li.innerHTML = this.highlightMatch(suggestion.text, query);
        li.setAttribute('role', 'option');
        li.setAttribute('tabindex', '0');
        
        // Click handler
        li.addEventListener('click', () => {
          this.selectSuggestion(suggestion);
        });

        // Keyboard handler
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.selectSuggestion(suggestion);
          }
        });

        this.autocompleteList.appendChild(li);
      });

      // Show dropdown
      this.autocompleteDropdown.style.display = 'block';
      this.autocompleteList.setAttribute('role', 'listbox');
    } catch (error) {
      console.error('Autocomplete error:', error);
      this.hideAutocomplete();
    }
  }

  /**
   * Get autocomplete suggestions based on query
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Suggestions array
   */
  async getAutocompleteSuggestions(query) {
    const suggestions = [];
    const lowerQuery = query.toLowerCase();

    // Get current language
    const currentLang = window.i18n?.getCurrentLanguage() || 'en';

    // Service type suggestions
    const serviceTypeSuggestions = this.serviceTypes
      .filter(type => {
        const typeName = this.getServiceTypeName(type, currentLang).toLowerCase();
        return typeName.includes(lowerQuery);
      })
      .map(type => ({
        type: 'serviceType',
        value: type,
        text: this.getServiceTypeName(type, currentLang),
        icon: 'bi-hospital'
      }));

    suggestions.push(...serviceTypeSuggestions);

    // City suggestions
    const citySuggestions = this.cities
      .filter(city => city.toLowerCase().includes(lowerQuery))
      .map(city => ({
        type: 'location',
        value: city,
        text: city,
        icon: 'bi-geo-alt'
      }));

    suggestions.push(...citySuggestions);

    // Common search terms (specialty suggestions)
    const specialties = [
      'Cardiology', 'Dermatology', 'Pediatrics', 'Dentistry', 
      'Orthopedics', 'Ophthalmology', 'General Medicine'
    ];

    const specialtySuggestions = specialties
      .filter(specialty => specialty.toLowerCase().includes(lowerQuery))
      .map(specialty => ({
        type: 'specialty',
        value: specialty,
        text: specialty,
        icon: 'bi-heart-pulse'
      }));

    suggestions.push(...specialtySuggestions);

    // Limit to 8 suggestions
    return suggestions.slice(0, 8);
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
   * Highlight matching text in suggestion
   * @param {string} text - Suggestion text
   * @param {string} query - Search query
   * @returns {string} - HTML with highlighted match
   */
  highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
  }

  /**
   * Select an autocomplete suggestion
   * @param {Object} suggestion - Selected suggestion
   */
  selectSuggestion(suggestion) {
    if (suggestion.type === 'serviceType') {
      this.serviceTypeSelect.value = suggestion.value;
      this.searchQueryInput.value = '';
    } else if (suggestion.type === 'location') {
      this.locationSelect.value = suggestion.value;
      this.searchQueryInput.value = '';
    } else if (suggestion.type === 'specialty') {
      this.searchQueryInput.value = suggestion.value;
    }

    this.hideAutocomplete();
    this.saveCurrentSearch();
    
    // Trigger search
    this.searchForm.dispatchEvent(new Event('submit'));
  }

  /**
   * Hide autocomplete dropdown
   */
  hideAutocomplete() {
    if (this.autocompleteDropdown) {
      this.autocompleteDropdown.style.display = 'none';
    }
  }

  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  async handleSubmit(event) {
    event.preventDefault();

    // Get search parameters
    const searchParams = this.getSearchParams();

    // Save search to history
    if (window.search) {
      window.search.saveSearchHistory(searchParams);
    }

    // Save current search to session
    this.saveCurrentSearch();

    // Dispatch custom event for search
    window.dispatchEvent(new CustomEvent('search-submit', {
      detail: searchParams
    }));

    // Navigate to search results page if not already there
    const currentPath = window.location.pathname;
    if (!currentPath.includes('search-results')) {
      // Store search params in session storage
      sessionStorage.setItem('currentSearch', JSON.stringify(searchParams));
      
      // Navigate to search results
      if (window.router) {
        window.router.navigate('/search-results');
      } else {
        window.location.href = 'pages/search-results.html';
      }
    }
  }

  /**
   * Get current search parameters
   * @returns {Object} - Search parameters
   */
  getSearchParams() {
    return {
      query: this.searchQueryInput?.value.trim() || '',
      serviceType: this.serviceTypeSelect?.value || 'all',
      location: this.locationSelect?.value || 'all',
      filters: {}
    };
  }

  /**
   * Set search parameters
   * @param {Object} params - Search parameters
   */
  setSearchParams(params) {
    if (this.searchQueryInput && params.query !== undefined) {
      this.searchQueryInput.value = params.query;
    }
    if (this.serviceTypeSelect && params.serviceType) {
      this.serviceTypeSelect.value = params.serviceType;
    }
    if (this.locationSelect && params.location) {
      this.locationSelect.value = params.location;
    }
  }

  /**
   * Save current search to session storage
   */
  saveCurrentSearch() {
    try {
      const params = this.getSearchParams();
      sessionStorage.setItem('currentSearch', JSON.stringify(params));
    } catch (error) {
      console.error('Error saving search:', error);
    }
  }

  /**
   * Load saved search from session storage
   */
  loadSavedSearch() {
    try {
      const saved = sessionStorage.getItem('currentSearch');
      if (saved) {
        const params = JSON.parse(saved);
        this.setSearchParams(params);
      }
    } catch (error) {
      console.error('Error loading saved search:', error);
    }
  }

  /**
   * Load service types from search module
   */
  async loadServiceTypes() {
    try {
      if (window.search) {
        this.serviceTypes = await window.search.getServiceTypes();
        this.updateServiceTypeOptions();
      }
    } catch (error) {
      console.error('Error loading service types:', error);
      this.serviceTypes = ['clinic', 'hospital', 'doctor', 'pharmacy', 'lab'];
    }
  }

  /**
   * Load cities from search module
   */
  async loadCities() {
    try {
      if (window.search) {
        this.cities = await window.search.getCities();
        this.updateLocationOptions();
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      this.cities = ['Sidi Bel Abbès'];
    }
  }

  /**
   * Update service type select options
   */
  updateServiceTypeOptions() {
    if (!this.serviceTypeSelect) return;

    const currentValue = this.serviceTypeSelect.value;
    const currentLang = window.i18n?.getCurrentLanguage() || 'en';

    // Keep the "All Types" option and add loaded types
    const allOption = this.serviceTypeSelect.querySelector('option[value="all"]');
    this.serviceTypeSelect.innerHTML = '';
    
    if (allOption) {
      this.serviceTypeSelect.appendChild(allOption);
    }

    this.serviceTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = this.getServiceTypeName(type, currentLang);
      this.serviceTypeSelect.appendChild(option);
    });

    // Restore previous value if it exists
    if (currentValue && this.serviceTypes.includes(currentValue)) {
      this.serviceTypeSelect.value = currentValue;
    }
  }

  /**
   * Update location select options
   */
  updateLocationOptions() {
    if (!this.locationSelect) return;

    const currentValue = this.locationSelect.value;

    // Keep the "All Locations" option and add loaded cities
    const allOption = this.locationSelect.querySelector('option[value="all"]');
    this.locationSelect.innerHTML = '';
    
    if (allOption) {
      this.locationSelect.appendChild(allOption);
    }

    this.cities.forEach(city => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      this.locationSelect.appendChild(option);
    });

    // Restore previous value if it exists
    if (currentValue && this.cities.includes(currentValue)) {
      this.locationSelect.value = currentValue;
    }
  }

  /**
   * Update translations when language changes
   */
  updateTranslations() {
    // Re-translate form elements
    if (window.i18n) {
      window.i18n.translatePage();
    }

    // Update service type options with new language
    this.updateServiceTypeOptions();
  }

  /**
   * Clear search form
   */
  clear() {
    if (this.searchQueryInput) this.searchQueryInput.value = '';
    if (this.serviceTypeSelect) this.serviceTypeSelect.value = 'all';
    if (this.locationSelect) this.locationSelect.value = 'all';
    this.hideAutocomplete();
    sessionStorage.removeItem('currentSearch');
  }
}

// Create and export search bar instance
const searchBar = new SearchBar();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = searchBar;
}

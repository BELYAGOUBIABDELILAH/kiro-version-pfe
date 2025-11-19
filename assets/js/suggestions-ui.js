/**
 * Suggestions UI Module
 * Handles rendering and interaction with smart suggestion cards
 */

class SuggestionsUI {
  constructor() {
    this.suggestions = window.suggestions;
    this.i18n = window.i18n;
  }

  /**
   * Render suggestions in a container
   * @param {string} containerId - Container element ID
   * @param {Object} context - User context for suggestions
   */
  async renderSuggestions(containerId, context = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container ${containerId} not found`);
      return;
    }

    try {
      // Show loading state
      container.innerHTML = this.getLoadingHTML();

      // Get suggestions
      const suggestionsList = await this.suggestions.getSuggestions(context);

      // Render suggestions
      if (suggestionsList.length === 0) {
        container.innerHTML = '';
        return;
      }

      container.innerHTML = this.getSuggestionsHTML(suggestionsList);

      // Attach event listeners
      this.attachEventListeners(container);

    } catch (error) {
      console.error('Error rendering suggestions:', error);
      container.innerHTML = '';
    }
  }

  /**
   * Get HTML for suggestions section
   * @param {Array} suggestionsList - List of suggestions
   * @returns {string} - HTML string
   */
  getSuggestionsHTML(suggestionsList) {
    const title = this.i18n ? this.i18n.translate('suggestions.title') : 'Suggested for You';
    const subtitle = this.i18n ? this.i18n.translate('suggestions.subtitle') : 'Based on your activity and preferences';

    return `
      <div class="suggestions-header">
        <h2 class="mb-2">${title}</h2>
        <p class="text-muted">${subtitle}</p>
      </div>
      <div class="row g-3">
        ${suggestionsList.map(provider => this.getSuggestionCardHTML(provider)).join('')}
      </div>
    `;
  }

  /**
   * Get HTML for a single suggestion card
   * @param {Object} provider - Provider data
   * @returns {string} - HTML string
   */
  getSuggestionCardHTML(provider) {
    const viewText = this.i18n ? this.i18n.translate('suggestions.view') : 'View Profile';
    const dismissText = this.i18n ? this.i18n.translate('suggestions.dismiss') : 'Dismiss';

    // Get provider image or placeholder
    const imageHTML = provider.images && provider.images.length > 0
      ? `<img src="${provider.images[0]}" alt="${provider.name}" class="suggestion-card-image" loading="lazy">`
      : `<div class="suggestion-card-image-placeholder">
           <i class="bi bi-building"></i>
         </div>`;

    // Get provider name based on current language
    const providerName = this.getLocalizedName(provider);
    const providerSpecialty = this.getLocalizedSpecialty(provider);

    // Build badges
    const badges = [];
    if (provider.verified) {
      badges.push(`<span class="badge badge-success"><i class="bi bi-patch-check-fill"></i> Verified</span>`);
    }
    if (provider.accessibility) {
      badges.push(`<span class="badge badge-info"><i class="bi bi-universal-access"></i> Accessible</span>`);
    }
    if (provider.homeVisits) {
      badges.push(`<span class="badge badge-info"><i class="bi bi-house-fill"></i> Home Visits</span>`);
    }
    if (provider.available24_7) {
      badges.push(`<span class="badge badge-danger"><i class="bi bi-clock-fill"></i> 24/7</span>`);
    }

    return `
      <div class="col-lg-3 col-md-4 col-sm-6">
        <div class="suggestion-card" data-provider-id="${provider.id}">
          <div class="suggestion-card-inner">
            <button 
              class="suggestion-dismiss-btn" 
              data-provider-id="${provider.id}"
              aria-label="${dismissText}"
              title="${dismissText}">
              <i class="bi bi-x"></i>
            </button>
            ${imageHTML}
            <div class="suggestion-card-content">
              <h3 class="suggestion-card-title">${providerName}</h3>
              ${providerSpecialty ? `<p class="suggestion-card-specialty">${providerSpecialty}</p>` : ''}
              <div class="suggestion-card-badges mb-2">
                ${badges.join('')}
              </div>
              ${provider.rating ? `
                <div class="mb-2">
                  <i class="bi bi-star-fill text-warning"></i>
                  <span class="text-muted">${provider.rating.toFixed(1)}</span>
                </div>
              ` : ''}
              ${provider.reason ? `
                <p class="suggestion-reason">
                  <i class="${provider.reasonIcon || 'bi-lightbulb-fill'}"></i>
                  ${provider.reason}
                </p>
              ` : ''}
              <button 
                class="btn btn-primary btn-sm w-100 view-suggestion-btn" 
                data-provider-id="${provider.id}">
                ${viewText}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get loading HTML
   * @returns {string} - Loading HTML
   */
  getLoadingHTML() {
    return `
      <div class="text-center py-4">
        <div class="spinner"></div>
        <p class="text-muted mt-2">Loading suggestions...</p>
      </div>
    `;
  }

  /**
   * Get localized provider name
   * @param {Object} provider - Provider data
   * @returns {string} - Localized name
   */
  getLocalizedName(provider) {
    if (!this.i18n) return provider.name;

    const lang = this.i18n.getCurrentLanguage();
    if (lang === 'ar' && provider.nameAr) return provider.nameAr;
    if (lang === 'fr' && provider.nameFr) return provider.nameFr;
    return provider.name;
  }

  /**
   * Get localized provider specialty
   * @param {Object} provider - Provider data
   * @returns {string} - Localized specialty
   */
  getLocalizedSpecialty(provider) {
    if (!this.i18n) return provider.specialty || '';

    const lang = this.i18n.getCurrentLanguage();
    if (lang === 'ar' && provider.specialtyAr) return provider.specialtyAr;
    if (lang === 'fr' && provider.specialtyFr) return provider.specialtyFr;
    return provider.specialty || '';
  }

  /**
   * Attach event listeners to suggestion cards
   * @param {HTMLElement} container - Container element
   */
  attachEventListeners(container) {
    // View profile buttons
    const viewButtons = container.querySelectorAll('.view-suggestion-btn');
    viewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const providerId = button.dataset.providerId;
        this.handleViewProvider(providerId);
      });
    });

    // Dismiss buttons
    const dismissButtons = container.querySelectorAll('.suggestion-dismiss-btn');
    dismissButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const providerId = button.dataset.providerId;
        this.handleDismissSuggestion(providerId, button);
      });
    });

    // Card click (navigate to profile)
    const cards = container.querySelectorAll('.suggestion-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on buttons
        if (e.target.closest('button')) return;
        
        const providerId = card.dataset.providerId;
        this.handleViewProvider(providerId);
      });
    });
  }

  /**
   * Handle view provider action
   * @param {string} providerId - Provider ID
   */
  handleViewProvider(providerId) {
    // Track interaction
    if (this.suggestions) {
      this.suggestions.trackInteraction(providerId, 'viewed');
    }

    // Navigate to provider profile
    if (window.router) {
      window.router.navigate(`/profile/${providerId}`);
    } else {
      window.location.href = `/profile.html?id=${providerId}`;
    }
  }

  /**
   * Handle dismiss suggestion action
   * @param {string} providerId - Provider ID
   * @param {HTMLElement} button - Dismiss button element
   */
  handleDismissSuggestion(providerId, button) {
    // Dismiss the suggestion
    if (this.suggestions) {
      this.suggestions.dismissSuggestion(providerId);
    }

    // Animate and remove the card
    const card = button.closest('.col-lg-3, .col-md-4, .col-sm-6');
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
      
      setTimeout(() => {
        card.remove();
        
        // Check if there are any suggestions left
        const container = button.closest('.row');
        if (container && container.querySelectorAll('.suggestion-card').length === 0) {
          const suggestionsSection = container.closest('.suggestions-section');
          if (suggestionsSection) {
            suggestionsSection.innerHTML = '';
          }
        }
      }, 300);
    }
  }

  /**
   * Update suggestions dynamically
   * @param {string} containerId - Container element ID
   * @param {Object} context - Updated context
   */
  async updateSuggestions(containerId, context = {}) {
    await this.renderSuggestions(containerId, context);
  }
}

// Create and export instance
const suggestionsUI = new SuggestionsUI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = suggestionsUI;
}


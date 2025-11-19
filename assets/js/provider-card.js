/**
 * Provider Card Component Module
 * Creates and manages provider card components
 * Requirements: 1.3, 2.3, 3.5
 */

class ProviderCard {
  /**
   * Create a provider card element
   * @param {Object} provider - Provider data object
   * @param {boolean} showFavorite - Whether to show favorite button
   * @returns {HTMLElement} - Provider card element
   */
  static create(provider, showFavorite = true) {
    // Create card container
    const card = document.createElement('article');
    card.className = 'provider-card';
    card.setAttribute('data-provider-id', provider.id);
    card.setAttribute('role', 'article');
    card.setAttribute('tabindex', '0');
    
    // Create image wrapper
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'provider-card-image-wrapper';
    
    // Add image or placeholder
    if (provider.images && provider.images.length > 0) {
      const img = document.createElement('img');
      img.src = provider.images[0];
      img.alt = `${provider.name} - ${provider.type}`;
      img.className = 'provider-card-image';
      img.loading = 'lazy';
      imageWrapper.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'provider-card-image-placeholder';
      placeholder.innerHTML = '<i class="bi bi-building" aria-hidden="true"></i>';
      imageWrapper.appendChild(placeholder);
    }

    
    // Add verified badge overlay if verified
    if (provider.verified) {
      const verifiedBadge = document.createElement('div');
      verifiedBadge.className = 'verified-badge-overlay';
      verifiedBadge.innerHTML = `
        <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
        <span class="visually-hidden">Verified provider</span>
      `;
      imageWrapper.appendChild(verifiedBadge);
    }
    
    card.appendChild(imageWrapper);
    
    // Create content section
    const content = document.createElement('div');
    content.className = 'provider-card-content';
    
    // Header with title and rating
    const header = document.createElement('div');
    header.className = 'provider-card-header';
    
    const title = document.createElement('h3');
    title.className = 'provider-card-title';
    title.textContent = this.getLocalizedName(provider);
    header.appendChild(title);
    
    if (provider.rating) {
      const ratingDiv = document.createElement('div');
      ratingDiv.className = 'provider-card-rating';
      ratingDiv.innerHTML = `
        <i class="bi bi-star-fill" aria-hidden="true"></i>
        <span class="rating-value">${provider.rating.toFixed(1)}</span>
        <span class="visually-hidden">out of 5 stars</span>
      `;
      header.appendChild(ratingDiv);
    }
    
    content.appendChild(header);

    
    // Meta section with type and specialty
    const meta = document.createElement('div');
    meta.className = 'provider-card-meta';
    
    const typeBadge = document.createElement('span');
    typeBadge.className = 'provider-type-badge';
    typeBadge.innerHTML = `
      <i class="bi bi-building" aria-hidden="true"></i>
      <span class="provider-type">${this.getLocalizedType(provider.type)}</span>
    `;
    meta.appendChild(typeBadge);
    
    if (provider.specialty) {
      const specialty = document.createElement('span');
      specialty.className = 'provider-specialty';
      specialty.textContent = provider.specialty;
      meta.appendChild(specialty);
    }
    
    content.appendChild(meta);
    
    // Location
    const location = document.createElement('div');
    location.className = 'provider-card-location';
    location.innerHTML = `
      <i class="bi bi-geo-alt" aria-hidden="true"></i>
      <span class="provider-location">${this.getLocationString(provider)}</span>
    `;
    content.appendChild(location);
    
    // Feature badges
    const badges = document.createElement('div');
    badges.className = 'provider-card-badges';

    
    if (provider.accessibility) {
      const accessBadge = document.createElement('span');
      accessBadge.className = 'badge badge-success accessibility-badge';
      accessBadge.innerHTML = `
        <i class="bi bi-universal-access" aria-hidden="true"></i>
        <span data-i18n="provider.accessible">Accessible</span>
      `;
      badges.appendChild(accessBadge);
    }
    
    if (provider.homeVisits) {
      const homeVisitBadge = document.createElement('span');
      homeVisitBadge.className = 'badge badge-info home-visit-badge';
      homeVisitBadge.innerHTML = `
        <i class="bi bi-house" aria-hidden="true"></i>
        <span data-i18n="provider.homeVisits">Home Visits</span>
      `;
      badges.appendChild(homeVisitBadge);
    }
    
    if (provider.available24_7) {
      const emergencyBadge = document.createElement('span');
      emergencyBadge.className = 'badge badge-warning emergency-badge';
      emergencyBadge.innerHTML = `
        <i class="bi bi-lightning-fill" aria-hidden="true"></i>
        <span data-i18n="provider.emergency">24/7</span>
      `;
      badges.appendChild(emergencyBadge);
    }
    
    content.appendChild(badges);

    
    // Actions section
    const actions = document.createElement('div');
    actions.className = 'provider-card-actions';
    
    // View profile button
    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-primary btn-sm view-profile-btn';
    viewBtn.type = 'button';
    viewBtn.innerHTML = `
      <i class="bi bi-eye" aria-hidden="true"></i>
      <span data-i18n="provider.viewProfile">View Profile</span>
    `;
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.navigateToProfile(provider.id);
    });
    actions.appendChild(viewBtn);
    
    // Favorite button (if enabled)
    if (showFavorite) {
      const favoriteBtn = document.createElement('button');
      favoriteBtn.className = 'btn btn-outline-danger btn-sm favorite-btn';
      favoriteBtn.type = 'button';
      favoriteBtn.setAttribute('aria-label', 'Add to favorites');
      favoriteBtn.setAttribute('title', 'Add to favorites');
      favoriteBtn.innerHTML = `
        <i class="bi bi-heart" aria-hidden="true"></i>
        <span class="favorite-text visually-hidden" data-i18n="provider.favorite">Favorite</span>
      `;
      favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFavorite(provider.id, favoriteBtn);
      });
      actions.appendChild(favoriteBtn);
    }
    
    content.appendChild(actions);
    card.appendChild(content);

    
    // Make card clickable
    card.addEventListener('click', () => {
      this.navigateToProfile(provider.id);
    });
    
    // Keyboard navigation
    card.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.navigateToProfile(provider.id);
      }
    });
    
    // Translate if i18n is available
    if (window.i18n) {
      window.i18n.translateElement(card);
    }
    
    return card;
  }
  
  /**
   * Get localized provider name
   * @param {Object} provider - Provider object
   * @returns {string} - Localized name
   */
  static getLocalizedName(provider) {
    if (!window.i18n) return provider.name;
    
    const lang = window.i18n.getCurrentLanguage();
    
    if (lang === 'ar' && provider.nameAr) {
      return provider.nameAr;
    } else if (lang === 'fr' && provider.nameFr) {
      return provider.nameFr;
    }
    
    return provider.name;
  }

  
  /**
   * Get localized provider type
   * @param {string} type - Provider type
   * @returns {string} - Localized type
   */
  static getLocalizedType(type) {
    if (!window.i18n) return type;
    
    const typeKey = `provider.type.${type}`;
    return window.i18n.translate(typeKey);
  }
  
  /**
   * Get location string from provider
   * @param {Object} provider - Provider object
   * @returns {string} - Location string
   */
  static getLocationString(provider) {
    if (provider.address) {
      if (typeof provider.address === 'string') {
        return provider.address;
      } else if (provider.address.city) {
        return `${provider.address.street || ''}, ${provider.address.city}`.trim();
      }
    }
    return 'Location not specified';
  }
  
  /**
   * Navigate to provider profile
   * @param {string} providerId - Provider ID
   */
  static navigateToProfile(providerId) {
    if (window.router) {
      window.router.navigate(`/profile/${providerId}`);
    } else {
      window.location.href = `/profile.html?id=${providerId}`;
    }
  }

  
  /**
   * Toggle favorite status
   * @param {string} providerId - Provider ID
   * @param {HTMLElement} button - Favorite button element
   */
  static async toggleFavorite(providerId, button) {
    // Check if user is authenticated
    if (!window.authModule) {
      console.error('Auth module not loaded');
      return;
    }
    
    const user = await window.authModule.getCurrentUser();
    
    if (!user) {
      // Redirect to login
      if (window.router) {
        window.router.navigate('/auth');
      } else {
        window.location.href = '/auth.html';
      }
      return;
    }
    
    try {
      // Check if already favorited
      const isFavorited = button.classList.contains('favorited');
      
      // Update UI immediately
      if (isFavorited) {
        button.classList.remove('favorited');
        button.querySelector('i').classList.remove('bi-heart-fill');
        button.querySelector('i').classList.add('bi-heart');
        button.setAttribute('aria-label', 'Add to favorites');
      } else {
        button.classList.add('favorited');
        button.querySelector('i').classList.remove('bi-heart');
        button.querySelector('i').classList.add('bi-heart-fill');
        button.setAttribute('aria-label', 'Remove from favorites');
      }
      
      // Call profile module to update favorites
      if (window.profileModule && window.profileModule.toggleFavorite) {
        await window.profileModule.toggleFavorite(providerId);
      }
      
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorites. Please try again.');
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProviderCard;
}

window.ProviderCard = ProviderCard;

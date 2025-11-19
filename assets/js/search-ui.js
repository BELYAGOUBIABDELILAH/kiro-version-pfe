/**
 * Search UI Module
 * 
 * Handles rendering of search results and integration with ads
 * Requirements: 1.1, 1.3, 1.4, 11.4
 */

(function() {
  'use strict';

  /**
   * Render provider card HTML
   * @param {Object} provider - Provider data
   * @returns {string} HTML string
   */
  function renderProviderCard(provider) {
    const imageUrl = provider.images && provider.images.length > 0 
      ? provider.images[0] 
      : 'assets/images/default-provider.png';
    
    const providerType = provider.type || 'provider';
    const location = provider.city || provider.address?.city || 'Unknown';
    const specialty = provider.specialty || '';
    
    return `
      <div class="card provider-card mb-3 shadow-sm" data-provider-id="${provider.id}">
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <img src="${escapeHtml(imageUrl)}" 
                   class="img-fluid rounded" 
                   alt="${escapeHtml(provider.name)}"
                   style="max-height: 150px; object-fit: cover; width: 100%;">
            </div>
            <div class="col-md-9">
              <div class="d-flex justify-content-between align-items-start">
                <h5 class="card-title mb-2">
                  <a href="#/profile/${provider.id}" class="text-decoration-none">
                    ${escapeHtml(provider.name)}
                  </a>
                  ${provider.verified ? '<i class="bi bi-check-circle-fill text-primary ms-1" title="Verified"></i>' : ''}
                </h5>
                <button class="btn btn-sm btn-outline-danger favorite-btn" 
                        data-provider-id="${provider.id}"
                        title="Add to favorites">
                  <i class="bi bi-heart"></i>
                </button>
              </div>
              
              <div class="mb-2">
                <span class="badge bg-secondary me-1">
                  <i class="bi bi-building"></i> ${escapeHtml(providerType)}
                </span>
                ${specialty ? `<span class="badge bg-info me-1">${escapeHtml(specialty)}</span>` : ''}
                <span class="badge bg-light text-dark me-1">
                  <i class="bi bi-geo-alt"></i> ${escapeHtml(location)}
                </span>
                ${provider.accessibility ? '<span class="badge bg-success me-1"><i class="bi bi-universal-access"></i> Accessible</span>' : ''}
                ${provider.homeVisits ? '<span class="badge bg-warning text-dark me-1"><i class="bi bi-house"></i> Home Visits</span>' : ''}
                ${provider.available24_7 ? '<span class="badge bg-danger me-1"><i class="bi bi-clock"></i> 24/7</span>' : ''}
              </div>
              
              ${provider.phone ? `<p class="mb-1"><i class="bi bi-telephone"></i> ${escapeHtml(provider.phone)}</p>` : ''}
              ${provider.address?.street ? `<p class="mb-1 text-muted"><i class="bi bi-map"></i> ${escapeHtml(provider.address.street)}</p>` : ''}
              
              ${provider.rating ? `
                <div class="mb-2">
                  <span class="text-warning">
                    ${'★'.repeat(Math.floor(provider.rating))}${'☆'.repeat(5 - Math.floor(provider.rating))}
                  </span>
                  <span class="text-muted ms-1">(${provider.rating.toFixed(1)})</span>
                </div>
              ` : ''}
              
              <a href="#/profile/${provider.id}" class="btn btn-primary btn-sm">
                View Profile <i class="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render search results with ads injected
   * @param {Array} providers - Array of provider objects
   * @param {string} containerId - ID of container element
   */
  async function renderSearchResults(providers, containerId = 'results-container') {
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error('Results container not found');
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    if (!providers || providers.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info" role="alert">
          <h4 class="alert-heading">No results found</h4>
          <p>Try adjusting your search criteria or filters.</p>
        </div>
      `;
      return;
    }
    
    // Render provider cards
    providers.forEach(provider => {
      const cardHtml = renderProviderCard(provider);
      container.insertAdjacentHTML('beforeend', cardHtml);
    });
    
    // Attach favorite button event listeners
    attachFavoriteListeners(container);
    
    // Dispatch event for ad injection
    const event = new CustomEvent('searchResultsRendered', {
      detail: {
        providerCount: providers.length,
        containerId: containerId
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Attach event listeners to favorite buttons
   * @param {HTMLElement} container - Container element
   */
  function attachFavoriteListeners(container) {
    const favoriteButtons = container.querySelectorAll('.favorite-btn');
    
    favoriteButtons.forEach(button => {
      button.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const providerId = this.getAttribute('data-provider-id');
        
        if (!providerId) return;
        
        try {
          // Check if user is authenticated
          const user = await window.authModule.getCurrentUser();
          
          if (!user) {
            // Redirect to login
            if (window.router) {
              window.router.navigate('/auth');
            }
            return;
          }
          
          // Toggle favorite
          if (window.profileModule && window.profileModule.toggleFavorite) {
            await window.profileModule.toggleFavorite(providerId);
            
            // Update button state
            const icon = this.querySelector('i');
            if (icon.classList.contains('bi-heart')) {
              icon.classList.remove('bi-heart');
              icon.classList.add('bi-heart-fill');
              this.classList.remove('btn-outline-danger');
              this.classList.add('btn-danger');
            } else {
              icon.classList.remove('bi-heart-fill');
              icon.classList.add('bi-heart');
              this.classList.remove('btn-danger');
              this.classList.add('btn-outline-danger');
            }
          }
        } catch (error) {
          console.error('Error toggling favorite:', error);
          alert('Failed to update favorites. Please try again.');
        }
      });
    });
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Update results count display
   * @param {number} count - Number of results
   */
  function updateResultsCount(count) {
    const countElement = document.getElementById('results-count');
    if (countElement) {
      const lang = localStorage.getItem('language') || 'en';
      const text = count === 1 ? '1 result found' : `${count} results found`;
      countElement.textContent = text;
    }
  }

  // Export functions
  window.searchUI = {
    renderSearchResults,
    renderProviderCard,
    updateResultsCount
  };

})();

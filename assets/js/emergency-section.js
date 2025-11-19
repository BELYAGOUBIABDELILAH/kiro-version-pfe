/**
 * Emergency Section Module
 * Displays emergency providers on homepage and handles auto-updates
 */

class EmergencySection {
  constructor() {
    this.providers = [];
    this.updateInterval = null;
    this.updateFrequency = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Render emergency section in a container
   * @param {string} containerId - ID of container element
   * @param {Object} options - Rendering options
   */
  async render(containerId, options = {}) {
    const {
      limit = 5,
      autoUpdate = true
    } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    try {
      // Show loading state
      container.innerHTML = this.getLoadingHTML();

      // Wait for search module
      await this.waitForSearch();

      // Fetch emergency providers
      const allProviders = await search.getEmergencyProviders();
      this.providers = allProviders.slice(0, limit);

      // Render section
      if (this.providers.length === 0) {
        container.innerHTML = '';
        return;
      }

      container.innerHTML = this.getSectionHTML(this.providers);

      // Re-translate
      if (window.i18n && window.i18n.translatePage) {
        window.i18n.translatePage();
      }

      // Set up auto-update if enabled
      if (autoUpdate) {
        this.startAutoUpdate(containerId, options);
      }

      // Log analytics
      if (window.analytics) {
        analytics.logEvent('view_emergency_section', {
          location: 'homepage',
          provider_count: this.providers.length
        });
      }

    } catch (error) {
      console.error('Error rendering emergency section:', error);
      container.innerHTML = this.getErrorHTML();
    }
  }

  /**
   * Get loading HTML
   */
  getLoadingHTML() {
    return `
      <section class="emergency-section py-4">
        <div class="text-center">
          <div class="spinner-border text-danger" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Get error HTML
   */
  getErrorHTML() {
    return `
      <section class="emergency-section py-4">
        <div class="alert alert-warning" role="alert">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <span>Unable to load emergency services at this time.</span>
        </div>
      </section>
    `;
  }

  /**
   * Get section HTML
   */
  getSectionHTML(providers) {
    return `
      <section class="emergency-section py-4">
        <div class="emergency-header d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-1">
              <i class="bi bi-hospital text-danger me-2"></i>
              <span data-i18n="emergency.sectionTitle">Emergency Services</span>
            </h2>
            <p class="text-muted mb-0" data-i18n="emergency.subtitle">Healthcare providers available around the clock</p>
          </div>
          <a href="/emergency" data-route class="btn btn-outline-danger">
            <span data-i18n="emergency.viewAll">View All Emergency Services</span>
            <i class="bi bi-arrow-right ms-2"></i>
          </a>
        </div>

        <div class="row g-3">
          ${providers.map(provider => this.getProviderCardHTML(provider)).join('')}
        </div>
      </section>

      <style>
        .emergency-section {
          background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
          border-radius: 1rem;
          padding: 2rem;
          border: 2px solid #dc3545;
        }

        .emergency-provider-card-mini {
          border: 1px solid #dc3545;
          border-radius: 0.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
          background: white;
          height: 100%;
        }

        .emergency-provider-card-mini:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.15);
        }

        .emergency-badge-mini {
          background: #dc3545;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .emergency-call-btn-mini {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 600;
          transition: background 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .emergency-call-btn-mini:hover {
          background: #bb2d3b;
          color: white;
        }

        @media (max-width: 768px) {
          .emergency-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 1rem;
          }

          .emergency-header .btn {
            width: 100%;
          }
        }
      </style>
    `;
  }

  /**
   * Get provider card HTML
   */
  getProviderCardHTML(provider) {
    const currentLang = localStorage.getItem('language') || 'en';
    
    // Get localized name
    let name = provider.name || 'Unknown Provider';
    if (currentLang === 'ar' && provider.nameAr) {
      name = provider.nameAr;
    } else if (currentLang === 'fr' && provider.nameFr) {
      name = provider.nameFr;
    }

    // Get localized specialty
    let specialty = provider.specialty || '';
    if (currentLang === 'ar' && provider.specialtyAr) {
      specialty = provider.specialtyAr;
    } else if (currentLang === 'fr' && provider.specialtyFr) {
      specialty = provider.specialtyFr;
    }

    // Format phone
    const phone = provider.phone || '';
    const phoneDisplay = phone.replace(/\s/g, '');

    // Get address
    const city = provider.address?.city || provider.city || '';

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card emergency-provider-card-mini">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="emergency-badge-mini">
                <i class="bi bi-clock-fill"></i>
                <span>24/7</span>
              </span>
              ${provider.verified ? `
                <span class="badge bg-success">
                  <i class="bi bi-patch-check-fill"></i>
                </span>
              ` : ''}
            </div>

            <h5 class="card-title mb-2">${this.escapeHtml(name)}</h5>
            
            <div class="mb-2">
              <span class="badge bg-primary">${this.escapeHtml(provider.type || 'Provider')}</span>
              ${specialty ? `<span class="badge bg-secondary ms-1">${this.escapeHtml(specialty)}</span>` : ''}
            </div>

            ${city ? `
              <p class="text-muted small mb-2">
                <i class="bi bi-geo-alt-fill"></i>
                ${this.escapeHtml(city)}
              </p>
            ` : ''}

            <div class="d-flex gap-2 mt-3">
              ${phone ? `
                <a href="tel:${phoneDisplay}" class="emergency-call-btn-mini flex-grow-1 text-center">
                  <i class="bi bi-telephone-fill"></i>
                  <span data-i18n="emergency.callNow">Call</span>
                </a>
              ` : ''}
              <a href="/profile/${provider.id}" data-route class="btn btn-outline-primary btn-sm flex-grow-1">
                <span data-i18n="emergency.viewProfile">View</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Start auto-update interval
   */
  startAutoUpdate(containerId, options) {
    // Clear existing interval
    this.stopAutoUpdate();

    // Set up new interval
    this.updateInterval = setInterval(async () => {
      try {
        console.log('Auto-updating emergency section...');
        await this.render(containerId, { ...options, autoUpdate: false });
        
        // Restart auto-update
        this.startAutoUpdate(containerId, options);
      } catch (error) {
        console.error('Error auto-updating emergency section:', error);
      }
    }, this.updateFrequency);
  }

  /**
   * Stop auto-update interval
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Wait for search module to be available
   */
  waitForSearch() {
    return new Promise((resolve) => {
      if (window.search) {
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (window.search) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);
      }
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy the emergency section (cleanup)
   */
  destroy() {
    this.stopAutoUpdate();
    this.providers = [];
  }
}

// Create and export instance
const emergencySection = new EmergencySection();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = emergencySection;
}

// Make available globally
window.emergencySection = emergencySection;

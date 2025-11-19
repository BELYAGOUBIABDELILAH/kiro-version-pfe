/**
 * Homepage Module
 * Handles homepage-specific functionality including featured providers,
 * ads carousel, emergency section, and smart suggestions
 */

(function() {
  'use strict';

  const homepage = {
    /**
     * Initialize homepage components with performance optimization
     */
    async init() {
      try {
        // Preload critical resources
        this.preloadCriticalResources();

        // Use optimized loading strategy
        this.optimizeInitialLoad();
        
        // Apply image optimizations
        this.optimizeImages();
        
        console.log('Homepage initialized successfully');
      } catch (error) {
        console.error('Error initializing homepage:', error);
      }
    },

    /**
     * Load search bar component
     */
    async loadSearchBar() {
      try {
        const container = document.getElementById('search-bar-container');
        if (!container) return;

        const response = await fetch('/components/search-bar.html');
        if (!response.ok) throw new Error('Failed to load search bar');
        
        const html = await response.text();
        container.innerHTML = html;
        
        // Initialize search functionality
        if (window.searchUI && window.searchUI.initSearchBar) {
          window.searchUI.initSearchBar();
        }
      } catch (error) {
        console.error('Error loading search bar:', error);
      }
    },


    /**
     * Load emergency section with caching
     */
    async loadEmergencySection() {
      try {
        if (window.emergencySection && window.db) {
          // Check cache first (3 minutes for emergency data - shorter cache for critical info)
          const cacheKey = 'homepage_emergency_providers';
          const cached = this.getFromCache(cacheKey, 3 * 60 * 1000);
          
          if (cached) {
            console.log('[Homepage] Using cached emergency providers');
          }
          
          window.emergencySection.render('emergency-section', {
            limit: 5,
            autoUpdate: false, // Disable auto-update to reduce Firebase queries
            cache: cached
          });
        } else {
          setTimeout(() => this.loadEmergencySection(), 100);
        }
      } catch (error) {
        console.error('Error loading emergency section:', error);
      }
    },

    /**
     * Load featured providers with caching
     */
    async loadFeaturedProviders() {
      try {
        const container = document.getElementById('featured-providers');
        if (!container) return;

        // Show loading state
        container.innerHTML = this.getLoadingHTML(3);

        // Wait for search module
        if (!window.search || !window.db) {
          setTimeout(() => this.loadFeaturedProviders(), 100);
          return;
        }

        // Check cache first (10 minutes for better performance)
        const cacheKey = 'homepage_featured_providers';
        const cached = this.getFromCache(cacheKey, 10 * 60 * 1000);
        
        let providers;
        if (cached) {
          providers = cached;
          console.log('[Homepage] Using cached featured providers');
        } else {
          // Get top-rated providers (limit to 6 to minimize query)
          providers = await window.search.getPopularProviders(6);
          this.saveToCache(cacheKey, providers);
          console.log('[Homepage] Fetched and cached featured providers');
        }

        if (providers.length === 0) {
          container.innerHTML = `
            <div class="col-12 text-center">
              <p class="text-muted" data-i18n="home.noFeaturedProviders">No featured providers available at the moment.</p>
            </div>
          `;
          return;
        }

        // Render provider cards
        container.innerHTML = '';
        providers.forEach(provider => {
          const card = this.createProviderCard(provider);
          container.appendChild(card);
        });

      } catch (error) {
        console.error('Error loading featured providers:', error);
        const container = document.getElementById('featured-providers');
        if (container) {
          container.innerHTML = `
            <div class="col-12 text-center">
              <p class="text-danger">Failed to load featured providers.</p>
            </div>
          `;
        }
      }
    },

    /**
     * Create provider card element
     */
    createProviderCard(provider) {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-4';

      const card = document.createElement('div');
      card.className = 'card h-100 provider-card';
      card.style.cursor = 'pointer';
      card.setAttribute('role', 'article');
      card.setAttribute('aria-label', `Provider: ${provider.name}`);

      // Card image
      const imageUrl = provider.images && provider.images.length > 0 
        ? provider.images[0] 
        : '/assets/images/placeholder-provider.png';

      card.innerHTML = `
        <img src="${this.escapeHtml(imageUrl)}" 
             class="card-img-top" 
             alt="${this.escapeHtml(provider.name)}"
             style="height: 200px; object-fit: cover;"
             loading="lazy">
        <div class="card-body">
          <h3 class="card-title h5">${this.escapeHtml(provider.name)}</h3>
          <p class="card-text text-muted mb-2">
            <i class="bi bi-hospital" aria-hidden="true"></i> 
            ${this.escapeHtml(provider.type || 'Healthcare Provider')}
          </p>
          <p class="card-text text-muted mb-2">
            <i class="bi bi-geo-alt" aria-hidden="true"></i> 
            ${this.escapeHtml(provider.city || provider.address?.city || 'Sidi Bel Abbès')}
          </p>
          ${provider.rating ? `
            <p class="card-text mb-2">
              <i class="bi bi-star-fill text-warning" aria-hidden="true"></i> 
              ${provider.rating.toFixed(1)}
            </p>
          ` : ''}
          <div class="d-flex gap-2 flex-wrap">
            ${provider.verified ? '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Verified</span>' : ''}
            ${provider.accessibility ? '<span class="badge bg-info"><i class="bi bi-universal-access"></i> Accessible</span>' : ''}
            ${provider.homeVisits ? '<span class="badge bg-primary"><i class="bi bi-house"></i> Home Visits</span>' : ''}
          </div>
        </div>
      `;

      // Make card clickable
      card.addEventListener('click', () => {
        if (window.router) {
          window.router.navigate(`/profile/${provider.id}`);
        }
      });

      // Add keyboard support
      card.setAttribute('tabindex', '0');
      card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (window.router) {
            window.router.navigate(`/profile/${provider.id}`);
          }
        }
      });

      col.appendChild(card);
      return col;
    },

    /**
     * Load medical ads carousel with caching
     */
    async loadMedicalAds() {
      try {
        // Wait for adsModule to be available
        if (!window.adsModule) {
          setTimeout(() => this.loadMedicalAds(), 100);
          return;
        }

        const section = document.getElementById('medical-ads-section');
        const carouselContent = document.getElementById('medical-ads-carousel-content');

        if (!section || !carouselContent) return;

        // Check cache first (15 minutes)
        const cacheKey = 'homepage_medical_ads';
        const cached = this.getFromCache(cacheKey, 15 * 60 * 1000);
        
        let ads;
        if (cached) {
          ads = cached;
          console.log('[Homepage] Using cached medical ads');
        } else {
          ads = await window.adsModule.getApprovedAds(['homepage']);
          this.saveToCache(cacheKey, ads);
          console.log('[Homepage] Fetched and cached medical ads');
        }

        if (ads.length === 0) {
          section.style.display = 'none';
          return;
        }

        // Show section
        section.style.display = 'block';

        // Build carousel HTML
        let html = `
          <div id="medicalAdsCarousel" class="carousel slide" data-bs-ride="carousel" data-bs-interval="5000">
            <div class="carousel-indicators">
        `;

        // Add indicators
        ads.forEach((ad, index) => {
          html += `
            <button type="button" data-bs-target="#medicalAdsCarousel" data-bs-slide-to="${index}" 
              ${index === 0 ? 'class="active" aria-current="true"' : ''} 
              aria-label="Slide ${index + 1}">
            </button>
          `;
        });

        html += `
            </div>
            <div class="carousel-inner">
        `;

        // Add carousel items with lazy loading for images
        ads.forEach((ad, index) => {
          html += `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
              <div class="card border-primary shadow-sm">
                <div class="card-body">
          `;

          if (ad.type === 'text') {
            html += `
                  <h5 class="card-title">${this.escapeHtml(ad.title || 'Untitled')}</h5>
                  <p class="card-text">${this.escapeHtml(ad.description || ad.content || '')}</p>
                  <span class="badge bg-primary">Sponsored</span>
            `;
          } else if (ad.type === 'image') {
            // Use data-src for lazy loading on non-first slides
            const imgAttr = index === 0 ? 'src' : 'data-src';
            html += `
                  <div class="text-center">
                    <img ${imgAttr}="${this.escapeHtml(ad.content)}" 
                         class="img-fluid mb-3" 
                         style="max-height: 300px; object-fit: contain;" 
                         alt="${this.escapeHtml(ad.title || 'Ad image')}"
                         loading="lazy">
                    <h5 class="card-title">${this.escapeHtml(ad.title || 'Untitled')}</h5>
                    ${ad.description ? `<p class="card-text">${this.escapeHtml(ad.description)}</p>` : ''}
                    <span class="badge bg-primary">Sponsored</span>
                  </div>
            `;
          }

          html += `
                </div>
              </div>
            </div>
          `;
        });

        html += `
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#medicalAdsCarousel" data-bs-slide="prev">
              <span class="carousel-control-prev-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#medicalAdsCarousel" data-bs-slide="next">
              <span class="carousel-control-next-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Next</span>
            </button>
          </div>
        `;

        carouselContent.innerHTML = html;

        // Initialize lazy loading for carousel images
        if (window.lazyLoading) {
          window.lazyLoading.observeImages(carouselContent);
        }

        // Log analytics event
        if (window.analytics) {
          window.analytics.logEvent('view_ads_carousel', {
            location: 'homepage',
            ad_count: ads.length
          });
        }
      } catch (error) {
        console.error('Error loading ads carousel:', error);
        const section = document.getElementById('medical-ads-section');
        if (section) {
          section.style.display = 'none';
        }
      }
    },

    /**
     * Load smart suggestions with caching
     */
    async loadSmartSuggestions() {
      try {
        if (!window.suggestionsUI || !window.db) {
          setTimeout(() => this.loadSmartSuggestions(), 100);
          return;
        }

        const userLocation = localStorage.getItem('userLocation') || 'Sidi Bel Abbès';

        // Check cache first (5 minutes for suggestions)
        const cacheKey = `homepage_suggestions_${userLocation}`;
        const cached = this.getFromCache(cacheKey, 5 * 60 * 1000);
        
        if (cached) {
          console.log('[Homepage] Using cached suggestions');
          // Render cached suggestions directly
          const container = document.getElementById('suggestions-container');
          if (container && cached.html) {
            container.innerHTML = cached.html;
            return;
          }
        }

        // Load fresh suggestions
        window.suggestionsUI.renderSuggestions('suggestions-container', {
          userLocation: userLocation
        });
        
        console.log('[Homepage] Loaded fresh suggestions');
      } catch (error) {
        console.error('Error loading smart suggestions:', error);
      }
    },

    /**
     * Get loading HTML skeleton
     */
    getLoadingHTML(count = 3) {
      let html = '';
      for (let i = 0; i < count; i++) {
        html += `
          <div class="col-md-6 col-lg-4">
            <div class="card h-100">
              <div class="card-img-top bg-secondary" style="height: 200px;"></div>
              <div class="card-body">
                <div class="placeholder-glow">
                  <span class="placeholder col-7"></span>
                  <span class="placeholder col-4"></span>
                  <span class="placeholder col-6"></span>
                </div>
              </div>
            </div>
          </div>
        `;
      }
      return html;
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    /**
     * Get data from cache
     */
    getFromCache(key, maxAge = 5 * 60 * 1000) {
      try {
        const cached = localStorage.getItem(`cache_${key}`);
        if (!cached) return null;

        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        if (age > maxAge) {
          localStorage.removeItem(`cache_${key}`);
          return null;
        }

        return data.value;
      } catch (error) {
        console.error('Error reading from cache:', error);
        return null;
      }
    },

    /**
     * Save data to cache
     */
    saveToCache(key, value) {
      try {
        const data = {
          value: value,
          timestamp: Date.now()
        };
        localStorage.setItem(`cache_${key}`, JSON.stringify(data));
      } catch (error) {
        console.error('Error saving to cache:', error);
      }
    },

    /**
     * Lazy load below-the-fold content
     */
    lazyLoadContent() {
      // Use Intersection Observer for lazy loading
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const section = entry.target;
              
              // Load content based on section
              if (section.id === 'medical-ads-section') {
                this.loadMedicalAds();
                observer.unobserve(section);
              } else if (section.classList.contains('suggestions-section')) {
                this.loadSmartSuggestions();
                observer.unobserve(section);
              }
            }
          });
        }, {
          rootMargin: '100px' // Start loading 100px before entering viewport
        });

        // Observe sections
        const adsSection = document.getElementById('medical-ads-section');
        const suggestionsSection = document.querySelector('.suggestions-section');

        if (adsSection) observer.observe(adsSection);
        if (suggestionsSection) observer.observe(suggestionsSection);
      } else {
        // Fallback for browsers without Intersection Observer
        this.loadMedicalAds();
        this.loadSmartSuggestions();
      }
    },

    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
      // Preload search bar component
      const searchBarLink = document.createElement('link');
      searchBarLink.rel = 'prefetch';
      searchBarLink.href = '/components/search-bar.html';
      document.head.appendChild(searchBarLink);

      // Preload critical images
      const placeholderLink = document.createElement('link');
      placeholderLink.rel = 'preload';
      placeholderLink.as = 'image';
      placeholderLink.href = '/assets/images/placeholder-provider.png';
      document.head.appendChild(placeholderLink);

      // DNS prefetch for Firebase Storage
      const dnsLink = document.createElement('link');
      dnsLink.rel = 'dns-prefetch';
      dnsLink.href = 'https://firebasestorage.googleapis.com';
      document.head.appendChild(dnsLink);
    },

    /**
     * Optimize images on the page
     */
    optimizeImages() {
      // Convert all images to lazy loading if not already
      if (window.imageHelper) {
        window.imageHelper.convertToLazyLoading();
      }

      // Observe new images added dynamically
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const images = node.querySelectorAll ? node.querySelectorAll('img:not([data-src])') : [];
              if (images.length > 0 && window.lazyLoading) {
                window.lazyLoading.observeImages(node);
              }
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    },

    /**
     * Minimize Firebase queries on initial load
     */
    optimizeInitialLoad() {
      // Load only critical above-the-fold content first
      this.loadSearchBar();
      this.loadEmergencySection();
      
      // Use requestIdleCallback for featured providers if available
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.loadFeaturedProviders();
        });
      } else {
        // Fallback with setTimeout
        setTimeout(() => {
          this.loadFeaturedProviders();
        }, 100);
      }

      // Lazy load below-the-fold content
      this.lazyLoadContent();
    }
  };

  // Export to window
  window.homepage = homepage;

  // Auto-initialize on page load if on homepage
  document.addEventListener('page-loaded', (event) => {
    if (event.detail.path === '/' || event.detail.path === '/home') {
      homepage.init();
    }
  });

  // Also initialize if already on homepage
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/' || currentPath === '/home') {
        homepage.init();
      }
    });
  } else {
    const currentPath = window.location.pathname;
    if (currentPath === '/' || currentPath === '/home') {
      homepage.init();
    }
  }

})();

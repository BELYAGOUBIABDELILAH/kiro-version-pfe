# Search Functionality Implementation Guide

## Overview

This document describes the implementation of the search functionality for the CityHealth platform, including search queries, filters, results display, and AI-powered suggestions.

## Implemented Components

### 1. Search Module (`assets/js/search.js`)

Core search functionality with Firestore queries.

**Key Features:**
- Full-text search with service type and location filters
- Compound Firestore queries with proper indexing
- Pagination support for large result sets
- Result sorting by relevance and rating
- Search result caching (5-minute TTL)
- Search history tracking

**Main Functions:**
- `searchProviders(params)` - Main search function
- `getEmergencyProviders()` - Get 24/7 available providers
- `getPopularProviders(limit)` - Get top-rated providers
- `getSuggestions(context)` - Get AI-powered suggestions
- `getServiceTypes()` - Get available service types
- `getCities()` - Get available cities

### 2. Search Bar Component (`assets/js/search-bar.js`)

Interactive search bar with autocomplete.

**Key Features:**
- Multilingual support (Arabic, French, English)
- Debounced search input (300ms delay)
- Autocomplete suggestions for service types, locations, and specialties
- Session persistence of search parameters
- Keyboard navigation support

**Usage:**
```html
<!-- Include in HTML -->
<div id="search-bar-container"></div>

<!-- Component will auto-initialize -->
<script src="assets/js/search-bar.js"></script>
```

### 3. Search Results Page (`assets/js/search-results.js`)

Results display with filtering and pagination.

**Key Features:**
- Provider card display with all relevant information
- Real-time filter application
- Filter persistence across navigation
- Result count display
- Empty state handling
- Pagination controls

**Filters Available:**
- Service type (clinic, hospital, doctor, pharmacy, lab)
- Wheelchair accessibility
- Home visits availability
- 24/7 emergency availability

### 4. Smart Suggestions (`assets/js/suggestions.js` & `assets/js/suggestions-ui.js`)

AI-powered provider suggestions.

**Key Features:**
- History-based suggestions
- Popular providers
- Location-based suggestions
- Emergency providers
- Suggestion scoring algorithm
- Dismissible suggestions
- Interaction tracking

**Usage:**
```html
<!-- Include in homepage or search page -->
<div id="suggestions-container"></div>

<!-- Scripts will auto-initialize -->
<script src="assets/js/suggestions.js"></script>
<script src="assets/js/suggestions-ui.js"></script>
```

## Integration Steps

### 1. Include Scripts in HTML

Add these scripts to your main HTML file (index.html) or page-specific files:

```html
<!-- Core dependencies (must be loaded first) -->
<script src="assets/js/firebase-config.js"></script>
<script src="assets/js/utils.js"></script>
<script src="assets/js/i18n.js"></script>

<!-- Search functionality -->
<script src="assets/js/search.js"></script>
<script src="assets/js/search-bar.js"></script>
<script src="assets/js/search-results.js"></script>
<script src="assets/js/suggestions.js"></script>
<script src="assets/js/suggestions-ui.js"></script>
```

### 2. Add HTML Containers

Include these containers in your pages:

**Homepage (pages/home.html):**
```html
<div id="search-bar-container"></div>
<div id="suggestions-container"></div>
```

**Search Results Page (pages/search-results.html):**
```html
<div id="search-bar-container"></div>
<div id="results-container"></div>
<div id="pagination-container"></div>
```

### 3. Deploy Firestore Indexes

Deploy the required Firestore indexes:

```bash
firebase deploy --only firestore:indexes
```

The indexes are defined in `firestore.indexes.json` and support:
- Search by type and city with rating sort
- Filter by accessibility, home visits, emergency
- Popular providers query

### 4. Configure Firestore Security Rules

Ensure your `firestore.rules` includes:

```javascript
match /providers/{providerId} {
  allow read: if true; // Public read access
  allow write: if request.auth != null;
}
```

## Usage Examples

### Performing a Search

```javascript
// Search for clinics in Sidi Bel Abbès
const results = await window.search.searchProviders({
  query: 'cardiology',
  serviceType: 'clinic',
  location: 'Sidi Bel Abbès',
  filters: {
    accessibility: true,
    homeVisits: false
  },
  page: 1
});

console.log(results.providers); // Array of provider objects
console.log(results.total); // Total count
console.log(results.hasMore); // Boolean for pagination
```

### Getting Suggestions

```javascript
// Get personalized suggestions
const suggestions = await window.suggestions.getSuggestions({
  userLocation: 'Sidi Bel Abbès',
  language: 'en'
});

console.log(suggestions); // Array of suggested providers
```

### Listening for Search Events

```javascript
// Listen for search submissions
window.addEventListener('search-submit', (event) => {
  const params = event.detail;
  console.log('Search submitted:', params);
  // Handle search...
});
```

## Multilingual Support

All components support Arabic, French, and English:

- Search bar labels and placeholders
- Filter labels
- Result messages
- Suggestion reasons
- Empty states

Translations are loaded from:
- `assets/locales/en.json`
- `assets/locales/fr.json`
- `assets/locales/ar.json`

## Performance Considerations

### Caching
- Search results are cached for 5 minutes
- Cache size limited to 50 entries
- Automatic cache invalidation

### Debouncing
- Search input debounced at 300ms
- Reduces unnecessary Firestore queries
- Improves user experience

### Pagination
- Results limited to 20 per page
- Lazy loading of additional pages
- Efficient cursor-based pagination

## Testing

### Manual Testing Checklist

1. **Search Functionality**
   - [ ] Search with query text
   - [ ] Filter by service type
   - [ ] Filter by location
   - [ ] Apply multiple filters
   - [ ] Clear filters
   - [ ] Pagination works

2. **Autocomplete**
   - [ ] Shows suggestions on input
   - [ ] Keyboard navigation works
   - [ ] Click to select suggestion
   - [ ] Hides on blur

3. **Results Display**
   - [ ] Provider cards show all info
   - [ ] Verified badge displays
   - [ ] Accessibility indicators show
   - [ ] Click to view profile
   - [ ] Favorite button works

4. **Suggestions**
   - [ ] Suggestions load on homepage
   - [ ] Dismiss button works
   - [ ] View profile from suggestion
   - [ ] Refresh suggestions works

5. **Multilingual**
   - [ ] Switch to Arabic (RTL layout)
   - [ ] Switch to French
   - [ ] All labels translate
   - [ ] Search works in all languages

## Troubleshooting

### No Search Results

1. Check Firestore indexes are deployed
2. Verify providers collection has data
3. Check browser console for errors
4. Ensure Firebase is initialized

### Autocomplete Not Working

1. Check debounce delay (300ms)
2. Verify service types are loaded
3. Check browser console for errors

### Suggestions Not Loading

1. Verify search history exists
2. Check Firestore has provider data
3. Ensure suggestions module is loaded

## Next Steps

After implementing search functionality, you can:

1. Implement provider profile viewing (Task 5)
2. Add favorites functionality (Task 5.3)
3. Implement verification system (Task 6)
4. Add chatbot integration (Task 9)

## Support

For issues or questions:
- Check browser console for errors
- Review Firestore query logs
- Verify all dependencies are loaded
- Check network tab for failed requests

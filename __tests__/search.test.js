/**
 * Unit tests for search and filter logic
 */

describe('Search Module', () => {
  // Mock search functions
  const SearchModule = {
    filterByAccessibility: (providers, accessible) => {
      if (!accessible) return providers;
      return providers.filter(p => p.accessibility === true);
    },

    filterByHomeVisits: (providers, homeVisits) => {
      if (!homeVisits) return providers;
      return providers.filter(p => p.homeVisits === true);
    },

    filterByProviderType: (providers, type) => {
      if (!type) return providers;
      return providers.filter(p => p.type === type);
    },

    sortByRating: (providers) => {
      return [...providers].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
  };

  const mockProviders = [
    { id: '1', name: 'Provider A', type: 'clinic', accessibility: true, homeVisits: false, rating: 4.5 },
    { id: '2', name: 'Provider B', type: 'hospital', accessibility: false, homeVisits: true, rating: 4.8 },
    { id: '3', name: 'Provider C', type: 'clinic', accessibility: true, homeVisits: true, rating: 4.2 },
    { id: '4', name: 'Provider D', type: 'pharmacy', accessibility: false, homeVisits: false, rating: 4.0 }
  ];

  describe('filterByAccessibility', () => {
    test('should return only accessible providers when filter is true', () => {
      const result = SearchModule.filterByAccessibility(mockProviders, true);
      expect(result).toHaveLength(2);
      expect(result.every(p => p.accessibility === true)).toBe(true);
    });

    test('should return all providers when filter is false', () => {
      const result = SearchModule.filterByAccessibility(mockProviders, false);
      expect(result).toHaveLength(4);
    });
  });

  describe('filterByHomeVisits', () => {
    test('should return only providers offering home visits', () => {
      const result = SearchModule.filterByHomeVisits(mockProviders, true);
      expect(result).toHaveLength(2);
      expect(result.every(p => p.homeVisits === true)).toBe(true);
    });
  });

  describe('filterByProviderType', () => {
    test('should return only providers of specified type', () => {
      const result = SearchModule.filterByProviderType(mockProviders, 'clinic');
      expect(result).toHaveLength(2);
      expect(result.every(p => p.type === 'clinic')).toBe(true);
    });
  });

  describe('sortByRating', () => {
    test('should sort providers by rating in descending order', () => {
      const result = SearchModule.sortByRating(mockProviders);
      expect(result[0].rating).toBe(4.8);
      expect(result[1].rating).toBe(4.5);
      expect(result[2].rating).toBe(4.2);
      expect(result[3].rating).toBe(4.0);
    });
  });
});

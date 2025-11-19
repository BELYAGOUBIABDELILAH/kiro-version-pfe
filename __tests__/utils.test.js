/**
 * Unit tests for utility functions
 */

describe('Utils Module', () => {
  // Mock Utils object
  const Utils = {
    debounce: (func, delay) => {
      let timeoutId;
      return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
      };
    },
    
    formatDate: (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },
    
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
  };

  describe('debounce', () => {
    test('should delay function execution', (done) => {
      let callCount = 0;
      const debouncedFn = Utils.debounce(() => {
        callCount++;
      }, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(callCount).toBe(0);

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });
  });

  describe('formatDate', () => {
    test('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = Utils.formatDate(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    test('should return empty string for null date', () => {
      expect(Utils.formatDate(null)).toBe('');
    });
  });

  describe('wait', () => {
    test('should resolve after specified time', async () => {
      const start = Date.now();
      await Utils.wait(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });
});

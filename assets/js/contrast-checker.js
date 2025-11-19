/**
 * Contrast Checker Utility
 * Validates color contrast ratios for WCAG compliance
 * This is a development tool to help ensure accessibility
 */

const ContrastChecker = {
  /**
   * Calculate relative luminance of a color
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @returns {number} - Relative luminance
   */
  getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Parse hex color to RGB
   * @param {string} hex - Hex color code
   * @returns {Object} - RGB values
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  /**
   * Calculate contrast ratio between two colors
   * @param {string} color1 - First color (hex)
   * @param {string} color2 - Second color (hex)
   * @returns {number} - Contrast ratio
   */
  getContrastRatio(color1, color2) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if contrast ratio meets WCAG AA standard
   * @param {number} ratio - Contrast ratio
   * @param {string} level - 'normal' or 'large' text
   * @returns {boolean} - True if compliant
   */
  meetsWCAG_AA(ratio, level = 'normal') {
    return level === 'large' ? ratio >= 3 : ratio >= 4.5;
  },

  /**
   * Check if contrast ratio meets WCAG AAA standard
   * @param {number} ratio - Contrast ratio
   * @param {string} level - 'normal' or 'large' text
   * @returns {boolean} - True if compliant
   */
  meetsWCAG_AAA(ratio, level = 'normal') {
    return level === 'large' ? ratio >= 4.5 : ratio >= 7;
  },

  /**
   * Validate color pair
   * @param {string} foreground - Foreground color (hex)
   * @param {string} background - Background color (hex)
   * @param {string} level - 'normal' or 'large' text
   * @returns {Object} - Validation results
   */
  validate(foreground, background, level = 'normal') {
    const ratio = this.getContrastRatio(foreground, background);
    return {
      ratio: ratio.toFixed(2),
      AA: this.meetsWCAG_AA(ratio, level),
      AAA: this.meetsWCAG_AAA(ratio, level),
      level: level
    };
  },

  /**
   * Test all color combinations in the theme
   * This is a development tool - logs results to console
   */
  testThemeColors() {
    console.log('=== WCAG Contrast Ratio Test ===');
    
    const lightTheme = {
      bg: '#ffffff',
      bgSecondary: '#f8f9fa',
      textPrimary: '#212529',
      textSecondary: '#495057',
      textMuted: '#6c757d',
      linkColor: '#0d6efd',
      successColor: '#198754',
      dangerColor: '#dc3545',
      warningColor: '#cc9a06',
      infoColor: '#0891b2'
    };

    const darkTheme = {
      bg: '#1a1d20',
      bgSecondary: '#2d3238',
      textPrimary: '#f8f9fa',
      textSecondary: '#d1d5db',
      textMuted: '#9ca3af',
      linkColor: '#60a5fa',
      successColor: '#22c55e',
      dangerColor: '#ef4444',
      warningColor: '#fbbf24',
      infoColor: '#06b6d4'
    };

    console.log('\n--- Light Theme ---');
    console.log('Text on Background:', this.validate(lightTheme.textPrimary, lightTheme.bg));
    console.log('Secondary Text on Background:', this.validate(lightTheme.textSecondary, lightTheme.bg));
    console.log('Muted Text on Background:', this.validate(lightTheme.textMuted, lightTheme.bg));
    console.log('Link on Background:', this.validate(lightTheme.linkColor, lightTheme.bg));
    console.log('Success on Background:', this.validate(lightTheme.successColor, lightTheme.bg));
    console.log('Danger on Background:', this.validate(lightTheme.dangerColor, lightTheme.bg));
    console.log('Warning on Background:', this.validate(lightTheme.warningColor, lightTheme.bg));
    console.log('Info on Background:', this.validate(lightTheme.infoColor, lightTheme.bg));

    console.log('\n--- Dark Theme ---');
    console.log('Text on Background:', this.validate(darkTheme.textPrimary, darkTheme.bg));
    console.log('Secondary Text on Background:', this.validate(darkTheme.textSecondary, darkTheme.bg));
    console.log('Muted Text on Background:', this.validate(darkTheme.textMuted, darkTheme.bg));
    console.log('Link on Background:', this.validate(darkTheme.linkColor, darkTheme.bg));
    console.log('Success on Background:', this.validate(darkTheme.successColor, darkTheme.bg));
    console.log('Danger on Background:', this.validate(darkTheme.dangerColor, darkTheme.bg));
    console.log('Warning on Background:', this.validate(darkTheme.warningColor, darkTheme.bg));
    console.log('Info on Background:', this.validate(darkTheme.infoColor, darkTheme.bg));

    console.log('\n=== Test Complete ===');
  }
};

// Export for use in other modules
window.ContrastChecker = ContrastChecker;

// Run test in development mode (comment out in production)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Uncomment to run contrast tests on page load
  // document.addEventListener('DOMContentLoaded', () => {
  //   ContrastChecker.testThemeColors();
  // });
}

# Accessibility Testing Guide

## Overview
This guide provides comprehensive accessibility testing procedures for the CityHealth platform to ensure WCAG 2.1 Level AA compliance.

## Testing Tools

### Automated Testing Tools
1. **axe DevTools** - Browser extension for automated accessibility testing
2. **WAVE** - Web accessibility evaluation tool
3. **Lighthouse** - Built into Chrome DevTools
4. **Pa11y** - Command-line accessibility testing tool

### Manual Testing Tools
1. **Screen Readers**
   - NVDA (Windows) - Free
   - JAWS (Windows) - Commercial
   - VoiceOver (macOS/iOS) - Built-in
   - TalkBack (Android) - Built-in

2. **Keyboard Navigation** - No additional tools needed

3. **Color Contrast Analyzers**
   - WebAIM Contrast Checker
   - Colour Contrast Analyser (CCA)

## Automated Testing with axe DevTools

### Installation
1. Install axe DevTools browser extension
2. Open browser DevTools (F12)
3. Navigate to "axe DevTools" tab

### Test Procedure

**Step 1: Run Full Page Scan**
```
1. Navigate to page to test
2. Open axe DevTools
3. Click "Scan ALL of my page"
4. Review results
5. Document issues found
```

**Step 2: Test Each Page**
- [ ] Homepage (/)
- [ ] Search Results (/search-results)
- [ ] Provider Profile (/profile/:id)
- [ ] Authentication (/auth)
- [ ] Provider Dashboard (/provider-dashboard)
- [ ] Admin Dashboard (/admin-dashboard)
- [ ] Emergency Services (/emergency)
- [ ] Favorites (/favorites)

**Step 3: Review Issue Categories**
- Critical issues (must fix)
- Serious issues (should fix)
- Moderate issues (should fix)
- Minor issues (nice to fix)

### Common Issues to Check
- Missing alt text on images
- Insufficient color contrast
- Missing form labels
- Missing ARIA labels
- Improper heading hierarchy
- Missing landmark regions
- Keyboard trap issues
- Focus order problems

## Manual Keyboard Navigation Testing

### Test Procedure

**Basic Navigation**
1. Start at top of page
2. Press Tab key repeatedly
3. Verify focus moves through all interactive elements
4. Verify focus indicator is visible
5. Verify logical tab order

**Keyboard Shortcuts to Test**
- `Tab` - Move focus forward
- `Shift + Tab` - Move focus backward
- `Enter` - Activate buttons/links
- `Space` - Activate buttons, check checkboxes
- `Escape` - Close modals/dialogs
- `Arrow keys` - Navigate within components

### Test Checklist

**Homepage**
- [ ] Can navigate to search bar with Tab
- [ ] Can type in search fields
- [ ] Can activate search button with Enter
- [ ] Can navigate to all navigation links
- [ ] Can access language selector
- [ ] Can toggle theme with keyboard
- [ ] Can access chatbot widget
- [ ] Skip link works to jump to main content

**Search Results**
- [ ] Can navigate through filter checkboxes
- [ ] Can check/uncheck filters with Space
- [ ] Can navigate through provider cards
- [ ] Can activate provider cards with Enter
- [ ] Can navigate pagination controls

**Provider Profile**
- [ ] Can navigate through all profile sections
- [ ] Can activate favorite button
- [ ] Can navigate photo gallery
- [ ] Can interact with map (if keyboard accessible)
- [ ] Can access contact information

**Forms (Auth, Profile Edit)**
- [ ] Can navigate through all form fields
- [ ] Can select from dropdowns
- [ ] Can check checkboxes and radio buttons
- [ ] Can submit form with Enter
- [ ] Error messages are announced
- [ ] Required fields are indicated

**Modals**
- [ ] Can close modal with Escape key
- [ ] Focus is trapped within modal
- [ ] Focus returns to trigger element on close
- [ ] Can navigate all modal controls

## Screen Reader Testing

### NVDA Testing (Windows)

**Setup**
1. Download and install NVDA (free)
2. Start NVDA (Ctrl + Alt + N)
3. Open browser and navigate to site

**Basic Commands**
- `Insert + Down Arrow` - Read next line
- `Insert + Up Arrow` - Read previous line
- `Insert + Space` - Toggle browse/focus mode
- `H` - Navigate by headings
- `K` - Navigate by links
- `F` - Navigate by form fields
- `B` - Navigate by buttons

**Test Checklist**
- [ ] Page title is announced on load
- [ ] Headings are properly announced
- [ ] Links have descriptive text
- [ ] Images have alt text announced
- [ ] Form labels are associated with inputs
- [ ] Error messages are announced
- [ ] Dynamic content changes are announced
- [ ] ARIA labels are properly announced
- [ ] Button purposes are clear
- [ ] Navigation landmarks are identified

### VoiceOver Testing (macOS)

**Setup**
1. Enable VoiceOver (Cmd + F5)
2. Open Safari or Chrome
3. Navigate to site

**Basic Commands**
- `VO + Right Arrow` - Move to next item
- `VO + Left Arrow` - Move to previous item
- `VO + Space` - Activate item
- `VO + U` - Open rotor
- `VO + H` - Navigate by headings

**Test Same Checklist as NVDA**

## Color Contrast Testing

### Using WebAIM Contrast Checker

**Test Procedure**
1. Visit https://webaim.org/resources/contrastchecker/
2. For each color combination:
   - Enter foreground color (text)
   - Enter background color
   - Verify contrast ratio meets WCAG AA standards

### Contrast Requirements (WCAG AA)
- Normal text: 4.5:1 minimum
- Large text (18pt+ or 14pt+ bold): 3:1 minimum
- UI components and graphics: 3:1 minimum

### Color Combinations to Test

**Light Mode**
- [ ] Body text on background
- [ ] Link text on background
- [ ] Button text on button background
- [ ] Navigation text on nav background
- [ ] Form labels on background
- [ ] Error messages on background
- [ ] Success messages on background
- [ ] Placeholder text on input background

**Dark Mode**
- [ ] Body text on background
- [ ] Link text on background
- [ ] Button text on button background
- [ ] Navigation text on nav background
- [ ] Form labels on background
- [ ] Error messages on background
- [ ] Success messages on background
- [ ] Placeholder text on input background

### Manual Visual Inspection
1. View site in light mode
2. Check all text is readable
3. Switch to dark mode
4. Check all text is readable
5. Test with different zoom levels (100%, 150%, 200%)

## Accessibility Testing Checklist

### Requirement 16.1: WCAG 2.1 Level AA Compliance
- [ ] All automated tests pass
- [ ] No critical accessibility issues
- [ ] Serious issues are addressed
- [ ] Manual testing confirms compliance

### Requirement 16.2: ARIA Labels
- [ ] All interactive elements have proper ARIA labels
- [ ] Form inputs have associated labels
- [ ] Buttons have descriptive labels
- [ ] Icons have aria-label or aria-labelledby
- [ ] Dynamic content has aria-live regions
- [ ] Navigation has proper landmarks

### Requirement 16.3: Keyboard Navigation
- [ ] All functionality accessible via keyboard
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] No keyboard traps
- [ ] Skip links work correctly
- [ ] Modals trap focus appropriately
- [ ] Escape key closes modals

### Requirement 16.4: Color Contrast
- [ ] All text meets 4.5:1 contrast ratio (normal text)
- [ ] Large text meets 3:1 contrast ratio
- [ ] UI components meet 3:1 contrast ratio
- [ ] Both light and dark modes comply
- [ ] Links are distinguishable from body text
- [ ] Focus indicators have sufficient contrast

### Requirement 16.5: Alternative Text
- [ ] All images have alt attributes
- [ ] Decorative images have empty alt=""
- [ ] Informative images have descriptive alt text
- [ ] Icons have text alternatives
- [ ] Complex images have extended descriptions
- [ ] Image buttons have descriptive alt text

## Testing Results Template

### Page: [Page Name]
**Date Tested:** [Date]
**Tester:** [Name]

**Automated Testing (axe DevTools)**
- Critical Issues: [Number]
- Serious Issues: [Number]
- Moderate Issues: [Number]
- Minor Issues: [Number]

**Keyboard Navigation**
- All elements accessible: [Pass/Fail]
- Tab order logical: [Pass/Fail]
- Focus indicators visible: [Pass/Fail]
- No keyboard traps: [Pass/Fail]

**Screen Reader Testing**
- Content properly announced: [Pass/Fail]
- Navigation clear: [Pass/Fail]
- Forms accessible: [Pass/Fail]
- Dynamic content announced: [Pass/Fail]

**Color Contrast**
- Light mode compliant: [Pass/Fail]
- Dark mode compliant: [Pass/Fail]
- All text readable: [Pass/Fail]

**Issues Found:**
1. [Description of issue]
   - Severity: [Critical/Serious/Moderate/Minor]
   - Location: [Where on page]
   - Recommendation: [How to fix]

**Overall Status:** [Pass/Fail]

## Remediation Priority

### Priority 1 (Fix Immediately)
- Keyboard traps
- Missing form labels
- Insufficient contrast on critical text
- Missing alt text on informative images
- Broken ARIA implementations

### Priority 2 (Fix Soon)
- Improper heading hierarchy
- Missing skip links
- Insufficient contrast on non-critical text
- Missing ARIA landmarks
- Focus order issues

### Priority 3 (Fix When Possible)
- Minor contrast issues
- Redundant ARIA labels
- Non-critical missing alt text
- Minor keyboard navigation improvements

## Continuous Testing

### During Development
- Run axe DevTools on every new page/component
- Test keyboard navigation for new features
- Verify color contrast for new designs
- Test with screen reader for complex interactions

### Before Release
- Complete full accessibility audit
- Test all pages with automated tools
- Perform manual keyboard testing
- Conduct screen reader testing
- Verify color contrast compliance
- Document any known issues

### After Release
- Monitor user feedback
- Conduct periodic audits
- Update as standards evolve
- Train team on accessibility best practices

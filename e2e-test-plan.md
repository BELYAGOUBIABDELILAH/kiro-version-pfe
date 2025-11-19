# End-to-End Test Plan

## Overview
This document outlines the end-to-end test scenarios for the CityHealth platform. These tests validate complete user workflows from start to finish.

## Test Environment Setup

### Prerequisites
- Cypress or Playwright installed
- Firebase emulators running
- Test data seeded in Firestore

### Installation (when npm is available)
```bash
npm install --save-dev cypress
# or
npm install --save-dev @playwright/test
```

## Test Scenarios

### 1. User Registration and Login Flow

**Test: Citizen Registration**
- Navigate to `/auth`
- Fill registration form with valid data
- Select "Citizen" as user type
- Submit form
- Verify redirect to home page
- Verify user is authenticated

**Test: Provider Registration**
- Navigate to `/auth`
- Fill registration form with valid data
- Select "Provider" as user type
- Submit form
- Verify redirect to provider dashboard
- Verify profile completion progress bar appears

**Test: Login with Email/Password**
- Navigate to `/auth`
- Enter valid credentials
- Click login button
- Verify redirect based on user role
- Verify user session persists after page reload

**Test: Login with Google OAuth**
- Navigate to `/auth`
- Click "Sign in with Google" button
- Complete OAuth flow
- Verify successful authentication
- Verify user data saved to Firestore

### 2. Search and Filter Workflow

**Test: Basic Search**
- Navigate to home page
- Enter service type in search bar
- Enter location
- Click search button
- Verify search results page loads
- Verify results match search criteria

**Test: Apply Accessibility Filter**
- Perform basic search
- Check "Wheelchair Accessible" filter
- Verify results update immediately
- Verify all displayed providers have accessibility=true

**Test: Apply Multiple Filters**
- Perform basic search
- Check "Wheelchair Accessible" filter
- Check "Home Visits" filter
- Select "Clinic" provider type
- Verify results match all filter criteria
- Verify result count updates correctly

**Test: Filter Persistence**
- Apply filters to search results
- Click on a provider profile
- Navigate back to search results
- Verify filters remain applied
- Verify same results are displayed

### 3. Provider Profile Management

**Test: View Provider Profile**
- Search for a provider
- Click on provider card
- Verify profile page loads
- Verify all profile information displays correctly
- Verify map shows correct location
- Verify photo gallery works

**Test: Update Provider Profile**
- Login as provider user
- Navigate to provider dashboard
- Update profile information
- Upload new photo
- Toggle accessibility features
- Click save
- Verify success message appears
- Verify changes persist after page reload

**Test: Favorite Provider (Authenticated)**
- Login as citizen user
- Navigate to provider profile
- Click favorite button
- Verify button state changes
- Navigate to favorites page
- Verify provider appears in favorites list

**Test: Favorite Provider (Unauthenticated)**
- Logout if logged in
- Navigate to provider profile
- Click favorite button
- Verify login prompt appears
- Complete login
- Verify provider is favorited after login

### 4. Admin Verification Process

**Test: Submit Verification Request**
- Login as provider user
- Complete profile information
- Click "Request Verification" button
- Upload required documents
- Submit request
- Verify success message
- Verify request appears in admin queue

**Test: Approve Verification**
- Login as admin user
- Navigate to verification queue
- Select pending verification request
- Review provider details and documents
- Click "Approve" button
- Verify provider status updates to verified
- Verify verification badge appears on profile

**Test: Deny Verification**
- Login as admin user
- Navigate to verification queue
- Select pending verification request
- Click "Deny" button
- Enter denial reason
- Submit denial
- Verify provider receives notification
- Verify provider can resubmit request

### 5. Language Switching and Theme Toggle

**Test: Switch to Arabic**
- Navigate to home page
- Click language selector
- Select Arabic
- Verify all UI text changes to Arabic
- Verify layout switches to RTL
- Verify preference persists after page reload

**Test: Switch to French**
- Navigate to home page
- Click language selector
- Select French
- Verify all UI text changes to French
- Verify preference persists after page reload

**Test: Toggle Dark Mode**
- Navigate to home page
- Click theme toggle button
- Verify dark theme applies to all elements
- Verify sufficient contrast maintained
- Navigate to different pages
- Verify dark theme persists across pages
- Reload page
- Verify dark theme preference persists

**Test: Combined Language and Theme**
- Switch to Arabic language
- Enable dark mode
- Navigate through multiple pages
- Verify both preferences persist
- Reload page
- Verify both preferences remain active

## Test Execution

### Manual Testing Checklist
- [ ] User registration and login flow
- [ ] Search and filter workflow
- [ ] Provider profile management
- [ ] Admin verification process
- [ ] Language switching and theme toggle

### Automated Testing (Cypress Example)

```javascript
describe('CityHealth E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should complete search workflow', () => {
    cy.get('#search-service-type').type('Clinic');
    cy.get('#search-location').type('Sidi Bel Abbès');
    cy.get('#search-button').click();
    cy.url().should('include', '/search-results');
    cy.get('.provider-card').should('have.length.greaterThan', 0);
  });

  it('should apply filters correctly', () => {
    cy.visit('/search-results');
    cy.get('#filter-accessibility').check();
    cy.get('.provider-card').each(($card) => {
      cy.wrap($card).find('.accessibility-badge').should('exist');
    });
  });

  it('should switch language to Arabic', () => {
    cy.get('[data-language="ar"]').click();
    cy.get('html').should('have.attr', 'dir', 'rtl');
    cy.get('html').should('have.attr', 'lang', 'ar');
  });

  it('should toggle dark mode', () => {
    cy.get('[data-theme-toggle]').click();
    cy.get('html').should('have.attr', 'data-theme', 'dark');
  });
});
```

## Success Criteria

All tests must:
- Complete without errors
- Validate expected outcomes
- Handle edge cases appropriately
- Execute within reasonable time limits
- Work across all supported browsers

## Browser Compatibility Testing

Test all scenarios on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

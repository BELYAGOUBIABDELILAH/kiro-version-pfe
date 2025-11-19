# Reusable UI Components

This directory contains reusable UI components for the CityHealth platform.

## Components

### 1. Navbar Component

**Location:** `components/navbar.html`  
**JavaScript:** `assets/js/navbar.js`  
**Requirements:** 4.1, 4.3

**Features:**
- Responsive navigation with mobile hamburger menu
- Language selector dropdown (English, Arabic, French)
- Theme toggle button (light/dark mode)
- User profile dropdown with role-specific menu items
- Authentication state management

**Usage:**
```html
<!-- Include in your HTML -->
<div id="navbar-container"></div>

<script src="assets/js/navbar.js"></script>
```

The navbar automatically initializes and handles:
- Language switching with persistence
- Theme toggling with system preference detection
- Authentication state updates
- Mobile menu behavior

---

### 2. Footer Component

**Location:** `components/footer.html`  
**JavaScript:** `assets/js/footer.js`

**Features:**
- Brand information and description
- Quick links navigation
- Contact information
- Social media icons
- Language selector buttons
- Copyright with dynamic year

**Usage:**
```html
<!-- Include in your HTML -->
<div id="footer-container"></div>

<script src="assets/js/footer.js"></script>
```

---

### 3. Provider Card Component

**Location:** `components/provider-card.html`  
**JavaScript:** `assets/js/provider-card.js`  
**Requirements:** 1.3, 2.3, 3.5

**Features:**
- Provider image with placeholder fallback
- Verified badge overlay
- Rating display
- Provider type and specialty
- Location information
- Feature badges (accessible, home visits, 24/7)
- Favorite button (requires authentication)
- Clickable card navigation to profile

**Usage:**
```javascript
// Create a provider card
const provider = {
  id: 'provider_123',
  name: 'Dr. Ahmed Clinic',
  type: 'clinic',
  specialty: 'Cardiology',
  address: { city: 'Sidi Bel Abbès', street: '123 Main St' },
  images: ['https://example.com/image.jpg'],
  verified: true,
  rating: 4.5,
  accessibility: true,
  homeVisits: true,
  available24_7: false
};

const card = ProviderCard.create(provider, true);
document.getElementById('provider-list').appendChild(card);
```

---

### 4. Modal Component

**Location:** `components/modal.html`  
**JavaScript:** `assets/js/modal.js`  
**Requirements:** 3.3, 16.2

**Features:**
- Accessible modal with ARIA attributes
- Focus trapping for keyboard navigation
- Escape key to close
- Backdrop click to close (configurable)
- Custom title, content, and buttons
- Screen reader announcements

**Usage:**
```javascript
// Create and show a modal
const modal = new Modal();

modal.init({
  title: 'Confirm Action',
  content: '<p>Are you sure you want to proceed?</p>',
  buttons: [
    {
      text: 'Cancel',
      className: 'btn btn-secondary',
      closeOnClick: true
    },
    {
      text: 'Confirm',
      className: 'btn btn-primary',
      onClick: () => {
        console.log('Confirmed!');
      },
      closeOnClick: true
    }
  ],
  closeOnBackdrop: true,
  closeOnEscape: true,
  onClose: () => {
    console.log('Modal closed');
  }
});
```

**Accessibility Features:**
- Focus is trapped within the modal
- Tab navigation cycles through focusable elements
- Escape key closes the modal
- Focus returns to the element that opened the modal
- Screen reader announcements for open/close

---

## Styling

All component styles are defined in `assets/css/components.css` with:
- CSS custom properties for theming
- Dark mode support
- Responsive breakpoints
- Accessibility-compliant contrast ratios
- Smooth transitions and animations

## Dependencies

- Bootstrap 5 (for grid and utilities)
- Bootstrap Icons
- Firebase (for authentication in navbar)
- i18n module (for translations)

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS 13+, Android 8+)

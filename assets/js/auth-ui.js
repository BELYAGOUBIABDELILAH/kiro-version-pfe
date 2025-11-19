/**
 * Authentication UI Module
 * 
 * Handles the authentication UI components including login, registration,
 * and password reset forms with validation and user feedback.
 * 
 * Requirements: 8.1, 8.2, 8.5
 */

/**
 * Initialize authentication UI
 */
function initAuthUI() {
  // Get form containers
  const loginContainer = document.getElementById('login-form-container');
  const registerContainer = document.getElementById('register-form-container');
  const forgotPasswordContainer = document.getElementById('forgot-password-container');
  
  if (!loginContainer || !registerContainer || !forgotPasswordContainer) {
    console.error('Auth UI containers not found');
    return;
  }
  
  // Set up form switching
  setupFormSwitching();
  
  // Set up login form
  setupLoginForm();
  
  // Set up registration form
  setupRegistrationForm();
  
  // Set up forgot password form
  setupForgotPasswordForm();
  
  // Set up password visibility toggles
  setupPasswordToggles();
  
  // Set up password strength indicator
  setupPasswordStrength();
}

/**
 * Set up form switching between login, register, and forgot password
 */
function setupFormSwitching() {
  const loginContainer = document.getElementById('login-form-container');
  const registerContainer = document.getElementById('register-form-container');
  const forgotPasswordContainer = document.getElementById('forgot-password-container');
  
  // Show register form
  document.getElementById('show-register-form')?.addEventListener('click', (e) => {
    e.preventDefault();
    loginContainer.classList.add('d-none');
    registerContainer.classList.remove('d-none');
    forgotPasswordContainer.classList.add('d-none');
  });
  
  // Show login form
  document.getElementById('show-login-form')?.addEventListener('click', (e) => {
    e.preventDefault();
    loginContainer.classList.remove('d-none');
    registerContainer.classList.add('d-none');
    forgotPasswordContainer.classList.add('d-none');
  });
  
  // Show forgot password form
  document.getElementById('forgot-password-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    loginContainer.classList.add('d-none');
    registerContainer.classList.add('d-none');
    forgotPasswordContainer.classList.remove('d-none');
  });
  
  // Back to login from forgot password
  document.getElementById('back-to-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    loginContainer.classList.remove('d-none');
    registerContainer.classList.add('d-none');
    forgotPasswordContainer.classList.add('d-none');
  });
}

/**
 * Set up login form submission and validation
 */
function setupLoginForm() {
  const form = document.getElementById('login-form');
  const submitBtn = document.getElementById('login-submit-btn');
  const errorDiv = document.getElementById('login-error');
  const googleBtn = document.getElementById('google-signin-btn');
  
  if (!form) return;
  
  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validate form
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    
    // Get form values
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Show loading state
    setButtonLoading(submitBtn, true);
    hideError(errorDiv);
    
    try {
      // Sign in
      const user = await window.authModule.signIn(email, password);
      
      // Success - redirect based on role
      handleSuccessfulAuth(user);
      
    } catch (error) {
      showError(errorDiv, error.message);
      setButtonLoading(submitBtn, false);
    }
  });
  
  // Google sign in
  googleBtn?.addEventListener('click', async () => {
    setButtonLoading(googleBtn, true);
    hideError(errorDiv);
    
    try {
      const user = await window.authModule.signInWithGoogle('citizen');
      handleSuccessfulAuth(user);
    } catch (error) {
      showError(errorDiv, error.message);
      setButtonLoading(googleBtn, false);
    }
  });
  
  // Real-time validation
  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', () => {
      if (form.classList.contains('was-validated')) {
        input.checkValidity();
      }
    });
  });
}

/**
 * Set up registration form submission and validation
 */
function setupRegistrationForm() {
  const form = document.getElementById('register-form');
  const submitBtn = document.getElementById('register-submit-btn');
  const errorDiv = document.getElementById('register-error');
  const googleBtn = document.getElementById('google-signup-btn');
  
  if (!form) return;
  
  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get form values
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-password-confirm').value;
    const userType = document.querySelector('input[name="user-type"]:checked').value;
    const acceptTerms = document.getElementById('accept-terms').checked;
    
    // Custom validation
    let isValid = true;
    
    // Check password match
    const confirmInput = document.getElementById('register-password-confirm');
    if (password !== confirmPassword) {
      confirmInput.setCustomValidity('Passwords do not match');
      isValid = false;
    } else {
      confirmInput.setCustomValidity('');
    }
    
    // Validate form
    if (!form.checkValidity() || !isValid) {
      form.classList.add('was-validated');
      return;
    }
    
    // Show loading state
    setButtonLoading(submitBtn, true);
    hideError(errorDiv);
    
    try {
      // Sign up
      const user = await window.authModule.signUp(email, password, userType, {
        displayName: name
      });
      
      // Show success message
      showSuccess(errorDiv, 'Account created! Please check your email to verify your account.');
      
      // Redirect after delay
      setTimeout(() => {
        handleSuccessfulAuth(user);
      }, 2000);
      
    } catch (error) {
      showError(errorDiv, error.message);
      setButtonLoading(submitBtn, false);
    }
  });
  
  // Google sign up
  googleBtn?.addEventListener('click', async () => {
    const userType = document.querySelector('input[name="user-type"]:checked').value;
    
    setButtonLoading(googleBtn, true);
    hideError(errorDiv);
    
    try {
      const user = await window.authModule.signInWithGoogle(userType);
      handleSuccessfulAuth(user);
    } catch (error) {
      showError(errorDiv, error.message);
      setButtonLoading(googleBtn, false);
    }
  });
  
  // Real-time validation
  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', () => {
      if (form.classList.contains('was-validated')) {
        input.checkValidity();
      }
    });
  });
  
  // Password confirmation validation
  document.getElementById('register-password-confirm')?.addEventListener('input', (e) => {
    const password = document.getElementById('register-password').value;
    const confirmPassword = e.target.value;
    
    if (password !== confirmPassword) {
      e.target.setCustomValidity('Passwords do not match');
    } else {
      e.target.setCustomValidity('');
    }
  });
}

/**
 * Set up forgot password form
 */
function setupForgotPasswordForm() {
  const form = document.getElementById('forgot-password-form');
  const submitBtn = document.getElementById('reset-submit-btn');
  const errorDiv = document.getElementById('reset-error');
  const successDiv = document.getElementById('reset-success');
  
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validate form
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    
    const email = document.getElementById('reset-email').value.trim();
    
    // Show loading state
    setButtonLoading(submitBtn, true);
    hideError(errorDiv);
    hideError(successDiv);
    
    try {
      await window.authModule.sendPasswordReset(email);
      
      // Show success message
      successDiv.classList.remove('d-none');
      form.reset();
      form.classList.remove('was-validated');
      
      setButtonLoading(submitBtn, false);
      
    } catch (error) {
      showError(errorDiv, error.message);
      setButtonLoading(submitBtn, false);
    }
  });
}

/**
 * Set up password visibility toggles
 */
function setupPasswordToggles() {
  // Login password toggle
  document.getElementById('toggle-login-password')?.addEventListener('click', function() {
    togglePasswordVisibility('login-password', this);
  });
  
  // Register password toggle
  document.getElementById('toggle-register-password')?.addEventListener('click', function() {
    togglePasswordVisibility('register-password', this);
  });
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  const icon = button.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('bi-eye');
    icon.classList.add('bi-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('bi-eye-slash');
    icon.classList.add('bi-eye');
  }
}

/**
 * Set up password strength indicator
 */
function setupPasswordStrength() {
  const passwordInput = document.getElementById('register-password');
  
  if (!passwordInput) return;
  
  passwordInput.addEventListener('input', (e) => {
    const password = e.target.value;
    const strength = calculatePasswordStrength(password);
    updatePasswordStrengthUI(strength);
  });
}

/**
 * Calculate password strength
 */
function calculatePasswordStrength(password) {
  let strength = 0;
  
  if (password.length === 0) {
    return { score: 0, text: '', color: '' };
  }
  
  // Length
  if (password.length >= 6) strength += 20;
  if (password.length >= 8) strength += 10;
  if (password.length >= 12) strength += 10;
  
  // Contains lowercase
  if (/[a-z]/.test(password)) strength += 15;
  
  // Contains uppercase
  if (/[A-Z]/.test(password)) strength += 15;
  
  // Contains numbers
  if (/\d/.test(password)) strength += 15;
  
  // Contains special characters
  if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
  
  // Determine strength level
  let text, color;
  if (strength < 30) {
    text = 'Weak';
    color = 'danger';
  } else if (strength < 60) {
    text = 'Fair';
    color = 'warning';
  } else if (strength < 80) {
    text = 'Good';
    color = 'info';
  } else {
    text = 'Strong';
    color = 'success';
  }
  
  return { score: strength, text, color };
}

/**
 * Update password strength UI
 */
function updatePasswordStrengthUI(strength) {
  const bar = document.getElementById('password-strength-bar');
  const text = document.getElementById('password-strength-text');
  
  if (!bar || !text) return;
  
  // Update progress bar
  bar.style.width = strength.score + '%';
  bar.className = 'progress-bar bg-' + strength.color;
  bar.setAttribute('aria-valuenow', strength.score);
  
  // Update text
  text.textContent = strength.text;
  text.className = 'text-' + strength.color;
}

/**
 * Handle successful authentication
 */
function handleSuccessfulAuth(user) {
  // Redirect based on role
  let redirectPath = '/';
  
  if (user.role === 'admin') {
    redirectPath = '/admin';
  } else if (user.role === 'provider') {
    redirectPath = '/provider-dashboard';
  } else {
    redirectPath = '/';
  }
  
  // Use router if available, otherwise use window.location
  if (window.router && window.router.navigate) {
    window.router.navigate(redirectPath);
  } else {
    window.location.href = redirectPath;
  }
}

/**
 * Set button loading state
 */
function setButtonLoading(button, isLoading) {
  if (!button) return;
  
  if (isLoading) {
    button.disabled = true;
    const originalText = button.innerHTML;
    button.dataset.originalText = originalText;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Loading...';
  } else {
    button.disabled = false;
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  }
}

/**
 * Show error message
 */
function showError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.classList.remove('d-none');
}

/**
 * Hide error message
 */
function hideError(element) {
  if (!element) return;
  element.classList.add('d-none');
}

/**
 * Show success message
 */
function showSuccess(element, message) {
  if (!element) return;
  element.textContent = message;
  element.classList.remove('d-none', 'alert-danger');
  element.classList.add('alert-success');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthUI);
} else {
  initAuthUI();
}

// Export for use in other modules
window.authUI = {
  initAuthUI,
  handleSuccessfulAuth
};


/**
 * Authentication Module
 * 
 * Handles user authentication and authorization for the CityHealth platform.
 * Supports email/password and Google OAuth authentication.
 * 
 * Requirements: 5.3, 8.4, 8.5
 */

/**
 * Sign up a new user with email and password
 * @param {string} email - User email address
 * @param {string} password - User password
 * @param {string} userType - Type of user: 'citizen', 'provider', or 'admin'
 * @param {Object} additionalData - Additional user data (displayName, etc.)
 * @param {HTMLElement} submitButton - Optional submit button to show loading state
 * @returns {Promise<Object>} User object with uid and role
 */
async function signUp(email, password, userType = 'citizen', additionalData = {}, submitButton = null) {
  // Show button loading state
  if (submitButton && window.LoadingIndicator) {
    window.LoadingIndicator.showButtonLoading(submitButton, 'Signing up...');
  }

  try {
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!['citizen', 'provider', 'admin'].includes(userType)) {
      throw new Error('Invalid user type');
    }

    // Create user with Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Send email verification
    await user.sendEmailVerification();

    // Create user document in Firestore
    const userData = {
      uid: user.uid,
      email: user.email,
      role: userType,
      displayName: additionalData.displayName || email.split('@')[0],
      photoURL: additionalData.photoURL || null,
      preferences: {
        language: additionalData.language || 'ar',
        theme: 'light'
      },
      favorites: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(user.uid).set(userData);

    // Track sign up in analytics
    if (window.Analytics) {
      window.Analytics.trackAuth('email', 'sign_up');
    }

    return {
      uid: user.uid,
      email: user.email,
      role: userType,
      displayName: userData.displayName
    };

  } catch (error) {
    console.error('Sign up error:', error);
    throw handleAuthError(error);
  } finally {
    // Hide button loading state
    if (submitButton && window.LoadingIndicator) {
      window.LoadingIndicator.hideButtonLoading(submitButton);
    }
  }
}

/**
 * Sign in user with email and password
 * @param {string} email - User email address
 * @param {string} password - User password
 * @param {HTMLElement} submitButton - Optional submit button to show loading state
 * @returns {Promise<Object>} User object with uid and role
 */
async function signIn(email, password, submitButton = null) {
  // Show button loading state
  if (submitButton && window.LoadingIndicator) {
    window.LoadingIndicator.showButtonLoading(submitButton, 'Signing in...');
  }

  try {
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Sign in with Firebase Auth
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Get user role from Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();

    if (!userDoc.exists) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data();

    // Track sign in in analytics
    if (window.Analytics) {
      window.Analytics.trackAuth('email', 'sign_in');
      window.Analytics.setUserId(user.uid);
      window.Analytics.setUserProperties({ role: userData.role });
    }

    return {
      uid: user.uid,
      email: user.email,
      role: userData.role,
      displayName: userData.displayName,
      photoURL: userData.photoURL
    };

  } catch (error) {
    console.error('Sign in error:', error);
    throw handleAuthError(error);
  } finally {
    // Hide button loading state
    if (submitButton && window.LoadingIndicator) {
      window.LoadingIndicator.hideButtonLoading(submitButton);
    }
  }
}

/**
 * Sign in with Google OAuth
 * @param {string} userType - Type of user: 'citizen', 'provider', or 'admin'
 * @param {HTMLElement} submitButton - Optional submit button to show loading state
 * @returns {Promise<Object>} User object with uid and role
 */
async function signInWithGoogle(userType = 'citizen', submitButton = null) {
  // Show button loading state
  if (submitButton && window.LoadingIndicator) {
    window.LoadingIndicator.showButtonLoading(submitButton, 'Signing in with Google...');
  }

  try {
    if (!['citizen', 'provider', 'admin'].includes(userType)) {
      throw new Error('Invalid user type');
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    // Sign in with popup
    const result = await auth.signInWithPopup(provider);
    const user = result.user;

    // Check if user already exists
    const userDoc = await db.collection('users').doc(user.uid).get();

    let userData;

    if (!userDoc.exists) {
      // Create new user document
      userData = {
        uid: user.uid,
        email: user.email,
        role: userType,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        preferences: {
          language: 'ar',
          theme: 'light'
        },
        favorites: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('users').doc(user.uid).set(userData);

      // Track sign up in analytics
      if (window.Analytics) {
        window.Analytics.trackAuth('google', 'sign_up');
      }
    } else {
      userData = userDoc.data();

      // Track sign in in analytics
      if (window.Analytics) {
        window.Analytics.trackAuth('google', 'sign_in');
      }
    }

    // Set user ID and properties in analytics
    if (window.Analytics) {
      window.Analytics.setUserId(user.uid);
      window.Analytics.setUserProperties({ role: userData.role });
    }

    return {
      uid: user.uid,
      email: user.email,
      role: userData.role,
      displayName: userData.displayName,
      photoURL: userData.photoURL
    };

  } catch (error) {
    console.error('Google sign in error:', error);
    throw handleAuthError(error);
  } finally {
    // Hide button loading state
    if (submitButton && window.LoadingIndicator) {
      window.LoadingIndicator.hideButtonLoading(submitButton);
    }
  }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
async function signOut() {
  try {
    await auth.signOut();

    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('logout');
    }

    // Clear any cached data
    sessionStorage.clear();

  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
}

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>} User object or null if not authenticated
 */
async function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();

      if (!user) {
        resolve(null);
        return;
      }

      try {
        // Get user data from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (!userDoc.exists) {
          resolve(null);
          return;
        }

        const userData = userDoc.data();

        resolve({
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          role: userData.role,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          preferences: userData.preferences,
          favorites: userData.favorites || []
        });

      } catch (error) {
        console.error('Error getting user data:', error);
        resolve(null);
      }
    });
  });
}

/**
 * Check user role
 * @param {string} requiredRole - Required role: 'citizen', 'provider', or 'admin'
 * @returns {Promise<boolean>} True if user has required role
 */
async function checkUserRole(requiredRole) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return false;
    }

    // Admin has access to everything
    if (user.role === 'admin') {
      return true;
    }

    return user.role === requiredRole;

  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

/**
 * Get user role for current user
 * @returns {Promise<string|null>} User role or null if not authenticated
 */
async function getUserRole() {
  try {
    const user = await getCurrentUser();
    return user ? user.role : null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Update user profile
 * @param {Object} updates - Profile updates
 * @returns {Promise<void>}
 */
async function updateUserProfile(updates) {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No user is currently signed in');
    }

    // Update Firebase Auth profile if displayName or photoURL changed
    const authUpdates = {};
    if (updates.displayName !== undefined) {
      authUpdates.displayName = updates.displayName;
    }
    if (updates.photoURL !== undefined) {
      authUpdates.photoURL = updates.photoURL;
    }

    if (Object.keys(authUpdates).length > 0) {
      await user.updateProfile(authUpdates);
    }

    // Update Firestore document
    const firestoreUpdates = {
      ...updates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(user.uid).update(firestoreUpdates);

  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
}

/**
 * Send password reset email
 * @param {string} email - User email address
 * @returns {Promise<void>}
 */
async function sendPasswordReset(email) {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    await auth.sendPasswordResetEmail(email);

  } catch (error) {
    console.error('Password reset error:', error);
    throw handleAuthError(error);
  }
}

/**
 * Handle Firebase Auth errors and return user-friendly messages
 * @param {Error} error - Firebase error object
 * @returns {Error} Error with user-friendly message
 */
function handleAuthError(error) {
  let message = 'An error occurred. Please try again.';

  switch (error.code) {
    case 'auth/email-already-in-use':
      message = 'This email is already registered. Please sign in instead.';
      break;
    case 'auth/invalid-email':
      message = 'Invalid email address.';
      break;
    case 'auth/operation-not-allowed':
      message = 'This sign-in method is not enabled.';
      break;
    case 'auth/weak-password':
      message = 'Password is too weak. Please use at least 6 characters.';
      break;
    case 'auth/user-disabled':
      message = 'This account has been disabled.';
      break;
    case 'auth/user-not-found':
      message = 'No account found with this email.';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password.';
      break;
    case 'auth/too-many-requests':
      message = 'Too many failed attempts. Please try again later.';
      break;
    case 'auth/popup-closed-by-user':
      message = 'Sign-in popup was closed. Please try again.';
      break;
    case 'auth/cancelled-popup-request':
      message = 'Sign-in was cancelled.';
      break;
    case 'auth/network-request-failed':
      message = 'Network error. Please check your connection.';
      break;
    default:
      message = error.message || message;
  }

  return new Error(message);
}

/**
 * Set up authentication state observer
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Function} Unsubscribe function
 */
function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          callback({
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            role: userData.role,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            preferences: userData.preferences,
            favorites: userData.favorites || []
          });
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Error in auth state observer:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

// Export functions
window.authModule = {
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  checkUserRole,
  getUserRole,
  updateUserProfile,
  sendPasswordReset,
  onAuthStateChanged
};


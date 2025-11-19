/**
 * Profile Module
 * 
 * Handles provider profile management including fetching, updating,
 * image uploads, and favorites functionality.
 * 
 * Requirements: 3.2, 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2, 9.3
 */

/**
 * Get provider profile by ID
 * @param {string} providerId - Provider ID
 * @param {boolean} showLoading - Whether to show loading indicator (default: true)
 * @returns {Promise<Object>} Provider profile data
 */
async function getProviderProfile(providerId, showLoading = true) {
  // Show skeleton loading for profile content
  const profileContainer = document.getElementById('profile-content');
  if (showLoading && profileContainer && window.LoadingIndicator) {
    window.LoadingIndicator.showSkeleton(profileContainer, {
      type: 'card',
      count: 1
    });
  }

  try {
    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    // Track Firestore query performance
    const stopTracking = window.PerformanceMonitoring 
      ? window.PerformanceMonitoring.trackFirestoreQuery('providers', 'read')
      : null;

    const providerDoc = await db.collection('providers').doc(providerId).get();
    
    // Stop performance tracking
    if (stopTracking) {
      stopTracking();
    }

    if (!providerDoc.exists) {
      throw new Error('Provider not found');
    }

    const providerData = providerDoc.data();

    // Track profile view in analytics
    if (window.Analytics) {
      window.Analytics.trackProfileView(providerId, providerData.name, providerData.type);
    }

    return {
      id: providerDoc.id,
      ...providerData
    };

  } catch (error) {
    console.error('Error fetching provider profile:', error);
    throw new Error('Failed to load provider profile. Please try again.');
  } finally {
    // Hide skeleton loading
    if (showLoading && profileContainer && window.LoadingIndicator) {
      window.LoadingIndicator.hideSkeleton(profileContainer);
    }
  }
}

/**
 * Update provider profile
 * @param {string} providerId - Provider ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<void>}
 */
async function updateProviderProfile(providerId, updates) {
  try {
    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    // Validate user is authenticated and owns this profile
    const currentUser = await authModule.getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be signed in to update a profile');
    }

    // Check if user owns this profile or is admin
    const providerDoc = await db.collection('providers').doc(providerId).get();
    if (!providerDoc.exists) {
      throw new Error('Provider not found');
    }

    const providerData = providerDoc.data();
    if (providerData.ownerId !== currentUser.uid && currentUser.role !== 'admin') {
      throw new Error('You do not have permission to update this profile');
    }

    // Validate required fields
    const validationErrors = validateProfileData(updates);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Prepare update data
    const updateData = {
      ...updates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Update Firestore document
    await db.collection('providers').doc(providerId).update(updateData);

    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('update_provider_profile', {
        provider_id: providerId
      });
    }

  } catch (error) {
    console.error('Error updating provider profile:', error);
    throw error;
  }
}

/**
 * Validate profile data
 * @param {Object} data - Profile data to validate
 * @returns {Array<string>} Array of validation error messages
 */
function validateProfileData(data) {
  const errors = [];

  // Validate name
  if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
    errors.push('Provider name is required');
  }

  // Validate phone
  if (data.phone !== undefined && data.phone) {
    if (!Utils.isValidPhone(data.phone)) {
      errors.push('Invalid phone number format');
    }
  }

  // Validate email
  if (data.email !== undefined && data.email) {
    if (!Utils.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }
  }

  // Validate type
  if (data.type !== undefined) {
    const validTypes = ['clinic', 'hospital', 'doctor', 'pharmacy', 'lab'];
    if (!validTypes.includes(data.type)) {
      errors.push('Invalid provider type');
    }
  }

  // Validate location
  if (data.location !== undefined && data.location) {
    if (!data.location.lat || !data.location.lng) {
      errors.push('Location must include latitude and longitude');
    }
    if (typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number') {
      errors.push('Location coordinates must be numbers');
    }
  }

  // Validate hours
  if (data.hours !== undefined && data.hours) {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of validDays) {
      if (data.hours[day] && (!data.hours[day].open || !data.hours[day].close)) {
        errors.push(`Invalid hours for ${day}`);
      }
    }
  }

  return errors;
}

/**
 * Upload profile image to Firebase Storage
 * @param {File} file - Image file to upload
 * @param {string} providerId - Provider ID
 * @param {HTMLElement} progressContainer - Optional container for progress bar
 * @returns {Promise<string>} URL of uploaded image
 */
async function uploadProfileImage(file, providerId, progressContainer = null) {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    // Validate user is authenticated
    const currentUser = await authModule.getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be signed in to upload images');
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image');
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Compress image before upload using performance module if available
    const compressedFile = window.performanceOptimization && window.performanceOptimization.optimizeImage
      ? await window.performanceOptimization.optimizeImage(file)
      : await compressImage(file);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Show progress bar if container provided
    let progressBar = null;
    if (progressContainer && window.LoadingIndicator) {
      progressBar = window.LoadingIndicator.showProgress(progressContainer, 0, {
        label: 'Uploading image...',
        showPercentage: true
      });
    }

    // Upload to Firebase Storage
    const storageRef = storage.ref(`provider-images/${providerId}/${filename}`);
    const uploadTask = storageRef.put(compressedFile);

    // Return promise that resolves with download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress monitoring
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
          
          // Update progress bar
          if (progressBar && window.LoadingIndicator) {
            window.LoadingIndicator.updateProgress(progressBar, progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          
          // Hide progress bar on error
          if (progressContainer && window.LoadingIndicator) {
            window.LoadingIndicator.hideProgress(progressContainer);
          }
          
          reject(new Error('Failed to upload image. Please try again.'));
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

            // Log analytics event
            if (window.analytics) {
              analytics.logEvent('upload_provider_image', {
                provider_id: providerId,
                file_size: compressedFile.size
              });
            }

            // Hide progress bar on success
            if (progressContainer && window.LoadingIndicator) {
              setTimeout(() => {
                window.LoadingIndicator.hideProgress(progressContainer);
              }, 500);
            }

            resolve(downloadURL);
          } catch (error) {
            // Hide progress bar on error
            if (progressContainer && window.LoadingIndicator) {
              window.LoadingIndicator.hideProgress(progressContainer);
            }
            
            reject(error);
          }
        }
      );
    });

  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
}

/**
 * Compress image before upload
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width (default 1200)
 * @param {number} maxHeight - Maximum height (default 1200)
 * @param {number} quality - Compression quality 0-1 (default 0.8)
 * @returns {Promise<Blob>} Compressed image blob
 */
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Delete profile image from Firebase Storage
 * @param {string} imageUrl - URL of image to delete
 * @returns {Promise<void>}
 */
async function deleteProfileImage(imageUrl) {
  try {
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    // Validate user is authenticated
    const currentUser = await authModule.getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be signed in to delete images');
    }

    // Create reference from URL
    const imageRef = storage.refFromURL(imageUrl);

    // Delete the file
    await imageRef.delete();

    console.log('Image deleted successfully');

  } catch (error) {
    console.error('Error deleting profile image:', error);
    throw new Error('Failed to delete image. Please try again.');
  }
}

/**
 * Toggle favorite status for a provider
 * @param {string} providerId - Provider ID
 * @returns {Promise<boolean>} New favorite status (true if added, false if removed)
 */
async function toggleFavorite(providerId) {
  try {
    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    // Validate user is authenticated
    const currentUser = await authModule.getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be signed in to favorite providers');
    }

    // Get current user document
    const userRef = db.collection('users').doc(currentUser.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data();
    const favorites = userData.favorites || [];

    // Check if provider is already favorited
    const isFavorited = favorites.includes(providerId);

    let newFavorites;
    if (isFavorited) {
      // Remove from favorites
      newFavorites = favorites.filter(id => id !== providerId);
    } else {
      // Add to favorites
      newFavorites = [...favorites, providerId];
    }

    // Update user document
    await userRef.update({
      favorites: newFavorites,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Track favorite action in analytics
    if (window.Analytics) {
      window.Analytics.trackFavorite(providerId, isFavorited ? 'remove' : 'add');
    }

    return !isFavorited;

  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
}

/**
 * Get user's favorite providers
 * @returns {Promise<Array<Object>>} Array of favorite provider profiles
 */
async function getFavoriteProviders() {
  try {
    // Validate user is authenticated
    const currentUser = await authModule.getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be signed in to view favorites');
    }

    // Get user's favorites list
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    if (!userDoc.exists) {
      return [];
    }

    const userData = userDoc.data();
    const favorites = userData.favorites || [];

    if (favorites.length === 0) {
      return [];
    }

    // Fetch all favorite providers
    // Firestore 'in' query supports up to 10 items, so batch if needed
    const batchSize = 10;
    const batches = [];

    for (let i = 0; i < favorites.length; i += batchSize) {
      const batch = favorites.slice(i, i + batchSize);
      const query = db.collection('providers')
        .where(firebase.firestore.FieldPath.documentId(), 'in', batch);
      batches.push(query.get());
    }

    const results = await Promise.all(batches);
    const providers = [];

    results.forEach(snapshot => {
      snapshot.forEach(doc => {
        providers.push({
          id: doc.id,
          ...doc.data()
        });
      });
    });

    return providers;

  } catch (error) {
    console.error('Error fetching favorite providers:', error);
    throw new Error('Failed to load favorite providers. Please try again.');
  }
}

/**
 * Check if a provider is favorited by current user
 * @param {string} providerId - Provider ID
 * @returns {Promise<boolean>} True if favorited
 */
async function isFavorited(providerId) {
  try {
    const currentUser = await authModule.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    if (!userDoc.exists) {
      return false;
    }

    const userData = userDoc.data();
    const favorites = userData.favorites || [];

    return favorites.includes(providerId);

  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
}

/**
 * Calculate profile completion percentage
 * @param {Object} profile - Provider profile data
 * @returns {number} Completion percentage (0-100)
 */
function calculateProfileCompletion(profile) {
  const fields = [
    'name',
    'type',
    'phone',
    'email',
    'address',
    'location',
    'hours',
    'specialty',
    'description',
    'images'
  ];

  let completedFields = 0;

  fields.forEach(field => {
    if (profile[field]) {
      if (field === 'images' && Array.isArray(profile[field])) {
        if (profile[field].length > 0) completedFields++;
      } else if (field === 'address' && typeof profile[field] === 'object') {
        if (profile[field].street && profile[field].city) completedFields++;
      } else if (field === 'location' && typeof profile[field] === 'object') {
        if (profile[field].lat && profile[field].lng) completedFields++;
      } else if (field === 'hours' && typeof profile[field] === 'object') {
        if (Object.keys(profile[field]).length > 0) completedFields++;
      } else {
        completedFields++;
      }
    }
  });

  return Math.round((completedFields / fields.length) * 100);
}

// Export functions
window.profileModule = {
  getProviderProfile,
  updateProviderProfile,
  validateProfileData,
  uploadProfileImage,
  compressImage,
  deleteProfileImage,
  toggleFavorite,
  getFavoriteProviders,
  isFavorited,
  calculateProfileCompletion
};

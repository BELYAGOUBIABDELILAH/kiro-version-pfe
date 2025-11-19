/**
 * Ads Module
 * 
 * Handles medical ads creation, moderation, and display
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 14.5
 */

/**
 * Submit a new medical ad (verified providers only)
 * @param {Object} adData - Ad data including content, type, dates
 * @returns {Promise<Object>} Created ad object
 */
async function submitAd(adData) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user) {
      throw new Error('You must be signed in to create an ad');
    }
    
    if (user.role !== 'provider') {
      throw new Error('Only providers can create ads');
    }
    
    // Get provider profile to check verification status
    const providerSnapshot = await db.collection('providers')
      .where('ownerId', '==', user.uid)
      .limit(1)
      .get();
    
    if (providerSnapshot.empty) {
      throw new Error('Provider profile not found');
    }
    
    const providerDoc = providerSnapshot.docs[0];
    const providerData = providerDoc.data();
    
    // Restrict ad creation to verified providers only
    if (!providerData.verified) {
      throw new Error('Only verified providers can create ads. Please request verification first.');
    }
    
    // Validate ad data
    if (!adData.type || !['text', 'image'].includes(adData.type)) {
      throw new Error('Invalid ad type. Must be "text" or "image"');
    }
    
    if (!adData.content || adData.content.trim() === '') {
      throw new Error('Ad content is required');
    }
    
    if (!adData.startDate || !adData.endDate) {
      throw new Error('Start and end dates are required');
    }
    
    // Validate dates
    const startDate = new Date(adData.startDate);
    const endDate = new Date(adData.endDate);
    const now = new Date();
    
    if (startDate < now) {
      throw new Error('Start date cannot be in the past');
    }
    
    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }
    
    // Create ad document
    const adDocument = {
      providerId: providerDoc.id,
      providerName: providerData.name,
      userId: user.uid,
      type: adData.type,
      content: adData.content,
      title: adData.title || '',
      description: adData.description || '',
      displayLocations: adData.displayLocations || ['homepage', 'search'],
      status: 'pending',
      startDate: firebase.firestore.Timestamp.fromDate(startDate),
      endDate: firebase.firestore.Timestamp.fromDate(endDate),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null
    };
    
    // Add to Firestore
    const adRef = await db.collection('ads').add(adDocument);
    
    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('ad_created', {
        ad_id: adRef.id,
        provider_id: providerDoc.id,
        ad_type: adData.type
      });
    }
    
    return {
      id: adRef.id,
      ...adDocument
    };
    
  } catch (error) {
    console.error('Error submitting ad:', error);
    throw error;
  }
}

/**
 * Upload ad image to Firebase Storage
 * @param {File} file - Image file
 * @param {string} providerId - Provider ID
 * @returns {Promise<string>} Download URL
 */
async function uploadAdImage(file, providerId) {
  try {
    if (!file) {
      throw new Error('No file provided');
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image');
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${extension}`;
    
    // Upload to Firebase Storage
    const storageRef = storage.ref(`ad-images/${providerId}/${filename}`);
    const uploadTask = await storageRef.put(file);
    const downloadURL = await uploadTask.ref.getDownloadURL();
    
    return downloadURL;
    
  } catch (error) {
    console.error('Error uploading ad image:', error);
    throw error;
  }
}

/**
 * Get ads for current provider
 * @returns {Promise<Array>} Array of provider's ads
 */
async function getProviderAds() {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user) {
      throw new Error('You must be signed in');
    }
    
    const snapshot = await db.collection('ads')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const ads = [];
    snapshot.forEach(doc => {
      ads.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return ads;
    
  } catch (error) {
    console.error('Error getting provider ads:', error);
    throw error;
  }
}

/**
 * Get pending ads for moderation (admin only)
 * @returns {Promise<Array>} Array of pending ads
 */
async function getPendingAds() {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can access pending ads');
    }
    
    const snapshot = await db.collection('ads')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'asc')
      .get();
    
    const ads = [];
    snapshot.forEach(doc => {
      ads.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return ads;
    
  } catch (error) {
    console.error('Error getting pending ads:', error);
    throw error;
  }
}

/**
 * Moderate an ad (admin only)
 * @param {string} adId - Ad ID
 * @param {string} action - 'approve' or 'reject'
 * @param {string} reason - Rejection reason (required if rejecting)
 * @returns {Promise<void>}
 */
async function moderateAd(adId, action, reason = null) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can moderate ads');
    }
    
    if (!['approve', 'reject'].includes(action)) {
      throw new Error('Invalid action. Must be "approve" or "reject"');
    }
    
    if (action === 'reject' && (!reason || reason.trim() === '')) {
      throw new Error('Rejection reason is required');
    }
    
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy: user.uid,
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (action === 'reject') {
      updateData.rejectionReason = reason;
    }
    
    await db.collection('ads').doc(adId).update(updateData);
    
    // TODO: Send notification to provider
    // This would typically be done via Cloud Functions
    
    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('ad_moderated', {
        ad_id: adId,
        action: action
      });
    }
    
  } catch (error) {
    console.error('Error moderating ad:', error);
    throw error;
  }
}

/**
 * Get approved ads for display
 * @param {Array<string>} locations - Display locations to filter by
 * @returns {Promise<Array>} Array of approved ads
 */
async function getApprovedAds(locations = ['homepage', 'search']) {
  try {
    const now = firebase.firestore.Timestamp.now();
    
    const snapshot = await db.collection('ads')
      .where('status', '==', 'approved')
      .where('startDate', '<=', now)
      .where('endDate', '>=', now)
      .get();
    
    const ads = [];
    snapshot.forEach(doc => {
      const adData = doc.data();
      // Filter by display locations
      const hasMatchingLocation = locations.some(loc => 
        adData.displayLocations && adData.displayLocations.includes(loc)
      );
      
      if (hasMatchingLocation) {
        ads.push({
          id: doc.id,
          ...adData
        });
      }
    });
    
    // Shuffle ads for rotation
    return shuffleArray(ads);
    
  } catch (error) {
    console.error('Error getting approved ads:', error);
    return [];
  }
}

/**
 * Shuffle array for ad rotation
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Delete an ad
 * @param {string} adId - Ad ID
 * @returns {Promise<void>}
 */
async function deleteAd(adId) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user) {
      throw new Error('You must be signed in');
    }
    
    // Get ad to check ownership
    const adDoc = await db.collection('ads').doc(adId).get();
    
    if (!adDoc.exists) {
      throw new Error('Ad not found');
    }
    
    const adData = adDoc.data();
    
    // Check if user owns this ad or is admin
    if (adData.userId !== user.uid && user.role !== 'admin') {
      throw new Error('You do not have permission to delete this ad');
    }
    
    await db.collection('ads').doc(adId).delete();
    
    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('ad_deleted', {
        ad_id: adId
      });
    }
    
  } catch (error) {
    console.error('Error deleting ad:', error);
    throw error;
  }
}

/**
 * Inject ads into search results
 * @param {Array} results - Array of search results
 * @param {number} frequency - Insert ad every N results (default 3)
 * @returns {Promise<Array>} Results with ads injected
 */
async function injectAdsIntoResults(results, frequency = 3) {
  try {
    const ads = await getApprovedAds(['search']);
    
    if (ads.length === 0) {
      return results;
    }
    
    const resultsWithAds = [];
    let adIndex = 0;
    
    results.forEach((result, index) => {
      resultsWithAds.push(result);
      
      // Insert ad after every N results
      if ((index + 1) % frequency === 0 && adIndex < ads.length) {
        resultsWithAds.push({
          isAd: true,
          ...ads[adIndex]
        });
        adIndex = (adIndex + 1) % ads.length; // Rotate through ads
      }
    });
    
    return resultsWithAds;
    
  } catch (error) {
    console.error('Error injecting ads:', error);
    return results;
  }
}

/**
 * Render ad card HTML
 * @param {Object} ad - Ad object
 * @returns {string} HTML string
 */
function renderAdCard(ad) {
  let html = `
    <div class="card border-primary mb-3 shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="badge bg-primary">Sponsored</span>
        </div>
  `;
  
  if (ad.type === 'text') {
    html += `
        <h5 class="card-title">${ad.title || 'Untitled'}</h5>
        <p class="card-text">${ad.description || ad.content || ''}</p>
    `;
  } else if (ad.type === 'image') {
    html += `
        <div class="text-center">
          <img src="${ad.content}" class="img-fluid mb-2" style="max-height: 200px; object-fit: contain;" alt="${ad.title}">
          <h5 class="card-title">${ad.title || 'Untitled'}</h5>
          ${ad.description ? `<p class="card-text">${ad.description}</p>` : ''}
        </div>
    `;
  }
  
  html += `
      </div>
    </div>
  `;
  
  return html;
}

// Export functions
window.adsModule = {
  submitAd,
  uploadAdImage,
  getProviderAds,
  getPendingAds,
  moderateAd,
  getApprovedAds,
  deleteAd,
  injectAdsIntoResults,
  renderAdCard
};

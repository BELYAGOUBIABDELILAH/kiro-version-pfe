/**
 * Admin Module
 * 
 * Handles administrative functions and moderation
 * Requirements: 10.1, 10.2, 10.3, 10.5, 13.1, 13.2, 13.3, 13.4, 13.5, 12.1, 12.2, 12.3, 12.4, 12.5
 */

/**
 * Submit a verification request for a provider
 * @param {string} providerId - Provider ID
 * @param {Array<File>} documents - Array of document files to upload
 * @param {string} type - Type of verification: 'new' or 'claim'
 * @returns {Promise<Object>} Verification request object
 */
async function submitVerificationRequest(providerId, documents = [], type = 'new') {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user) {
      throw new Error('You must be signed in to submit a verification request');
    }
    
    if (user.role !== 'provider') {
      throw new Error('Only providers can submit verification requests');
    }
    
    // Validate inputs
    if (!providerId) {
      throw new Error('Provider ID is required');
    }
    
    if (!['new', 'claim'].includes(type)) {
      throw new Error('Invalid verification type');
    }
    
    // Upload documents to Firebase Storage
    const documentUrls = [];
    
    for (let i = 0; i < documents.length; i++) {
      const file = documents[i];
      
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`File ${file.name} exceeds 5MB limit`);
      }
      
      // Upload to Storage
      const storageRef = storage.ref(`verification-documents/${providerId}/${Date.now()}_${file.name}`);
      const uploadTask = await storageRef.put(file);
      const downloadUrl = await uploadTask.ref.getDownloadURL();
      
      documentUrls.push(downloadUrl);
    }
    
    // Create verification request in Firestore
    const verificationData = {
      providerId: providerId,
      userId: user.uid,
      type: type,
      documents: documentUrls,
      status: 'pending',
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      reviewedBy: null,
      reviewedAt: null,
      denialReason: null
    };
    
    const verificationRef = await db.collection('verifications').add(verificationData);
    
    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('verification_request_submitted', {
        provider_id: providerId,
        type: type,
        document_count: documentUrls.length
      });
    }
    
    return {
      id: verificationRef.id,
      ...verificationData
    };
    
  } catch (error) {
    console.error('Error submitting verification request:', error);
    throw error;
  }
}

/**
 * Get verification requests for the current provider
 * @returns {Promise<Array>} Array of verification requests
 */
async function getProviderVerificationRequests() {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user) {
      throw new Error('You must be signed in');
    }
    
    const snapshot = await db.collection('verifications')
      .where('userId', '==', user.uid)
      .orderBy('submittedAt', 'desc')
      .get();
    
    const requests = [];
    snapshot.forEach(doc => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return requests;
    
  } catch (error) {
    console.error('Error getting verification requests:', error);
    throw error;
  }
}

/**
 * Get all pending verification requests (admin only)
 * @returns {Promise<Array>} Array of pending verification requests with provider details
 */
async function getVerificationQueue() {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can access the verification queue');
    }
    
    // Track Firestore query performance
    const stopTracking = window.PerformanceMonitoring 
      ? window.PerformanceMonitoring.trackFirestoreQuery('verifications', 'read')
      : null;
    
    const snapshot = await db.collection('verifications')
      .where('status', '==', 'pending')
      .orderBy('submittedAt', 'asc')
      .get();
    
    // Stop performance tracking
    if (stopTracking) stopTracking();
    
    const requests = [];
    
    for (const doc of snapshot.docs) {
      const verificationData = doc.data();
      
      // Get provider details
      let providerData = null;
      try {
        const providerDoc = await db.collection('providers').doc(verificationData.providerId).get();
        if (providerDoc.exists) {
          providerData = providerDoc.data();
        }
      } catch (error) {
        console.error('Error fetching provider data:', error);
      }
      
      requests.push({
        id: doc.id,
        ...verificationData,
        providerDetails: providerData
      });
    }
    
    return requests;
    
  } catch (error) {
    console.error('Error getting verification queue:', error);
    throw error;
  }
}

/**
 * Approve a verification request (admin only)
 * @param {string} verificationId - Verification request ID
 * @param {string} providerId - Provider ID
 * @returns {Promise<void>}
 */
async function approveVerification(verificationId, providerId) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can approve verification requests');
    }
    
    // Update verification request
    await db.collection('verifications').doc(verificationId).update({
      status: 'approved',
      reviewedBy: user.uid,
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Update provider verified status
    await db.collection('providers').doc(providerId).update({
      verified: true,
      verifiedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Get verification data to check type
    const verificationDoc = await db.collection('verifications').doc(verificationId).get();
    const verificationData = verificationDoc.data();
    
    // If this is a claim request, update claimed status
    if (verificationData.type === 'claim') {
      await db.collection('providers').doc(providerId).update({
        claimed: true,
        ownerId: verificationData.userId,
        claimedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // TODO: Send email notification to provider
    // This would typically be done via Cloud Functions
    
    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('verification_approved', {
        verification_id: verificationId,
        provider_id: providerId,
        type: verificationData.type
      });
    }
    
  } catch (error) {
    console.error('Error approving verification:', error);
    throw error;
  }
}

/**
 * Deny a verification request (admin only)
 * @param {string} verificationId - Verification request ID
 * @param {string} reason - Reason for denial
 * @returns {Promise<void>}
 */
async function denyVerification(verificationId, reason) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can deny verification requests');
    }
    
    if (!reason || reason.trim() === '') {
      throw new Error('Reason for denial is required');
    }
    
    // Update verification request
    await db.collection('verifications').doc(verificationId).update({
      status: 'denied',
      reviewedBy: user.uid,
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
      denialReason: reason
    });
    
    // TODO: Send email notification to provider with reason
    // This would typically be done via Cloud Functions
    
    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('verification_denied', {
        verification_id: verificationId
      });
    }
    
  } catch (error) {
    console.error('Error denying verification:', error);
    throw error;
  }
}

/**
 * Submit a profile claim request
 * @param {string} providerId - Provider ID to claim
 * @param {Array<File>} documents - Array of document files proving ownership
 * @returns {Promise<Object>} Verification request object
 */
async function claimProfile(providerId, documents = []) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user) {
      throw new Error('You must be signed in to claim a profile');
    }
    
    if (user.role !== 'provider') {
      throw new Error('Only providers can claim profiles');
    }
    
    // Check if profile exists and is claimable
    const providerDoc = await db.collection('providers').doc(providerId).get();
    
    if (!providerDoc.exists) {
      throw new Error('Provider profile not found');
    }
    
    const providerData = providerDoc.data();
    
    if (providerData.claimed) {
      throw new Error('This profile has already been claimed');
    }
    
    if (!providerData.preloaded) {
      throw new Error('This profile is not available for claiming');
    }
    
    // Submit verification request with type 'claim'
    return await submitVerificationRequest(providerId, documents, 'claim');
    
  } catch (error) {
    console.error('Error claiming profile:', error);
    throw error;
  }
}

/**
 * Get dashboard statistics (admin only)
 * @returns {Promise<Object>} Dashboard statistics
 */
async function getDashboardStats() {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can access dashboard statistics');
    }
    
    // Track dashboard stats loading performance
    const stopTracking = window.PerformanceMonitoring 
      ? window.PerformanceMonitoring.startTrace('admin_dashboard_stats')
      : null;
    
    // Get total providers
    const providersSnapshot = await db.collection('providers').get();
    const totalProviders = providersSnapshot.size;
    
    // Get verified providers
    const verifiedSnapshot = await db.collection('providers')
      .where('verified', '==', true)
      .get();
    const verifiedProviders = verifiedSnapshot.size;
    
    // Get pending verifications
    const pendingSnapshot = await db.collection('verifications')
      .where('status', '==', 'pending')
      .get();
    const pendingVerifications = pendingSnapshot.size;
    
    // Get claimed profiles
    const claimedSnapshot = await db.collection('providers')
      .where('claimed', '==', true)
      .get();
    const claimedProfiles = claimedSnapshot.size;
    
    // Get total users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    
    // Get active users (users who logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsersSnapshot = await db.collection('users')
      .where('lastLoginAt', '>=', firebase.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();
    const activeUsers = activeUsersSnapshot.size;
    
    // Get chatbot usage statistics
    let chatbotMessages = 0;
    let chatbotSessions = 0;
    try {
      const chatbotSnapshot = await db.collection('chatbot_sessions')
        .orderBy('createdAt', 'desc')
        .limit(1000)
        .get();
      chatbotSessions = chatbotSnapshot.size;
      
      // Count total messages
      chatbotSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.messageCount) {
          chatbotMessages += data.messageCount;
        }
      });
    } catch (error) {
      console.warn('Chatbot statistics not available:', error);
    }
    
    // Stop performance tracking
    if (stopTracking) {
      window.PerformanceMonitoring.stopTrace('admin_dashboard_stats');
    }
    
    return {
      totalProviders,
      verifiedProviders,
      unverifiedProviders: totalProviders - verifiedProviders,
      pendingVerifications,
      claimedProfiles,
      totalUsers,
      activeUsers,
      chatbotMessages,
      chatbotSessions
    };
    
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    
    // Stop performance tracking on error
    if (stopTracking) {
      window.PerformanceMonitoring.stopTrace('admin_dashboard_stats');
    }
    
    throw error;
  }
}

/**
 * Get all providers with search and filters (admin only)
 * @param {Object} options - Search and filter options
 * @param {Array<string>} options.fields - Specific fields to retrieve (optional)
 * @returns {Promise<Array>} Array of providers
 */
async function getAllProviders(options = {}) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can access all providers');
    }
    
    // Track Firestore query performance
    const stopTracking = window.PerformanceMonitoring 
      ? window.PerformanceMonitoring.trackFirestoreQuery('providers', 'admin_read')
      : null;
    
    let query = db.collection('providers');
    
    // Apply filters
    if (options.verified !== undefined) {
      query = query.where('verified', '==', options.verified);
    }
    
    if (options.claimed !== undefined) {
      query = query.where('claimed', '==', options.claimed);
    }
    
    if (options.type) {
      query = query.where('type', '==', options.type);
    }
    
    // Order by creation date
    query = query.orderBy('createdAt', 'desc');
    
    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    const providers = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // If specific fields requested, return only those fields
      if (options.fields && Array.isArray(options.fields)) {
        const filteredData = { id: doc.id };
        options.fields.forEach(field => {
          if (data[field] !== undefined) {
            filteredData[field] = data[field];
          }
        });
        providers.push(filteredData);
      } else {
        providers.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    // Apply search filter on client side (for name search)
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      return providers.filter(p => 
        (p.name && p.name.toLowerCase().includes(searchLower)) ||
        (p.nameAr && p.nameAr.includes(options.search)) ||
        (p.nameFr && p.nameFr.toLowerCase().includes(searchLower))
      );
    }
    
    // Stop performance tracking
    if (stopTracking) stopTracking();
    
    return providers;
    
  } catch (error) {
    console.error('Error getting all providers:', error);
    
    // Stop performance tracking on error
    if (stopTracking) stopTracking();
    
    throw error;
  }
}

/**
 * Create a new provider profile (admin only)
 * @param {Object} providerData - Provider data
 * @returns {Promise<string>} Provider ID
 */
async function createProvider(providerData) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can create provider profiles');
    }
    
    // Validate required fields
    if (!providerData.name || !providerData.type) {
      throw new Error('Provider name and type are required');
    }
    
    // Add metadata
    const newProvider = {
      ...providerData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: user.uid,
      verified: providerData.verified || false,
      claimed: providerData.claimed || false,
      preloaded: providerData.preloaded || false
    };
    
    const docRef = await db.collection('providers').add(newProvider);
    
    // Log change
    await logAdminChange({
      action: 'create_provider',
      providerId: docRef.id,
      adminId: user.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      data: newProvider
    });
    
    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('admin_create_provider', {
        provider_id: docRef.id,
        provider_type: providerData.type
      });
    }
    
    return docRef.id;
    
  } catch (error) {
    console.error('Error creating provider:', error);
    throw error;
  }
}

/**
 * Update a provider profile (admin only)
 * @param {string} providerId - Provider ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
async function updateProvider(providerId, updates) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can update provider profiles');
    }
    
    // Get current provider data for logging
    const providerDoc = await db.collection('providers').doc(providerId).get();
    const oldData = providerDoc.data();
    
    // Add update metadata
    const updateData = {
      ...updates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.uid
    };
    
    await db.collection('providers').doc(providerId).update(updateData);
    
    // Log change
    await logAdminChange({
      action: 'update_provider',
      providerId: providerId,
      adminId: user.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      oldData: oldData,
      newData: updates
    });
    
    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('admin_update_provider', {
        provider_id: providerId
      });
    }
    
  } catch (error) {
    console.error('Error updating provider:', error);
    throw error;
  }
}

/**
 * Delete a provider profile (admin only)
 * @param {string} providerId - Provider ID
 * @returns {Promise<void>}
 */
async function deleteProvider(providerId) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can delete provider profiles');
    }
    
    // Get provider data for logging
    const providerDoc = await db.collection('providers').doc(providerId).get();
    const providerData = providerDoc.data();
    
    // Delete provider
    await db.collection('providers').doc(providerId).delete();
    
    // Log change
    await logAdminChange({
      action: 'delete_provider',
      providerId: providerId,
      adminId: user.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      data: providerData
    });
    
    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('admin_delete_provider', {
        provider_id: providerId
      });
    }
    
  } catch (error) {
    console.error('Error deleting provider:', error);
    throw error;
  }
}

/**
 * Log admin changes for audit trail
 * @param {Object} changeData - Change data
 * @returns {Promise<void>}
 */
async function logAdminChange(changeData) {
  try {
    await db.collection('admin_logs').add(changeData);
  } catch (error) {
    console.error('Error logging admin change:', error);
    // Don't throw error, just log it
  }
}

/**
 * Get system data (account types, specialties, service categories)
 * @returns {Promise<Object>} System data
 */
async function getSystemData() {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can access system data');
    }
    
    const systemDoc = await db.collection('system').doc('data').get();
    
    if (!systemDoc.exists) {
      // Return default data if not exists
      return {
        accountTypes: ['clinic', 'hospital', 'doctor', 'pharmacy', 'lab'],
        specialties: [
          'General Medicine',
          'Cardiology',
          'Dermatology',
          'Pediatrics',
          'Orthopedics',
          'Neurology',
          'Psychiatry',
          'Ophthalmology',
          'ENT',
          'Dentistry'
        ],
        serviceCategories: [
          'Consultation',
          'Emergency',
          'Surgery',
          'Diagnostics',
          'Pharmacy',
          'Laboratory'
        ]
      };
    }
    
    return systemDoc.data();
    
  } catch (error) {
    console.error('Error getting system data:', error);
    throw error;
  }
}

/**
 * Update system data (admin only)
 * @param {Object} systemData - System data to update
 * @returns {Promise<void>}
 */
async function updateSystemData(systemData) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can update system data');
    }
    
    await db.collection('system').doc('data').set({
      ...systemData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.uid
    }, { merge: true });
    
    // Log change
    await logAdminChange({
      action: 'update_system_data',
      adminId: user.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      data: systemData
    });
    
    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('admin_update_system_data');
    }
    
  } catch (error) {
    console.error('Error updating system data:', error);
    throw error;
  }
}

/**
 * Add account type (admin only)
 * @param {string} accountType - Account type to add
 * @returns {Promise<void>}
 */
async function addAccountType(accountType) {
  try {
    const systemData = await getSystemData();
    
    if (!systemData.accountTypes) {
      systemData.accountTypes = [];
    }
    
    if (systemData.accountTypes.includes(accountType)) {
      throw new Error('Account type already exists');
    }
    
    systemData.accountTypes.push(accountType);
    await updateSystemData(systemData);
    
  } catch (error) {
    console.error('Error adding account type:', error);
    throw error;
  }
}

/**
 * Remove account type (admin only)
 * @param {string} accountType - Account type to remove
 * @returns {Promise<void>}
 */
async function removeAccountType(accountType) {
  try {
    const systemData = await getSystemData();
    
    if (!systemData.accountTypes) {
      throw new Error('No account types found');
    }
    
    systemData.accountTypes = systemData.accountTypes.filter(t => t !== accountType);
    await updateSystemData(systemData);
    
  } catch (error) {
    console.error('Error removing account type:', error);
    throw error;
  }
}

/**
 * Add specialty (admin only)
 * @param {string} specialty - Specialty to add
 * @returns {Promise<void>}
 */
async function addSpecialty(specialty) {
  try {
    const systemData = await getSystemData();
    
    if (!systemData.specialties) {
      systemData.specialties = [];
    }
    
    if (systemData.specialties.includes(specialty)) {
      throw new Error('Specialty already exists');
    }
    
    systemData.specialties.push(specialty);
    await updateSystemData(systemData);
    
  } catch (error) {
    console.error('Error adding specialty:', error);
    throw error;
  }
}

/**
 * Remove specialty (admin only)
 * @param {string} specialty - Specialty to remove
 * @returns {Promise<void>}
 */
async function removeSpecialty(specialty) {
  try {
    const systemData = await getSystemData();
    
    if (!systemData.specialties) {
      throw new Error('No specialties found');
    }
    
    systemData.specialties = systemData.specialties.filter(s => s !== specialty);
    await updateSystemData(systemData);
    
  } catch (error) {
    console.error('Error removing specialty:', error);
    throw error;
  }
}

/**
 * Add service category (admin only)
 * @param {string} category - Service category to add
 * @returns {Promise<void>}
 */
async function addServiceCategory(category) {
  try {
    const systemData = await getSystemData();
    
    if (!systemData.serviceCategories) {
      systemData.serviceCategories = [];
    }
    
    if (systemData.serviceCategories.includes(category)) {
      throw new Error('Service category already exists');
    }
    
    systemData.serviceCategories.push(category);
    await updateSystemData(systemData);
    
  } catch (error) {
    console.error('Error adding service category:', error);
    throw error;
  }
}

/**
 * Remove service category (admin only)
 * @param {string} category - Service category to remove
 * @returns {Promise<void>}
 */
async function removeServiceCategory(category) {
  try {
    const systemData = await getSystemData();
    
    if (!systemData.serviceCategories) {
      throw new Error('No service categories found');
    }
    
    systemData.serviceCategories = systemData.serviceCategories.filter(c => c !== category);
    await updateSystemData(systemData);
    
  } catch (error) {
    console.error('Error removing service category:', error);
    throw error;
  }
}

/**
 * Bulk import providers from CSV data (admin only)
 * Uses batch operations for better performance
 * @param {string} csvText - CSV text content
 * @returns {Promise<Object>} Import results with success and error counts
 */
async function bulkImportProviders(csvText) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can bulk import providers');
    }
    
    // Parse CSV
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate required fields
    const requiredFields = ['name', 'type'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    const results = {
      total: lines.length - 1,
      success: 0,
      errors: [],
      imported: []
    };
    
    // Prepare provider data for batch operations
    const providersToImport = [];
    
    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length === 0 || values[0] === '') {
          continue; // Skip empty lines
        }
        
        // Build provider object
        const provider = {};
        headers.forEach((header, index) => {
          if (values[index]) {
            provider[header] = values[index];
          }
        });
        
        // Validate required fields
        if (!provider.name || !provider.type) {
          results.errors.push({
            row: i + 1,
            error: 'Missing required fields (name, type)'
          });
          continue;
        }
        
        // Validate provider type
        const validTypes = ['clinic', 'hospital', 'doctor', 'pharmacy', 'lab'];
        if (!validTypes.includes(provider.type.toLowerCase())) {
          results.errors.push({
            row: i + 1,
            error: `Invalid provider type: ${provider.type}`
          });
          continue;
        }
        
        // Build provider data
        const providerData = {
          name: provider.name,
          type: provider.type.toLowerCase(),
          phone: provider.phone || '',
          specialty: provider.specialty || '',
          address: {
            street: provider.address || provider.street || '',
            city: provider.city || 'Sidi Bel Abbès',
            wilaya: provider.wilaya || 'Sidi Bel Abbès'
          },
          verified: true, // Preloaded profiles are verified
          claimed: false,
          preloaded: true,
          accessibility: provider.accessibility === 'true' || provider.accessibility === '1',
          homeVisits: provider.homevisits === 'true' || provider.homevisits === '1',
          available24_7: provider.available24_7 === 'true' || provider.available24_7 === '1',
          rating: provider.rating ? parseFloat(provider.rating) : 0,
          viewCount: 0,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: user.uid
        };
        
        // Add location if provided
        if (provider.latitude && provider.longitude) {
          providerData.location = {
            lat: parseFloat(provider.latitude),
            lng: parseFloat(provider.longitude)
          };
        }
        
        providersToImport.push({
          row: i + 1,
          data: providerData
        });
        
      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }
    
    // Use batch operations for better performance (max 500 per batch)
    const batchSize = 500;
    
    for (let i = 0; i < providersToImport.length; i += batchSize) {
      const chunk = providersToImport.slice(i, i + batchSize);
      const batch = db.batch();
      
      chunk.forEach(item => {
        const docRef = db.collection('providers').doc();
        batch.set(docRef, item.data);
        
        results.imported.push({
          id: docRef.id,
          name: item.data.name
        });
      });
      
      try {
        await batch.commit();
        results.success += chunk.length;
      } catch (error) {
        console.error('Batch commit error:', error);
        chunk.forEach(item => {
          results.errors.push({
            row: item.row,
            error: error.message
          });
        });
      }
    }
    
    // Log bulk import
    await logAdminChange({
      action: 'bulk_import_providers',
      adminId: user.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      results: {
        total: results.total,
        success: results.success,
        errors: results.errors.length
      }
    });
    
    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('admin_bulk_import', {
        total: results.total,
        success: results.success,
        errors: results.errors.length
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('Error bulk importing providers:', error);
    throw error;
  }
}

/**
 * Batch delete multiple providers (admin only)
 * @param {Array<string>} providerIds - Array of provider IDs to delete
 * @returns {Promise<Object>} Result with success and error counts
 */
async function batchDeleteProviders(providerIds) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can batch delete providers');
    }
    
    if (!providerIds || providerIds.length === 0) {
      return { success: 0, errors: [] };
    }
    
    const results = {
      success: 0,
      errors: []
    };
    
    // Firestore batch has a limit of 500 operations
    const batchSize = 500;
    
    for (let i = 0; i < providerIds.length; i += batchSize) {
      const chunk = providerIds.slice(i, i + batchSize);
      const batch = db.batch();
      
      chunk.forEach(id => {
        const docRef = db.collection('providers').doc(id);
        batch.delete(docRef);
      });
      
      try {
        await batch.commit();
        results.success += chunk.length;
        
        // Log each deletion
        await logAdminChange({
          action: 'batch_delete_providers',
          adminId: user.uid,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          providerIds: chunk
        });
      } catch (error) {
        console.error('Batch delete error:', error);
        chunk.forEach(id => {
          results.errors.push({
            id: id,
            error: error.message
          });
        });
      }
    }
    
    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('admin_batch_delete', {
        total: providerIds.length,
        success: results.success,
        errors: results.errors.length
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('Error batch deleting providers:', error);
    throw error;
  }
}

/**
 * Batch update multiple providers (admin only)
 * @param {Array<Object>} updates - Array of {id, data} objects
 * @returns {Promise<Object>} Result with success and error counts
 */
async function batchUpdateProviders(updates) {
  try {
    const user = await authModule.getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can batch update providers');
    }
    
    if (!updates || updates.length === 0) {
      return { success: 0, errors: [] };
    }
    
    const results = {
      success: 0,
      errors: []
    };
    
    // Firestore batch has a limit of 500 operations
    const batchSize = 500;
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const chunk = updates.slice(i, i + batchSize);
      const batch = db.batch();
      
      chunk.forEach(update => {
        const docRef = db.collection('providers').doc(update.id);
        batch.update(docRef, {
          ...update.data,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedBy: user.uid
        });
      });
      
      try {
        await batch.commit();
        results.success += chunk.length;
      } catch (error) {
        console.error('Batch update error:', error);
        chunk.forEach(update => {
          results.errors.push({
            id: update.id,
            error: error.message
          });
        });
      }
    }
    
    // Log batch update
    await logAdminChange({
      action: 'batch_update_providers',
      adminId: user.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      results: {
        total: updates.length,
        success: results.success,
        errors: results.errors.length
      }
    });
    
    // Log analytics event
    if (window.analytics) {
      analytics.logEvent('admin_batch_update', {
        total: updates.length,
        success: results.success,
        errors: results.errors.length
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('Error batch updating providers:', error);
    throw error;
  }
}

// Export functions
window.adminModule = {
  submitVerificationRequest,
  getProviderVerificationRequests,
  getVerificationQueue,
  approveVerification,
  denyVerification,
  claimProfile,
  getDashboardStats,
  getAllProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  logAdminChange,
  bulkImportProviders,
  batchDeleteProviders,
  batchUpdateProviders,
  getSystemData,
  updateSystemData,
  addAccountType,
  removeAccountType,
  addSpecialty,
  removeSpecialty,
  addServiceCategory,
  removeServiceCategory
};

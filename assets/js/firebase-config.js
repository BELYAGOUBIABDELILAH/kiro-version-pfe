/**
 * Firebase Configuration and Initialization
 * 
 * This module initializes Firebase services including Authentication,
 * Firestore, Storage, and Analytics for the CityHealth platform.
 */

// Firebase configuration object
// TODO: Replace with your actual Firebase project configuration
// For now, using demo/placeholder config to allow app to run
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo",
  measurementId: "G-DEMO"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let analytics;
let performance;

try {
  // Check if using demo config
  if (firebaseConfig.apiKey === "demo-api-key") {
    console.warn('⚠️ Using demo Firebase config');
    console.warn('📖 To enable Firebase features, update firebase-config.js with your project credentials');
    console.warn('📚 See: https://console.firebase.google.com/');

    // Create mock Firebase objects for demo mode
    window.auth = {
      currentUser: null,
      onAuthStateChanged: (callback) => {
        callback(null);
        return () => { };
      },
      signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
      createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
      signOut: () => Promise.resolve()
    };

    window.db = {
      collection: () => ({
        get: () => Promise.resolve({ docs: [], empty: true }),
        where: () => ({ get: () => Promise.resolve({ docs: [], empty: true }) }),
        doc: () => ({
          get: () => Promise.resolve({ exists: false }),
          set: () => Promise.reject(new Error('Firebase not configured'))
        })
      })
    };

    window.storage = {
      ref: () => ({
        put: () => Promise.reject(new Error('Firebase not configured'))
      })
    };

    console.log('✅ Demo mode initialized (Firebase features disabled)');
  } else {
    // Initialize Firebase App with real config
    app = firebase.initializeApp(firebaseConfig);

    // Initialize Firebase services
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();

    // Initialize Analytics (optional, only if measurementId is provided)
    if (firebaseConfig.measurementId && firebaseConfig.measurementId !== 'G-DEMO') {
      analytics = firebase.analytics();
    }

    // Initialize Performance Monitoring
    if (typeof firebase.performance === 'function') {
      performance = firebase.performance();
    }

    // Configure Auth persistence
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .catch((error) => {
        console.error('Error setting auth persistence:', error);
      });

    console.log('✅ Firebase initialized successfully');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase:', error);
  console.warn('⚠️ Falling back to demo mode');

  // Fallback to demo mode
  window.auth = { currentUser: null, onAuthStateChanged: (cb) => { cb(null); return () => { }; } };
  window.db = { collection: () => ({ get: () => Promise.resolve({ docs: [], empty: true }) }) };
  window.storage = { ref: () => ({}) };
}

// Export Firebase services for use in other modules
window.firebaseApp = app;
window.auth = auth;
window.db = db;
window.storage = storage;
window.analytics = analytics;
window.performance = performance;

/**
 * Firebase Configuration for Snow Plow Tracker
 *
 * This module provides real-time database integration for syncing
 * plow locations between driver apps and the public map viewer.
 *
 * Setup Instructions:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (or use existing)
 * 3. Enable Realtime Database
 * 4. Copy your config from Project Settings > General > Your apps
 * 5. Paste the config below
 * 6. Set database rules to allow public read, authenticated write
 */

// Firebase Configuration
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Feature flag: Enable/disable Firebase
const FIREBASE_ENABLED = false; // Set to true after configuring Firebase

// Mock/Local Storage Mode (when Firebase is disabled)
class MockFirebaseDatabase {
    constructor() {
        this.listeners = new Map();
        this.data = this.loadFromLocalStorage();
        console.log('📦 Using LOCAL STORAGE mode (Firebase disabled)');
    }

    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('plow-tracker-data');
            return stored ? JSON.parse(stored) : { plows: {} };
        } catch (e) {
            return { plows: {} };
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('plow-tracker-data', JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    ref(path) {
        return new MockDatabaseRef(this, path);
    }

    notifyListeners(path) {
        this.listeners.forEach((callback, listenerPath) => {
            if (path.startsWith(listenerPath)) {
                const data = this.getDataAtPath(listenerPath);
                callback({ val: () => data });
            }
        });
    }

    getDataAtPath(path) {
        const parts = path.split('/').filter(p => p);
        let current = this.data;
        for (const part of parts) {
            current = current?.[part];
        }
        return current;
    }

    setDataAtPath(path, value) {
        const parts = path.split('/').filter(p => p);
        let current = this.data;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) current[part] = {};
            current = current[part];
        }
        current[parts[parts.length - 1]] = value;
        this.saveToLocalStorage();
        this.notifyListeners(path);
    }

    updateDataAtPath(path, updates) {
        const parts = path.split('/').filter(p => p);
        let current = this.data;
        for (const part of parts) {
            if (!current[part]) current[part] = {};
            current = current[part];
        }
        Object.assign(current, updates);
        this.saveToLocalStorage();
        this.notifyListeners(path);
    }
}

class MockDatabaseRef {
    constructor(db, path) {
        this.db = db;
        this.path = path;
    }

    set(value) {
        return Promise.resolve().then(() => {
            this.db.setDataAtPath(this.path, value);
            console.log(`✅ Saved to ${this.path}:`, value);
        });
    }

    update(updates) {
        return Promise.resolve().then(() => {
            this.db.updateDataAtPath(this.path, updates);
            console.log(`✅ Updated ${this.path}:`, updates);
        });
    }

    on(eventType, callback) {
        this.db.listeners.set(this.path, callback);
        // Immediately call with current data
        const currentData = this.db.getDataAtPath(this.path);
        callback({ val: () => currentData });
        console.log(`👂 Listening to ${this.path}`);
    }

    off(eventType, callback) {
        this.db.listeners.delete(this.path);
        console.log(`🔇 Stopped listening to ${this.path}`);
    }

    once(eventType) {
        return Promise.resolve({
            val: () => this.db.getDataAtPath(this.path)
        });
    }

    remove() {
        return Promise.resolve().then(() => {
            this.db.setDataAtPath(this.path, null);
            console.log(`🗑️ Removed ${this.path}`);
        });
    }
}

// Database instance (will be initialized below)
let database = null;

/**
 * Initialize Firebase or Mock Database
 */
export function initializeFirebase() {
    if (FIREBASE_ENABLED) {
        try {
            // Initialize Firebase (requires Firebase SDK loaded)
            if (typeof firebase === 'undefined') {
                console.error('❌ Firebase SDK not loaded. Add script tag to HTML:');
                console.error('<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js"></script>');
                console.error('<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js"></script>');
                return useMockDatabase();
            }

            firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            console.log('🔥 Firebase initialized successfully!');
            return database;
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            console.log('Falling back to local storage mode...');
            return useMockDatabase();
        }
    } else {
        return useMockDatabase();
    }
}

function useMockDatabase() {
    database = new MockFirebaseDatabase();
    return database;
}

/**
 * Get database instance
 */
export function getDatabase() {
    if (!database) {
        initializeFirebase();
    }
    return database;
}

/**
 * Update plow location in real-time
 */
export async function updatePlowLocation(plowId, locationData) {
    const db = getDatabase();
    const plowRef = db.ref(`plows/${plowId}`);

    try {
        await plowRef.update({
            ...locationData,
            lastUpdate: Date.now()
        });
        return true;
    } catch (error) {
        console.error('Error updating plow location:', error);
        return false;
    }
}

/**
 * Set plow as active/inactive
 */
export async function setPlowStatus(plowId, status, metadata = {}) {
    const db = getDatabase();
    const plowRef = db.ref(`plows/${plowId}`);

    try {
        await plowRef.update({
            status: status, // 'active', 'paused', 'offline'
            ...metadata,
            lastUpdate: Date.now()
        });
        return true;
    } catch (error) {
        console.error('Error updating plow status:', error);
        return false;
    }
}

/**
 * Listen to all plow locations (for map viewer)
 */
export function watchAllPlows(callback) {
    const db = getDatabase();
    const plowsRef = db.ref('plows');

    plowsRef.on('value', (snapshot) => {
        const plows = snapshot.val() || {};
        callback(plows);
    });

    // Return unsubscribe function
    return () => {
        plowsRef.off('value');
    };
}

/**
 * Listen to specific plow
 */
export function watchPlow(plowId, callback) {
    const db = getDatabase();
    const plowRef = db.ref(`plows/${plowId}`);

    plowRef.on('value', (snapshot) => {
        const plowData = snapshot.val();
        callback(plowData);
    });

    return () => {
        plowRef.off('value');
    };
}

/**
 * Remove plow from tracking
 */
export async function removePlow(plowId) {
    const db = getDatabase();
    const plowRef = db.ref(`plows/${plowId}`);

    try {
        await plowRef.remove();
        return true;
    } catch (error) {
        console.error('Error removing plow:', error);
        return false;
    }
}

/**
 * Get all active plows (one-time read)
 */
export async function getAllPlows() {
    const db = getDatabase();
    const plowsRef = db.ref('plows');

    try {
        const snapshot = await plowsRef.once('value');
        return snapshot.val() || {};
    } catch (error) {
        console.error('Error getting plows:', error);
        return {};
    }
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured() {
    return FIREBASE_ENABLED &&
           firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" &&
           firebaseConfig.databaseURL !== "https://your-project-default-rtdb.firebaseio.com";
}

/**
 * Get configuration status
 */
export function getConfigStatus() {
    return {
        firebaseEnabled: FIREBASE_ENABLED,
        configured: isFirebaseConfigured(),
        mode: FIREBASE_ENABLED && isFirebaseConfigured() ? 'Firebase' : 'Local Storage'
    };
}

// Export config for debugging
export { firebaseConfig, FIREBASE_ENABLED };

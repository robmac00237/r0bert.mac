/**
 * Snow Plow Driver App
 *
 * Mobile-friendly interface for plow drivers to share their
 * real-time GPS location while on duty.
 */

import {
    initializeFirebase,
    updatePlowLocation,
    setPlowStatus,
    removePlow,
    getConfigStatus
} from './firebase-config.js';

// App State
const state = {
    plowId: null,
    routeName: null,
    driverName: null,
    isTracking: false,
    isPaused: false,
    startTime: null,
    watchId: null,
    updateCount: 0,
    lastLocation: null
};

// Configuration
const CONFIG = {
    updateInterval: 15000, // Update every 15 seconds
    minAccuracy: 100, // Minimum GPS accuracy in meters
    enableHighAccuracy: true
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚜 Snow Plow Driver App Starting...');

    // Initialize Firebase
    initializeFirebase();
    const configStatus = getConfigStatus();
    console.log(`📡 Database Mode: ${configStatus.mode}`);

    // Check for existing session
    checkExistingSession();

    // Setup event listeners
    setupEventListeners();

    // Check GPS support
    checkGPSSupport();
});

/**
 * Check for existing active session
 */
function checkExistingSession() {
    const savedSession = localStorage.getItem('plow-driver-session');
    if (savedSession) {
        try {
            const session = JSON.parse(savedSession);
            // Check if session is less than 12 hours old
            if (Date.now() - session.startTime < 12 * 60 * 60 * 1000) {
                // Resume session
                if (confirm(`Resume previous shift as ${session.plowId}?`)) {
                    state.plowId = session.plowId;
                    state.routeName = session.routeName;
                    state.driverName = session.driverName;
                    state.startTime = session.startTime;
                    startTracking();
                    return;
                }
            }
        } catch (e) {
            console.error('Error loading session:', e);
        }
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Login screen
    document.getElementById('startBtn').addEventListener('click', handleStartShift);

    // Tracking screen
    document.getElementById('pauseBtn').addEventListener('click', handlePause);
    document.getElementById('resumeBtn').addEventListener('click', handleResume);
    document.getElementById('stopBtn').addEventListener('click', handleStop);

    // Handle page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Prevent sleep on mobile
    if ('wakeLock' in navigator) {
        requestWakeLock();
    }
}

/**
 * Check GPS support
 */
function checkGPSSupport() {
    if (!('geolocation' in navigator)) {
        alert('❌ GPS is not supported on this device. This app requires GPS to function.');
    }
}

/**
 * Handle start shift button
 */
async function handleStartShift() {
    const plowSelect = document.getElementById('plowSelect');
    const routeSelect = document.getElementById('routeSelect');
    const driverNameInput = document.getElementById('driverName');
    const errorDiv = document.getElementById('loginError');

    // Validate
    if (!plowSelect.value) {
        errorDiv.textContent = 'Please select a plow number';
        return;
    }

    if (!routeSelect.value) {
        errorDiv.textContent = 'Please select a route';
        return;
    }

    // Save state
    state.plowId = plowSelect.value;
    state.routeName = routeSelect.options[routeSelect.selectedIndex].text;
    state.driverName = driverNameInput.value || 'Anonymous Driver';
    state.startTime = Date.now();

    // Save session
    saveSession();

    // Start tracking
    await startTracking();
}

/**
 * Start GPS tracking
 */
async function startTracking() {
    state.isTracking = true;
    state.isPaused = false;

    // Switch to tracking screen
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('trackingScreen').classList.add('active');

    // Update UI
    document.getElementById('activePlowName').textContent = state.plowId.replace('-', ' #').toUpperCase();
    document.getElementById('activeRouteName').textContent = state.routeName;

    // Set plow status in database
    await setPlowStatus(state.plowId, 'active', {
        route: state.routeName,
        driverName: state.driverName,
        startTime: state.startTime
    });

    // Start GPS watch
    startGPSWatch();

    // Start timer
    startTimer();

    // Log activity
    addLogEntry('🚀 Shift started - GPS tracking active');
}

/**
 * Start GPS watch
 */
function startGPSWatch() {
    if (!navigator.geolocation) {
        addLogEntry('❌ GPS not available', 'error');
        return;
    }

    const options = {
        enableHighAccuracy: CONFIG.enableHighAccuracy,
        timeout: 10000,
        maximumAge: 0
    };

    state.watchId = navigator.geolocation.watchPosition(
        handleLocationSuccess,
        handleLocationError,
        options
    );

    addLogEntry('📡 GPS watch started');
}

/**
 * Handle successful location update
 */
async function handleLocationSuccess(position) {
    const { latitude, longitude, accuracy, speed, heading } = position.coords;

    // Update UI
    document.getElementById('currentLat').textContent = latitude.toFixed(6);
    document.getElementById('currentLng').textContent = longitude.toFixed(6);
    document.getElementById('accuracy').textContent = `${Math.round(accuracy)}m`;
    document.getElementById('speed').textContent = speed !== null ? `${Math.round(speed * 3.6)} km/h` : '--';
    document.getElementById('gpsStatus').textContent = accuracy < 50 ? '✅ Excellent' : accuracy < 100 ? '✅ Good' : '⚠️ Fair';
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();

    // Save location
    state.lastLocation = {
        latitude,
        longitude,
        accuracy,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: Date.now()
    };

    // Update database (if not paused)
    if (state.isTracking && !state.isPaused) {
        const success = await updatePlowLocation(state.plowId, {
            latitude,
            longitude,
            accuracy,
            speed: speed || 0,
            heading: heading || 0,
            route: state.routeName,
            driverName: state.driverName,
            status: 'active'
        });

        if (success) {
            state.updateCount++;
            document.getElementById('updateCount').textContent = state.updateCount;

            if (state.updateCount % 10 === 0) {
                addLogEntry(`✅ Sent ${state.updateCount} updates`);
            }
        }
    }
}

/**
 * Handle location error
 */
function handleLocationError(error) {
    let message = '';

    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = '❌ GPS permission denied';
            break;
        case error.POSITION_UNAVAILABLE:
            message = '⚠️ GPS position unavailable';
            break;
        case error.TIMEOUT:
            message = '⏱️ GPS timeout';
            break;
        default:
            message = '❌ GPS error';
    }

    document.getElementById('gpsStatus').textContent = message;
    addLogEntry(message, 'error');
}

/**
 * Handle pause
 */
async function handlePause() {
    state.isPaused = true;

    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('resumeBtn').style.display = 'block';

    await setPlowStatus(state.plowId, 'paused', {
        route: state.routeName,
        driverName: state.driverName
    });

    addLogEntry('⏸️ Tracking paused');
}

/**
 * Handle resume
 */
async function handleResume() {
    state.isPaused = false;

    document.getElementById('pauseBtn').style.display = 'block';
    document.getElementById('resumeBtn').style.display = 'none';

    await setPlowStatus(state.plowId, 'active', {
        route: state.routeName,
        driverName: state.driverName
    });

    addLogEntry('▶️ Tracking resumed');
}

/**
 * Handle stop shift
 */
async function handleStop() {
    if (!confirm('End your shift? This will stop GPS tracking.')) {
        return;
    }

    // Stop GPS watch
    if (state.watchId !== null) {
        navigator.geolocation.clearWatch(state.watchId);
        state.watchId = null;
    }

    // Update database
    await setPlowStatus(state.plowId, 'offline', {
        route: state.routeName,
        driverName: state.driverName,
        endTime: Date.now()
    });

    // Clear session
    localStorage.removeItem('plow-driver-session');

    // Show summary
    const duration = Math.floor((Date.now() - state.startTime) / 1000 / 60);
    alert(`Shift ended!\n\nDuration: ${duration} minutes\nUpdates sent: ${state.updateCount}`);

    // Reset and go back to login
    state.isTracking = false;
    location.reload();
}

/**
 * Start timer
 */
function startTimer() {
    setInterval(() => {
        if (state.isTracking && state.startTime) {
            const elapsed = Date.now() - state.startTime;
            const hours = Math.floor(elapsed / 1000 / 60 / 60);
            const minutes = Math.floor((elapsed / 1000 / 60) % 60);
            const seconds = Math.floor((elapsed / 1000) % 60);

            document.getElementById('activeTime').textContent =
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);
}

/**
 * Add log entry
 */
function addLogEntry(message, type = 'info') {
    const logDiv = document.getElementById('activityLog');
    const entry = document.createElement('p');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;

    logDiv.insertBefore(entry, logDiv.firstChild);

    // Keep only last 20 entries
    while (logDiv.children.length > 20) {
        logDiv.removeChild(logDiv.lastChild);
    }
}

/**
 * Save session to localStorage
 */
function saveSession() {
    const session = {
        plowId: state.plowId,
        routeName: state.routeName,
        driverName: state.driverName,
        startTime: state.startTime
    };

    localStorage.setItem('plow-driver-session', JSON.stringify(session));
}

/**
 * Handle visibility change (app goes to background)
 */
function handleVisibilityChange() {
    if (document.hidden) {
        addLogEntry('📱 App in background - tracking continues');
    } else {
        addLogEntry('📱 App in foreground');
    }
}

/**
 * Request wake lock to prevent screen sleep
 */
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            const wakeLock = await navigator.wakeLock.request('screen');
            addLogEntry('🔋 Screen wake lock active');

            wakeLock.addEventListener('release', () => {
                addLogEntry('🔋 Screen wake lock released');
            });
        }
    } catch (err) {
        console.log('Wake lock error:', err);
    }
}

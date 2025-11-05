/**
 * Snow Plow Map Viewer
 *
 * Public-facing map that displays real-time locations
 * of all active snow plows.
 */

import {
    initializeFirebase,
    watchAllPlows,
    getConfigStatus
} from './firebase-config.js';

// App State
const state = {
    plows: {},
    map: null,
    markers: {},
    mapReady: false,
    showMarkersEnabled: true
};

// Configuration
const CONFIG = {
    // Miramichi, NB coordinates
    defaultCenter: { lat: 47.0284, lng: -65.4988 },
    defaultZoom: 13,
    refreshInterval: 30000, // 30 seconds
    staleThreshold: 2 * 60 * 1000, // 2 minutes
    offlineThreshold: 10 * 60 * 1000 // 10 minutes
};

// Plow colors (for map markers)
const PLOW_COLORS = {
    'plow-1': '#ef4444', // red
    'plow-2': '#3b82f6', // blue
    'plow-3': '#10b981', // green
    'plow-4': '#f59e0b', // orange
    'plow-5': '#8b5cf6', // purple
    'plow-6': '#ec4899', // pink
    'plow-7': '#14b8a6'  // teal
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🗺️ Snow Plow Map Viewer Starting...');

    // Initialize Firebase
    initializeFirebase();
    const configStatus = getConfigStatus();
    console.log(`📡 Database Mode: ${configStatus.mode}`);

    // Show warning if using local storage
    if (configStatus.mode === 'Local Storage') {
        showLocalStorageWarning();
    }

    // Setup event listeners
    setupEventListeners();

    // Try to initialize Google Maps
    await initializeMap();

    // Start watching for plow updates
    startWatchingPlows();

    // Start periodic refresh
    startPeriodicRefresh();
});

/**
 * Initialize Google Maps
 */
async function initializeMap() {
    const mapDiv = document.getElementById('map');
    const loadingDiv = document.getElementById('mapLoading');
    const fallbackDiv = document.getElementById('noMapFallback');

    try {
        // Check if Google Maps is loaded
        if (typeof google === 'undefined' || !google.maps) {
            throw new Error('Google Maps not loaded');
        }

        // Create map
        state.map = new google.maps.Map(mapDiv, {
            center: CONFIG.defaultCenter,
            zoom: CONFIG.defaultZoom,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            styles: getMapStyles()
        });

        state.mapReady = true;
        loadingDiv.style.display = 'none';

        console.log('✅ Google Maps initialized');
    } catch (error) {
        console.log('⚠️ Google Maps unavailable, using text mode');
        loadingDiv.style.display = 'none';
        fallbackDiv.style.display = 'block';
        mapDiv.style.display = 'none';
    }
}

/**
 * Get custom map styles
 */
function getMapStyles() {
    return [
        {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
        }
    ];
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', handleRefresh);
    document.getElementById('centerBtn')?.addEventListener('click', handleCenterMap);
    document.getElementById('toggleMarkersBtn')?.addEventListener('click', handleToggleMarkers);
    document.getElementById('filterActive')?.addEventListener('change', handleFilterChange);
}

/**
 * Start watching all plows
 */
function startWatchingPlows() {
    watchAllPlows((plows) => {
        state.plows = plows;
        updateUI();
        updateMap();
        updateLastSync();
    });

    console.log('👂 Listening for plow updates...');
}

/**
 * Update UI with plow data
 */
function updateUI() {
    const plowList = document.getElementById('plowList');
    const activePlowCount = document.getElementById('activePlowCount');
    const filterActive = document.getElementById('filterActive')?.checked ?? true;

    // Count active plows
    const plowArray = Object.entries(state.plows);
    const activePlows = plowArray.filter(([id, data]) => isPlowActive(data));

    activePlowCount.textContent = activePlows.length;

    // Filter plows
    const filteredPlows = filterActive
        ? plowArray.filter(([id, data]) => isPlowActive(data) || isPlowStale(data))
        : plowArray;

    // Sort by last update
    filteredPlows.sort((a, b) => (b[1].lastUpdate || 0) - (a[1].lastUpdate || 0));

    // Render plow cards
    if (filteredPlows.length === 0) {
        plowList.innerHTML = `
            <div class="no-plows">
                <p>No active plows at this time.</p>
                <p class="help-text">Snow plows will appear here when drivers start their shifts.</p>
            </div>
        `;
    } else {
        plowList.innerHTML = filteredPlows.map(([id, data]) => createPlowCard(id, data)).join('');
    }

    // Update fallback list (if maps unavailable)
    updateFallbackList(filteredPlows);
}

/**
 * Create plow card HTML
 */
function createPlowCard(plowId, data) {
    const status = getPlowStatus(data);
    const lastSeen = getLastSeenText(data.lastUpdate);
    const color = PLOW_COLORS[plowId] || '#6b7280';

    return `
        <div class="plow-card status-${status}" data-plow-id="${plowId}">
            <div class="plow-header">
                <div class="plow-icon" style="background-color: ${color};">
                    🚜
                </div>
                <div class="plow-info">
                    <h3>${formatPlowName(plowId)}</h3>
                    <p class="plow-route">${data.route || 'Unknown Route'}</p>
                </div>
                <div class="plow-status-badge status-${status}">
                    ${status}
                </div>
            </div>
            <div class="plow-details">
                <div class="detail-row">
                    <span class="detail-label">Driver:</span>
                    <span class="detail-value">${data.driverName || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Last Seen:</span>
                    <span class="detail-value">${lastSeen}</span>
                </div>
                ${data.speed !== undefined ? `
                <div class="detail-row">
                    <span class="detail-label">Speed:</span>
                    <span class="detail-value">${Math.round(data.speed * 3.6)} km/h</span>
                </div>
                ` : ''}
                ${data.latitude && data.longitude ? `
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value coords">${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Update map with markers
 */
function updateMap() {
    if (!state.mapReady) return;

    // Remove old markers
    Object.values(state.markers).forEach(marker => marker.setMap(null));
    state.markers = {};

    // Add new markers
    Object.entries(state.plows).forEach(([plowId, data]) => {
        if (data.latitude && data.longitude) {
            const marker = createMarker(plowId, data);
            state.markers[plowId] = marker;
        }
    });
}

/**
 * Create map marker for plow
 */
function createMarker(plowId, data) {
    const position = { lat: data.latitude, lng: data.longitude };
    const color = PLOW_COLORS[plowId] || '#6b7280';
    const status = getPlowStatus(data);

    // Create custom icon
    const icon = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: color,
        fillOpacity: status === 'active' ? 1.0 : 0.5,
        strokeColor: '#ffffff',
        strokeWeight: 3
    };

    const marker = new google.maps.Marker({
        position: position,
        map: state.showMarkersEnabled ? state.map : null,
        title: formatPlowName(plowId),
        icon: icon,
        animation: status === 'active' ? google.maps.Animation.DROP : null
    });

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(plowId, data)
    });

    marker.addListener('click', () => {
        // Close other info windows
        Object.values(state.markers).forEach(m => {
            if (m.infoWindow) m.infoWindow.close();
        });
        infoWindow.open(state.map, marker);
    });

    marker.infoWindow = infoWindow;

    return marker;
}

/**
 * Create info window content
 */
function createInfoWindowContent(plowId, data) {
    const lastSeen = getLastSeenText(data.lastUpdate);

    return `
        <div class="map-info-window">
            <h3>${formatPlowName(plowId)}</h3>
            <p><strong>Route:</strong> ${data.route || 'Unknown'}</p>
            <p><strong>Driver:</strong> ${data.driverName || 'N/A'}</p>
            <p><strong>Speed:</strong> ${Math.round((data.speed || 0) * 3.6)} km/h</p>
            <p><strong>Last Update:</strong> ${lastSeen}</p>
        </div>
    `;
}

/**
 * Update fallback list (text mode)
 */
function updateFallbackList(plows) {
    const fallbackList = document.getElementById('fallbackList');
    if (!fallbackList) return;

    if (plows.length === 0) {
        fallbackList.innerHTML = '<p>No active plows.</p>';
        return;
    }

    fallbackList.innerHTML = plows.map(([id, data]) => `
        <div class="fallback-plow">
            <h4>${formatPlowName(id)} - ${data.route || 'Unknown Route'}</h4>
            <p>Driver: ${data.driverName || 'N/A'}</p>
            <p>Location: ${data.latitude?.toFixed(4)}, ${data.longitude?.toFixed(4)}</p>
            <p>Last Update: ${getLastSeenText(data.lastUpdate)}</p>
        </div>
    `).join('');
}

/**
 * Get plow status
 */
function getPlowStatus(data) {
    if (!data.lastUpdate) return 'offline';

    const timeSince = Date.now() - data.lastUpdate;

    if (data.status === 'paused') return 'paused';
    if (timeSince < CONFIG.staleThreshold) return 'active';
    if (timeSince < CONFIG.offlineThreshold) return 'stale';
    return 'offline';
}

/**
 * Check if plow is active
 */
function isPlowActive(data) {
    const status = getPlowStatus(data);
    return status === 'active';
}

/**
 * Check if plow is stale
 */
function isPlowStale(data) {
    const status = getPlowStatus(data);
    return status === 'stale';
}

/**
 * Get last seen text
 */
function getLastSeenText(timestamp) {
    if (!timestamp) return 'Never';

    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
}

/**
 * Format plow name
 */
function formatPlowName(plowId) {
    return plowId.replace('plow-', 'Plow #');
}

/**
 * Handle refresh button
 */
function handleRefresh() {
    console.log('🔄 Manual refresh triggered');
    updateUI();
    updateMap();
    updateLastSync();
}

/**
 * Handle center map button
 */
function handleCenterMap() {
    if (!state.mapReady) return;

    // If there are active plows, center on them
    const activePlows = Object.values(state.plows).filter(isPlowActive);

    if (activePlows.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        activePlows.forEach(plow => {
            if (plow.latitude && plow.longitude) {
                bounds.extend({ lat: plow.latitude, lng: plow.longitude });
            }
        });
        state.map.fitBounds(bounds);
    } else {
        // Center on default location
        state.map.setCenter(CONFIG.defaultCenter);
        state.map.setZoom(CONFIG.defaultZoom);
    }
}

/**
 * Handle toggle markers
 */
function handleToggleMarkers() {
    state.showMarkersEnabled = !state.showMarkersEnabled;

    Object.values(state.markers).forEach(marker => {
        marker.setMap(state.showMarkersEnabled ? state.map : null);
    });
}

/**
 * Handle filter change
 */
function handleFilterChange() {
    updateUI();
}

/**
 * Start periodic refresh
 */
function startPeriodicRefresh() {
    setInterval(() => {
        updateUI();
        updateLastSync();
    }, CONFIG.refreshInterval);
}

/**
 * Update last sync time
 */
function updateLastSync() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    document.getElementById('lastMapUpdate').textContent = timeString;
    document.getElementById('dbSyncTime').textContent = timeString;
}

/**
 * Show local storage warning
 */
function showLocalStorageWarning() {
    const notice = document.createElement('div');
    notice.className = 'local-storage-notice';
    notice.innerHTML = `
        <p>⚠️ <strong>Running in LOCAL STORAGE mode</strong></p>
        <p>Data is only visible on this device. Configure Firebase for multi-device sync.</p>
    `;
    document.body.insertBefore(notice, document.body.firstChild);
}

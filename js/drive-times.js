/* ==========================================
   DRIVE TIMES & TRAFFIC FEATURE
   Uses Google Maps API to calculate commute times
   ========================================== */

document.addEventListener('DOMContentLoaded', async function() {

    // Only run if we're on the dashboard page
    if (!document.getElementById('drive-times-tab')) {
        return;
    }

    let googleMapsLoaded = false;
    let geocodedAddresses = {}; // Cache geocoded addresses

    /* ------------------------------------------
       INITIALIZE
       ------------------------------------------ */

    async function init() {
        try {
            // Try to load Google Maps API
            await loadGoogleMapsAPI();
            googleMapsLoaded = true;
            console.log('Google Maps API loaded successfully');

            // Geocode any addresses that need it
            if (sessionStorage.getItem('needsGeocoding') === 'true') {
                await geocodeUserAddresses();
                sessionStorage.removeItem('needsGeocoding');
            }

            // Load drive times
            await loadDriveTimes();

        } catch (error) {
            console.warn('Google Maps not available:', error.message);
            // Show manual mode instead of setup instructions
            await showManualMode();
        }
    }

    /* ------------------------------------------
       GEOCODE USER ADDRESSES
       Converts addresses to latitude/longitude
       ------------------------------------------ */

    async function geocodeUserAddresses() {
        const currentUser = window.getCurrentUser();
        const profiles = await SecureStorage.getItem('userProfiles') || {};
        const profile = profiles[currentUser];

        if (!profile) return;

        const geocoder = new google.maps.Geocoder();

        // Geocode home address
        if (profile.homeAddress) {
            try {
                const homeResult = await geocodeAddress(geocoder, profile.homeAddress);
                profile.homeCoordinates = homeResult;
            } catch (error) {
                console.error('Failed to geocode home address:', error);
            }
        }

        // Geocode work address
        if (profile.workAddress) {
            try {
                const workResult = await geocodeAddress(geocoder, profile.workAddress);
                profile.workCoordinates = workResult;
            } catch (error) {
                console.error('Failed to geocode work address:', error);
            }
        }

        // Save updated profile
        profiles[currentUser] = profile;
        await SecureStorage.setItem('userProfiles', profiles);
    }

    /* ------------------------------------------
       GEOCODE ADDRESS HELPER
       ------------------------------------------ */

    function geocodeAddress(geocoder, address) {
        return new Promise((resolve, reject) => {
            geocoder.geocode({ address: address }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    resolve({
                        lat: location.lat(),
                        lng: location.lng(),
                        formatted_address: results[0].formatted_address
                    });
                } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                }
            });
        });
    }

    /* ------------------------------------------
       CALCULATE DRIVE TIME
       ------------------------------------------ */

    async function calculateDriveTime(origin, destination, departureTime = null) {
        if (!googleMapsLoaded) {
            throw new Error('Google Maps not loaded');
        }

        const service = new google.maps.DistanceMatrixService();

        const request = {
            origins: [origin],
            destinations: [destination],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL,
            drivingOptions: {
                departureTime: departureTime || new Date(),
                trafficModel: GOOGLE_MAPS_CONFIG.trafficModel
            }
        };

        return new Promise((resolve, reject) => {
            service.getDistanceMatrix(request, (response, status) => {
                if (status === 'OK') {
                    const result = response.rows[0].elements[0];

                    if (result.status === 'OK') {
                        resolve({
                            distance: result.distance.text,
                            distanceValue: result.distance.value, // in meters
                            duration: result.duration.text,
                            durationValue: result.duration.value, // in seconds
                            durationInTraffic: result.duration_in_traffic ? result.duration_in_traffic.text : null,
                            durationInTrafficValue: result.duration_in_traffic ? result.duration_in_traffic.value : null
                        });
                    } else {
                        reject(new Error(`Distance Matrix failed: ${result.status}`));
                    }
                } else {
                    reject(new Error(`Distance Matrix service failed: ${status}`));
                }
            });
        });
    }

    /* ------------------------------------------
       LOAD AND DISPLAY DRIVE TIMES
       ------------------------------------------ */

    async function loadDriveTimes() {
        const currentUser = window.getCurrentUser();
        const profiles = await SecureStorage.getItem('userProfiles') || {};
        const profile = profiles[currentUser];

        const driveTimesContainer = document.getElementById('drive-times-list');

        if (!profile || !profile.works || !profile.homeCoordinates || !profile.workCoordinates) {
            driveTimesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🚗</div>
                    <p>No commute information available</p>
                    <p style="font-size: 12px; margin-top: 5px;">Complete your profile setup to see drive times</p>
                </div>
            `;
            return;
        }

        driveTimesContainer.innerHTML = '<p style="text-align: center; color: #666;">Calculating drive times...</p>';

        try {
            // Calculate current drive time to work
            const toWork = await calculateDriveTime(
                profile.homeCoordinates,
                profile.workCoordinates
            );

            // Calculate return trip
            const toHome = await calculateDriveTime(
                profile.workCoordinates,
                profile.homeCoordinates
            );

            // Display results
            displayDriveTimeResults(profile, toWork, toHome);

        } catch (error) {
            console.error('Drive time calculation error:', error);
            driveTimesContainer.innerHTML = `
                <div class="error-message" style="display: block;">
                    Failed to calculate drive times. Please check your addresses and try again.
                </div>
            `;
        }
    }

    /* ------------------------------------------
       DISPLAY DRIVE TIME RESULTS
       ------------------------------------------ */

    function displayDriveTimeResults(profile, toWork, toHome) {
        const driveTimesContainer = document.getElementById('drive-times-list');

        const hasTraffic = toWork.durationInTraffic !== null;
        const trafficDelay = hasTraffic
            ? Math.round((toWork.durationInTrafficValue - toWork.durationValue) / 60)
            : 0;

        let trafficBadge = '';
        let trafficClass = '';

        if (hasTraffic) {
            if (trafficDelay > 10) {
                trafficBadge = '🔴 Heavy Traffic';
                trafficClass = 'traffic-heavy';
            } else if (trafficDelay > 5) {
                trafficBadge = '🟡 Moderate Traffic';
                trafficClass = 'traffic-moderate';
            } else {
                trafficBadge = '🟢 Light Traffic';
                trafficClass = 'traffic-light';
            }
        }

        driveTimesContainer.innerHTML = `
            <div class="drive-time-card">
                <h4>🏠 → 🏢 To Work</h4>
                <div class="drive-time-info">
                    <div class="drive-time-main">
                        <span class="time-value">${hasTraffic ? toWork.durationInTraffic : toWork.duration}</span>
                        <span class="distance-value">${toWork.distance}</span>
                    </div>
                    ${hasTraffic ? `
                        <div class="traffic-info ${trafficClass}">
                            ${trafficBadge}
                            ${trafficDelay > 0 ? `<span class="traffic-delay">+${trafficDelay} min delay</span>` : ''}
                        </div>
                    ` : ''}
                    <div class="drive-time-normal">
                        Normal drive time: ${toWork.duration}
                    </div>
                </div>

                ${profile.usualStartTime ? `
                    <div class="leave-time-suggestion">
                        ${calculateLeaveTime(profile.usualStartTime, toWork.durationInTrafficValue || toWork.durationValue, profile.prepTime)}
                    </div>
                ` : ''}
            </div>

            <div class="drive-time-card">
                <h4>🏢 → 🏠 To Home</h4>
                <div class="drive-time-info">
                    <div class="drive-time-main">
                        <span class="time-value">${hasTraffic ? toHome.durationInTraffic : toHome.duration}</span>
                        <span class="distance-value">${toHome.distance}</span>
                    </div>
                    <div class="drive-time-normal">
                        Normal drive time: ${toHome.duration}
                    </div>
                </div>
            </div>

            <button class="btn btn-primary" onclick="window.refreshDriveTimes()" style="margin-top: 15px;">
                🔄 Refresh Drive Times
            </button>
        `;
    }

    /* ------------------------------------------
       CALCULATE WHEN TO LEAVE
       ------------------------------------------ */

    function calculateLeaveTime(arrivalTime, driveDurationSeconds, prepTimeMinutes) {
        // Parse arrival time (HH:MM format)
        const [hours, minutes] = arrivalTime.split(':').map(Number);

        // Create date object for today at arrival time
        const arrivalDate = new Date();
        arrivalDate.setHours(hours, minutes, 0, 0);

        // Subtract drive time and prep time
        const totalMinutesToSubtract = Math.ceil(driveDurationSeconds / 60) + prepTimeMinutes;
        const leaveDate = new Date(arrivalDate.getTime() - (totalMinutesToSubtract * 60 * 1000));

        const leaveTime = leaveDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return `
            <div class="leave-suggestion">
                <span class="suggestion-icon">⏰</span>
                <span class="suggestion-text">
                    To arrive by ${window.formatTime(arrivalTime)}, leave by <strong>${leaveTime}</strong>
                    <br><small>(Includes ${prepTimeMinutes} min prep time)</small>
                </span>
            </div>
        `;
    }

    /* ------------------------------------------
       SHOW SETUP INSTRUCTIONS (if no API key)
       ------------------------------------------ */

    function showGoogleMapsSetupInstructions() {
        const driveTimesContainer = document.getElementById('drive-times-list');

        driveTimesContainer.innerHTML = `
            <div class="setup-instructions">
                <h4>📍 Google Maps Setup Required</h4>
                <p>To use drive time and traffic features, you need a Google Maps API key.</p>

                <div class="setup-steps">
                    <h5>Quick Setup (5 minutes):</h5>
                    <ol>
                        <li>Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                        <li>Create a new project</li>
                        <li>Enable these APIs:
                            <ul>
                                <li>Maps JavaScript API</li>
                                <li>Geocoding API</li>
                                <li>Distance Matrix API</li>
                            </ul>
                        </li>
                        <li>Create API credentials (API Key)</li>
                        <li>Open <code>js/maps-config.js</code> and paste your API key</li>
                        <li>Refresh this page</li>
                    </ol>
                </div>

                <div class="pricing-info">
                    <strong>💰 Cost:</strong> FREE for family use!<br>
                    Google provides $200/month free credit (more than enough for daily family use)
                </div>
            </div>
        `;
    }

    /* ------------------------------------------
       MANUAL MODE (NO API REQUIRED!)
       ------------------------------------------ */

    async function showManualMode() {
        const currentUser = window.getCurrentUser();
        const profiles = await SecureStorage.getItem('userProfiles') || {};
        const profile = profiles[currentUser];

        // Get saved manual commute data
        const manualCommutes = await SecureStorage.getItem('manualCommutes') || {};
        let userCommute = manualCommutes[currentUser] || {};

        // If no saved commute data, try to pre-fill from family config
        if (!userCommute.toWork && typeof getEstimatedCommute !== 'undefined') {
            const estimatedTime = getEstimatedCommute(currentUser);
            if (estimatedTime) {
                userCommute = {
                    toWork: estimatedTime,
                    toHome: estimatedTime + 2  // Assume return trip is slightly longer
                };
                console.log(`Pre-filled commute time: ${estimatedTime} minutes`);
            }
        }

        const driveTimesContainer = document.getElementById('drive-times-list');

        if (!profile || !profile.works) {
            driveTimesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🚗</div>
                    <p>No work information available</p>
                    <p style="font-size: 12px; margin-top: 5px;">Complete your profile setup first</p>
                </div>
            `;
            return;
        }

        driveTimesContainer.innerHTML = `
            <div class="manual-mode-notice">
                <h4>📝 Manual Drive Time Mode</h4>
                <p>Google Maps API not configured. Enter your typical commute times manually.</p>
            </div>

            <div class="drive-time-card">
                <h4>🏠 → 🏢 To Work</h4>
                <div class="manual-input-section">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Typical Drive Time (minutes)</label>
                            <input type="number" id="manual-to-work" class="form-control"
                                   value="${userCommute.toWork || ''}" placeholder="e.g., 25" min="1" max="180">
                        </div>
                        <div class="form-group">
                            <label>Distance (miles)</label>
                            <input type="number" id="manual-distance-work" class="form-control"
                                   value="${userCommute.distanceToWork || ''}" placeholder="e.g., 15" min="0.1" step="0.1">
                        </div>
                    </div>
                    ${profile.usualStartTime && userCommute.toWork ? `
                        <div class="leave-time-suggestion">
                            ${calculateLeaveTimeManual(profile.usualStartTime, userCommute.toWork, profile.prepTime)}
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="drive-time-card">
                <h4>🏢 → 🏠 To Home</h4>
                <div class="manual-input-section">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Typical Drive Time (minutes)</label>
                            <input type="number" id="manual-to-home" class="form-control"
                                   value="${userCommute.toHome || ''}" placeholder="e.g., 30" min="1" max="180">
                        </div>
                        <div class="form-group">
                            <label>Distance (miles)</label>
                            <input type="number" id="manual-distance-home" class="form-control"
                                   value="${userCommute.distanceToHome || ''}" placeholder="e.g., 15" min="0.1" step="0.1">
                        </div>
                    </div>
                </div>
            </div>

            <div class="manual-tips">
                <strong>💡 Tips:</strong>
                <ul>
                    <li>Check your commute during your typical work hours</li>
                    <li>Add 5-10 minutes for heavy traffic times</li>
                    <li>Update these values if you notice consistent changes</li>
                    <li>Use your phone's Maps app to get accurate times</li>
                </ul>
            </div>

            <button class="btn btn-primary" onclick="window.saveManualCommute()" style="margin-top: 15px;">
                💾 Save Commute Times
            </button>

            <div style="margin-top: 20px; padding: 15px; background: #f8f9ff; border-radius: 10px; border-left: 4px solid #667eea;">
                <strong>Want automatic traffic updates?</strong><br>
                <small>Add a Google Maps API key to <code>js/maps-config.js</code> when ready!</small>
            </div>
        `;
    }

    /* ------------------------------------------
       SAVE MANUAL COMMUTE DATA
       ------------------------------------------ */

    window.saveManualCommute = async function() {
        const toWork = parseInt(document.getElementById('manual-to-work').value);
        const toHome = parseInt(document.getElementById('manual-to-home').value);
        const distanceWork = parseFloat(document.getElementById('manual-distance-work').value);
        const distanceHome = parseFloat(document.getElementById('manual-distance-home').value);

        // Validation
        if (!toWork || toWork < 1) {
            alert('Please enter a valid drive time to work');
            return;
        }

        if (!toHome || toHome < 1) {
            alert('Please enter a valid drive time to home');
            return;
        }

        const currentUser = window.getCurrentUser();
        const manualCommutes = await SecureStorage.getItem('manualCommutes') || {};

        manualCommutes[currentUser] = {
            toWork: toWork,
            toHome: toHome,
            distanceToWork: distanceWork || null,
            distanceToHome: distanceHome || null,
            lastUpdated: new Date().toISOString()
        };

        await SecureStorage.setItem('manualCommutes', manualCommutes);

        window.showNotification('Commute times saved!');

        // Refresh display
        await showManualMode();
    };

    /* ------------------------------------------
       CALCULATE LEAVE TIME (MANUAL MODE)
       ------------------------------------------ */

    function calculateLeaveTimeManual(arrivalTime, driveTimeMinutes, prepTimeMinutes) {
        // Parse arrival time (HH:MM format)
        const [hours, minutes] = arrivalTime.split(':').map(Number);

        // Create date object for today at arrival time
        const arrivalDate = new Date();
        arrivalDate.setHours(hours, minutes, 0, 0);

        // Subtract drive time and prep time
        const totalMinutesToSubtract = driveTimeMinutes + prepTimeMinutes;
        const leaveDate = new Date(arrivalDate.getTime() - (totalMinutesToSubtract * 60 * 1000));

        const leaveTime = leaveDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return `
            <div class="leave-suggestion">
                <span class="suggestion-icon">⏰</span>
                <span class="suggestion-text">
                    To arrive by ${window.formatTime(arrivalTime)}, leave by <strong>${leaveTime}</strong>
                    <br><small>(Includes ${driveTimeMinutes} min drive + ${prepTimeMinutes} min prep time)</small>
                </span>
            </div>
        `;
    }

    /* ------------------------------------------
       MAKE REFRESH FUNCTION GLOBAL
       ------------------------------------------ */

    window.refreshDriveTimes = function() {
        if (googleMapsLoaded) {
            loadDriveTimes();
        } else {
            showManualMode();
        }
    };

    /* ------------------------------------------
       INITIALIZE ON TAB ACTIVATION
       ------------------------------------------ */

    // Listen for when drive times tab is clicked
    const driveTimesTab = document.querySelector('[data-tab="drive-times"]');
    if (driveTimesTab) {
        driveTimesTab.addEventListener('click', function() {
            if (!googleMapsLoaded) {
                init();
            }
        });
    }

    // Initialize if this is the active tab on page load
    const activeTab = localStorage.getItem('activeTab');
    if (activeTab === 'drive-times') {
        init();
    }
});

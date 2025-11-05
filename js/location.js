/* ==========================================
   LOCATION TRACKING SYSTEM
   Share location to show if at work or home
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {

    /* ------------------------------------------
       GET REFERENCES TO HTML ELEMENTS
       ------------------------------------------ */

    const shareLocationBtn = document.getElementById('share-location-btn');
    const locationStatus = document.getElementById('location-status');
    const locationsList = document.getElementById('locations-list');

    /* ------------------------------------------
       LOCATION STORAGE FUNCTIONS
       ------------------------------------------ */

    function getLocations() {
        const locations = localStorage.getItem('familyLocations');
        return locations ? JSON.parse(locations) : {};
    }

    function saveLocations(locations) {
        localStorage.setItem('familyLocations', JSON.stringify(locations));
    }

    /* ------------------------------------------
       DETERMINE LOCATION STATUS
       Uses browser's Geolocation API
       ------------------------------------------ */

    function determineLocationStatus(lat, lon) {
        // In a real app, you would:
        // 1. Compare coordinates with saved home/work addresses
        // 2. Use a geocoding service to get actual address
        // 3. Calculate distance from known locations

        // For this demo, we'll use a simple approximation
        // You can enhance this by adding actual addresses later

        // For now, we'll just mark as "Location Shared"
        // You can extend this with actual address comparison
        return {
            status: 'Location Shared',
            latitude: lat,
            longitude: lon
        };
    }

    /* ------------------------------------------
       SHARE LOCATION FUNCTION
       ------------------------------------------ */

    function shareLocation() {
        // Check if browser supports geolocation
        if (!navigator.geolocation) {
            window.showNotification('Location sharing not supported by your browser', 'error');
            return;
        }

        // Show loading state
        shareLocationBtn.disabled = true;
        shareLocationBtn.textContent = '📍 Getting location...';
        locationStatus.textContent = 'Requesting location access...';

        // Request location from browser
        navigator.geolocation.getCurrentPosition(
            // SUCCESS callback
            function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Determine if at work or home
                const locationInfo = determineLocationStatus(lat, lon);

                // Get current user info
                const userId = window.getCurrentUser();
                const userName = window.getCurrentUserName();

                // Save location
                const locations = getLocations();
                locations[userId] = {
                    userName: userName,
                    ...locationInfo,
                    timestamp: new Date().toISOString()
                };
                saveLocations(locations);

                // Update UI
                shareLocationBtn.disabled = false;
                shareLocationBtn.textContent = '📍 Update My Location';
                locationStatus.textContent = 'Location shared successfully!';
                locationStatus.style.color = '#4CAF50';

                window.showNotification('Location shared with family!');

                // Refresh display
                displayLocations();
            },
            // ERROR callback
            function(error) {
                shareLocationBtn.disabled = false;
                shareLocationBtn.textContent = '📍 Share My Location';

                let errorMsg = 'Unable to get location';

                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = 'Location access denied. Please enable location permissions in your browser settings.';
                        locationStatus.textContent = 'Location access denied';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = 'Location information unavailable';
                        locationStatus.textContent = 'Location unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMsg = 'Location request timed out';
                        locationStatus.textContent = 'Request timed out';
                        break;
                }

                locationStatus.style.color = '#f44336';
                window.showNotification(errorMsg, 'error');
            },
            // OPTIONS
            {
                enableHighAccuracy: true, // Use GPS if available
                timeout: 10000, // Wait up to 10 seconds
                maximumAge: 300000 // Accept cached location up to 5 minutes old
            }
        );
    }

    /* ------------------------------------------
       CALCULATE TIME AGO
       ------------------------------------------ */

    function timeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const seconds = Math.floor((now - then) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    }

    /* ------------------------------------------
       SIMPLE LOCATION DETECTION
       This is a simplified version for the demo
       ------------------------------------------ */

    function getStatusBadge(location) {
        // Check if location was shared recently (within 8 hours)
        const now = new Date();
        const locationTime = new Date(location.timestamp);
        const hoursAgo = (now - locationTime) / (1000 * 60 * 60);

        if (hoursAgo > 8) {
            return {
                class: 'status-unknown',
                text: 'Location Stale'
            };
        }

        // For demo purposes, we'll just show "Active"
        // In a real app, you'd compare coordinates with saved addresses
        return {
            class: 'status-home',
            text: 'Location Active'
        };
    }

    /* ------------------------------------------
       DISPLAY LOCATIONS FUNCTION
       ------------------------------------------ */

    function displayLocations() {
        const locations = getLocations();
        const currentUserId = window.getCurrentUser();

        // Clear current display
        locationsList.innerHTML = '';

        // Get all users
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const userIds = Object.keys(users);

        // If no locations shared yet
        if (Object.keys(locations).length === 0) {
            locationsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📍</div>
                    <p>No locations shared yet</p>
                    <p style="font-size: 12px; margin-top: 5px;">Share your location to let family know where you are</p>
                </div>
            `;
            return;
        }

        // Display each family member
        userIds.forEach(userId => {
            const user = users[userId];
            const location = locations[userId];

            const cardDiv = document.createElement('div');
            cardDiv.className = 'location-card';

            if (location) {
                const badge = getStatusBadge(location);

                cardDiv.innerHTML = `
                    <div class="location-user-name">${user.name}</div>
                    <span class="location-status-badge ${badge.class}">${badge.text}</span>
                    <div class="location-time">${timeAgo(location.timestamp)}</div>
                `;
            } else {
                cardDiv.innerHTML = `
                    <div class="location-user-name">${user.name}</div>
                    <span class="location-status-badge status-unknown">Not Shared</span>
                    <div class="location-time">No location data</div>
                `;
            }

            locationsList.appendChild(cardDiv);
        });

        // Check if current user has shared location
        if (locations[currentUserId]) {
            locationStatus.textContent = `Last updated: ${timeAgo(locations[currentUserId].timestamp)}`;
            locationStatus.style.color = '#4CAF50';
            shareLocationBtn.textContent = '📍 Update My Location';
        }
    }

    /* ------------------------------------------
       EVENT LISTENERS
       ------------------------------------------ */

    shareLocationBtn.addEventListener('click', shareLocation);

    /* ------------------------------------------
       INITIALIZE ON PAGE LOAD
       ------------------------------------------ */

    displayLocations();

    // Refresh locations every 30 seconds
    setInterval(displayLocations, 30000);

});

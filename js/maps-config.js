/* ==========================================
   GOOGLE MAPS API CONFIGURATION
   ========================================== */

/*
 * HOW TO GET A GOOGLE MAPS API KEY:
 *
 * 1. Go to: https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable these APIs:
 *    - Maps JavaScript API
 *    - Geocoding API
 *    - Distance Matrix API
 *    - Directions API
 * 4. Go to "Credentials" → "Create Credentials" → "API Key"
 * 5. Copy your API key and paste it below
 * 6. IMPORTANT: Restrict your API key to your domain for security!
 *    (In production, restrict to your laptop's IP or domain)
 */

const GOOGLE_MAPS_CONFIG = {
    // Replace 'YOUR_API_KEY_HERE' with your actual Google Maps API key
    apiKey: 'YOUR_API_KEY_HERE',

    // API settings
    libraries: ['places', 'geometry'],

    // Default map settings
    defaultLocation: {
        lat: 40.7128,  // Default to New York City
        lng: -74.0060
    },

    // Traffic model for predictions
    // Options: 'best_guess', 'pessimistic', 'optimistic'
    trafficModel: 'best_guess'
};

/*
 * PRICING INFORMATION (as of 2024):
 *
 * Google Maps is FREE for:
 * - First $200 of usage per month
 * - For a family app, this is MORE than enough
 *
 * Typical family usage estimate:
 * - Geocoding: ~10 requests/day = $0.50/month
 * - Distance Matrix: ~50 requests/day = $2.50/month
 * - Total: ~$3/month (well within free tier!)
 *
 * You get $200 FREE credit every month!
 */

// Check if API key is configured
function isGoogleMapsConfigured() {
    return GOOGLE_MAPS_CONFIG.apiKey !== 'YOUR_API_KEY_HERE' &&
           GOOGLE_MAPS_CONFIG.apiKey.length > 0;
}

// Load Google Maps API
function loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
        if (!isGoogleMapsConfigured()) {
            console.warn('Google Maps API key not configured');
            reject(new Error('Google Maps API key not configured. Please add your API key in js/maps-config.js'));
            return;
        }

        // Check if already loaded
        if (window.google && window.google.maps) {
            resolve(window.google);
            return;
        }

        // Load the script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=${GOOGLE_MAPS_CONFIG.libraries.join(',')}`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            resolve(window.google);
        };

        script.onerror = () => {
            reject(new Error('Failed to load Google Maps API'));
        };

        document.head.appendChild(script);
    });
}

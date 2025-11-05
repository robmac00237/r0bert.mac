# Snow Plow GPS Tracker - Setup Guide

A real-time GPS tracking system for snow plows with driver mobile app and public map viewer.

## 🚜 What's Included

### 1. **Driver Mobile App** (`plow-driver.html`)
- Mobile-friendly interface for plow drivers
- Live GPS tracking with 15-second updates
- Route selection and driver identification
- Activity logging and statistics
- Pause/resume/end shift controls
- Works offline and can be installed as PWA

### 2. **Public Map Viewer** (`plow-map.html`)
- Real-time map showing all active plows
- Color-coded markers for each plow
- Status indicators (Active, Paused, Offline)
- Sidebar with detailed plow information
- Filters and refresh controls
- Works without login (public access)

### 3. **Firebase Integration** (`js/firebase-config.js`)
- Real-time database synchronization
- Automatic fallback to local storage mode
- Simple configuration setup
- No server required

---

## 🚀 Quick Start (Test Mode)

The system works **immediately** without any configuration using local storage mode!

### For Drivers:
1. Open `plow-driver.html` in your mobile browser
2. Select your plow number (Plow #1-5)
3. Choose your route (Downtown, North End, etc.)
4. Tap "Start Shift" - GPS tracking begins!
5. Optional: Install as app (Add to Home Screen)

### For Public Viewers:
1. Open `plow-map.html` in any browser
2. View active plows in the sidebar
3. See locations on map (if Google Maps configured)
4. Or view text-based list (works without maps)

**Note:** In test mode, data is stored locally and only visible on the same device. For multi-device sync, configure Firebase (see below).

---

## 📋 System Requirements

### Driver Mobile App:
- Modern smartphone (Android or iPhone)
- GPS/location services enabled
- Modern web browser (Chrome, Safari, Edge, Firefox)
- Internet connection (for data sync with Firebase)

### Public Map Viewer:
- Any device with web browser
- Internet connection
- Optional: Google Maps API key for map visualization

---

## ⚙️ Configuration Options

### Option 1: Local Storage Mode (DEFAULT - No Setup Required)
- **Pros:** Works immediately, no accounts needed, 100% free
- **Cons:** Data only visible on same device, no multi-device sync
- **Best For:** Testing, single-device demos, offline use

**How to use:** Just open the files - it works!

### Option 2: Firebase Mode (Recommended for Production)
- **Pros:** Real-time sync across all devices, drivers + public can see same data
- **Cons:** Requires 5-10 minutes setup, free tier limits
- **Best For:** Actual deployment, multiple plows, public access

**Setup Steps:**

#### 1. Create Firebase Project (FREE)
1. Go to https://console.firebase.google.com/
2. Click "Add Project"
3. Name it (e.g., "miramichi-plow-tracker")
4. Disable Google Analytics (not needed)
5. Click "Create Project"

#### 2. Enable Realtime Database
1. In left sidebar, click "Build" → "Realtime Database"
2. Click "Create Database"
3. Choose location (us-central1 is fine)
4. Start in **test mode** (for now)
5. Click "Enable"

#### 3. Set Database Rules
Click "Rules" tab and replace with:
```json
{
  "rules": {
    "plows": {
      ".read": true,
      "$plowId": {
        ".write": true
      }
    }
  }
}
```
This allows:
- Everyone can READ plow locations (public map)
- Anyone can WRITE to individual plow data (drivers)

**For production:** Add authentication to restrict writes to authorized drivers only.

#### 4. Get Your Config
1. Click gear icon (⚙️) → "Project Settings"
2. Scroll down to "Your apps"
3. Click web icon `</>`
4. Register app (name: "Plow Tracker")
5. Copy the `firebaseConfig` object

#### 5. Update firebase-config.js
Open `/js/firebase-config.js` and:

1. Replace the config (around line 20):
```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

2. Change this line to `true`:
```javascript
const FIREBASE_ENABLED = true; // Changed from false
```

#### 6. Add Firebase SDK
Add these script tags to **both** `plow-driver.html` and `plow-map.html` (before the closing `</body>` tag):

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>

<!-- Your app scripts (keep existing) -->
<script type="module" src="js/plow-driver.js"></script>
```

#### 7. Test It!
- Open driver app on one device
- Open map viewer on another device
- Start tracking - both should see updates in real-time!

---

## 🗺️ Google Maps Integration (Optional)

The public map viewer works in **two modes:**

### Text Mode (Default)
- Lists all active plows
- Shows coordinates and status
- Works without any API key
- **Always available as fallback**

### Map Mode (Enhanced)
- Visual map with markers
- Click markers for details
- Center/zoom controls
- Better user experience

**To Enable Map Mode:**

1. Get Google Maps API Key:
   - Go to https://console.cloud.google.com/
   - Create project or select existing
   - Enable these APIs:
     - Maps JavaScript API
     - Geocoding API (optional)
     - Distance Matrix API (optional)
   - Create credentials → API Key
   - Copy the key

2. Add to `plow-map.html`:
   Find this line (near bottom):
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places" async defer></script>
   ```
   Replace `YOUR_API_KEY_HERE` with your actual key.

**Cost:** Google Maps has generous free tier ($200/month credit). Typical usage for a small city would be **$0-5/month**.

---

## 📱 Installing as Mobile App (PWA)

### iPhone/iPad:
1. Open `plow-driver.html` in Safari
2. Tap Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on home screen!

### Android:
1. Open `plow-driver.html` in Chrome
2. Tap menu (⋮) → "Add to Home Screen" or "Install App"
3. Tap "Install"
4. App icon appears in app drawer!

**Benefits:**
- Launches like native app
- Hides browser UI
- Better full-screen experience
- Separate app switcher entry

---

## 🏗️ Customization

### Add More Plows
Edit `plow-driver.html` around line 28:
```html
<option value="plow-6">Plow #6</option>
<option value="plow-7">Plow #7</option>
```

Add corresponding colors in `js/plow-map.js` around line 34:
```javascript
const PLOW_COLORS = {
    'plow-1': '#ef4444', // red
    'plow-2': '#3b82f6', // blue
    // ... add more
    'plow-6': '#14b8a6', // teal
    'plow-7': '#f97316'  // orange
};
```

### Add More Routes
Edit `plow-driver.html` around line 36:
```html
<option value="commercial">Commercial District</option>
<option value="residential">Residential Areas</option>
```

### Change Update Frequency
Edit `js/plow-driver.js` around line 23:
```javascript
const CONFIG = {
    updateInterval: 15000, // milliseconds (15 sec default)
    minAccuracy: 100,
    enableHighAccuracy: true
};
```

Lower number = more frequent updates (uses more battery/data).

### Change City Location
Edit `js/plow-map.js` around line 23:
```javascript
const CONFIG = {
    // Replace with your city's coordinates
    defaultCenter: { lat: 47.0284, lng: -65.4988 }, // Miramichi, NB
    defaultZoom: 13
};
```

Use Google Maps to find your city's lat/lng.

---

## 🎨 Customization - Colors & Branding

### Change App Colors
Edit `css/plow.css` around line 14:
```css
:root {
    --primary: #1e40af;      /* Main blue color */
    --primary-dark: #1e3a8a; /* Darker shade */
    --success: #10b981;      /* Green for active */
    --warning: #f59e0b;      /* Orange for warnings */
    --danger: #ef4444;       /* Red for stop/offline */
}
```

### Change App Name
- `plow-driver.html`: Change `<title>` and `<h1>`
- `plow-map.html`: Change `<title>` and `<h1>`
- `plow-manifest.json`: Change `name` and `short_name`

---

## 🔧 Troubleshooting

### GPS Not Working (Driver App)
1. **Check browser permissions:**
   - Chrome: Settings → Site Settings → Location → Allow
   - Safari: Settings → Safari → Location → Allow
   - Firefox: Permissions → Location → Allow

2. **Check device location:**
   - iPhone: Settings → Privacy → Location Services → ON
   - Android: Settings → Location → ON

3. **Test outdoors:**
   - GPS works poorly indoors
   - Stand outside for better signal

### No Plows Showing (Map Viewer)
1. **Check if driver app is actually tracking:**
   - Driver must click "Start Shift"
   - GPS status should show "Excellent" or "Good"
   - "Last Update" should show recent time

2. **Check same database:**
   - Both apps must use same Firebase project OR
   - Both must be on same device (local storage mode)

3. **Clear cache and refresh:**
   - Hard refresh: Ctrl+Shift+R (PC) or Cmd+Shift+R (Mac)

### Firebase Not Syncing
1. **Verify config:**
   - Open browser console (F12)
   - Look for "🔥 Firebase initialized successfully!"
   - If not, check API key and config

2. **Check database rules:**
   - Firebase console → Database → Rules
   - Ensure `.read: true` for public access

3. **Check internet connection:**
   - Both devices need active internet
   - Cellular data or WiFi

### Map Not Loading
1. **Check Google Maps API key:**
   - Must be valid and unrestricted (or allow your domain)
   - Billing must be enabled (even for free tier)

2. **Fallback to text mode:**
   - App automatically shows text list if maps fail
   - Full functionality still works

### Battery Draining Fast
1. **Reduce update frequency:**
   - Edit `js/plow-driver.js` → increase `updateInterval`
   - Change from 15000 to 30000 (30 seconds)

2. **Use low power mode:**
   - Phone settings → Battery Saver / Low Power Mode
   - GPS will be slightly less accurate but usable

3. **Close other apps:**
   - Background apps compete for GPS
   - Close unused apps while plowing

---

## 📊 Understanding Status Indicators

### Driver App:
- **🟢 Actively Plowing** - Tracking is on, sending updates
- **⏸️ Paused** - Tracking paused (on break)
- **⏹️ Offline** - Shift ended or tracking stopped

### Map Viewer:
- **Active** (green) - Updated within last 2 minutes
- **Stale** (yellow) - Updated 2-10 minutes ago
- **Offline** (gray) - No update for 10+ minutes

---

## 📈 Scaling Up

### For Small Cities (5-10 plows):
- Firebase free tier is perfect
- No additional config needed
- Works great out of the box

### For Medium Cities (10-30 plows):
- Consider Firebase Spark plan (still free)
- Monitor usage in Firebase console
- Add authentication for drivers

### For Large Cities (30+ plows):
- Upgrade to Firebase Blaze (pay-as-you-go)
- Cost typically $5-20/month
- Add proper authentication system
- Consider dedicated domain

---

## 🔒 Security Recommendations

### For Testing:
- Current setup is fine
- Anyone can update any plow
- Acceptable for closed testing

### For Production:
1. **Add driver authentication:**
   - Use Firebase Authentication
   - Require login before tracking
   - Assign drivers to specific plows

2. **Lock down database rules:**
   ```json
   {
     "rules": {
       "plows": {
         ".read": true,
         "$plowId": {
           ".write": "auth != null && auth.uid == $plowId"
         }
       }
     }
   }
   ```

3. **Use HTTPS:**
   - Host on Firebase Hosting or similar
   - Never use HTTP for production

4. **API key restrictions:**
   - Restrict Google Maps key to your domain
   - Set up billing alerts

---

## 📁 File Structure

```
r0bert.mac/
├── plow-driver.html          # Driver mobile app (main interface)
├── plow-map.html             # Public map viewer
├── plow-manifest.json        # PWA configuration
├── css/
│   └── plow.css              # All styling for both apps
├── js/
│   ├── firebase-config.js    # Database configuration & sync
│   ├── plow-driver.js        # Driver app logic
│   └── plow-map.js           # Map viewer logic
└── PLOW-TRACKER-GUIDE.md     # This file!
```

---

## 🌐 Hosting Options

### Option 1: Local Network (Easiest)
1. Put files on computer
2. Start simple HTTP server:
   ```bash
   python -m http.server 8000
   ```
3. Access from phones on same WiFi: `http://YOUR-IP:8000/plow-driver.html`
4. **Best for:** Testing, small operations, no internet needed

### Option 2: Firebase Hosting (Recommended)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize: `firebase init hosting`
3. Deploy: `firebase deploy --only hosting`
4. Get URL: `your-project.web.app`
5. **Best for:** Public access, free HTTPS, automatic SSL

### Option 3: GitHub Pages (Free)
1. Create GitHub repo
2. Push files
3. Enable Pages in Settings
4. Access: `yourusername.github.io/repo-name/`
5. **Best for:** Public projects, version control, free hosting

### Option 4: Any Static Host
- Netlify, Vercel, Surge, etc.
- All work perfectly (static HTML/JS/CSS only)
- Most have generous free tiers

---

## 💡 Tips & Best Practices

### For Drivers:
- **Charge phone** before shift (tracking uses battery)
- **Keep screen on** occasionally to prevent sleep
- **Test GPS** before leaving garage
- **Use phone mount** - don't hold while driving
- **Pause tracking** during breaks to save battery
- **End shift** when done to stop tracking

### For Administrators:
- **Monitor Firebase usage** in console
- **Test regularly** with multiple devices
- **Backup config** (firebase-config.js settings)
- **Train drivers** on how to use app
- **Have fallback plan** (radio, phone calls) if system fails
- **Check map daily** to ensure working

### For Public:
- **Refresh page** if data seems old
- **Check timestamps** - plows may be offline
- **Don't rely solely on tracker** - conditions change
- **Report issues** to city officials if tracker is down

---

## 🎯 Next Steps

1. **Test in local storage mode** (works immediately)
2. **Set up Firebase** for real-time sync (10 minutes)
3. **Add Google Maps** for visual map (optional)
4. **Customize** routes and plow numbers
5. **Deploy** to hosting service
6. **Train drivers** on mobile app usage
7. **Share map URL** with public
8. **Monitor and iterate** based on feedback

---

## 📞 Support & Resources

- **Firebase Console:** https://console.firebase.google.com/
- **Google Cloud Console:** https://console.cloud.google.com/
- **Firebase Docs:** https://firebase.google.com/docs
- **Google Maps API Docs:** https://developers.google.com/maps

---

## 📄 License & Credits

This project is part of the MacDonald Family Scheduler app, adapted for municipal snow plow tracking.

Built with:
- Vanilla JavaScript (no frameworks)
- HTML5 Geolocation API
- Firebase Realtime Database
- Google Maps JavaScript API
- Progressive Web App (PWA) standards

---

**Happy Plowing! 🚜❄️**

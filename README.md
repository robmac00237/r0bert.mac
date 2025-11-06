# 👨‍👩‍👦 Family Scheduler & 🚜 Snow Plow Tracker

A collection of cross-platform web apps including:
- **Family Scheduler** - Coordinate schedules, share grocery lists, and stay connected
- **Snow Plow GPS Tracker** - Real-time tracking system for municipal snow plows

---

## 🚜 Snow Plow GPS Tracker

### Quick Links
- **[Driver App](plow-driver.html)** - For plow drivers to start tracking
- **[Live Map](plow-map.html)** - For residents to view active plows
- **[Landing Page](plow-index.html)** - Main portal for both drivers and public
- **[Setup Guide](PLOW-TRACKER-GUIDE.md)** - Complete installation and configuration guide

### What It Does
Real-time GPS tracking system designed for municipal snow plow operations:
- **Driver Mobile App** - Plow drivers share their live location while on duty
- **Public Map Viewer** - Residents see which streets are being plowed in real-time
- **Real-time Sync** - Updates every 15 seconds using Firebase or local storage
- **Works Offline** - No internet? Continues tracking and syncs when reconnected

### Key Features
- 📍 **Live GPS Tracking** - 15-second location updates with accuracy indicators
- 🗺️ **Interactive Map** - Color-coded markers for each plow with status badges
- 📱 **Mobile-Friendly** - Install as app on any smartphone (PWA)
- 🔋 **Battery Efficient** - Optimized GPS polling with wake lock
- 🌐 **Public Access** - No login required for viewing map
- 🔄 **Two Modes** - Local storage (test) or Firebase (production)
- 🚦 **Status Indicators** - Active, Paused, Stale, Offline states
- 📊 **Activity Logging** - Track shift duration, updates sent, GPS stats

### How It Works
1. **Drivers** open the app, select their plow number and route, tap "Start Shift"
2. **GPS tracking** begins automatically, sending location every 15 seconds
3. **Public map** shows all active plows with routes, speed, and last update time
4. **Real-time sync** via Firebase (or local storage for testing)

### Quick Start (Test Mode)
```bash
# 1. Start local server
python -m http.server 8000

# 2. Open driver app on phone
# Visit: http://YOUR-IP:8000/plow-driver.html

# 3. Open map viewer
# Visit: http://YOUR-IP:8000/plow-map.html
```

Works immediately with no setup! Uses local storage for testing.

### Production Setup
For real deployment with multi-device sync:
1. Set up Firebase Realtime Database (10 minutes, free)
2. Add Google Maps API key for visual map (optional)
3. Deploy to GitHub Pages, Netlify, or Firebase Hosting
4. Share map URL with residents

**See [PLOW-TRACKER-GUIDE.md](PLOW-TRACKER-GUIDE.md) for complete instructions.**

### Files
```
Plow Tracker Files:
├── plow-index.html         # Landing page with driver/public links
├── plow-driver.html        # Driver mobile app interface
├── plow-map.html           # Public map viewer
├── plow-manifest.json      # PWA configuration
├── css/
│   └── plow.css            # Styling for all plow apps
├── js/
│   ├── firebase-config.js  # Database sync (Firebase + local fallback)
│   ├── plow-driver.js      # Driver app logic & GPS tracking
│   └── plow-map.js         # Map viewer logic & real-time display
└── PLOW-TRACKER-GUIDE.md   # Complete setup & configuration guide
```

### Technology
- **HTML5 Geolocation API** - GPS tracking
- **Firebase Realtime Database** - Cross-device sync (optional)
- **Google Maps JavaScript API** - Map visualization (optional)
- **Service Workers** - Offline support & PWA features
- **Web Crypto API** - Secure data handling
- **Progressive Web App** - Install on any device

### Live Demo
Once deployed to GitHub Pages:
- **Driver Portal:** `https://robmac00237.github.io/r0bert.mac/plow-driver.html`
- **Public Map:** `https://robmac00237.github.io/r0bert.mac/plow-map.html`
- **Landing Page:** `https://robmac00237.github.io/r0bert.mac/plow-index.html`

---

## 👨‍👩‍👦 Family Scheduler

### Features

#### Core Features
- **User Authentication** - Secure 4-digit PIN login with encrypted data storage
- **First-Time Setup** - Guided questionnaire to collect user preferences and addresses
- **Work Schedule Calendar** - Share work shifts so everyone knows when you're busy
- **Drive Times & Traffic** - Real-time commute times with Google Maps traffic data
- **Smart Leave Reminders** - Calculate when to leave based on traffic and prep time
- **Shared Grocery List** - Add items with star ratings from family members
- **Location Sharing** - See where family members are (work, home, etc.)

### Technical Features
- **Encrypted Storage** - All data encrypted using Web Crypto API
- **Progressive Web App (PWA)** - Install on any device (Android, iOS, Windows, Mac, Linux)
- **Offline Support** - Works even without internet connection
- **Mobile-Friendly** - Responsive design for all screen sizes
- **Google Maps Integration** - Geocoding, distance matrix, and traffic APIs
- **Local Hosting Ready** - Can be self-hosted on old laptop (see LOCAL-HOSTING-GUIDE.md)

## Getting Started

### Quick Start

1. **Open the app**: Simply open `index.html` in a web browser
2. **First time login**:
   - Select your profile (Mom, Dad, Brother 1, Brother 2, or You)
   - Enter a 4-digit PIN of your choice
   - Click "Login" - your PIN will be saved for future logins
3. **Start using**: Add work schedules, create grocery lists, share location!

### Running Locally

You can run this app in several ways:

#### Option 1: Double-click (Simplest)
- Just double-click `index.html` to open in your browser

#### Option 2: Local Web Server (Recommended for testing PWA features)
```bash
# If you have Python installed:
python -m http.server 8000

# Or if you have Node.js:
npx http-server -p 8000

# Then open: http://localhost:8000
```

#### Option 3: VS Code Live Server
- Install the "Live Server" extension in VS Code
- Right-click `index.html` and select "Open with Live Server"

## How It Works

### Technology Stack

This app uses simple web technologies that you're learning:

- **HTML** - Structure of the pages
- **CSS** - Styling and responsive design
- **JavaScript** - All the interactive features
- **localStorage** - Stores data in your browser (no server needed!)
- **Service Workers** - Enables offline support and PWA features

### File Structure

```
r0bert.mac/
# Family Scheduler
├── index.html              # Login page
├── dashboard.html          # Main app page
├── setup.html              # First-time setup wizard
├── manifest.json           # PWA configuration
├── service-worker.js       # Offline support
├── css/
│   ├── style.css          # General styles
│   ├── dashboard.css      # Dashboard-specific styles
│   ├── setup.css          # Setup wizard styles
│   └── plow.css           # Plow tracker styles
├── js/
│   # Family Scheduler modules
│   ├── auth.js            # Login/authentication
│   ├── app.js             # Main dashboard logic
│   ├── setup.js           # Setup wizard logic
│   ├── calendar.js        # Work schedule feature
│   ├── grocery.js         # Grocery list feature
│   ├── location.js        # Location sharing feature
│   ├── drive-times.js     # Commute time calculator
│   ├── crypto-utils.js    # Encryption utilities
│   ├── family-config.js   # Family data configuration
│   ├── maps-config.js     # Google Maps config
│   # Plow Tracker modules
│   ├── firebase-config.js # Firebase/storage integration
│   ├── plow-driver.js     # Driver app logic
│   └── plow-map.js        # Map viewer logic
# Snow Plow Tracker
├── plow-index.html         # Plow tracker landing page
├── plow-driver.html        # Driver mobile app
├── plow-map.html           # Public map viewer
├── plow-manifest.json      # Plow PWA config
# Documentation
├── README.md               # This file
├── PLOW-TRACKER-GUIDE.md   # Plow tracker setup guide
└── LOCAL-HOSTING-GUIDE.md  # Self-hosting instructions
```

## Features Explained

### 1. Login System (auth.js)

- Each family member sets a 4-digit PIN on first login
- PINs are stored securely in browser's localStorage
- Click "First time? Set up your PIN" to reset your PIN

### 2. Work Schedule (calendar.js)

- Add your work shifts with date and time
- Everyone can see each other's schedules
- Automatically shows "Today" and "Tomorrow" labels
- Only you can delete your own events

### 3. Grocery List (grocery.js)

- Add items you'd like at the store
- Rate items with stars (1-5)
- See average ratings from all family members
- Mark items as "Bought" to remove them

### 4. Location Sharing (location.js)

- Click "Share My Location" to let family know where you are
- Uses your device's GPS
- Browser will ask for permission first
- Updates show how long ago location was shared

## Installing as an App

### On Android
1. Open the app in Chrome
2. Tap the menu (three dots) → "Install app" or "Add to Home screen"
3. The app icon will appear on your home screen

### On iOS (iPhone/iPad)
1. Open the app in Safari
2. Tap the Share button → "Add to Home Screen"
3. Name it and tap "Add"

### On Windows/Mac/Linux
1. Open the app in Chrome or Edge
2. Click the install icon (⊕) in the address bar
3. Or go to menu → "Install Family Scheduler"

## How Data Storage Works

This app uses **localStorage** - think of it as a small database inside your browser:

- **localStorage** - Stores data permanently (PINs, events, groceries)
- **sessionStorage** - Stores data only while browser is open (who's logged in)

**Important Notes:**
- Data is stored locally on each device
- Clearing browser data will erase everything
- For a real production app, you'd want a backend server to sync data across devices

## Customization Ideas

Want to personalize the app? Here are some easy tweaks:

1. **Change colors** - Edit the gradient colors in `css/style.css` (line 12-13)
2. **Add more family members** - Edit `index.html` (lines 28-32)
3. **Change app name** - Edit `manifest.json` (line 2)
4. **Add more features** - Each feature is in its own JS file for easy editing

## Learning Resources

Want to understand the code better? Here are key concepts used:

- **DOM Manipulation** - How JavaScript changes HTML (lines like `document.getElementById`)
- **Event Listeners** - How buttons respond to clicks (`addEventListener`)
- **localStorage API** - Saving data in the browser
- **Geolocation API** - Getting GPS coordinates
- **Service Workers** - Making the app work offline
- **Progressive Web Apps** - Installing web apps like native apps

## Browser Support

Works on all modern browsers:
- Chrome (recommended for best PWA support)
- Edge
- Safari
- Firefox
- Opera

## Privacy & Security

- All data is stored locally on your device
- No data is sent to any servers
- Location data is only shared within your family
- PINs are stored in plain text (for learning purposes - a real app would encrypt them)

## Future Enhancements

Want to add more features? Here are some ideas:

1. **Push Notifications** - Remind family about events
2. **Multiple Locations** - Save home/work addresses for better location detection
3. **Photo Sharing** - Add photos to grocery items or events
4. **Meal Planning** - Plan family dinners for the week
5. **Task Lists** - Assign chores and tasks
6. **Backend Sync** - Connect to a server to sync data across devices

## Google Maps Setup (Optional but Recommended!)

To enable drive times and traffic features, you need a Google Maps API key.

### Get Your Free API Key (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Family Scheduler")
3. Enable these APIs:
   - Maps JavaScript API
   - Geocoding API
   - Distance Matrix API
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key
6. Open `js/maps-config.js` and replace `YOUR_API_KEY_HERE` with your key
7. Refresh the app!

### Cost

**It's FREE for family use!**
- Google provides $200/month free credit
- Family app usage: ~$3/month
- You're well within the free tier!

### Without Google Maps

The app still works without Google Maps! You'll just see setup instructions instead of drive times.

## Local Hosting

Want to host this on your old laptop? Check out the comprehensive guide:

📖 **[LOCAL-HOSTING-GUIDE.md](LOCAL-HOSTING-GUIDE.md)**

Covers:
- Ubuntu/Linux setup
- Windows setup
- Mac setup
- Network configuration
- Security best practices
- Auto-start on boot
- And much more!

## Troubleshooting

### App won't load
- Make sure JavaScript is enabled in your browser
- Try opening in an incognito/private window
- Check browser console for errors (F12 → Console tab)

### Can't login
- Click "First time? Set up your PIN" to reset
- Clear browser data and try again

### Setup page doesn't show
- Complete your first login to trigger setup
- Check that `crypto-utils.js` is loaded (view page source)

### Drive times not showing
- Make sure you've added Google Maps API key in `js/maps-config.js`
- Complete your profile setup with home and work addresses
- Check browser console for API errors

### Location not working
- Check browser permissions (allow location access)
- Make sure you're using HTTPS or localhost
- Some browsers require secure connection for GPS

### Data disappeared
- Check if browser cache was cleared
- Data is encrypted and stored per-device
- Use the backup feature (see Local Hosting Guide)

### PWA not installing
- Try Chrome or Edge for best PWA support
- Make sure you're using a web server (not file://)
- Service workers require HTTPS (except on localhost)

## Support

Questions or issues? Check:
- Browser console (F12 → Console) for error messages
- Make sure all files are in the correct folders
- Verify encryption scripts are loaded
- Try a different browser

## License

This is a learning project - feel free to modify and use it however you like!

---

## 🎯 Project Overview

This repository contains two complete, production-ready web applications:

### 1. Family Scheduler (Original Project)
- **Purpose:** Help families coordinate schedules and stay connected
- **Users:** 5 family members with personalized profiles
- **Tech:** Encrypted localStorage, Google Maps, PWA
- **Start:** Open `index.html`

### 2. Snow Plow GPS Tracker (New!)
- **Purpose:** Real-time tracking for municipal snow plows
- **Users:** Plow drivers + general public
- **Tech:** Firebase Realtime DB, Geolocation API, Google Maps, PWA
- **Start:** Open `plow-index.html` or see [PLOW-TRACKER-GUIDE.md](PLOW-TRACKER-GUIDE.md)

Both apps:
- Work on all devices (phone, tablet, computer)
- Install as mobile apps (PWA)
- Work offline
- No server required (can use Firebase optionally)
- Free and open source

---

**Built with ❤️ for families who want to stay organized together and cities that want to keep residents informed during winter storms 🚜❄️**

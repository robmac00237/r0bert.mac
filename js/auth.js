/* ==========================================
   AUTHENTICATION SYSTEM
   This handles user login with PIN codes
   NOW WITH ENCRYPTION!
   ========================================== */

// Wait for the page to fully load before running any code
document.addEventListener('DOMContentLoaded', async function() {

    /* ------------------------------------------
       GET REFERENCES TO HTML ELEMENTS
       We need to interact with these elements
       ------------------------------------------ */

    const userSelect = document.getElementById('user-select');
    const pinInput = document.getElementById('pin-input');
    const loginBtn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('error-message');
    const setupLink = document.getElementById('setup-link');

    /* ------------------------------------------
       INITIALIZE DEFAULT USERS
       First time setup - create default PINs
       ------------------------------------------ */

    async function initializeUsers() {
        // SecureStorage is like a small encrypted database in the browser
        // It stores data even after you close the browser, but ENCRYPTED!

        // Check if users already exist
        const existingUsers = await SecureStorage.getItem('users');

        if (!existingUsers) {
            // Create default user structure with REAL family names!
            const defaultUsers = {
                user1: { name: 'Tracy', pin: null, role: 'family' }, // Mom
                user2: { name: 'Jason', pin: null, role: 'family' }, // Dad
                user3: { name: 'Robbie', pin: null, role: 'family' }, // You (app creator)
                user4: { name: 'Owen', pin: null, role: 'family' }, // Brother 1
                user5: { name: 'Ryan', pin: null, role: 'family' }  // Brother 2 (at uni)
            };

            // Save to encrypted storage
            await SecureStorage.setItem('users', defaultUsers);
        }
    }

    /* ------------------------------------------
       GET USERS FROM STORAGE
       ------------------------------------------ */

    async function getUsers() {
        // Get users from encrypted storage
        return await SecureStorage.getItem('users');
    }

    /* ------------------------------------------
       SAVE USERS TO STORAGE
       ------------------------------------------ */

    async function saveUsers(users) {
        await SecureStorage.setItem('users', users);
    }

    /* ------------------------------------------
       SHOW ERROR MESSAGE
       ------------------------------------------ */

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');

        // Shake animation for visual feedback
        errorMessage.style.animation = 'none';
        setTimeout(() => {
            errorMessage.style.animation = 'shake 0.5s';
        }, 10);
    }

    /* ------------------------------------------
       HIDE ERROR MESSAGE
       ------------------------------------------ */

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    /* ------------------------------------------
       VALIDATE PIN
       Checks if PIN is exactly 4 digits
       ------------------------------------------ */

    function isValidPin(pin) {
        // Regular expression: ^ = start, $ = end, \d = digit, {4} = exactly 4
        return /^\d{4}$/.test(pin);
    }

    /* ------------------------------------------
       LOGIN FUNCTION
       ------------------------------------------ */

    async function handleLogin() {
        hideError();

        const selectedUser = userSelect.value;
        const enteredPin = pinInput.value;

        // Validation: Check if user selected
        if (!selectedUser) {
            showError('Please select a user profile');
            return;
        }

        // Validation: Check if PIN entered
        if (!enteredPin) {
            showError('Please enter your PIN');
            return;
        }

        // Validation: Check if PIN is 4 digits
        if (!isValidPin(enteredPin)) {
            showError('PIN must be exactly 4 digits');
            return;
        }

        // Disable login button while checking
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        try {
            // Get all users from encrypted storage
            const users = await getUsers();
            const user = users[selectedUser];

            // FIRST TIME SETUP: If user has no PIN yet
            if (user.pin === null) {
                // Set the PIN they entered as their new PIN
                user.pin = enteredPin;
                await saveUsers(users);

                // Save who is logged in
                sessionStorage.setItem('currentUser', selectedUser);
                sessionStorage.setItem('userName', user.name);

                // Redirect to setup page for first-time users
                window.location.href = 'setup.html';
                return;
            }

            // NORMAL LOGIN: Check if PIN matches
            if (user.pin === enteredPin) {
                // Success! Save login session
                sessionStorage.setItem('currentUser', selectedUser);
                sessionStorage.setItem('userName', user.name);

                // Check if user has completed profile setup
                const profiles = await SecureStorage.getItem('userProfiles') || {};
                const userProfile = profiles[selectedUser];

                if (!userProfile || !userProfile.setupCompleted) {
                    // Redirect to setup page
                    window.location.href = 'setup.html';
                } else {
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                }
            } else {
                // Wrong PIN
                showError('Incorrect PIN. Please try again.');
                pinInput.value = ''; // Clear the input
                pinInput.focus(); // Put cursor back in PIN field
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }

        } catch (error) {
            console.error('Login error:', error);
            showError('Login failed. Please try again.');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    }

    /* ------------------------------------------
       SETUP LINK HANDLER
       ------------------------------------------ */

    setupLink.addEventListener('click', async function(e) {
        e.preventDefault(); // Prevent default link behavior

        const selectedUser = userSelect.value;

        if (!selectedUser) {
            showError('Please select a user profile first');
            return;
        }

        const users = await getUsers();
        const user = users[selectedUser];

        if (user.pin === null) {
            alert(`Hi ${user.name}! Since this is your first time, just enter a 4-digit PIN and click Login to set it up.`);
        } else {
            // Allow PIN reset (in a real app, you'd want more security here)
            const confirm = window.confirm(`Reset PIN for ${user.name}?`);
            if (confirm) {
                user.pin = null;
                await saveUsers(users);
                alert('PIN reset! Enter a new 4-digit PIN and click Login.');
            }
        }
    });

    /* ------------------------------------------
       EVENT LISTENERS
       These "listen" for user actions
       ------------------------------------------ */

    // When user clicks login button
    loginBtn.addEventListener('click', handleLogin);

    // When user presses Enter key in PIN input
    pinInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    // Only allow numbers in PIN input
    pinInput.addEventListener('input', function(e) {
        // Remove any non-numeric characters
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    /* ------------------------------------------
       INITIALIZE ON PAGE LOAD
       ------------------------------------------ */

    await initializeUsers();
});

/* ------------------------------------------
   SHAKE ANIMATION FOR ERRORS
   Add this CSS animation dynamically
   ------------------------------------------ */

const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

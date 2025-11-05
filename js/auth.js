/* ==========================================
   AUTHENTICATION SYSTEM
   This handles user login with PIN codes
   ========================================== */

// Wait for the page to fully load before running any code
document.addEventListener('DOMContentLoaded', function() {

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

    function initializeUsers() {
        // localStorage is like a small database in the browser
        // It stores data even after you close the browser

        // Check if users already exist
        if (!localStorage.getItem('users')) {
            // Create default user structure
            const defaultUsers = {
                user1: { name: 'Mom', pin: null },
                user2: { name: 'Dad', pin: null },
                user3: { name: 'Brother 1', pin: null },
                user4: { name: 'Brother 2', pin: null },
                user5: { name: 'You', pin: null }
            };

            // Convert JavaScript object to string and save
            // JSON.stringify turns objects into text format
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }
    }

    /* ------------------------------------------
       GET USERS FROM STORAGE
       ------------------------------------------ */

    function getUsers() {
        // JSON.parse turns text back into a JavaScript object
        return JSON.parse(localStorage.getItem('users'));
    }

    /* ------------------------------------------
       SAVE USERS TO STORAGE
       ------------------------------------------ */

    function saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
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

    function handleLogin() {
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

        // Get all users from storage
        const users = getUsers();
        const user = users[selectedUser];

        // FIRST TIME SETUP: If user has no PIN yet
        if (user.pin === null) {
            // Set the PIN they entered as their new PIN
            user.pin = enteredPin;
            saveUsers(users);

            // Save who is logged in
            sessionStorage.setItem('currentUser', selectedUser);
            sessionStorage.setItem('userName', user.name);

            // Redirect to dashboard
            window.location.href = 'dashboard.html';
            return;
        }

        // NORMAL LOGIN: Check if PIN matches
        if (user.pin === enteredPin) {
            // Success! Save login session
            sessionStorage.setItem('currentUser', selectedUser);
            sessionStorage.setItem('userName', user.name);

            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Wrong PIN
            showError('Incorrect PIN. Please try again.');
            pinInput.value = ''; // Clear the input
            pinInput.focus(); // Put cursor back in PIN field
        }
    }

    /* ------------------------------------------
       SETUP LINK HANDLER
       ------------------------------------------ */

    setupLink.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent default link behavior

        const selectedUser = userSelect.value;

        if (!selectedUser) {
            showError('Please select a user profile first');
            return;
        }

        const users = getUsers();
        const user = users[selectedUser];

        if (user.pin === null) {
            alert(`Hi ${user.name}! Since this is your first time, just enter a 4-digit PIN and click Login to set it up.`);
        } else {
            // Allow PIN reset (in a real app, you'd want more security here)
            const confirm = window.confirm(`Reset PIN for ${user.name}?`);
            if (confirm) {
                user.pin = null;
                saveUsers(users);
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

    initializeUsers();
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

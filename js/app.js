/* ==========================================
   MAIN DASHBOARD APPLICATION
   Handles tabs, authentication check, logout
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {

    /* ------------------------------------------
       CHECK IF USER IS LOGGED IN
       ------------------------------------------ */

    // sessionStorage holds data only while browser is open
    // localStorage holds data permanently
    const currentUser = sessionStorage.getItem('currentUser');
    const userName = sessionStorage.getItem('userName');

    // If no one is logged in, redirect back to login
    if (!currentUser || !userName) {
        window.location.href = 'index.html';
        return;
    }

    // Display user name in navbar
    document.getElementById('user-name').textContent = `Welcome, ${userName}!`;

    /* ------------------------------------------
       LOGOUT FUNCTIONALITY
       ------------------------------------------ */

    document.getElementById('logout-btn').addEventListener('click', function() {
        // Ask for confirmation
        if (confirm('Are you sure you want to logout?')) {
            // Clear session data
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('userName');

            // Redirect to login
            window.location.href = 'index.html';
        }
    });

    /* ------------------------------------------
       TAB SWITCHING FUNCTIONALITY
       ------------------------------------------ */

    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the tab name from data-tab attribute
            const tabName = this.getAttribute('data-tab');

            // Remove 'active' class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add 'active' class to clicked button
            this.classList.add('active');

            // Show the corresponding tab content
            document.getElementById(tabName + '-tab').classList.add('active');

            // Save current tab to localStorage (remembers what tab you were on)
            localStorage.setItem('activeTab', tabName);
        });
    });

    // Restore previously active tab on page load
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
        const savedButton = document.querySelector(`[data-tab="${savedTab}"]`);
        if (savedButton) {
            savedButton.click();
        }
    }

    /* ------------------------------------------
       UTILITY FUNCTIONS
       These can be used by other JavaScript files
       ------------------------------------------ */

    // Get current logged in user ID
    window.getCurrentUser = function() {
        return sessionStorage.getItem('currentUser');
    };

    // Get current user name
    window.getCurrentUserName = function() {
        return sessionStorage.getItem('userName');
    };

    // Format date nicely
    window.formatDate = function(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Reset time to compare dates only
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) {
            return 'Today';
        } else if (date.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else {
            // Format as "Mon, Dec 25"
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        }
    };

    // Format time nicely (24hr to 12hr)
    window.formatTime = function(timeString) {
        if (!timeString) return '';

        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;

        return `${hour12}:${minutes} ${ampm}`;
    };

    // Show a nice notification
    window.showNotification = function(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    };

    // Add notification animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100px);
            }
        }
    `;
    document.head.appendChild(style);

});

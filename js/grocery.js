/* ==========================================
   GROCERY LIST SYSTEM
   Family shopping list with rating system
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {

    /* ------------------------------------------
       GET REFERENCES TO HTML ELEMENTS
       ------------------------------------------ */

    const groceryItem = document.getElementById('grocery-item');
    const addGroceryBtn = document.getElementById('add-grocery-btn');
    const groceryList = document.getElementById('grocery-list');

    /* ------------------------------------------
       INITIALIZE GROCERY STORAGE
       ------------------------------------------ */

    function getGroceries() {
        const groceries = localStorage.getItem('familyGroceries');
        return groceries ? JSON.parse(groceries) : [];
    }

    function saveGroceries(groceries) {
        localStorage.setItem('familyGroceries', JSON.stringify(groceries));
    }

    /* ------------------------------------------
       ADD GROCERY ITEM FUNCTION
       ------------------------------------------ */

    function addGrocery() {
        const itemName = groceryItem.value.trim();

        // Validation
        if (!itemName) {
            window.showNotification('Please enter an item name', 'error');
            return;
        }

        // Get current user info
        const userId = window.getCurrentUser();
        const userName = window.getCurrentUserName();

        // Create grocery item object
        const item = {
            id: Date.now(),
            name: itemName,
            addedBy: userName,
            addedById: userId,
            ratings: {}, // Object to store ratings from each user: { user1: 5, user2: 3 }
            addedAt: new Date().toISOString()
        };

        // Save to storage
        const groceries = getGroceries();
        groceries.push(item);
        saveGroceries(groceries);

        // Show success message
        window.showNotification('Item added to grocery list!');

        // Clear input
        groceryItem.value = '';
        groceryItem.focus();

        // Refresh display
        displayGroceries();
    }

    /* ------------------------------------------
       DELETE GROCERY ITEM FUNCTION
       ------------------------------------------ */

    function deleteGrocery(itemId) {
        if (confirm('Mark this item as bought and remove from list?')) {
            let groceries = getGroceries();
            groceries = groceries.filter(item => item.id !== itemId);
            saveGroceries(groceries);
            displayGroceries();
            window.showNotification('Item marked as bought!');
        }
    }

    /* ------------------------------------------
       RATE GROCERY ITEM FUNCTION
       ------------------------------------------ */

    function rateItem(itemId, rating) {
        const groceries = getGroceries();
        const item = groceries.find(g => g.id === itemId);

        if (item) {
            const userId = window.getCurrentUser();

            // If user clicks the same rating again, remove it
            if (item.ratings[userId] === rating) {
                delete item.ratings[userId];
            } else {
                // Set new rating
                item.ratings[userId] = rating;
            }

            saveGroceries(groceries);
            displayGroceries();
        }
    }

    /* ------------------------------------------
       CALCULATE AVERAGE RATING
       ------------------------------------------ */

    function getAverageRating(ratings) {
        const ratingValues = Object.values(ratings);
        if (ratingValues.length === 0) return 0;

        const sum = ratingValues.reduce((a, b) => a + b, 0);
        return sum / ratingValues.length;
    }

    /* ------------------------------------------
       DISPLAY GROCERIES FUNCTION
       ------------------------------------------ */

    function displayGroceries() {
        const groceries = getGroceries();

        // Sort by average rating (highest first), then by date added
        groceries.sort((a, b) => {
            const avgA = getAverageRating(a.ratings);
            const avgB = getAverageRating(b.ratings);

            if (avgB !== avgA) {
                return avgB - avgA; // Higher rating first
            }

            return new Date(b.addedAt) - new Date(a.addedAt); // Newer first
        });

        // Clear current display
        groceryList.innerHTML = '';

        // If no items
        if (groceries.length === 0) {
            groceryList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🛒</div>
                    <p>No items in the list</p>
                    <p style="font-size: 12px; margin-top: 5px;">Add items that everyone might like at the store</p>
                </div>
            `;
            return;
        }

        // Get current user ID
        const currentUserId = window.getCurrentUser();

        // Display each grocery item
        groceries.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'grocery-item';

            // Get user's current rating for this item
            const userRating = item.ratings[currentUserId] || 0;
            const avgRating = getAverageRating(item.ratings);
            const ratingCount = Object.keys(item.ratings).length;

            // Create 5 stars
            let starsHtml = '<div class="rating-container">';
            for (let i = 1; i <= 5; i++) {
                const filled = i <= userRating ? 'filled' : '';
                starsHtml += `<span class="star ${filled}" onclick="window.rateGroceryItem(${item.id}, ${i})">★</span>`;
            }

            // Show average and count if there are ratings
            if (ratingCount > 0) {
                starsHtml += `<span class="rating-count">${avgRating.toFixed(1)} (${ratingCount})</span>`;
            }

            starsHtml += '</div>';

            itemDiv.innerHTML = `
                <div class="grocery-info">
                    <div class="grocery-name">${item.name}</div>
                    <div class="grocery-added-by">Added by ${item.addedBy}</div>
                    ${starsHtml}
                </div>
                <div class="grocery-actions">
                    <button class="btn-bought" onclick="window.deleteGroceryItem(${item.id})">✓ Bought</button>
                </div>
            `;

            groceryList.appendChild(itemDiv);
        });
    }

    /* ------------------------------------------
       EVENT LISTENERS
       ------------------------------------------ */

    addGroceryBtn.addEventListener('click', addGrocery);

    // Allow pressing Enter to add item
    groceryItem.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addGrocery();
        }
    });

    /* ------------------------------------------
       MAKE FUNCTIONS GLOBALLY ACCESSIBLE
       (so they can be called from HTML onclick)
       ------------------------------------------ */

    window.deleteGroceryItem = deleteGrocery;
    window.rateGroceryItem = rateItem;

    /* ------------------------------------------
       INITIALIZE ON PAGE LOAD
       ------------------------------------------ */

    displayGroceries();

});

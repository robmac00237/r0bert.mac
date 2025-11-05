/* ==========================================
   FAMILY PRE-CONFIGURATION
   Pre-filled data for the MacDonald family
   ========================================== */

const FAMILY_CONFIG = {
    // Shared home address for everyone except Ryan (at uni)
    homeAddress: {
        street: 'Your Home Address',  // TODO: Add your actual home address
        city: 'Miramichi',
        province: 'NB',
        postalCode: '',  // Add if needed
        fullAddress: 'Your Home Address, Miramichi, NB'  // Update this
    },

    // Individual family member work information
    members: {
        user1: {  // Tracy (Mom)
            name: 'Tracy',
            workplace: 'SuperStore',
            workAddress: '408 King George Hwy, Miramichi, NB E1V 2T3',
            usualStartTime: '09:00',
            usualEndTime: '17:00',
            prepTime: 30,
            drives: true
        },

        user2: {  // Jason (Dad)
            name: 'Jason',
            workplace: 'Mill',
            // Jason works at two locations!
            workLocations: [
                {
                    name: 'Mill (Main)',
                    address: '1101 Water St, Miramichi, NB E1N 4C6',
                    isPrimary: true
                },
                {
                    name: 'Newcastle Wharf',
                    address: '10 Jane St, Miramichi, NB E1V 2S7',
                    isPrimary: false
                }
            ],
            usualStartTime: '07:00',
            usualEndTime: '15:00',
            prepTime: 45,
            drives: true
        },

        user3: {  // Robbie (You)
            name: 'Robbie',
            workplace: 'Sobeys',
            workAddress: '273 Pleasant St, Miramichi, NB E1V 1Y7',
            usualStartTime: '',  // Will be filled during setup
            usualEndTime: '',
            prepTime: 30,
            drives: true
        },

        user4: {  // Owen
            name: 'Owen',
            workplace: 'Dollarstore',
            workAddress: 'Business Complex, 408 King George Hwy, Miramichi, NB E1V 1L4',
            usualStartTime: '',  // Will be filled during setup
            usualEndTime: '',
            prepTime: 30,
            drives: true
        },

        user5: {  // Ryan (at university, returning April/May)
            name: 'Ryan',
            workplace: 'SuperStore',
            workAddress: '408 King George Hwy, Miramichi, NB E1V 2T3',
            usualStartTime: '',
            usualEndTime: '',
            prepTime: 30,
            drives: true,
            // Special flag for Ryan
            atUniversity: true,
            returningDate: '2025-05-01', // Approximate return date
            universityAddress: ''  // Can be filled later
        }
    },

    // Pre-calculated typical commute times (Manual Mode)
    // These are estimates - users should verify and update
    estimatedCommutes: {
        // From home to each work location (minutes)
        toSobeys: 10,           // Robbie
        toDollarstore: 8,       // Owen
        toSuperStore: 8,        // Tracy & Ryan
        toMill: 15,             // Jason - Main location
        toNewcastleWharf: 12    // Jason - Secondary location
    }
};

/* ==========================================
   GUEST/VIEWER CONFIGURATION
   For extended family (aunt, grandfather, etc.)
   ========================================== */

const GUEST_CONFIG = {
    enabled: true,

    // Guest users can:
    permissions: {
        viewCalendar: true,       // See family schedules
        viewGroceryList: true,    // See shopping list
        viewLocations: true,      // See where family is
        viewDriveTimes: false,    // Don't need this

        addCalendarEvents: true,  // Can add family events (Christmas, parties)
        addGroceryItems: true,    // Can suggest items
        editOwnEvents: true,      // Can edit their own events
        deleteOwnEvents: true,    // Can delete their own events

        editOthersEvents: false,  // Can't change other people's events
        deleteOthersEvents: false,// Can't delete other people's events
        changeSettings: false      // Can't change app settings
    },

    // Example guest users
    guestUsers: {
        guest1: {
            name: 'Aunt [Name]',  // Update with real name
            pin: null,
            role: 'guest',
            addedBy: 'user3',  // Added by Robbie
            addedDate: null
        },
        guest2: {
            name: 'Grandfather [Name]',  // Update with real name
            pin: null,
            role: 'guest',
            addedBy: 'user3',  // Added by Robbie
            addedDate: null
        }
    }
};

/* ==========================================
   HELPER FUNCTIONS
   ========================================== */

// Pre-fill setup form with family data
function prefillSetupForm(userId) {
    const config = FAMILY_CONFIG.members[userId];
    if (!config) return null;

    return {
        displayName: config.name,
        homeAddress: config.atUniversity ? config.universityAddress : FAMILY_CONFIG.homeAddress.fullAddress,
        works: true,
        workName: config.workplace,
        workAddress: config.workAddress || (config.workLocations ? config.workLocations[0].address : ''),
        workLocations: config.workLocations || null,  // For Jason
        usualStartTime: config.usualStartTime,
        usualEndTime: config.usualEndTime,
        drives: config.drives,
        prepTime: config.prepTime,
        atUniversity: config.atUniversity || false,
        returningDate: config.returningDate || null
    };
}

// Get estimated commute time
function getEstimatedCommute(userId) {
    const config = FAMILY_CONFIG.members[userId];
    if (!config) return null;

    // Map workplace to commute time
    const commuteMap = {
        'Sobeys': FAMILY_CONFIG.estimatedCommutes.toSobeys,
        'Dollarstore': FAMILY_CONFIG.estimatedCommutes.toDollarstore,
        'SuperStore': FAMILY_CONFIG.estimatedCommutes.toSuperStore,
        'Mill': FAMILY_CONFIG.estimatedCommutes.toMill
    };

    return commuteMap[config.workplace] || 15; // Default 15 minutes
}

// Check if user is a guest
function isGuestUser(userId) {
    return userId === 'guest' || userId.startsWith('guest');
}

// Get guest permissions
function getGuestPermissions() {
    return GUEST_CONFIG.permissions;
}

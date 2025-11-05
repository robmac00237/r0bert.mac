/* ==========================================
   FIRST-TIME SETUP FLOW
   Collects user profile information
   ========================================== */

document.addEventListener('DOMContentLoaded', async function() {

    /* ------------------------------------------
       CHECK IF USER IS LOGGED IN
       ------------------------------------------ */

    const currentUser = sessionStorage.getItem('currentUser');
    const userName = sessionStorage.getItem('userName');

    if (!currentUser || !userName) {
        window.location.href = 'index.html';
        return;
    }

    // Display user name
    document.getElementById('user-name').textContent = userName;

    /* ------------------------------------------
       WORK FIELDS TOGGLE
       ------------------------------------------ */

    const workRadios = document.querySelectorAll('input[name="works"]');
    const workFields = document.getElementById('work-fields');

    workRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'yes') {
                workFields.style.display = 'block';
            } else {
                workFields.style.display = 'none';
            }
        });
    });

    /* ------------------------------------------
       LOAD EXISTING PROFILE (if any)
       ------------------------------------------ */

    await loadExistingProfile();

});

/* ------------------------------------------
   LOAD EXISTING PROFILE DATA
   ------------------------------------------ */

async function loadExistingProfile() {
    const currentUser = sessionStorage.getItem('currentUser');

    // Get user profiles
    const profiles = await SecureStorage.getItem('userProfiles') || {};
    let profile = profiles[currentUser];

    // If no profile exists, pre-fill from family config
    if (!profile && typeof prefillSetupForm !== 'undefined') {
        profile = prefillSetupForm(currentUser);
        if (profile) {
            console.log('Pre-filling setup form with family data');
        }
    }

    if (profile) {
        // Populate form with existing data or pre-filled data
        document.getElementById('display-name').value = profile.displayName || '';
        document.getElementById('home-address').value = profile.homeAddress || '';
        document.getElementById('work-address').value = profile.workAddress || '';
        document.getElementById('work-name').value = profile.workName || '';
        document.getElementById('usual-start').value = profile.usualStartTime || '';
        document.getElementById('usual-end').value = profile.usualEndTime || '';
        document.getElementById('prep-time').value = profile.prepTime || '30';

        // Set radio buttons
        if (profile.works !== undefined) {
            const worksValue = profile.works ? 'yes' : 'no';
            document.querySelector(`input[name="works"][value="${worksValue}"]`).checked = true;

            if (!profile.works) {
                document.getElementById('work-fields').style.display = 'none';
            }
        }

        if (profile.drives !== undefined) {
            const drivesValue = profile.drives ? 'yes' : 'no';
            document.querySelector(`input[name="drives"][value="${drivesValue}"]`).checked = true;
        }

        // Set checkboxes
        if (profile.notifications) {
            document.getElementById('notify-traffic').checked = profile.notifications.traffic;
            document.getElementById('notify-leave').checked = profile.notifications.leave;
            document.getElementById('notify-family').checked = profile.notifications.family;
        }
    }
}

/* ------------------------------------------
   NAVIGATION BETWEEN STEPS
   ------------------------------------------ */

window.nextStep = function(stepNumber) {
    // Validate current step before proceeding
    const currentStep = document.querySelector('.setup-step.active');
    const currentStepNum = parseInt(currentStep.id.split('-')[1]);

    if (stepNumber > currentStepNum) {
        if (!validateStep(currentStepNum)) {
            return;
        }
    }

    // Hide all steps
    document.querySelectorAll('.setup-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show requested step
    document.getElementById('step-' + stepNumber).classList.add('active');

    // Update progress bar
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');

        if (index + 1 < stepNumber) {
            step.classList.add('completed');
        } else if (index + 1 === stepNumber) {
            step.classList.add('active');
        }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ------------------------------------------
   VALIDATE STEP
   ------------------------------------------ */

function validateStep(stepNumber) {
    switch(stepNumber) {
        case 1:
            const displayName = document.getElementById('display-name').value.trim();
            const homeAddress = document.getElementById('home-address').value.trim();

            if (!displayName) {
                alert('Please enter your preferred name');
                document.getElementById('display-name').focus();
                return false;
            }

            if (!homeAddress) {
                alert('Please enter your home address');
                document.getElementById('home-address').focus();
                return false;
            }

            return true;

        case 2:
            const works = document.querySelector('input[name="works"]:checked').value === 'yes';

            if (works) {
                const workAddress = document.getElementById('work-address').value.trim();

                if (!workAddress) {
                    alert('Please enter your work address');
                    document.getElementById('work-address').focus();
                    return false;
                }
            }

            return true;

        case 3:
            return true;

        default:
            return true;
    }
}

/* ------------------------------------------
   COMPLETE SETUP
   ------------------------------------------ */

window.completeSetup = async function() {
    // Validate final step
    if (!validateStep(3)) {
        return;
    }

    // Show loading state
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        // Gather all form data
        const currentUser = sessionStorage.getItem('currentUser');
        const userName = sessionStorage.getItem('userName');

        const works = document.querySelector('input[name="works"]:checked').value === 'yes';
        const drives = document.querySelector('input[name="drives"]:checked').value === 'yes';

        const profileData = {
            userId: currentUser,
            userName: userName,
            displayName: document.getElementById('display-name').value.trim(),
            homeAddress: document.getElementById('home-address').value.trim(),
            works: works,
            workAddress: works ? document.getElementById('work-address').value.trim() : '',
            workName: works ? document.getElementById('work-name').value.trim() : '',
            usualStartTime: works ? document.getElementById('usual-start').value : '',
            usualEndTime: works ? document.getElementById('usual-end').value : '',
            drives: drives,
            prepTime: parseInt(document.getElementById('prep-time').value),
            notifications: {
                traffic: document.getElementById('notify-traffic').checked,
                leave: document.getElementById('notify-leave').checked,
                family: document.getElementById('notify-family').checked
            },
            setupCompleted: true,
            setupDate: new Date().toISOString()
        };

        // Save to encrypted storage
        const profiles = await SecureStorage.getItem('userProfiles') || {};
        profiles[currentUser] = profileData;
        await SecureStorage.setItem('userProfiles', profiles);

        // If work address provided, geocode it for later use
        if (profileData.workAddress) {
            // We'll geocode addresses when Google Maps API is loaded
            sessionStorage.setItem('needsGeocoding', 'true');
        }

        // Show success message
        btn.textContent = '✓ Setup Complete!';
        btn.style.background = '#4CAF50';

        // Redirect to dashboard after 1 second
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        console.error('Setup error:', error);
        alert('Failed to save profile. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Complete Setup';
    }
};

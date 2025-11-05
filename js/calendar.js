/* ==========================================
   CALENDAR / WORK SCHEDULE SYSTEM
   Allows family members to add work shifts
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {

    /* ------------------------------------------
       GET REFERENCES TO HTML ELEMENTS
       ------------------------------------------ */

    const eventDate = document.getElementById('event-date');
    const eventStart = document.getElementById('event-start');
    const eventEnd = document.getElementById('event-end');
    const eventNotes = document.getElementById('event-notes');
    const addEventBtn = document.getElementById('add-event-btn');
    const eventsList = document.getElementById('events-list');

    /* ------------------------------------------
       INITIALIZE EVENTS STORAGE
       ------------------------------------------ */

    function getEvents() {
        const events = localStorage.getItem('familyEvents');
        return events ? JSON.parse(events) : [];
    }

    function saveEvents(events) {
        localStorage.setItem('familyEvents', JSON.stringify(events));
    }

    /* ------------------------------------------
       SET DEFAULT DATE TO TODAY
       ------------------------------------------ */

    // Set date input to today by default
    const today = new Date().toISOString().split('T')[0];
    eventDate.value = today;

    /* ------------------------------------------
       ADD EVENT FUNCTION
       ------------------------------------------ */

    function addEvent() {
        // Get current user info
        const userId = window.getCurrentUser();
        const userName = window.getCurrentUserName();

        // Validation
        if (!eventDate.value) {
            window.showNotification('Please select a date', 'error');
            return;
        }

        if (!eventStart.value) {
            window.showNotification('Please select a start time', 'error');
            return;
        }

        if (!eventEnd.value) {
            window.showNotification('Please select an end time', 'error');
            return;
        }

        // Check that end time is after start time
        if (eventEnd.value <= eventStart.value) {
            window.showNotification('End time must be after start time', 'error');
            return;
        }

        // Create event object
        const event = {
            id: Date.now(), // Unique ID using timestamp
            userId: userId,
            userName: userName,
            date: eventDate.value,
            startTime: eventStart.value,
            endTime: eventEnd.value,
            notes: eventNotes.value,
            createdAt: new Date().toISOString()
        };

        // Save to storage
        const events = getEvents();
        events.push(event);
        saveEvents(events);

        // Show success message
        window.showNotification('Work shift added to calendar!');

        // Clear form
        eventNotes.value = '';
        // Keep date and times for easy adding of multiple shifts

        // Refresh display
        displayEvents();
    }

    /* ------------------------------------------
       DELETE EVENT FUNCTION
       ------------------------------------------ */

    function deleteEvent(eventId) {
        if (confirm('Remove this shift from the calendar?')) {
            let events = getEvents();
            events = events.filter(event => event.id !== eventId);
            saveEvents(events);
            displayEvents();
            window.showNotification('Shift removed');
        }
    }

    /* ------------------------------------------
       DISPLAY EVENTS FUNCTION
       ------------------------------------------ */

    function displayEvents() {
        const events = getEvents();

        // Sort events by date and time (newest first, then by date)
        events.sort((a, b) => {
            const dateCompare = new Date(a.date) - new Date(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
        });

        // Filter to show only upcoming events (today and future)
        const today = new Date().toISOString().split('T')[0];
        const upcomingEvents = events.filter(event => event.date >= today);

        // Clear current display
        eventsList.innerHTML = '';

        // If no events
        if (upcomingEvents.length === 0) {
            eventsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <p>No upcoming work shifts</p>
                    <p style="font-size: 12px; margin-top: 5px;">Add your work schedule above so everyone knows when you're busy</p>
                </div>
            `;
            return;
        }

        // Display each event
        upcomingEvents.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-item';

            // Only show delete button if this is the current user's event
            const currentUserId = window.getCurrentUser();
            const deleteButton = event.userId === currentUserId
                ? `<button class="btn-delete" onclick="window.deleteCalendarEvent(${event.id})">Delete</button>`
                : '';

            eventDiv.innerHTML = `
                <div class="event-info">
                    <div class="event-user">${event.userName}</div>
                    <div class="event-time">
                        ${window.formatDate(event.date)} •
                        ${window.formatTime(event.startTime)} - ${window.formatTime(event.endTime)}
                    </div>
                    ${event.notes ? `<div class="event-notes">${event.notes}</div>` : ''}
                </div>
                <div class="event-actions">
                    ${deleteButton}
                </div>
            `;

            eventsList.appendChild(eventDiv);
        });
    }

    /* ------------------------------------------
       EVENT LISTENERS
       ------------------------------------------ */

    addEventBtn.addEventListener('click', addEvent);

    // Allow pressing Enter to submit
    [eventDate, eventStart, eventEnd, eventNotes].forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addEvent();
            }
        });
    });

    /* ------------------------------------------
       MAKE DELETE FUNCTION GLOBALLY ACCESSIBLE
       (so it can be called from HTML onclick)
       ------------------------------------------ */

    window.deleteCalendarEvent = deleteEvent;

    /* ------------------------------------------
       INITIALIZE ON PAGE LOAD
       ------------------------------------------ */

    displayEvents();

    // Refresh events every minute (to update "Today/Tomorrow" labels)
    setInterval(displayEvents, 60000);

});

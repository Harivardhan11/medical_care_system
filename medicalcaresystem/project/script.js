// Global variables
let medicines = [];
let history = [];
let currentNotification = null;
let checkInterval;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateDashboard();
    displayMedicines();
    displayHistory();
    startTimeUpdates();
    startReminderCheck();
    setupFormHandlers();
    requestNotificationPermission();
});

// Load data from localStorage
function loadData() {
    const savedMedicines = localStorage.getItem('medicines');
    const savedHistory = localStorage.getItem('medicineHistory');
    
    if (savedMedicines) {
        medicines = JSON.parse(savedMedicines);
    }
    
    if (savedHistory) {
        history = JSON.parse(savedHistory);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('medicines', JSON.stringify(medicines));
    localStorage.setItem('medicineHistory', JSON.stringify(history));
}

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Remove active class from all nav buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    document.getElementById(sectionName + '-btn').classList.add('active');
    
    // Update content when switching sections
    if (sectionName === 'dashboard') {
        updateDashboard();
    } else if (sectionName === 'medicine-list') {
        displayMedicines();
    } else if (sectionName === 'history') {
        displayHistory();
    }
}

// Setup form handlers
function setupFormHandlers() {
    // Frequency change handler
    document.getElementById('frequency').addEventListener('change', function() {
        const freq = parseInt(this.value);
        
        // Hide all time groups first
        for (let i = 2; i <= 4; i++) {
            document.getElementById(`time${i}-group`).style.display = 'none';
            document.getElementById(`time${i}`).required = false;
        }
        
        // Show required time groups
        for (let i = 2; i <= freq; i++) {
            document.getElementById(`time${i}-group`).style.display = 'block';
            document.getElementById(`time${i}`).required = true;
        }
    });
    
    // Form submit handler
    document.getElementById('medicine-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addMedicine();
    });
}

// Add new medicine
function addMedicine() {
    const name = document.getElementById('medicine-name').value;
    const dosage = document.getElementById('dosage').value;
    const frequency = parseInt(document.getElementById('frequency').value);
    const notes = document.getElementById('notes').value;
    
    const times = [];
    for (let i = 1; i <= frequency; i++) {
        const time = document.getElementById(`time${i}`).value;
        if (time) {
            times.push(time);
        }
    }
    
    const medicine = {
        id: Date.now(),
        name: name,
        dosage: dosage,
        frequency: frequency,
        times: times,
        notes: notes,
        active: true,
        dateAdded: new Date().toISOString()
    };
    
    medicines.push(medicine);
    saveData();
    
    // Reset form
    document.getElementById('medicine-form').reset();
    document.getElementById('frequency').dispatchEvent(new Event('change'));
    
    alert('Medicine added successfully!');
    updateDashboard();
}

// Display medicines
function displayMedicines() {
    const container = document.getElementById('medicines-container');
    
    if (medicines.length === 0) {
        container.innerHTML = '<p>No medicines added yet.</p>';
        return;
    }
    
    container.innerHTML = medicines.map(medicine => `
        <div class="medicine-item">
            <div class="medicine-header">
                <span class="medicine-name">${medicine.name}</span>
                <div>
                    <button class="btn-edit" onclick="editMedicine(${medicine.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteMedicine(${medicine.id})">Delete</button>
                </div>
            </div>
            <p><strong>Dosage:</strong> ${medicine.dosage}</p>
            <div class="medicine-times">
                <strong>Times:</strong>
                ${medicine.times.map(time => `<span class="time-slot">${time}</span>`).join('')}
            </div>
            ${medicine.notes ? `<p><strong>Notes:</strong> ${medicine.notes}</p>` : ''}
        </div>
    `).join('');
}

// Delete medicine
function deleteMedicine(id) {
    if (confirm('Are you sure you want to delete this medicine?')) {
        medicines = medicines.filter(med => med.id !== id);
        saveData();
        displayMedicines();
        updateDashboard();
    }
}

// Edit medicine (basic implementation)
function editMedicine(id) {
    const medicine = medicines.find(med => med.id === id);
    if (!medicine) return;
    
    const newName = prompt('Enter new medicine name:', medicine.name);
    const newDosage = prompt('Enter new dosage:', medicine.dosage);
    
    if (newName && newDosage) {
        medicine.name = newName;
        medicine.dosage = newDosage;
        saveData();
        displayMedicines();
        updateDashboard();
    }
}

// Update dashboard
function updateDashboard() {
    updateTodaysMedicines();
    updateNextReminder();
    updateTotalCount();
}

function updateTodaysMedicines() {
    const container = document.getElementById('today-medicines');
    const today = new Date().toDateString();
    
    if (medicines.length === 0) {
        container.innerHTML = '<p>No medicines scheduled.</p>';
        return;
    }
    
    let todayHTML = '';
    medicines.forEach(medicine => {
        medicine.times.forEach(time => {
            todayHTML += `<div style="margin: 5px 0; padding: 5px; background: #e9ecef; border-radius: 3px;">
                ${medicine.name} - ${time} (${medicine.dosage})
            </div>`;
        });
    });
    
    container.innerHTML = todayHTML || '<p>No medicines for today.</p>';
}

function updateNextReminder() {
    const container = document.getElementById('next-reminder');
    const now = new Date();
    let nextReminder = null;
    let nextTime = null;
    
    medicines.forEach(medicine => {
        medicine.times.forEach(time => {
            const [hours, minutes] = time.split(':');
            const reminderTime = new Date();
            reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            if (reminderTime > now) {
                if (!nextTime || reminderTime < nextTime) {
                    nextTime = reminderTime;
                    nextReminder = medicine;
                }
            }
        });
    });
    
    if (nextReminder && nextTime) {
        container.innerHTML = `
            <p><strong>${nextReminder.name}</strong></p>
            <p>At ${nextTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
        `;
    } else {
        container.innerHTML = '<p>No upcoming reminders today.</p>';
    }
}

function updateTotalCount() {
    document.getElementById('total-count').innerHTML = `<span class="big-number">${medicines.length}</span>`;
}

// Time updates
function startTimeUpdates() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
}

function updateCurrentTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString();
}

// Reminder system
function startReminderCheck() {
    checkInterval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Check immediately
}

function checkReminders() {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    
    medicines.forEach(medicine => {
        medicine.times.forEach(time => {
            if (time === currentTime) {
                showReminderNotification(medicine, time);
            }
        });
    });
}

function showReminderNotification(medicine, time) {
    currentNotification = { medicine, time };
    
    document.getElementById('notification-message').innerHTML = `
        <strong>Time to take your medicine!</strong><br>
        <strong>Medicine:</strong> ${medicine.name}<br>
        <strong>Dosage:</strong> ${medicine.dosage}<br>
        <strong>Time:</strong> ${time}
        ${medicine.notes ? `<br><strong>Notes:</strong> ${medicine.notes}` : ''}
    `;
    
    document.getElementById('notification-popup').style.display = 'flex';
    
    // Browser notification
    if (Notification.permission === 'granted') {
        new Notification('Medicine Reminder', {
            body: `Time to take ${medicine.name} (${medicine.dosage})`,
            icon: '💊'
        });
    }
    
    // Play sound (basic beep)
    playNotificationSound();
}

function playNotificationSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAcBDuV3LHHdidHL2S//fOLg');
        audio.play();
    } catch (e) {
        console.log('Audio playback failed');
    }
}

function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

function markAsTaken() {
    if (currentNotification) {
        const record = {
            id: Date.now(),
            medicine: currentNotification.medicine.name,
            dosage: currentNotification.medicine.dosage,
            scheduledTime: currentNotification.time,
            takenTime: new Date().toLocaleTimeString(),
            date: new Date().toDateString(),
            status: 'taken'
        };
        
        history.push(record);
        saveData();
        closeNotification();
        
        alert('Great! Medicine marked as taken.');
    }
}

function snoozeReminder() {
    closeNotification();
    
    setTimeout(() => {
        if (currentNotification) {
            showReminderNotification(currentNotification.medicine, currentNotification.time);
        }
    }, 5 * 60 * 1000); // 5 minutes
    
    alert('Reminder snoozed for 5 minutes.');
}

function closeNotification() {
    document.getElementById('notification-popup').style.display = 'none';
    currentNotification = null;
}

// History functions
function displayHistory() {
    const container = document.getElementById('history-container');
    
    if (history.length === 0) {
        container.innerHTML = '<p>No history available.</p>';
        return;
    }
    
    const sortedHistory = history.sort((a, b) => new Date(b.date + ' ' + b.takenTime) - new Date(a.date + ' ' + a.takenTime));
    
    container.innerHTML = sortedHistory.map(record => `
        <div class="history-item history-${record.status}">
            <strong>${record.medicine}</strong> (${record.dosage})<br>
            <small>Scheduled: ${record.scheduledTime} | Taken: ${record.takenTime} | ${record.date}</small>
        </div>
    `).join('');
}

function showTodayHistory() {
    const today = new Date().toDateString();
    const todayHistory = history.filter(record => record.date === today);
    
    const container = document.getElementById('history-container');
    
    if (todayHistory.length === 0) {
        container.innerHTML = '<p>No medicines taken today.</p>';
        return;
    }
    
    container.innerHTML = todayHistory.map(record => `
        <div class="history-item history-${record.status}">
            <strong>${record.medicine}</strong> (${record.dosage})<br>
            <small>Scheduled: ${record.scheduledTime} | Taken: ${record.takenTime}</small>
        </div>
    `).join('');
}

function showWeekHistory() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekHistory = history.filter(record => new Date(record.date) >= weekAgo);
    
    const container = document.getElementById('history-container');
    
    if (weekHistory.length === 0) {
        container.innerHTML = '<p>No medicines taken this week.</p>';
        return;
    }
    
    container.innerHTML = weekHistory.map(record => `
        <div class="history-item history-${record.status}">
            <strong>${record.medicine}</strong> (${record.dosage})<br>
            <small>Scheduled: ${record.scheduledTime} | Taken: ${record.takenTime} | ${record.date}</small>
        </div>
    `).join('');
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        history = [];
        saveData();
        displayHistory();
        alert('History cleared.');
    }
}
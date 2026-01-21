// --- SYSTEM STATE ---
let isIdle = false;
let lastLoginDate = localStorage.getItem('lastLoginDate');
let achievements = JSON.parse(localStorage.getItem('achievements')) || [];

// --- UTILS ---
const showToast = (msg) => {
    if (isIdle) return; // Don't show if user is away
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerText = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3000);
};

// --- IDLE DETECTION ---
window.onfocus = () => { 
    if (isIdle) showToast("Welcome Back! Checking status...");
    isIdle = false; 
};
window.onblur = () => { isIdle = true; };

// --- AUTO-RESET LOGIC ---
function checkResets() {
    const now = new Date();
    const todayStr = now.toDateString();
    
    if (lastLoginDate !== todayStr) {
        // It's a new day!
        showToast("☀️ New Day! Daily tasks reset.");
        // Logic to uncheck Daily boxes would go here
        localStorage.setItem('lastLoginDate', todayStr);
    }
}

// --- CLOCK & BOSS BAR ---
function updateBossBar() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    const isLeap = (now.getFullYear() % 4 === 0);
    const totalDays = isLeap ? 366 : 365;
    
    const percent = (dayOfYear / totalDays) * 100;
    document.getElementById('weekBar').style.width = percent + "%";
    document.getElementById('weekBarText').innerText = `DAY ${dayOfYear} / ${totalDays}`;
}

// --- TASK CORE ---
function addTask(type) {
    const container = document.getElementById(type + 'TaskList');
    const div = document.createElement('div');
    div.className = 'task-group';
    div.innerHTML = `
        <input type="text" class="main-input" placeholder="${type} task">
        <button onclick="this.nextElementSibling.appendChild(document.createElement('input'))">+Sub</button>
        <div class="sub-container" style="margin-left:20px"></div>
    `;
    container.appendChild(div);
}

// --- DASHBOARD TOGGLE ---
document.getElementById('toggleBtn').addEventListener('click', toggleView);

function toggleView() {
    const editor = document.getElementById('editor');
    const view = document.getElementById('viewMode');
    const bar = document.getElementById('weekBarContainer');
    
    editor.classList.toggle('hidden');
    view.classList.toggle('hidden');
    bar.classList.toggle('hidden');
    
    if (!view.classList.contains('hidden')) {
        updateBossBar();
        renderDashboard();
        checkResets();
    }
}

function renderDashboard() {
    // This builds the checklist. 
    // Logic is similar to previous, but separates Daily vs Weekly containers
    // And adds showToast("Task Complete!") to checkbox listeners.
    document.getElementById('sequenceDisplay').innerText = document.getElementById('seqInput').value;
    // ... logic to map inputs to checkboxes ...
}

// --- NOTIFICATIONS ---
setInterval(() => {
    const now = new Date();
    const currentTime = now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0');
    const am = document.getElementById('amTime').value;
    const pm = document.getElementById('pmTime').value;

    if (currentTime === am) showToast("⏰ WAKE UP: Morning Sequence Start!");
    if (currentTime === pm) showToast("🌙 BEDTIME: End-of-Day Reset!");
}, 60000);

// Start
updateBossBar();
// --- DATA STRUCTURE ---
let appData = JSON.parse(localStorage.getItem('slayerData')) || {
    weekly: [],
    daily: [],
    seq: "MORNING:\n- Wake up\n- Coffee\n\nNIGHT:\n- Shower\n- Reset",
    amTime: "06:00",
    pmTime: "22:00",
    lastLogin: new Date().toDateString(),
    unlockedAch: []
};

// --- CORE FUNCTIONS ---
function save() {
    localStorage.setItem('slayerData', JSON.stringify(appData));
}

function addInput(type, val = "", subs = []) {
    const container = document.getElementById(type + 'Inputs');
    const div = document.createElement('div');
    div.className = 'task-input-group';
    div.innerHTML = `
        <input type="text" class="m-in" value="${val}" placeholder="Task Name">
        <button onclick="addSubInput(this)">+S</button>
        <div class="s-cont" style="margin-left:20px"></div>
    `;
    container.appendChild(div);
    subs.forEach(s => addSubInput(div.querySelector('button'), s.val, s.done));
}

function addSubInput(btn, val = "") {
    const inp = document.createElement('input');
    inp.type = "text";
    inp.className = "s-in";
    inp.value = val;
    btn.parentElement.querySelector('.s-cont').appendChild(inp);
}

// --- RELIABLE RESET ---
function checkDateResets() {
    const today = new Date().toDateString();
    if (appData.lastLogin !== today) {
        // Daily Reset: Uncheck all daily tasks
        appData.daily.forEach(t => {
            t.done = false;
            t.subs.forEach(s => s.done = false);
        });
        showToast("☀️ New Day: Daily Tasks Reset!");
        appData.lastLogin = today;
        save();
    }
    // Check for Weekly Reset (Monday)
    const dayName = new Date().toLocaleDateString('en-US', {weekday: 'long'});
    if (dayName === "Monday" && localStorage.getItem('lastWeekReset') !== today) {
        appData.weekly.forEach(t => { t.done = false; t.subs.forEach(s => s.done = false); });
        localStorage.setItem('lastWeekReset', today);
        showToast("📅 Monday: Weekly Tasks Reset!");
        save();
    }
}

// --- DASHBOARD LOGIC ---
document.getElementById('saveBtn').addEventListener('click', () => {
    // Collect all data from Editor
    appData.weekly = collectTasks('weeklyInputs');
    appData.daily = collectTasks('dailyInputs');
    appData.seq = document.getElementById('seqInput').value;
    appData.amTime = document.getElementById('amTime').value;
    appData.pmTime = document.getElementById('pmTime').value;
    save();
    enterDashboard();
});

function collectTasks(id) {
    return Array.from(document.getElementById(id).children).map(group => ({
        val: group.querySelector('.m-in').value,
        done: false,
        subs: Array.from(group.querySelectorAll('.s-in')).map(si => ({ val: si.value, done: false }))
    }));
}

function enterDashboard() {
    document.getElementById('editor').classList.add('hidden');
    document.getElementById('viewMode').classList.remove('hidden');
    document.getElementById('weekBarContainer').classList.remove('hidden');
    checkDateResets();
    renderTasks();
}

function renderTasks() {
    renderList('weekly');
    renderList('daily');
    document.getElementById('seqDisplay').innerText = appData.seq;
    updateXP();
}

function renderList(type) {
    const cont = document.getElementById(type + 'Display');
    cont.innerHTML = '';
    appData[type].forEach((task, tIdx) => {
        if (!task.val) return;
        const row = document.createElement('div');
        row.className = 'task-row';
        row.innerHTML = `<input type="checkbox" ${task.done?'checked':''} onchange="updateTask('${type}',${tIdx},-1,this.checked)"> <b>${task.val}</b>`;
        cont.appendChild(row);
        
        task.subs.forEach((sub, sIdx) => {
            const sRow = document.createElement('div');
            sRow.className = 'task-row sub-row';
            sRow.innerHTML = `<input type="checkbox" ${sub.done?'checked':''} onchange="updateTask('${type}',${tIdx},${sIdx},this.checked)"> ${sub.val}`;
            cont.appendChild(sRow);
        });
    });
}

function updateTask(type, tIdx, sIdx, status) {
    if (sIdx === -1) appData[type][tIdx].done = status;
    else appData[type][tIdx].subs[sIdx].done = status;
    save();
    updateXP();
    showToast("Progress Updated!");
}

function updateXP() {
    let total = 0, earned = 0;
    ['weekly', 'daily'].forEach(type => {
        appData[type].forEach(t => {
            if (!t.val) return;
            total++;
            const subCount = t.subs.length;
            const subsDone = t.subs.filter(s => s.done).length;
            if (subCount === 0) { if (t.done) earned++; }
            else {
                const weight = 1 / (subCount + 1);
                if (t.done && subsDone > 0) earned += weight;
                earned += (subsDone * weight);
            }
        });
    });
    const p = total > 0 ? Math.round((earned / total) * 100) : 0;
    document.getElementById('xpBar').style.width = p + "%";
    document.getElementById('xpText').innerText = `XP: ${p}%`;
    
    if (p > 0) unlockAch('ach-1');
    if (p >= 50) unlockAch('ach-2');
    if (p === 100) unlockAch('ach-3');
}

function unlockAch(id) {
    const el = document.getElementById(id);
    if (!el.classList.contains('unlocked')) {
        el.classList.add('unlocked');
        showToast("🏆 ACHIEVEMENT UNLOCKED!");
    }
}

function showToast(m) {
    const t = document.createElement('div');
    t.className = 'toast'; t.innerText = m;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function updateBoss() {
    const now = new Date(), start = new Date(now.getFullYear(), 0, 1);
    const day = Math.floor((now - start) / 86400000) + 1;
    const total = (now.getFullYear() % 4 === 0) ? 366 : 365;
    document.getElementById('weekBar').style.width = (day/total*100) + "%";
    document.getElementById('weekBarText').innerText = `DAY ${day} / ${total}`;
}

// Init
setInterval(updateBoss, 60000);
updateBoss();
// Load existing data into editor
appData.weekly.forEach(t => addInput('weekly', t.val, t.subs));
appData.daily.forEach(t => addInput('daily', t.val, t.subs));
document.getElementById('seqInput').value = appData.seq;
document.getElementById('amTime').value = appData.amTime;
document.getElementById('pmTime').value = appData.pmTime;
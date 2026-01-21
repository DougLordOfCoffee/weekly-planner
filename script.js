let appData = JSON.parse(localStorage.getItem('slayerData')) || {
    weekly: [], daily: [], amTime: "06:00", pmTime: "22:00",
    bg: "", shader: 0.7, unlocked: [], lastDate: "", streak: 0, streakClaimed: false
};

// --- ALARM LOGIC ---
let lastTime = "";
setInterval(() => {
    const now = new Date();
    const time = now.getHours().toString().padStart(2,'0') + ":" + now.getMinutes().toString().padStart(2,'0');
    if ((time === appData.amTime || time === appData.pmTime) && lastTime !== time) {
        lastTime = time;
        showToast(time === appData.amTime ? "☀️ RISE AND SHINE!" : "🌙 NIGHT RESET TIME!");
        new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(()=>{});
    }
    updateTimeBars();
}, 1000);

// --- NAVIGATION ---
function toggleView() {
    const isEditing = !document.getElementById('editor').classList.contains('hidden');
    if (isEditing) {
        // Saving
        appData.weekly = collect('weeklyInputs');
        appData.daily = collect('dailyInputs');
        appData.bg = document.getElementById('bgUrl').value;
        appData.shader = document.getElementById('shaderRange').value;
        appData.amTime = document.getElementById('amTime').value;
        appData.pmTime = document.getElementById('pmTime').value;
        saveData();
        renderDashboard();
    }
    document.getElementById('editor').classList.toggle('hidden');
    document.getElementById('viewMode').classList.toggle('hidden');
    document.getElementById('statBars').classList.toggle('hidden');
    updateVisuals();
}

document.getElementById('saveBtn').onclick = toggleView;

// --- TASK HELPERS ---
function addInput(type, val="", subs=[]) {
    const div = document.createElement('div');
    div.className = 'input-group';
    div.style.marginBottom = "10px";
    div.innerHTML = `
        <input type="text" class="m-in" value="${val}" placeholder="Main Task" style="width:70%;">
        <button onclick="this.nextElementSibling.appendChild(createSubIn())" style="background:var(--accent); padding:4px 8px;">+S</button>
        <div class="s-cont" style="margin-left:20px; display:flex; flex-direction:column;"></div>
    `;
    document.getElementById(type+'Inputs').appendChild(div);
    subs.forEach(s => div.querySelector('.s-cont').appendChild(createSubIn(s.val)));
}

function createSubIn(val="") {
    const i = document.createElement('input');
    i.className = "s-in"; i.value = val; i.placeholder = "Subtask"; i.style.marginTop = "4px";
    return i;
}

function collect(id) {
    return Array.from(document.getElementById(id).children).map(g => ({
        val: g.querySelector('.m-in').value,
        done: false,
        subs: Array.from(g.querySelectorAll('.s-in')).map(s => ({val: s.value, done: false}))
    }));
}

// --- DASHBOARD RENDER ---
function renderDashboard() {
    checkResets();
    ['weekly', 'daily'].forEach(type => {
        const cont = document.getElementById(type+'Display');
        cont.innerHTML = '';
        appData[type].forEach((t, i) => {
            if (!t.val) return;
            const d = document.createElement('div');
            d.style.margin = "10px 0";
            d.innerHTML = `<input type="checkbox" ${t.done?'checked':''} onchange="upd('${type}',${i},-1,this.checked)"> <b style="font-size:1.1rem">${t.val}</b>`;
            cont.appendChild(d);
            t.subs.forEach((s, si) => {
                const sd = document.createElement('div');
                sd.style.marginLeft = "35px"; sd.style.marginTop = "5px";
                sd.innerHTML = `<input type="checkbox" ${s.done?'checked':''} onchange="upd('${type}',${i},${si},this.checked)"> ${s.val}`;
                cont.appendChild(sd);
            });
        });
    });
    updateXP();
    document.getElementById('streakDisplay').innerText = `🔥 ${appData.streak} DAY STREAK`;
}

function upd(type, i, si, val) {
    if (si === -1) appData[type][i].done = val;
    else appData[type][i].subs[si].done = val;
    saveData();
    updateXP();
}

function updateXP() {
    let t = 0, e = 0;
    ['weekly', 'daily'].forEach(type => {
        appData[type].forEach(tk => {
            if (!tk.val) return;
            t++;
            const sDone = tk.subs.filter(s=>s.done).length;
            const sTotal = tk.subs.length;
            if (sTotal === 0) { if (tk.done) e++; }
            else {
                const w = 1 / (sTotal + 1);
                if (tk.done && sDone > 0) e += w;
                e += (sDone * w);
            }
        });
    });
    const p = t > 0 ? Math.round((e/t)*100) : 0;
    document.getElementById('xpBar').style.width = p + "%";
    document.getElementById('xpLabel').innerText = `XP: ${p}%`;

    if (p === 100 && !appData.streakClaimed) {
        appData.streak++;
        appData.streakClaimed = true;
        showToast("⚡ STREAK INCREASED! 🔥");
        saveData();
    }
    
    if (p > 0) unlock("Initiated", "🌱");
    if (p >= 100) unlock("Legendary", "👑");
}

function checkResets() {
    const today = new Date().toDateString();
    if (appData.lastDate !== today) {
        appData.daily.forEach(t => { t.done = false; t.subs.forEach(s => s.done = false); });
        appData.lastDate = today;
        appData.streakClaimed = false;
        saveData();
        showToast("🌅 Daily Tasks Reset!");
    }
}

function unlock(name, icon) {
    if (appData.unlocked.includes(name)) return;
    appData.unlocked.push(name);
    saveData();
    const s = document.createElement('span'); s.className = 'medal'; s.innerText = icon; s.title = name;
    document.getElementById('achievementList').appendChild(s);
    showToast(`🏆 ACHIEVEMENT: ${name}`);
}

function updateTimeBars() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const day = Math.floor((now - start) / 86400000) + 1;
    document.getElementById('weekBar').style.width = (day/365*100) + "%";
    document.getElementById('weekBarText').innerText = `YEAR: ${day}/365`;
    const dayP = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400 * 100;
    document.getElementById('dayBar').style.width = dayP + "%";
}

function updateVisuals() {
    document.getElementById('bg-layer').style.backgroundImage = `url(${appData.bg})`;
    document.getElementById('shader-layer').style.background = `rgba(0,0,0,${appData.shader})`;
}

function saveData() { localStorage.setItem('slayerData', JSON.stringify(appData)); }

function showToast(m) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerText = m;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

// Start
appData.weekly.forEach(t => addInput('weekly', t.val, t.subs));
appData.daily.forEach(t => addInput('daily', t.val, t.subs));
document.getElementById('bgUrl').value = appData.bg;
document.getElementById('shaderRange').value = appData.shader;
document.getElementById('amTime').value = appData.amTime;
document.getElementById('pmTime').value = appData.pmTime;
updateVisuals();
appData.unlocked.forEach(u => {
    const s = document.createElement('span'); s.className = 'medal'; 
    s.innerText = u === "Initiated" ? "🌱" : "👑";
    document.getElementById('achievementList').appendChild(s);
});
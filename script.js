let appData = JSON.parse(localStorage.getItem('slayerData')) || {
    weekly: [], daily: [], amTime: "06:00", pmTime: "22:00",
    bg: "", shader: 0.7, unlocked: [], lastLogin: ""
};

// --- ALARM ENGINE ---
let lastNotified = "";
function checkAlarms() {
    const now = new Date();
    const time = now.getHours().toString().padStart(2,'0') + ":" + now.getMinutes().toString().padStart(2,'0');
    
    if ((time === appData.amTime || time === appData.pmTime) && lastNotified !== time) {
        lastNotified = time;
        showToast(time === appData.amTime ? "☀️ WAKE UP: Morning Routine!" : "🌙 RESET: Night Sequence!");
        new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(()=>{});
    }
}
setInterval(checkAlarms, 1000);

// --- VISUALS ---
function updateVisuals() {
    document.getElementById('bg-layer').style.backgroundImage = `url(${appData.bg})`;
    document.getElementById('shader-layer').style.background = `rgba(0,0,0,${appData.shader})`;
}

// --- TASK LOGIC ---
function addInput(type, val="", subs=[]) {
    const div = document.createElement('div');
    div.className = 'group';
    div.innerHTML = `<input type="text" class="m-in" value="${val}" placeholder="${type} task">
                     <button onclick="this.nextElementSibling.appendChild(Object.assign(document.createElement('input'),{className:'s-in'}))">+S</button>
                     <div class="s-cont"></div>`;
    document.getElementById(type+'Inputs').appendChild(div);
    subs.forEach(s => {
        const si = Object.assign(document.createElement('input'), {className:'s-in', value:s.val});
        div.querySelector('.s-cont').appendChild(si);
    });
}

function exitDashboard() {
    document.getElementById('editor').classList.remove('hidden');
    document.getElementById('viewMode').classList.add('hidden');
    document.getElementById('bars').classList.add('hidden');
}

document.getElementById('saveBtn').onclick = () => {
    appData.weekly = collect('weeklyInputs');
    appData.daily = collect('dailyInputs');
    appData.bg = document.getElementById('bgUrl').value;
    appData.shader = document.getElementById('shaderRange').value;
    appData.amTime = document.getElementById('amTime').value;
    appData.pmTime = document.getElementById('pmTime').value;
    localStorage.setItem('slayerData', JSON.stringify(appData));
    updateVisuals();
    enterDashboard();
};

function collect(id) {
    return Array.from(document.getElementById(id).children).map(g => ({
        val: g.querySelector('.m-in').value,
        subs: Array.from(g.querySelectorAll('.s-in')).map(s => ({val: s.value, done: false})),
        done: false
    }));
}

function enterDashboard() {
    document.getElementById('editor').classList.add('hidden');
    document.getElementById('viewMode').classList.remove('hidden');
    document.getElementById('bars').classList.remove('hidden');
    render();
}

function render() {
    ['weekly', 'daily'].forEach(type => {
        const cont = document.getElementById(type+'Display');
        cont.innerHTML = '';
        appData[type].forEach((t, i) => {
            const d = document.createElement('div');
            d.innerHTML = `<input type="checkbox" ${t.done?'checked':''} onchange="upd('${type}',${i},-1,this.checked)"> ${t.val}`;
            cont.appendChild(d);
            t.subs.forEach((s, si) => {
                const sd = document.createElement('div');
                sd.style.marginLeft = "30px";
                sd.innerHTML = `<input type="checkbox" ${s.done?'checked':''} onchange="upd('${type}',${i},${si},this.checked)"> ${s.val}`;
                cont.appendChild(sd);
            });
        });
    });
    updateXP();
}

function upd(type, i, si, val) {
    if (si === -1) appData[type][i].done = val;
    else appData[type][i].subs[si].done = val;
    localStorage.setItem('slayerData', JSON.stringify(appData));
    updateXP();
    showToast("Progress Saved");
}

function updateXP() {
    let t = 0, e = 0;
    ['weekly', 'daily'].forEach(type => {
        appData[type].forEach(tk => {
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
    document.getElementById('xpDisplay').innerText = `XP: ${p}%`;
    
    // Achievements
    if (p > 0) unlock("First Blood", "🌱");
    if (p >= 100) unlock("God Mode", "👑");
    if (appData.weekly.length > 5) unlock("Overachiever", "📚");
}

function unlock(name, icon) {
    if (appData.unlocked.includes(name)) return;
    appData.unlocked.push(name);
    localStorage.setItem('slayerData', JSON.stringify(appData));
    const span = document.createElement('span');
    span.className = 'medal'; span.innerText = icon; span.title = name;
    document.getElementById('achievementList').appendChild(span);
    showToast(`🏆 UNLOCKED: ${name}`);
}

function showToast(m) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerText = m;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => t.remove(), 4000);
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
setInterval(updateTimeBars, 1000);

// Init
appData.weekly.forEach(t => addInput('weekly', t.val, t.subs));
appData.daily.forEach(t => addInput('daily', t.val, t.subs));
document.getElementById('bgUrl').value = appData.bg;
document.getElementById('shaderRange').value = appData.shader;
document.getElementById('amTime').value = appData.amTime;
document.getElementById('pmTime').value = appData.pmTime;
updateVisuals();
appData.unlocked.forEach(u => {
    const span = document.createElement('span');
    span.className = 'medal'; span.innerText = u === "First Blood" ? "🌱" : u === "God Mode" ? "👑" : "📚";
    document.getElementById('achievementList').appendChild(span);
});
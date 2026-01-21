let saved = JSON.parse(localStorage.getItem("voidData")) || {};
let appData = {
    version: 1,
    weekly: [],
    daily: [],
    guideNight: "",
    guideMorning: "",
    amTime: "06:00",
    pmTime: "22:00",
    bg: "",
    shader: 0.7,
    unlocked: [],
    lastDate: "",
    lastWeek: null,
    focusMode: false,
    view: "editor",
    ...saved
};

function sync() {
    localStorage.setItem("voidData", JSON.stringify(appData));
}

// --- DASHBOARD TOGGLE ---
function toggleView() {
    const isCurrentlyEditor = appData.view === "editor";

    if (isCurrentlyEditor) {
        // Collect data from inputs before switching
        appData.weekly = collect('weekly');
        appData.daily = collect('daily');
        appData.bg = document.getElementById('bgUrl').value;
        appData.shader = document.getElementById('shaderRange').value;
        appData.amTime = document.getElementById('amTime').value;
        appData.pmTime = document.getElementById('pmTime').value;
        appData.guideNight = document.getElementById('nightGuide').value;
        appData.guideMorning = document.getElementById('morningGuide').value;
        
        renderView(); 
    }

    appData.view = isCurrentlyEditor ? "dashboard" : "editor";
    sync();
    applyVisibility();
}

function applyVisibility() {
    const isDashboard = appData.view === "dashboard";
    document.getElementById('editor').classList.toggle('hidden', isDashboard);
    document.getElementById('dashboard').classList.toggle('hidden', !isDashboard);
    document.getElementById('topBars').classList.toggle('hidden', !isDashboard);
    updateVisuals();
}

document.getElementById('saveBtn').onclick = toggleView;

function toggleFocus() {
    appData.focusMode = !appData.focusMode;
    sync();
    renderView();
}

// --- INPUT HELPERS ---
function addInput(type, val = "", subs = []) {
    const g = document.createElement('div');
    g.className = "input-group";
    g.style.marginBottom = "15px";
    g.innerHTML = `
        <div style="display:flex; gap:5px;">
            <input type="text" class="m-in" value="${val}" placeholder="Goal..." style="width:75%;">
            <button onclick="this.parentElement.nextElementSibling.appendChild(createSubIn())" style="background:var(--accent); color:white; border:none; border-radius:4px; padding:4px 8px;">+S</button>
        </div>
        <div class="s-cont" style="margin-left:25px; display:flex; flex-direction:column;"></div>
    `;
    document.getElementById(type + 'Inputs').appendChild(g);
    subs.forEach(s => g.querySelector('.s-cont').appendChild(createSubIn(s.val)));
}

function createSubIn(val = "") {
    const i = document.createElement('input');
    i.className = "s-in"; 
    i.value = val; 
    i.placeholder = "Subtask"; 
    i.style.marginTop = "5px"; 
    i.style.fontSize = "0.85rem";
    return i;
}

function collect(type) {
    const container = document.getElementById(type + 'Inputs');
    return Array.from(container.querySelectorAll('.input-group')).map((g, index) => {
        const mainVal = g.querySelector('.m-in').value;
        const existing = appData[type][index];
        
        // Preserve 'done' if the text hasn't changed
        const isDone = (existing && existing.val === mainVal) ? existing.done : false;

        const subs = Array.from(g.querySelectorAll('.s-in')).map((s, si) => {
            const existingSub = (existing && existing.subs && existing.subs[si]) ? existing.subs[si] : null;
            return {
                val: s.value,
                done: (existingSub && existingSub.val === s.value) ? existingSub.done : false
            };
        });

        return { val: mainVal, done: isDone, subs: subs };
    }).filter(t => t.val.trim() !== "");
}

// --- RENDERING ---
function renderView() {
    const guide = document.getElementById("guideDisplay");
    guide.innerHTML = "";

    if (appData.guideNight) {
        const n = document.createElement("div");
        n.className = "guide-block";
        n.innerHTML = `<strong>Night:</strong><pre>${appData.guideNight}</pre>`;
        guide.appendChild(n);
    }

    if (appData.guideMorning) {
        const m = document.createElement("div");
        m.className = "guide-block";
        m.innerHTML = `<strong>Morning:</strong><pre>${appData.guideMorning}</pre>`;
        guide.appendChild(m);
    }

    ["weekly", "daily"].forEach(type => {
        const cont = document.getElementById(type + "Display");
        cont.innerHTML = `<h3>${type.toUpperCase()}</h3>`;

        appData[type].forEach((t, i) => {
            const row = document.createElement("div");
            row.className = "task-row";
            if (appData.focusMode && t.done) row.classList.add("focus-hide");

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = t.done;
            cb.onchange = () => upd(type, i, -1, cb.checked);

            const label = document.createElement("span");
            label.textContent = " " + t.val;
            label.style.fontWeight = "bold";

            row.append(cb, label);
            cont.appendChild(row);

            t.subs.forEach((s, si) => {
                const sr = document.createElement("div");
                sr.className = "sub-row";
                if (appData.focusMode && s.done) sr.classList.add("focus-hide");

                const scb = document.createElement("input");
                scb.type = "checkbox";
                scb.checked = s.done;
                scb.onchange = () => upd(type, i, si, scb.checked);

                const slabel = document.createElement("span");
                slabel.textContent = " " + s.val;

                sr.append(scb, slabel);
                cont.appendChild(sr);
            });
        });
    });

    updateXP();
}

function upd(type, i, si, val) {
    const task = appData[type][i];
    if (si === -1) {
        task.done = val;
    } else {
        task.subs[si].done = val;
        task.done = task.subs.every(s => s.done);
    }
    sync();
    renderView(); // Re-render to handle focus mode visibility
}

function updateXP() {
    let total = 0, earned = 0;

    ["weekly", "daily"].forEach(type => {
        const weight = type === "weekly" ? 1.5 : 1;
        appData[type].forEach(tk => {
            total += weight;
            if (tk.subs.length === 0) {
                if (tk.done) earned += weight;
            } else {
                const doneSubs = tk.subs.filter(s => s.done).length;
                earned += weight * (doneSubs / tk.subs.length);
            }
        });
    });

    const p = total ? Math.round((earned / total) * 100) : 0;
    document.getElementById("xpBar").style.width = p + "%";
    document.getElementById("xpLabel").innerText = `XP: ${p}%`;

    if (p > 0) unlock("VOID_WALKER", "🌱");
    if (p >= 50) unlock("SYNAPSE_LINK", "🌗");
    if (p >= 100) unlock("SYSTEM_LORD", "👑");
}

function unlock(id, icon) {
    if (appData.unlocked.includes(id)) return;
    appData.unlocked.push(id);
    sync();
    renderAchievements();
}

function renderAchievements() {
    const list = document.getElementById('achievementList');
    list.innerHTML = "";
    appData.unlocked.forEach(id => {
        const icon = id === "VOID_WALKER" ? "🌱" : id === "SYNAPSE_LINK" ? "🌗" : "👑";
        const span = document.createElement('span');
        span.className = 'achievement-pop'; 
        span.innerText = icon; 
        span.title = id;
        list.appendChild(span);
    });
}

// --- UTILS ---
function updateVisuals() {
    document.getElementById('bg-layer').style.backgroundImage = `url(${appData.bg})`;
    document.getElementById('shader-layer').style.background = `rgba(0,0,0,${appData.shader})`;
}

function getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
}

function checkResets() {
    const now = new Date();
    const today = now.toDateString();
    const week = getWeekNumber(now);

    if (appData.lastDate !== today) {
        appData.daily.forEach(t => { t.done = false; t.subs.forEach(s => s.done = false); });
        appData.lastDate = today;
    }
    if (appData.lastWeek !== week) {
        appData.weekly.forEach(t => { t.done = false; t.subs.forEach(s => s.done = false); });
        appData.lastWeek = week;
    }
    sync();
}

function updateTime() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const day = Math.floor((now - start) / 86400000) + 1;
    document.getElementById('yearBar').style.width = (day/365*100) + "%";
    const dayP = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400 * 100;
    document.getElementById('dayBar').style.width = dayP + "%";
}

// --- INIT ---
setInterval(updateTime, 1000);
updateTime();
checkResets();

// Populate Editor
appData.weekly.forEach(t => addInput('weekly', t.val, t.subs));
appData.daily.forEach(t => addInput('daily', t.val, t.subs));
if (appData.weekly.length === 0) addInput('weekly');
if (appData.daily.length === 0) addInput('daily');

document.getElementById('bgUrl').value = appData.bg || "";
document.getElementById('shaderRange').value = appData.shader || 0.7;
document.getElementById('amTime').value = appData.amTime || "06:00";
document.getElementById('pmTime').value = appData.pmTime || "22:00";
document.getElementById('nightGuide').value = appData.guideNight || "";
document.getElementById('morningGuide').value = appData.guideMorning || "";

applyVisibility();
renderAchievements();
renderView();
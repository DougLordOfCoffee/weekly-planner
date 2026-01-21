let appData = JSON.parse(localStorage.getItem('voidData')) || {
    weekly: [], daily: [], amTime: "06:00", pmTime: "22:00",
    bg: "", shader: 0.7, unlocked: [], lastDate: ""
};

// --- DATA SAVING ---
const sync = () => localStorage.setItem('voidData', JSON.stringify(appData));

// --- DASHBOARD TOGGLE ---
function toggleView() {
    const isEdit = !document.getElementById('editor').classList.contains('hidden');
    if (isEdit) {
        appData.weekly = collect('weeklyInputs');
        appData.daily = collect('dailyInputs');
        appData.bg = document.getElementById('bgUrl').value;
        appData.shader = document.getElementById('shaderRange').value;
        appData.amTime = document.getElementById('amTime').value;
        appData.pmTime = document.getElementById('pmTime').value;
        sync();
        renderView();
    }
    document.getElementById('editor').classList.toggle('hidden');
    document.getElementById('dashboard').classList.toggle('hidden');
    document.getElementById('topBars').classList.toggle('hidden');
    updateVisuals();
}
document.getElementById('saveBtn').onclick = toggleView;

// --- INPUT HELPERS ---
function addInput(type, val="", subs=[]) {
    const g = document.createElement('div');
    g.style.marginBottom = "15px";
    g.innerHTML = `
        <input type="text" class="m-in" value="${val}" placeholder="Goal..." style="width:75%;">
        <button onclick="this.nextElementSibling.appendChild(createSubIn())" style="background:var(--accent); color:white; border:none; border-radius:4px; padding:4px 8px;">+S</button>
        <div class="s-cont" style="margin-left:25px; display:flex; flex-direction:column;"></div>
    `;
    document.getElementById(type+'Inputs').appendChild(g);
    subs.forEach(s => g.querySelector('.s-cont').appendChild(createSubIn(s.val)));
}

function createSubIn(val="") {
    const i = document.createElement('input');
    i.className = "s-in"; i.value = val; i.placeholder = "Subtask"; i.style.marginTop = "5px"; i.style.fontSize = "0.85rem";
    return i;
}

function collect(id) {
    return Array.from(document.getElementById(id).children).filter(g => g.querySelector('.m-in')).map(g => ({
        val: g.querySelector('.m-in').value,
        done: false,
        subs: Array.from(g.querySelectorAll('.s-in')).map(s => ({val: s.value, done: false}))
    }));
}

// --- RENDERING ---
function renderView() {
    checkResets();
    ['weekly', 'daily'].forEach(type => {
        const cont = document.getElementById(type+'Display');
        cont.innerHTML = `<h3>${type.toUpperCase()}</h3>`;
        appData[type].forEach((t, i) => {
            if (!t.val) return;
            const row = document.createElement('div');
            row.style.margin = "12px 0";
            row.innerHTML = `<input type="checkbox" ${t.done?'checked':''} onchange="upd('${type}',${i},-1,this.checked)"> <span style="font-weight:bold; margin-left:5px;">${t.val}</span>`;
            cont.appendChild(row);
            t.subs.forEach((s, si) => {
                const sr = document.createElement('div');
                sr.style.marginLeft = "35px"; sr.style.marginTop = "6px"; sr.style.fontSize = "0.9rem"; sr.style.opacity = "0.8";
                sr.innerHTML = `<input type="checkbox" ${s.done?'checked':''} onchange="upd('${type}',${i},${si},this.checked)"> ${s.val}`;
                cont.appendChild(sr);
            });
        });
    });
    updateXP();
}

function upd(type, i, si, val) {
    if (si === -1) appData[type][i].done = val;
    else appData[type][i].subs[si].done = val;
    sync();
    updateXP();
}

// --- XP & ACHIEVEMENTS ---
function updateXP() {
    let t = 0, e = 0;
    ['weekly', 'daily'].forEach(type => {
        appData[type].forEach(tk => {
            if (!tk.val) return; t++;
            const sTotal = tk.subs.length;
            const sDone = tk.subs.filter(s=>s.done).length;
            if (sTotal === 0) { if (tk.done) e++; }
            else {
                const w = 1 / (sTotal + 1);
                if (tk.done && sDone > 0) e += (sDone * w) + w;
                else if (sDone > 0) e += (sDone * w);
            }
        });
    });
    const p = t > 0 ? Math.round((e/t)*100) : 0;
    document.getElementById('xpBar').style.width = p + "%";
    document.getElementById('xpLabel').innerText = `XP: ${p}%`;

    // Achievement Checks (Only unlock if p reaches threshold)
    if (p > 0) unlock("VOID_WALKER", "🌱");
    if (p >= 50) unlock("SYNAPSE_LINK", "🌗");
    if (p >= 100) unlock("SYSTEM_LORD", "👑");
}

function unlock(id, icon) {
    if (appData.unlocked.includes(id)) return;
    appData.unlocked.push(id);
    sync();
    const span = document.createElement('span');
    span.className = 'achievement-pop'; span.innerText = icon; span.title = id;
    document.getElementById('achievementList').appendChild(span);
}

// --- UTILS ---
function updateVisuals() {
    document.getElementById('bg-layer').style.backgroundImage = `url(${appData.bg})`;
    document.getElementById('shader-layer').style.background = `rgba(0,0,0,${appData.shader})`;
}

function checkResets() {
    const today = new Date().toDateString();
    if (appData.lastDate !== today) {
        appData.daily.forEach(t => { t.done = false; t.subs.forEach(s => s.done = false); });
        appData.lastDate = today;
        sync();
    }
}

function updateTime() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const day = Math.floor((now - start) / 86400000) + 1;
    document.getElementById('yearBar').style.width = (day/365*100) + "%";
    const dayP = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400 * 100;
    document.getElementById('dayBar').style.width = dayP + "%";
}

setInterval(updateTime, 1000);
updateTime();

// Init
appData.weekly.forEach(t => addInput('weekly', t.val, t.subs));
appData.daily.forEach(t => addInput('daily', t.val, t.subs));
if (appData.weekly.length === 0) addInput('weekly');
if (appData.daily.length === 0) addInput('daily');

document.getElementById('bgUrl').value = appData.bg;
document.getElementById('shaderRange').value = appData.shader;
document.getElementById('amTime').value = appData.amTime;
document.getElementById('pmTime').value = appData.pmTime;
updateVisuals();
appData.unlocked.forEach(u => {
    const span = document.createElement('span');
    span.className = 'achievement-pop'; 
    span.innerText = u === "VOID_WALKER" ? "🌱" : u === "SYNAPSE_LINK" ? "🌗" : "👑";
    document.getElementById('achievementList').appendChild(span);
});
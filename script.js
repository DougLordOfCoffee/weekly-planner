const DEFAULT_DATA = {
  version: 1,
  weekly: [],
  daily: [],
  amTime: "06:00",
  pmTime: "22:00",
  bg: "",
  shader: 0.7,
  unlocked: [],
  lastDate: "",
  lastWeek: null,
  focusMode: false
};

let appData = Object.assign(
  structuredClone(DEFAULT_DATA),
  JSON.parse(localStorage.getItem("voidData")) || {}
);

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

function toggleFocus() {
  appData.focusMode = !appData.focusMode;
  sync();
  renderView();
}


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
            const row = document.createElement("div");
            row.className = "task-row";

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = t.done;
            cb.onchange = () => upd(type, i, -1, cb.checked);

            const label = document.createElement("span");
            label.textContent = " " + t.val;
            label.style.fontWeight = "bold";

            row.append(cb, label);
            cont.appendChild(row);
    });
    updateXP();
}
if (appData.focusMode && !t.done) {
  row.classList.add("focus-hide");
}


function upd(type, i, si, val) {
  const task = appData[type][i];

  if (si === -1) {
    task.done = val;
    task.subs.forEach(s => s.done = val);
  } else {
    task.subs[si].done = val;
    task.done = task.subs.every(s => s.done);
  }

  sync();
  updateXP();
}


// --- XP & ACHIEVEMENTS ---
function updateXP() {
        let total = 0, earned = 0;

        ["weekly", "daily"].forEach(type => {
        const weight = type === "weekly" ? 1.5 : 1;

        appData[type].forEach(tk => {
            if (!tk.val) return;
            total += weight;

            const subs = tk.subs.length;
            const doneSubs = tk.subs.filter(s => s.done).length;

            if (subs === 0) {
            if (tk.done) earned += weight;
            } else {
            earned += weight * (doneSubs / subs);
            }
        });
      });

        const p = total ? Math.round((earned / total) * 100) : 0;


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
    appData.daily.forEach(t => {
      t.done = false;
      t.subs.forEach(s => s.done = false);
    });
    appData.lastDate = today;
  }

  if (appData.lastWeek !== week) {
    appData.weekly.forEach(t => {
      t.done = false;
      t.subs.forEach(s => s.done = false);
    });
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

setInterval(updateTime, 1000);
updateTime();

function updateTimeMood() {
  const now = new Date();
  const h = now.getHours();
  document.body.style.filter =
    h < 8 || h > 22 ? "brightness(0.85)" : "none";
}

setInterval(updateTimeMood, 60000);
updateTimeMood();


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
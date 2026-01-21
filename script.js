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
  const goingToDashboard = appData.view === "editor";

  if (goingToDashboard) {
    appData.weekly = collect('weeklyInputs');
    appData.daily = collect('dailyInputs');
    appData.bg = document.getElementById('bgUrl').value;
    appData.shader = document.getElementById('shaderRange').value;
    appData.amTime = document.getElementById('amTime').value;
    appData.pmTime = document.getElementById('pmTime').value;
    appData.guideNight = document.getElementById('nightGuide').value;
    appData.guideMorning = document.getElementById('morningGuide').value;

    sync();
    renderView();
  }

  appData.view = goingToDashboard ? "dashboard" : "editor";
  sync();

  document.getElementById('editor').classList.toggle('hidden', appData.view !== "editor");
  document.getElementById('dashboard').classList.toggle('hidden', appData.view !== "dashboard");
  document.getElementById('topBars').classList.toggle('hidden', appData.view !== "dashboard");

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

function collect(type) {
    const id = type + 'Inputs';
    return Array.from(document.getElementById(id).children).filter(g => g.querySelector('.m-in')).map((g, index) => {
        const val = g.querySelector('.m-in').value;
        // Try to find if this task already existed to preserve 'done' status
        const existing = appData[type][index];
        const isDone = (existing && existing.val === val) ? existing.done : false;

        return {
            val: val,
            done: isDone,
            subs: Array.from(g.querySelectorAll('.s-in')).map((s, si) => {
                const existingSub = (existing && existing.subs[si]) ? existing.subs[si] : null;
                return {
                    val: s.value,
                    done: (existingSub && existingSub.val === s.value) ? existingSub.done : false
                };
            })
        };
    });
}

// --- RENDERING ---
function renderView() {

  const guide = document.getElementById("guideDisplay");
    guide.innerHTML = "";

    if (appData.guideNight) {
      const n = document.createElement("pre");
        n.className = "guide-block";
        n.textContent = appData.guideNight;
        guide.appendChild(n);
    }

    if (appData.guideMorning) {
        const m = document.createElement("pre");
        m.className = "guide-block";
        m.textContent = appData.guideMorning;
        guide.appendChild(m);
    }


  ["weekly", "daily"].forEach(type => {
    const cont = document.getElementById(type + "Display");
    cont.innerHTML = `<h3>${type.toUpperCase()}</h3>`;

    appData[type].forEach((t, i) => {
      if (!t.val) return;

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

     if (appData.focusMode && t.done) {
         row.classList.add("focus-hide");
     }

      cont.appendChild(row);

      // Subtasks
      t.subs.forEach((s, si) => {
        if (!s.val) return;

        const sr = document.createElement("div");
        sr.className = "sub-row";

        const scb = document.createElement("input");
        scb.type = "checkbox";
        scb.checked = s.done;
        scb.onchange = () => upd(type, i, si, scb.checked);

        const slabel = document.createElement("span");
        slabel.textContent = " " + s.val;

        sr.append(scb, slabel);

        if (appData.focusMode && !s.done) {
          sr.classList.add("focus-hide");
        }

        cont.appendChild(sr);
      });
    });
  });

  updateXP();
}


function upd(type, i, si, val) {
  const task = appData[type][i];

  if (si === -1) {
    // Main checkbox ONLY toggles main done state
    task.done = val;
  } else {
    // Subtask checkbox
    task.subs[si].done = val;

    // Auto-mark main as done ONLY if all subs done
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
        
        document.getElementById("xpBar").style.width = p + "%";
        document.getElementById("xpLabel").innerText = `XP: ${p}%`;



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
document.getElementById('nightGuide').value = appData.guideNight || "";
document.getElementById('morningGuide').value = appData.guideMorning || "";

updateVisuals();
appData.unlocked.forEach(u => {
    const span = document.createElement('span');
    span.className = 'achievement-pop'; 
    span.innerText = u === "VOID_WALKER" ? "🌱" : u === "SYNAPSE_LINK" ? "🌗" : "👑";
    document.getElementById('achievementList').appendChild(span);
});

checkResets(); 
renderView();
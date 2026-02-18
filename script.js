let saved = JSON.parse(localStorage.getItem("voidData")) || {};
let appData = {
    version: 1,
    weekly: [],
    daily: [],
    oneTime: [],
    guides: [],
    bg: "",
    shader: 0.7,
    lastDate: "",
    lastWeek: null,
    focusMode: false,
    view: "editor",
    colors: { xp: '#9500ff', day: '#3f37c9', week: '#6ab04c', center: '#ffffff' },
    centerLabelContrast: 0.9,
    centerLabels: { day: false, xp: false, year: false },
    currentUser: null,
    ...saved
};

function sync() {
    localStorage.setItem("voidData", JSON.stringify(appData));
}

// --- ACCOUNT & SAVE/LOAD SYSTEM ---
async function hashPassword(pw) {
    const enc = new TextEncoder();
    const data = enc.encode(pw);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function registerAccount() {
    const u = document.getElementById('acctUser').value.trim();
    const p = document.getElementById('acctPass').value;
    if (!u || !p) return alert('Enter username and password');
    const h = await hashPassword(p);
    const key = 'vp_user_' + u;
    if (localStorage.getItem(key)) return alert('User exists');
    const payload = { pwHash: h, data: JSON.parse(JSON.stringify(appData)) };
    localStorage.setItem(key, JSON.stringify(payload));
    alert('Registered. You are signed in.');
    appData.currentUser = u;
    sync();
    updateAccountUI();
}

async function signIn() {
    const u = document.getElementById('acctUser').value.trim();
    const p = document.getElementById('acctPass').value;
    if (!u || !p) return alert('Enter username and password');
    const key = 'vp_user_' + u;
    const stored = localStorage.getItem(key);
    if (!stored) return alert('No such user');
    const parsed = JSON.parse(stored);
    const h = await hashPassword(p);
    if (h !== parsed.pwHash) return alert('Wrong password');
    appData.currentUser = u;
    sync();
    updateAccountUI();
    alert('Signed in. You can now SAVE and LOAD your data.');
}

function signOut() {
    appData.currentUser = null;
    sync();
    updateAccountUI();
    alert('Signed out');
}

function saveDataToAccount() {
    if (!appData.currentUser) return alert('Not signed in');
    const key = 'vp_user_' + appData.currentUser;
    const stored = localStorage.getItem(key);
    if (!stored) return alert('Account not found');
    const parsed = JSON.parse(stored);
    // Save current appData (exclude currentUser from the saved data)
    const toSave = JSON.parse(JSON.stringify(appData));
    delete toSave.currentUser;
    parsed.data = toSave;
    localStorage.setItem(key, JSON.stringify(parsed));
    alert('Data saved to your account');
    sync();
}

function loadDataFromAccount() {
    if (!appData.currentUser) return alert('Not signed in');
    const key = 'vp_user_' + appData.currentUser;
    const stored = localStorage.getItem(key);
    if (!stored) return alert('Account not found');
    const parsed = JSON.parse(stored);
    // Load saved data into appData
    const loaded = parsed.data;
    appData = Object.assign({}, appData, loaded);
    appData.currentUser = appData.currentUser || key.replace('vp_user_','');
    sync();
    // rebuild UI
    document.getElementById('weeklyInputs').innerHTML = '<h3>WEEKLY</h3>';
    document.getElementById('dailyInputs').innerHTML = '<h3>DAILY</h3>';
    document.getElementById('oneTimeInputs').innerHTML = '<h3>ONE-TIME</h3>';
    populateInputs();
    updateVisuals();
    renderView();
    alert('Data loaded from your account');
}

function updateAccountUI() {
    const saveBtn = document.getElementById('saveDataBtn');
    const loadBtn = document.getElementById('loadDataBtn');
    if (appData.currentUser) {
        if (saveBtn) saveBtn.style.display = 'block';
        if (loadBtn) loadBtn.style.display = 'block';
    } else {
        if (saveBtn) saveBtn.style.display = 'none';
        if (loadBtn) loadBtn.style.display = 'none';
    }
}

// --- DASHBOARD TOGGLE ---
function toggleView() {
    const isCurrentlyEditor = appData.view === "editor";

    if (isCurrentlyEditor) {
        // Collect data from inputs before switching
        appData.weekly = collect('weekly');
        appData.daily = collect('daily');
        appData.oneTime = collect('oneTime');
        appData.bg = document.getElementById('bgUrl').value;
        appData.shader = document.getElementById('shaderRange').value;
        // removed alarm inputs (no longer in editor)
        appData.colors.xp = document.getElementById('xpColor').value;
        appData.colors.day = document.getElementById('dayColor').value;
        appData.colors.week = document.getElementById('weekColor').value;
        // center label visual controls
        const centerColEl = document.getElementById('centerLabelColor');
        if (centerColEl) appData.colors.center = centerColEl.value;
        const centerContrastEl = document.getElementById('centerLabelContrast');
        if (centerContrastEl) appData.centerLabelContrast = parseFloat(centerContrastEl.value || 0.9);
        appData.centerLabels.day = !!document.getElementById('dayCenterLabel').checked;
        appData.centerLabels.xp = !!document.getElementById('xpCenterLabel').checked;
        appData.centerLabels.year = !!document.getElementById('yearCenterLabel').checked;
        appData.guides = collectGuides();
        
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
    document.getElementById('taskbar').classList.toggle('hidden', !isDashboard);
    document.getElementById('topBars').classList.toggle('hidden', !isDashboard);
    updateVisuals();
    if (isDashboard) initSystemInfo(); // Start updating system info when dashboard shows
}

function toggleTaskbarCollapse() {
    const taskbar = document.getElementById('taskbar');
    const dashboard = document.getElementById('dashboard');
    const compactInfo = document.getElementById('compactSysInfo');
    const toggle = document.getElementById('taskbarToggle');
    
    const isCollapsed = taskbar.classList.toggle('collapsed');
    dashboard.classList.toggle('taskbar-collapsed', isCollapsed);
    
    if (isCollapsed) {
        compactInfo.classList.remove('hidden');
        toggle.innerText = '◀';
    } else {
        compactInfo.classList.add('hidden');
        toggle.innerText = '▶';
    }
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
    g.style.padding = "10px";
    g.style.border = "1px solid var(--glass-border)";
    g.style.borderRadius = "8px";

    g.innerHTML = `
        <div class="input-row" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <input type="text" class="m-in" value="${val}" placeholder="Goal..." style="flex: 1; min-width: 150px;">
            <label style="font-size:0.8rem; white-space: nowrap;"><input type="checkbox" class="one-time" ${type==='oneTime'?'checked':''}> One-time</label>
            <label style="font-size:0.8rem; white-space: nowrap;"><input type="checkbox" class="use-slider"> Slider</label>
            <input type="number" class="slider-max" min="1" value="5" style="width: 50px;">
            <button onclick="this.parentElement.nextElementSibling.appendChild(createSubIn())" style="background:var(--accent); color:white; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; white-space: nowrap;">+Sub</button>
            <button class="del-btn" onclick="this.closest('.input-group').remove()" style="padding: 6px 10px;">X</button>
        </div>
        <div class="s-cont" style="margin-left:25px; display:flex; flex-direction:column;"></div>
    `;
    document.getElementById(type + 'Inputs').appendChild(g);
    subs.forEach(s => g.querySelector('.s-cont').appendChild(createSubIn(s.val)));
}

function createSubIn(val = "") {
    const div = document.createElement('div');
    div.className = "input-row";
    div.style.marginTop = "8px";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "8px";
    div.innerHTML = `
        <input type="text" class="s-in" value="${val}" placeholder="Subtask" style="flex: 1; font-size:0.8rem;">
        <button class="del-btn" onclick="this.parentElement.remove()" style="padding: 4px 8px; font-size: 0.8rem;">x</button>
    `;
    return div;
}

function collect(type) {
    const container = document.getElementById(type + 'Inputs');
    return Array.from(container.querySelectorAll('.input-group')).map((g, index) => {
        const mainVal = g.querySelector('.m-in').value;
        const existing = appData[type][index];
        
        // Preserve 'done' if the text hasn't changed
        const isDone = (existing && existing.val === mainVal) ? existing.done : false;

        const useSliderEl = g.querySelector('.use-slider');
        const sliderMaxEl = g.querySelector('.slider-max');
        const oneTimeEl = g.querySelector('.one-time');
        const useSlider = useSliderEl ? useSliderEl.checked : (existing? existing.useSlider:false);
        const sliderMax = sliderMaxEl ? parseInt(sliderMaxEl.value || 1,10) : (existing? existing.sliderMax||1:1);
        const sliderVal = existing && existing.sliderVal ? existing.sliderVal : 0;
        const oneTime = oneTimeEl ? oneTimeEl.checked : false;

        const subs = Array.from(g.querySelectorAll('.s-in')).map((s, si) => {
            const existingSub = (existing && existing.subs && existing.subs[si]) ? existing.subs[si] : null;
            return {
                val: s.value,
                done: (existingSub && existingSub.val === s.value) ? existingSub.done : false
            };
        });

        return { val: mainVal, done: isDone, subs: subs, useSlider: useSlider, sliderMax: sliderMax, sliderVal: sliderVal, oneTime: oneTime };
    }).filter(t => t.val.trim() !== "");
}

// --- RENDERING ---
function renderView() {
    const guide = document.getElementById("guideDisplay");
    // Safety check: If dashboard isn't visible or element missing, skip
    if (!guide) return; 

    guide.innerHTML = "";
    appData.guides.forEach(gd => {
        const n = document.createElement("div");
        n.className = "guide-block";
        n.innerHTML = `<strong>${gd.name}:</strong><pre>${gd.text}</pre>`;
        guide.appendChild(n);
    });

    ["weekly", "daily"].forEach(type => {
        const cont = document.getElementById(type + "Display");
        if (!cont) return; // Safety check
        
        cont.innerHTML = `<h3>${type.toUpperCase()}</h3>`;

        appData[type].forEach((t, i) => {
            if (!t.val) return;

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

            // Slider UI rendered as a sub-row (below parent, above subs)
            if (t.useSlider) {
                const srow = document.createElement('div');
                srow.className = 'sub-row';
                srow.style.display = 'flex'; srow.style.alignItems = 'center'; srow.style.gap = '8px';

                const sl = document.createElement('input');
                sl.type = 'range';
                sl.className = 'task-slider';
                sl.min = 0; sl.max = t.sliderMax || 1; sl.value = t.sliderVal || 0;
                sl.step = 0.01; // smooth while dragging
                // live label
                const valLabel = document.createElement('span'); valLabel.className = 'slider-val'; valLabel.innerText = `${Math.round(t.sliderVal||0)}/${t.sliderMax||1}`;

                // initialize filled track
                updateRangeFill(sl, sl.value, sl.max, appData.colors.xp);

                // while dragging: update label and track only (no re-render) for smooth follow
                sl.oninput = (e) => { valLabel.innerText = `${Math.round(e.target.value)}/${sl.max}`; updateRangeFill(sl, e.target.value, sl.max, appData.colors.xp); };

                // on release (change), snap to nearest notch and commit with a small snap animation
                sl.onchange = (e) => {
                    const target = e.target;
                    const current = parseFloat(target.value);
                    const v = Math.round(current);
                    // animate the visual fill from current fractional to snapped integer
                    animateRangeFill(target, current, v, sl.max, appData.colors.xp, 200, () => {
                        target.value = v;
                        valLabel.innerText = `${v}/${sl.max}`;
                        // ensure final fill state
                        updateRangeFill(target, v, sl.max, appData.colors.xp);
                        updSlider(type, i, v);
                    });
                };

                srow.appendChild(sl);
                srow.appendChild(valLabel);
                cont.appendChild(srow);
            }

            t.subs.forEach((s, si) => {
                if (!s.val) return;
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
        // render one-time tasks
        const oneCont = document.getElementById('oneTimeDisplay');
        if (oneCont) {
            oneCont.innerHTML = '<h3>ONE-TIME</h3>';
            if (appData.oneTime.length === 0) {
                oneCont.style.display = 'none'; // Hide if empty
            } else {
                oneCont.style.display = 'block';
                appData.oneTime.forEach((t,i) => {
                    if (!t.val) return;
                    const row = document.createElement('div'); row.className='task-row';
                    const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = t.done; cb.onchange = () => { if(cb.checked){ appData.oneTime.splice(i,1); sync(); renderView(); } else { t.done = false; sync(); renderView(); } };
                    const label = document.createElement('span'); label.textContent = ' '+t.val; label.style.fontWeight='bold';
                    row.append(cb,label);
                    oneCont.appendChild(row);
                });
            }
        }
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

    // achievements removed
    // keep other visuals updated
    updateVisuals();
}

// --- UTILS ---
function updateVisuals() {
    document.getElementById('bg-layer').style.backgroundImage = `url(${appData.bg})`;
    document.getElementById('shader-layer').style.background = `rgba(0,0,0,${appData.shader})`;
    // apply bar colors
    const xpBar = document.getElementById('xpBar');
    const dayBar = document.getElementById('dayBar');
    const weekBar = document.getElementById('weekBar');
    if (xpBar) xpBar.style.background = appData.colors.xp;
    if (dayBar) dayBar.style.background = appData.colors.day;
    if (weekBar) weekBar.style.background = appData.colors.week;
    // apply center label color/contrast and centering
    function hexToRgba(hex, a) {
        if (!hex) return `rgba(255,255,255,${a})`;
        const h = hex.replace('#','');
        const bigint = parseInt(h.length===3? h.split('').map(c=>c+c).join('') : h, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r},${g},${b},${a})`;
    }
    const centerColor = appData.colors.center || '#ffffff';
    const contrast = (typeof appData.centerLabelContrast === 'number') ? appData.centerLabelContrast : 0.9;
    // xp label (separate element) and bar-fill texts
    const xpLabelEl = document.getElementById('xpLabel');
    if (xpLabelEl) xpLabelEl.style.color = hexToRgba(centerColor, contrast);
    [xpBar, dayBar, weekBar].forEach(b => {
        if (!b) return;
        b.style.display = 'flex';
        b.style.alignItems = 'center';
        b.style.justifyContent = 'center';
        b.style.color = hexToRgba(centerColor, contrast);
        // if label toggles are off, clear inner text; updateTime sets the day/week label if enabled
        if (b === xpBar) b.innerText = appData.centerLabels.xp ? (xpLabelEl? xpLabelEl.innerText : '') : '';
        if (b === dayBar && !appData.centerLabels.day) b.innerText = '';
        if (b === weekBar && !appData.centerLabels.year) b.innerText = '';
    });
}

// --- EXPORT / IMPORT ---
function exportData() {
    const data = JSON.stringify(appData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'weekly-planner-export.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function importData(e) {
    const f = e.target.files ? e.target.files[0] : null;
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const parsed = JSON.parse(ev.target.result);
            // Basic validation
            if (parsed && typeof parsed === 'object') {
                appData = Object.assign({}, appData, parsed);
                sync();
                // rebuild UI
                document.getElementById('weeklyInputs').innerHTML = '<h3>WEEKLY</h3>';
                document.getElementById('dailyInputs').innerHTML = '<h3>DAILY</h3>';
                document.getElementById('oneTimeInputs').innerHTML = '<h3>ONE-TIME</h3>';
                populateInputs();
                updateVisuals();
                renderView();
                alert('Import complete');
            }
        } catch (err) { alert('Failed to import: ' + err.message); }
    };
    reader.readAsText(f);
}

// --- SYSTEM INFO ---
let sysInfoInterval = null;

async function initSystemInfo() {
    if (sysInfoInterval) clearInterval(sysInfoInterval);
    updateSystemInfo();
    sysInfoInterval = setInterval(updateSystemInfo, 1000);
}

async function updateSystemInfo() {
    // Update time and date
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const timeEl = document.getElementById('sysTime');
    const dateEl = document.getElementById('sysDate');
    
    if (timeEl) timeEl.innerText = timeStr;
    if (dateEl) dateEl.innerText = dateStr;
    
    // Compact time display with separated hour:min and AM/PM
    const compactTimeHourEl = document.getElementById('compactTimeHour');
    const compactTimeMinEl = document.getElementById('compactTimeMin');
    const compactPeriodEl = document.getElementById('compactPeriod');
    
    // Info tab time display
    const infoTimeHourEl = document.getElementById('infoTimeHour');
    const infoTimeMinEl = document.getElementById('infoTimeMin');
    const infoPeriodEl = document.getElementById('infoPeriod');
    
    if (compactTimeHourEl || infoTimeHourEl) {
        let hours = now.getHours();
        const mins = String(now.getMinutes()).padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const hoursStr = String(hours).padStart(2, '0');
        if (compactTimeHourEl) {
            compactTimeHourEl.innerText = hoursStr;
            compactTimeMinEl.innerText = mins;
            if (compactPeriodEl) compactPeriodEl.innerText = period;
        }
        if (infoTimeHourEl) {
            infoTimeHourEl.innerText = hoursStr;
            infoTimeMinEl.innerText = mins;
            if (infoPeriodEl) infoPeriodEl.innerText = period;
        }
    }
    
    // Compact date display and Info tab date
    const compactMonthEl = document.getElementById('compactMonth');
    const compactDayEl = document.getElementById('compactDay');
    const infoMonthEl = document.getElementById('infoMonth');
    const infoDayEl = document.getElementById('infoDay');
    const monthStr = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const dayStr = String(now.getDate()).padStart(2, '0');
    if (compactMonthEl) compactMonthEl.innerText = monthStr;
    if (compactDayEl) compactDayEl.innerText = dayStr;
    if (infoMonthEl) infoMonthEl.innerText = monthStr;
    if (infoDayEl) infoDayEl.innerText = dayStr;
    
    // Try to get battery info
    try {
        if (navigator.getBattery) {
            const battery = await navigator.getBattery();
            const batteryEl = document.getElementById('sysBattery');
            const compactBatteryEl = document.getElementById('compactBatteryValue');
            const infoBatteryEl = document.getElementById('infoBattery');
            const batteryPercent = Math.round(battery.level * 100);
            if (batteryEl) batteryEl.innerText = batteryPercent;
            if (compactBatteryEl) compactBatteryEl.innerText = batteryPercent;
            if (infoBatteryEl) infoBatteryEl.innerText = batteryPercent;
        }
    } catch(e) { /* Battery API not available */ }
    
    // Volume: placeholder
    const volEl = document.getElementById('sysVolume');
    const compactVolEl = document.getElementById('compactVolumeValue');
    const infoVolEl = document.getElementById('infoVolume');
    if (volEl) volEl.innerText = '~';
    if (compactVolEl) compactVolEl.innerText = '~';
    if (infoVolEl) infoVolEl.innerText = '~';
}


// (removed task-based week completion) Week progress is time-based in updateTime()

function updSlider(type, i, val) {
    const task = appData[type][i];
    if (!task) return;
    task.sliderVal = val;
    if (task.sliderMax && val >= task.sliderMax) task.done = true;
    else task.done = false;
    sync();
    // update display for this task only: avoid full re-render for smooth interaction
    renderView();
}

function updateRangeFill(el, value, max, fillColor) {
    const pct = max ? (value / max) * 100 : 0;
    const track = `linear-gradient(90deg, ${fillColor} ${pct}%, #111 ${pct}%)`;
    el.style.background = track;
}

// Animate a range fill from `from` to `to` (numeric values) over `duration`ms,
// calling updateRangeFill each frame for a smooth snap animation.
function animateRangeFill(el, from, to, max, fillColor, duration = 220, cb) {
    const start = performance.now();
    const diff = to - from;
    function step(ts) {
        const t = Math.min(1, (ts - start) / duration);
        const cur = from + diff * t;
        updateRangeFill(el, cur, max, fillColor);
        if (t < 1) requestAnimationFrame(step);
        else if (cb) cb();
    }
    requestAnimationFrame(step);
}

function collectGuides() {
    const list = document.getElementById('guidesList');
    if (!list) return [];
    return Array.from(list.querySelectorAll('.guide-editor')).map(ed => {
        const name = ed.querySelector('.guide-name').value || 'Guide';
        const text = ed.querySelector('.guide-text').value || '';
        return { name, text };
    });
}

function addGuide(name = '', text = '') {
    const list = document.getElementById('guidesList');
    if (!list) return;
    list.appendChild(createGuideEditor(name, text));
}

function createGuideEditor(name = '', text = '') {
    const div = document.createElement('div'); div.className = 'guide-editor';
    div.style.display = 'flex'; div.style.gap = '8px'; div.style.alignItems = 'flex-start';
    div.innerHTML = `
        <input class="guide-name" placeholder="Guide name" value="${name}" style="width:150px;">
        <textarea class="guide-text" placeholder="Guide content" style="flex:1; height:60px">${text}</textarea>
        <button class="del-btn" onclick="this.closest('.guide-editor').remove()">X</button>
    `;
    return div;
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
    const db = document.getElementById('dayBar');
    if (db) db.style.width = dayP + "%";
    // center label for day if enabled
    if (db) db.innerText = appData.centerLabels.day ? (`DAY ${Math.round(dayP)}%`) : '';
    // week percent based on time-of-week (Mon-Sun), calculate seconds elapsed in week
    const weekStart = new Date(now);
    // move to start of week (Sunday)
    weekStart.setHours(0,0,0,0);
    const dayOfWeek = now.getDay(); // 0 (Sun) - 6
    const secondsInDay = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();
    const secondsElapsed = dayOfWeek*86400 + secondsInDay;
    const weekPct = Math.round((secondsElapsed / (7*86400)) * 100);
    const wb = document.getElementById('weekBar');
    if (wb) wb.style.width = weekPct + "%";
    if (wb) wb.innerText = appData.centerLabels.year ? (`WEEK ${weekPct}%`) : '';
}

// --- INIT ---
setInterval(updateTime, 1000);
updateTime();
checkResets();
// Populate Editor
function populateInputs() {
    // weekly
    const wCont = document.getElementById('weeklyInputs');
    appData.weekly.forEach(t => {
        addInput('weekly', t.val, t.subs || []);
        const groups = wCont.querySelectorAll('.input-group');
        const g = groups[groups.length-1];
        if (t.useSlider && g) g.querySelector('.use-slider').checked = true;
        if (t.sliderMax && g) g.querySelector('.slider-max').value = t.sliderMax;
        if (t.oneTime && g) g.querySelector('.one-time').checked = true;
    });
    if (appData.weekly.length === 0) addInput('weekly');

    // daily
    const dCont = document.getElementById('dailyInputs');
    appData.daily.forEach(t => {
        addInput('daily', t.val, t.subs || []);
        const groups = dCont.querySelectorAll('.input-group');
        const g = groups[groups.length-1];
        if (t.useSlider && g) g.querySelector('.use-slider').checked = true;
        if (t.sliderMax && g) g.querySelector('.slider-max').value = t.sliderMax;
        if (t.oneTime && g) g.querySelector('.one-time').checked = true;
    });
    if (appData.daily.length === 0) addInput('daily');

    // oneTime
    const oCont = document.getElementById('oneTimeInputs');
    appData.oneTime.forEach(t => {
        addInput('oneTime', t.val, t.subs || []);
        const groups = oCont.querySelectorAll('.input-group');
        const g = groups[groups.length-1];
        if (t.useSlider && g) g.querySelector('.use-slider').checked = true;
        if (t.sliderMax && g) g.querySelector('.slider-max').value = t.sliderMax;
        if (t.oneTime && g) g.querySelector('.one-time').checked = true;
    });
}

populateInputs();

// Visuals and controls
document.getElementById('bgUrl').value = appData.bg || "";
document.getElementById('shaderRange').value = appData.shader || 0.7;
document.getElementById('xpColor').value = appData.colors.xp || '#80ffdb';
document.getElementById('dayColor').value = appData.colors.day || '#3f37c9';
document.getElementById('weekColor').value = appData.colors.week || '#6ab04c';
const centerColorEl = document.getElementById('centerLabelColor');
if (centerColorEl) centerColorEl.value = appData.colors.center || '#ffffff';
const centerContrastEl = document.getElementById('centerLabelContrast');
if (centerContrastEl) centerContrastEl.value = appData.centerLabelContrast || 0.9;

// live updates for color pickers
const xpEl = document.getElementById('xpColor'); if (xpEl) xpEl.onchange = () => { appData.colors.xp = xpEl.value; sync(); updateVisuals(); };
const dayEl = document.getElementById('dayColor'); if (dayEl) dayEl.onchange = () => { appData.colors.day = dayEl.value; sync(); updateVisuals(); };
const weekEl = document.getElementById('weekColor'); if (weekEl) weekEl.onchange = () => { appData.colors.week = weekEl.value; sync(); updateVisuals(); };
if (centerColorEl) centerColorEl.onchange = () => { appData.colors.center = centerColorEl.value; sync(); updateVisuals(); };
if (centerContrastEl) centerContrastEl.oninput = () => { appData.centerLabelContrast = parseFloat(centerContrastEl.value); sync(); updateVisuals(); };

// initialize shader slider fill
const shaderEl = document.getElementById('shaderRange');
if (shaderEl) {
    updateRangeFill(shaderEl, shaderEl.value, shaderEl.max || 1, appData.colors.day);
    shaderEl.oninput = (e) => { updateRangeFill(shaderEl, e.target.value, shaderEl.max || 1, appData.colors.day); };
    shaderEl.onchange = (e) => { updateRangeFill(shaderEl, Math.round(e.target.value*100)/100, shaderEl.max || 1, appData.colors.day); };
}

// populate center-label toggles
document.getElementById('dayCenterLabel').checked = !!appData.centerLabels.day;
document.getElementById('xpCenterLabel').checked = !!appData.centerLabels.xp;
document.getElementById('yearCenterLabel').checked = !!appData.centerLabels.year;

// Guides
if (appData.guides && appData.guides.length) {
    appData.guides.forEach(g => addGuide(g.name, g.text));
}

// Taskbar tab switching
document.querySelectorAll('.taskbar-tab').forEach(tab => {
    tab.onclick = () => {
        const tabName = tab.dataset.tab;
        document.querySelectorAll('.taskbar-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.taskbar-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panelId = `taskbar-${tabName}`;
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.add('active');
    };
});

applyVisibility();
updateVisuals();
renderView();
updateAccountUI();
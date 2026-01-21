let isMinimized = false;
let achievementsUnlocked = new Set();

// --- WEEK CALCULATION (Day-based precision) ---
function getWeekData() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const weekNum = Math.ceil((dayOfYear + start.getDay() + 1) / 7);
    const dayOfWeek = now.getDay() || 7; // 1-7 (Mon-Sun)
    // Percent = (Past weeks + current day fraction) / 52
    const precisePercent = ((weekNum - 1 + (dayOfWeek / 7)) / 52) * 100;
    return { weekNum, percent: precisePercent };
}

// --- TASK LOGIC ---
document.getElementById('mainTaskBtn').addEventListener('click', () => {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-group';
    taskDiv.innerHTML = `
        <div style="margin-top:10px;">
            <input type="text" class="main-input" placeholder="Main Task">
            <button onclick="this.parentElement.querySelector('.sub-container').appendChild(Object.assign(document.createElement('input'), {className:'sub-input', placeholder:'Subtask'}))">+ Sub</button>
            <div class="sub-container" style="margin-left: 30px; display:flex; flex-direction:column;"></div>
        </div>`;
    document.getElementById('taskList').appendChild(taskDiv);
});

// --- TOGGLE ---
document.getElementById('toggleBtn').addEventListener('click', () => {
    isMinimized = !isMinimized;
    const data = getWeekData();
    if (isMinimized) {
        renderView();
        document.getElementById('editor').classList.add('hidden');
        document.getElementById('viewMode').classList.remove('hidden');
        document.getElementById('weekBarContainer').classList.remove('hidden');
        document.getElementById('plannerTitle').classList.add('hidden');
        document.getElementById('weekBar').style.width = data.percent + "%";
        document.getElementById('weekBarText').innerText = `WEEK ${data.weekNum} PROGRESS`;
        document.getElementById('toggleBtn').innerText = "Expand Editor";
    } else {
        document.getElementById('editor').classList.remove('hidden');
        document.getElementById('viewMode').classList.add('hidden');
        document.getElementById('weekBarContainer').classList.add('hidden');
        document.getElementById('plannerTitle').classList.remove('hidden');
        document.getElementById('toggleBtn').innerText = "Minimize Editor";
    }
});

function renderView() {
    const output = document.getElementById('interactiveOutput');
    document.getElementById('sequenceDisplay').innerText = document.getElementById('seqInput').value;
    output.innerHTML = '';
    
    document.querySelectorAll('.task-group').forEach((group, gIdx) => {
        const mainVal = group.querySelector('.main-input').value;
        if (!mainVal) return;

        const mainRow = document.createElement('div');
        mainRow.innerHTML = `<input type="checkbox" class="prog-check main-c" data-group="${gIdx}"> <strong>${mainVal}</strong>`;
        output.appendChild(mainRow);

        group.querySelectorAll('.sub-input').forEach(sub => {
            if (sub.value) {
                const subRow = document.createElement('div');
                subRow.style.marginLeft = "40px";
                subRow.innerHTML = `<input type="checkbox" class="prog-check sub-c" data-group="${gIdx}"> - ${sub.value}`;
                output.appendChild(subRow);
            }
        });
    });

    document.querySelectorAll('.prog-check').forEach(cb => cb.addEventListener('change', updateXP));
    updateXP();
}

// --- XP & ACHIEVEMENT LOGIC ---
function updateXP() {
    const groups = new Set();
    document.querySelectorAll('.prog-check').forEach(cb => groups.add(cb.dataset.group));
    
    let totalScore = 0;
    let earnedScore = 0;

    groups.forEach(gIdx => {
        const mainCheck = document.querySelector(`.main-c[data-group="${gIdx}"]`);
        const subChecks = document.querySelectorAll(`.sub-c[data-group="${gIdx}"]`);
        
        totalScore += 1;
        const subCount = subChecks.length;
        const subsDone = Array.from(subChecks).filter(s => s.checked).length;

        if (subCount === 0) {
            if (mainCheck.checked) earnedScore += 1;
        } else {
            // RULE: If main is checked but 0 subs are done, main is worth 0.
            const weight = 1 / (subCount + 1);
            if (mainCheck.checked && subsDone > 0) earnedScore += weight;
            earnedScore += (subsDone * weight);
        }
    });

    const percent = totalScore > 0 ? Math.round((earnedScore / totalScore) * 100) : 0;
    document.getElementById('xpBar').style.width = percent + "%";
    document.getElementById('xpText').innerText = `XP: ${percent}%`;

    checkAchievements(percent, earnedScore);
}

function checkAchievements(percent, score) {
    const list = document.getElementById('achievementList');
    const potential = [
        { id: 'first_step', icon: '🌱', text: 'First Step: Earned any XP', cond: score > 0 },
        { id: 'halfway', icon: '🌗', text: 'Halfway There: 50% completion', cond: percent >= 50 },
        { id: 'perfection', icon: '👑', text: 'God Tier: 100% completion', cond: percent === 100 }
    ];

    potential.forEach(ach => {
        if (ach.cond && !achived(ach.id)) {
            achievementsUnlocked.add(ach.id);
            const el = document.createElement('div');
            el.className = 'medal';
            el.innerText = ach.icon;
            el.setAttribute('data-tooltip', ach.text);
            list.appendChild(el);
        }
    });
}

const achived = (id) => achievementsUnlocked.has(id);
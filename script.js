let isMinimized = false;

// --- WEEK CALCULATION ---
const now = new Date();
const start = new Date(now.getFullYear(), 0, 1);
const weekNum = Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
const weekPercent = (weekNum / 52) * 100;

// --- DOM ELEMENTS ---
const taskList = document.getElementById('taskList');
const editor = document.getElementById('editor');
const viewMode = document.getElementById('viewMode');
const toggleBtn = document.getElementById('toggleBtn');
const weekBarContainer = document.getElementById('weekBarContainer');
const weekBar = document.getElementById('weekBar');
const weekBarText = document.getElementById('weekBarText');

// --- ADD TASK (EDITOR) ---
document.getElementById('mainTaskBtn').addEventListener('click', () => {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-group';
    taskDiv.innerHTML = `
        <div style="margin-top:10px;">
            <input type="text" class="main-input" placeholder="Main Task">
            <button onclick="addSub(this)">+ Sub</button>
            <div class="sub-container" style="margin-left: 30px;"></div>
        </div>
    `;
    taskList.appendChild(taskDiv);
});

function addSub(btn) {
    const subContainer = btn.parentElement.querySelector('.sub-container');
    const subDiv = document.createElement('div');
    subDiv.innerHTML = `<input type="text" class="sub-input" placeholder="Subtask">`;
    subContainer.appendChild(subDiv);
}

// --- TOGGLE & RENDER ---
toggleBtn.addEventListener('click', () => {
    isMinimized = !isMinimized;
    if (isMinimized) {
        renderView();
        editor.classList.add('hidden');
        viewMode.classList.remove('hidden');
        weekBarContainer.classList.remove('hidden');
        document.getElementById('plannerTitle').classList.add('hidden');
        
        // Update Boss Bar
        weekBar.style.width = weekPercent + "%";
        weekBarText.innerText = `WEEK ${weekNum} / 52`;
        toggleBtn.innerText = "Expand Editor";
    } else {
        editor.classList.remove('hidden');
        viewMode.classList.add('hidden');
        weekBarContainer.classList.add('hidden');
        document.getElementById('plannerTitle').classList.remove('hidden');
        toggleBtn.innerText = "Minimize Editor";
    }
});

function renderView() {
    const output = document.getElementById('interactiveOutput');
    const seqDisplay = document.getElementById('sequenceDisplay');
    output.innerHTML = '';
    
    // Display Sequences (No checkboxes)
    seqDisplay.innerText = document.getElementById('seqInput').value;

    const groups = document.querySelectorAll('.task-group');
    groups.forEach((group, gIdx) => {
        const mainVal = group.querySelector('.main-input').value;
        if (!mainVal) return;

        // Create Main Task Row
        const mainRow = document.createElement('div');
        mainRow.className = 'task-row';
        mainRow.innerHTML = `<input type="checkbox" class="prog-check main-c" data-group="${gIdx}"> <strong>${mainVal}</strong>`;
        output.appendChild(mainRow);

        // Create Subtask Rows
        const subs = group.querySelectorAll('.sub-input');
        subs.forEach(sub => {
            if (sub.value) {
                const subRow = document.createElement('div');
                subRow.className = 'task-row';
                subRow.style.marginLeft = "40px";
                subRow.innerHTML = `<input type="checkbox" class="prog-check sub-c" data-group="${gIdx}"> - ${sub.value}`;
                output.appendChild(subRow);
            }
        });
    });

    // Attach listeners to all new checkboxes for the XP bar
    document.querySelectorAll('.prog-check').forEach(cb => {
        cb.addEventListener('change', updateXP);
    });
    updateXP();
}

// --- XP CALCULATION LOGIC ---
function updateXP() {
    const groups = document.querySelectorAll('.task-group');
    let totalScore = 0;
    let earnedScore = 0;

    // We check the checkboxes generated in the VIEW MODE
    const viewGroups = new Set();
    document.querySelectorAll('.prog-check').forEach(cb => viewGroups.add(cb.dataset.group));

    viewGroups.forEach(gIdx => {
        const mainCheck = document.querySelector(`.main-c[data-group="${gIdx}"]`);
        const subChecks = document.querySelectorAll(`.sub-c[data-group="${gIdx}"]`);
        
        totalScore += 1; // Each group is worth 1 point

        if (subChecks.length === 0) {
            if (mainCheck.checked) earnedScore += 1;
        } else {
            // If there are subs, the "1 point" is split between the main and its subs
            const weight = 1 / (subChecks.length + 1); 
            if (mainCheck.checked) earnedScore += weight;
            subChecks.forEach(sc => {
                if (sc.checked) earnedScore += weight;
            });
        }
    });

    const percent = totalScore > 0 ? Math.round((earnedScore / totalScore) * 100) : 0;
    document.getElementById('xpBar').style.width = percent + "%";
    document.getElementById('xpText').innerText = `XP: ${percent}%`;
}
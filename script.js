// --- STATE MANAGEMENT ---
let isMinimized = false;
const tasks = [];

// --- WEEK CALCULATION ---
const now = new Date();
const start = new Date(now.getFullYear(), 0, 1);
const weekNum = Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
document.getElementById('plannerTitle').innerText = `Weekly Planner: Week ${weekNum}/52`;

// --- DOM ELEMENTS ---
const taskList = document.getElementById('taskList');
const editor = document.getElementById('editor');
const viewMode = document.getElementById('viewMode');
const toggleBtn = document.getElementById('toggleBtn');
const interactiveOutput = document.getElementById('interactiveOutput');

// --- ADD TASK LOGIC ---
document.getElementById('mainTaskBtn').addEventListener('click', () => {
    const id = Date.now();
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-group';
    taskDiv.dataset.id = id;
    taskDiv.innerHTML = `
        <div style="margin-top:10px;">
            <input type="text" class="main-input" placeholder="Main Task (e.g. Laundry)">
            <button onclick="addSub(this)">+ Sub</button>
            <div class="sub-container" style="margin-left: 30px;"></div>
        </div>
    `;
    taskList.appendChild(taskDiv);
});

function addSub(btn) {
    const subContainer = btn.parentElement.querySelector('.sub-container');
    const subDiv = document.createElement('div');
    subDiv.innerHTML = `<input type="text" class="sub-input" placeholder="Subtask" style="margin-top:5px;">`;
    subContainer.appendChild(subDiv);
}

// --- MINIMIZE/TOGGLE LOGIC ---
toggleBtn.addEventListener('click', () => {
    isMinimized = !isMinimized;
    if (isMinimized) {
        renderInteractivePlan();
        editor.classList.add('hidden');
        viewMode.classList.remove('hidden');
        toggleBtn.innerText = "Expand Editor";
    } else {
        editor.classList.remove('hidden');
        viewMode.classList.add('hidden');
        toggleBtn.innerText = "Minimize Editor";
    }
});

// --- RENDER INTERACTIVE PLAN ---
function renderInteractivePlan() {
    let html = `<strong>TARGET DEADLINE: Saturday Night</strong>\n\n`;
    html += `================================\nTHINGS TO FINISH THIS WEEK\n================================\n`;

    const groups = document.querySelectorAll('.task-group');
    groups.forEach(group => {
        const mainVal = group.querySelector('.main-input').value;
        if (mainVal) {
            html += `<div><input type="checkbox"> ${mainVal}</div>`;
            const subs = group.querySelectorAll('.sub-input');
            subs.forEach(sub => {
                if (sub.value) {
                    html += `<div style="margin-left:40px;"><input type="checkbox"> - ${sub.value}</div>`;
                }
            });
        }
    });

    html += `\n================================\nRIGHT NOW (END-OF-DAY RESET)\n================================\n`;
    const dailyItems = ["Shower", "Get clothes out", "Coffee/Monster Setup", "Plates out of room", "Sleep"];
    dailyItems.forEach(item => html += `<div><input type="checkbox"> ${item}</div>`);

    html += `\n================================\nNEXT-DAY SEQUENCE (DEFAULT)\n================================\n`;
    html += `Morning: Wake up, Dress, Wash, Coffee\nRoom reset: Plates out, Laundry start\nFocus: Textbook Audio + (Minecraft/Cleaning)\nFallback: Computer Information\n\n`;
    
    html += `================================\nBACKUP PLAN\n================================\n`;
    html += `If tasks fail: Do it all Saturday morning.\nClear the slate.`;

    interactiveOutput.innerHTML = html;
}

// --- DOWNLOAD LOGIC ---
document.getElementById('downloadBtn').addEventListener('click', () => {
    const text = interactiveOutput.innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const anchor = document.createElement('a');
    anchor.download = `Week_${weekNum}_Plan.txt`;
    anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
    anchor.dataset.downloadurl = ['text/plain', anchor.download, anchor.href].join(':');
    anchor.click();
});
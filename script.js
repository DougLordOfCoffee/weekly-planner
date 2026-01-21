// --- WEEK CALCULATION ---
const now = new Date();
const start = new Date(now.getFullYear(), 0, 1);
const weekNum = Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
document.getElementById('plannerTitle').innerText = `Weekly Planner: Week ${weekNum}/52`;

const taskList = document.getElementById('taskList');

// --- ADD MAIN TASK ---
document.getElementById('mainTaskBtn').addEventListener('click', () => {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-group';
    taskDiv.innerHTML = `
        <div style="margin-top:10px;">
            <input type="checkbox" class="main-check">
            <input type="text" class="main-input" placeholder="Main Task (e.g. Laundry)">
            <button onclick="addSub(this)">+ Sub</button>
            <div class="sub-container" style="margin-left: 30px;"></div>
        </div>
    `;
    taskList.appendChild(taskDiv);
});

// --- ADD SUBTASK ---
function addSub(btn) {
    const subContainer = btn.parentElement.querySelector('.sub-container');
    const subDiv = document.createElement('div');
    subDiv.innerHTML = `
        <input type="checkbox" class="sub-check">
        <input type="text" class="sub-input" placeholder="Subtask">
    `;
    subContainer.appendChild(subDiv);
}

// --- GENERATE LOGIC ---
document.getElementById('generateBtn').addEventListener('click', () => {
    let output = `WEEK OF: ${now.toLocaleDateString()}\n`;
    output += `WEEK PROGRESS: ${weekNum}/52\n\n`;
    output += `================================\nTHINGS TO FINISH THIS WEEK\n================================\n`;

    const mainTasks = document.querySelectorAll('.task-group');
    let total = 0;
    let done = 0;

    mainTasks.forEach((group) => {
        const mainInp = group.querySelector('.main-input').value;
        const mainCheck = group.querySelector('.main-check').checked;
        
        if (mainInp) {
            total++;
            if (mainCheck) done++;
            output += `[${mainCheck ? 'X' : ' '}] ${mainInp}\n`;

            // Handle Subtasks
            const subs = group.querySelectorAll('.sub-container div');
            subs.forEach(sub => {
                const subInp = sub.querySelector('.sub-input').value;
                const subCheck = sub.querySelector('.sub-check').checked;
                if (subInp) {
                    output += `    - [${subCheck ? 'X' : ' '}] ${subInp}\n`;
                }
            });
        }
    });

    // Add back the Hardcoded Sequences
    output += `
================================
RIGHT NOW (END-OF-DAY RESET)
================================
[ ] Shower
[ ] Get clothes out for tomorrow
[ ] Set out coffee stuff -(OR)- Fridge Monster
[ ] Plates out of room/off desk
[ ] Sleep

================================
NEXT-DAY SEQUENCE (DEFAULT)
================================
Morning: Wake up, Dress, Wash, Coffee/Monster
Room reset: Plates out, Gather clothes, Start laundry
Focus: Textbook Audio + (Minecraft OR Folding)
Fallback: Work on Computer Information

================================
EXPECTED OUTCOME
================================
That’s ${done} / ${total} tasks done
≈ ${total > 0 ? Math.round((done/total)*100) : 0}% of bullshit handled

================================
BACKUP PLAN
================================
If ANY TASKS don't get done Saturday:
- Do it all on Saturday morning.
- Then you’re clear.`;

    document.getElementById('outputBox').value = output;
});
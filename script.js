// --- INITIALIZATION ---
const taskContainer = document.getElementById('taskContainer');
const addTaskBtn = document.getElementById('addTaskBtn');
const generateBtn = document.getElementById('generateBtn');

// Set the Title on Load
window.onload = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const weekNum = Math.ceil(dayOfYear / 7);
    
    document.getElementById('plannerTitle').innerText = `Weekly Planner: Week ${weekNum}/52`;
};

// --- ADD INPUT LOGIC ---
addTaskBtn.addEventListener('click', () => {
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.className = 'task-input';
    newInput.placeholder = 'Enter task...';
    taskContainer.appendChild(newInput);
});

// --- GENERATE LOGIC ---
generateBtn.addEventListener('click', () => {
    const inputs = document.querySelectorAll('.task-input');
    let taskListString = "";
    let totalTasks = 0;
    let completedTasks = 0; // In a simple text input, we'll assume they aren't done yet

    inputs.forEach((input, index) => {
        if (input.value.trim() !== "") {
            totalTasks++;
            taskListString += `[ ] ${index + 1}. ${input.value}\n`;
        }
    });

    // Simple Calculation Logic
    // For now, it shows 0/Total. Later we can add checkboxes to the UI to calc "Done".
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const template = `================================
THINGS TO FINISH THIS WEEK
================================
${taskListString}

================================
EXPECTED OUTCOME
================================
That’s ${completedTasks} / ${totalTasks} tasks done
≈ ${percentage}% of bullshit handled

================================
BACKUP PLAN
================================
If ANY TASKS don't get done Saturday morning:
- Do it all on Saturday
- Then you’re clear`;

    document.getElementById('outputBox').value = template;
});
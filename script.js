document.getElementById('generateBtn').addEventListener('click', function() {
    // 1. Read all inputs
    const homework = document.getElementById('homework').value;
    const cleaning = document.getElementById('cleaning').value;
    const project = document.getElementById('projectGoal').value;
    const today = document.getElementById('todayTasks').value;
    const done = document.getElementById('doneCount').value || "____";
    const total = document.getElementById('totalCount').value || "____";

    // 2. Format into template string
    const template = `WEEK OF: January 18th
TARGET DEADLINE: Saturday night

================================
THINGS TO FINISH THIS WEEK
================================
[ ] 1. College homework: ${homework}
[ ] 2. Chapter 2 Reading Quiz (Status: NOT STARTED)
[ ] 3. Laundry (Status: NOT STARTED)
[ ] 4. Cleaning Tasks: ${cleaning}
[ ] 5. Side project: ${project}

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
Time check: 7:20 AM Departure

================================
EXPECTED OUTCOME
================================
Tasks for today: ${today}

That’s ${done} / ${total} tasks done
≈ 80–90% of bullshit handled

================================
BACKUP PLAN
================================
Saturday is the "Catch All" day. Clear everything then!`;

    // 3. Put result in output box
    document.getElementById('outputBox').value = template;
});
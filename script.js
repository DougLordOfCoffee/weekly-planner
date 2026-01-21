// Step 1: Link the button click to the function
document.getElementById('generateBtn').addEventListener('click', function() {
    
    // 1. Read all inputs
    const mon = document.getElementById('monInput').value;
    const tue = document.getElementById('tueInput').value;
    const wed = document.getElementById('wedInput').value;
    const thu = document.getElementById('thuInput').value;
    const fri = document.getElementById('friInput').value;
    const wknd = document.getElementById('wkndInput').value;

    // 2. Format into template string
    const formattedTemplate = `WEEKLY PLAN
-------------------
MONDAY: ${mon}
TUESDAY: ${tue}
WEDNESDAY: ${wed}
THURSDAY: ${thu}
FRIDAY: ${fri}
WEEKEND: ${wknd}
-------------------
Generated on: ${new Date().toLocaleDateString()}`;

    // 3. Put result in output box
    document.getElementById('outputBox').value = formattedTemplate;
});
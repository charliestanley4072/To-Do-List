var taskList = document.getElementById("task-list");
var isPostIt = false, isPriorityMode = false;

loadActiveTasks();

function saveActiveTasks() {
    var allTasks = [];
    // FIX: Look for both class types so data isn't lost during toggle
    document.querySelectorAll(".task, .post-it-note").forEach(row => {
        var textSpan = row.querySelector("span:not(.priority-number):not(.drag-handle)"); 
        if (textSpan) {
            // Only save rows that actually have task text
            allTasks.push({
                text: textSpan.textContent,
                isRed: row.querySelector(".flag")?.classList.contains("active") || false
            });
        }
    });
    localStorage.setItem("activeTasks", JSON.stringify(allTasks));
    updateHelpVisibility();
}

function loadActiveTasks() {
    var savedTasks = JSON.parse(localStorage.getItem("activeTasks") || "[]");
    taskList.innerHTML = ""; 
    savedTasks.forEach(item => {
        var newBox = document.createElement("div");
        // Set class based on current view mode
        makeReminder(newBox, item.text, item.isRed);
        taskList.appendChild(newBox);
    });
    // Only show the input box if NOT in Post-it mode
    if (!isPostIt) addPreset();
    updateHelpVisibility();
}

function addPreset() {
    // Don't create the typing box if in Post-it mode
    if (isPostIt || isPriorityMode) return;
    var row = document.createElement("div");
    row.className = "task";
    
    var flag = document.createElement("div");
    flag.className = "flag";
    flag.onclick = () => { toggleFlag(flag); saveActiveTasks(); };
    
    var typingArea = document.createElement("div");
    typingArea.className = "editable";
    typingArea.contentEditable = true;
    typingArea.innerHTML = "&#8203;"; 
    typingArea.style.color = "black"; // Ensures text is black

    typingArea.onkeydown = (e) => {
	if (e.key === "Enter") {
		e.preventDefault();
		// Removes the hidden placeholder character and any extra spaces
		var input = typingArea.textContent.replace(/\u200B/g, "").trim();
		
		// Only make new preset if there is any text typed
		if (input.length > 0) {
			makeReminder(row, input, flag.classList.contains("active"));
			saveActiveTasks();
			addPreset(); 
		}
	}
    };
    row.append(flag, typingArea);
    taskList.appendChild(row);
    typingArea.focus();
}

function makeReminder(row, message, isRed) {
    row.innerHTML = ""; 
    row.className = isPostIt ? "post-it-note" : "task";

    // Add random color if it's a post-it
    var flag = document.createElement("div");
    flag.className = "flag" + (isRed ? " active" : "");
    if (isRed) flag.style.background = "#ff4d4d";
    flag.onclick = () => { toggleFlag(flag); saveActiveTasks(); };
    flag.ondblclick = () => doubleClick(flag);

    var textLabel = document.createElement("span");
    textLabel.textContent = message;
    textLabel.style.flex = "1";
    textLabel.style.color = "black"; // Ensuring text is black

	var editBtn = createBtn("✏️", () => {
		if (textLabel.contentEditable !== "true") {
			textLabel.contentEditable = "true";
			textLabel.focus();
			window.getSelection().selectAllChildren(textLabel);
			window.getSelection().collapseToEnd();
		} else {
			textLabel.blur();
		}
	});

	textLabel.onblur = () => { textLabel.contentEditable = "false"; saveActiveTasks(); };
	textLabel.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); textLabel.blur(); } };


	var deleteBtn = createBtn("🗑", () => { 
		// Get existing deleted tasks or empty array
		var deletedList = JSON.parse(localStorage.getItem("deletedTasks") || "[]");
		
		// Add the current task with a timestamp
		deletedList.push({ text: textLabel.textContent, time: Date.now() });
		
		localStorage.setItem("deletedTasks", JSON.stringify(deletedList));

		row.style.transition = "opacity 0.3s";
		row.style.opacity = "0";
		setTimeout(() => { 
			row.remove(); 
			saveActiveTasks(); 
		}, 300);
	});

    row.append(flag, textLabel, editBtn, deleteBtn);
}

// Helper to reduce button creation code
function createBtn(text, action) {
    var btn = document.createElement("span");
    btn.textContent = text;
    btn.className = "secondary-btn";
    btn.onclick = action;
    return btn;
}

function toggleFlag(circle) {
    var active = circle.classList.toggle("active");
    circle.style.background = active ? "#ff4d4d" : "transparent";
}

function doubleClick(circle) {
    circle.style.background = "#2ecc71"; 
    var text = circle.parentElement.querySelector("span:not(.priority-number):not(.drag-handle)").textContent;
    
    var completedList = JSON.parse(localStorage.getItem("myTasks") || "[]");
    completedList.push({ text: text, time: Date.now() });
    localStorage.setItem("myTasks", JSON.stringify(completedList));

    circle.parentElement.style.transition = "opacity 0.5s";
    circle.parentElement.style.opacity = "0";
    setTimeout(() => { circle.parentElement.remove(); saveActiveTasks(); }, 500);
}

function togglePostItView() {
    var btn = document.getElementById("view-toggle-btn");
    var colors = ["neon-yellow", "neon-pink", "neon-green", "neon-blue"];

    isPostIt = !isPostIt; //Sets to false
    if (isPostIt) { //if true
        btn.textContent = "Normal View"; //button changes as mode is switched
        document.getElementById("priority-mode-toggle").disabled = true;
        taskList.classList.add("post-it-mode");
        
        var preset = taskList.querySelector(".task:not(:has(span))"); //remove next free note
        if (preset) preset.remove();

        // 2. Convert existing tasks to squares
        taskList.querySelectorAll(".task").forEach(item => {
            item.classList.remove("task"); //removes task
            item.classList.add("post-it-note"); //adds post-it to classList
            item.classList.add(colors[Math.floor(Math.random() * colors.length)]); //generates random (0-1), multiplies by length of array and rounds
        });
        saveActiveTasks();
    } else {
        location.reload(); // Keeps the refresh line
    }
}

function togglePriorityView() {
    isPriorityMode = !isPriorityMode;
    if (isPriorityMode) {
        document.getElementById("view-toggle-btn").disabled = true;
        document.getElementById("priority-mode-toggle").textContent = "Normal View";
        taskList.classList.add("priority-mode");
        taskList.querySelector(".task:not(:has(span))")?.remove();

        taskList.querySelectorAll(".task").forEach((item, index) => {
            item.querySelector(".flag").style.display = "none";
            var handle = document.createElement("span");
            handle.innerHTML = "&#9776;";
            handle.className = "drag-handle";
            handle.onmousedown = () => item.draggable = true;
            handle.onmouseup = () => item.draggable = false;

            item.addEventListener('dragstart', (e) => {
                item.classList.add('dragging');
                var img = new Image();
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
                e.dataTransfer.setDragImage(img, 0, 0);
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                item.draggable = false; reorderNumbers(); saveActiveTasks();
            });

            var num = document.createElement("span");
            num.className = "priority-number";
            num.style.marginRight = "10px";
            num.textContent = (index + 1) + ". ";
            item.prepend(handle, num);
        });
        taskList.addEventListener('dragover', initDragOrder);
    } else {
        saveActiveTasks();
        location.reload(); // Refreshes to fix bug
    }
}

function initDragOrder(e) {
    e.preventDefault();
    var draggingItem = document.querySelector('.dragging');
    var siblings = [...taskList.querySelectorAll('.task:not(.dragging)')];
    var nextSibling = siblings.find(sibling => {
        var box = sibling.getBoundingClientRect();
        return e.clientY <= box.top + box.height / 2;
    });
    taskList.insertBefore(draggingItem, nextSibling || null);
}

function reorderNumbers() {
    taskList.querySelectorAll('.priority-number').forEach((num, i) => num.textContent = (i + 1) + ". ");
}

function updateHelpVisibility() {
    var hasTasks = document.querySelectorAll('.task span, .post-it-note span').length > 0;
    document.getElementById('start-help').classList.toggle('hide-cloud', hasTasks);
}

document.getElementById("view-toggle-btn").onclick = togglePostItView;
document.getElementById("priority-mode-toggle").onclick = togglePriorityView;

const settingsBtn = document.getElementById('settings-btn');
const sidePanel = document.getElementById('side-panel');
const panelOverlay = document.getElementById('panel-overlay');
const closePanel = document.getElementById('close-panel');

settingsBtn.onclick = () => {
    sidePanel.classList.add('open'); // Slides width to 300px
    panelOverlay.classList.add('active');
};

const hidePanel = () => {
    sidePanel.classList.remove('open'); // Slides width back to 0
    panelOverlay.classList.remove('active');
};

closePanel.onclick = hidePanel;
panelOverlay.onclick = hidePanel;

// Selectors
const accountLabel = document.getElementById('account-label');
const accountModal = document.getElementById('account-modal');
const closeAccount = document.getElementById('close-account-modal');
const saveAccountBtn = document.getElementById('save-account');
const keyBtn = document.getElementById('key-btn');
const keyModal = document.getElementById('key-modal');
const closeKey = document.getElementById('close-key-modal');
const checkPasswordBtn = document.getElementById('check-password');

// --- Account Logic (Set Password) ---
accountLabel.onclick = () => {
    accountModal.style.display = "flex";
};

closeAccount.onclick = () => {
    accountModal.style.display = "none";
};

saveAccountBtn.onclick = () => {
    const pass = document.getElementById('new-password').value;
    if (pass) {
        localStorage.setItem("userPassword", pass);
        alert("Password saved!");
        accountModal.style.display = "none";
        document.getElementById('new-password').value = ""; // Clear input
    } else {
        alert("Please enter a password.");
    }
};

// --- Key Logic (Check Password) ---
keyBtn.onclick = () => {
    keyModal.style.display = "flex";
};

closeKey.onclick = () => {
    keyModal.style.display = "none";
};

checkPasswordBtn.onclick = () => {
    const entered = document.getElementById('try-password').value;
    const saved = localStorage.getItem("userPassword");
    
    if (entered === saved) {
        window.location.href = "important.html";
    } else {
        alert("Incorrect password!");
        document.getElementById('try-password').value = "";
    }
};

// Global Close (Click outside modal)
window.onclick = (event) => {
    if (event.target == accountModal) accountModal.style.display = "none";
    if (event.target == keyModal) keyModal.style.display = "none";
};

const calendarTrigger = document.getElementById('calendar-trigger');
const calendarPanel = document.getElementById('calendar-panel');

// Open Left Panel on Mouse Hover
calendarTrigger.onmouseenter = () => {
    calendarPanel.classList.add('open');
};

// Close Left Panel when Mouse Leaves the area
calendarTrigger.onmouseleave = () => {
    calendarPanel.classList.remove('open');
};

const scheduleBtn = document.getElementById('schedule-dropdown-btn');
const daysDropdown = document.getElementById('days-dropdown');

// Toggle the Dropdown Menu within the sidebar
if (scheduleBtn && daysDropdown) {
    scheduleBtn.onclick = () => {
        daysDropdown.classList.toggle('active');
    };
}

// Function to check each day's local storage data for active reminders
function updateCalendarStatusDots() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
        const dot = document.getElementById(`dot-${day}`);
        if (dot) {
            const savedTasks = localStorage.getItem(`tasks-${day}`);
            
            if (savedTasks) {
                const tasksArray = JSON.parse(savedTasks);
                // If the list exists and contains at least one reminder, show the dot
                if (tasksArray && tasksArray.length > 0) {
                    dot.classList.add('has-tasks');
                } else {
                    dot.classList.remove('has-tasks');
                }
            } else {
                dot.classList.remove('has-tasks');
            }
        }
    });
}

// Run the check when the page loads up
window.addEventListener('DOMContentLoaded', updateCalendarStatusDots);

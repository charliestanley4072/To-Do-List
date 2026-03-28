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
    // Only show the input box if we are NOT in Post-it mode
    if (!isPostIt) addPreset();
    updateHelpVisibility();
}

function addPreset() {
    // Safety check: Don't create the typing box if in Post-it mode
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
    typingArea.style.color = "black"; // Ensuring text is black

    typingArea.onkeydown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            var input = typingArea.textContent.trim();
            if (input) {
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

    // List view buttons
    var editBtn = createBtn("✏️", () => {
        var newText = prompt("Edit your task:", textLabel.textContent);
        if (newText?.trim()) { textLabel.textContent = newText; saveActiveTasks(); }
    });

    var deleteBtn = createBtn("🗑", () => { row.remove(); saveActiveTasks(); });

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

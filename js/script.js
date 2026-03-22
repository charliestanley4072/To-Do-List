var taskList = document.getElementById("task-list");
var isPostIt = false; 

loadActiveTasks();

function saveActiveTasks() {
    var allTasks = [];
    // FIX: Look for both class types so data isn't lost during toggle
    var allRows = document.querySelectorAll(".task, .post-it-note");

    allRows.forEach(function(row) {
        var textSpan = row.querySelector("span");
        
        // Only save rows that actually have task text
        if (textSpan) {
            var taskData = {
                text: textSpan.textContent,
                isRed: row.querySelector(".flag").classList.contains("active")
            };
            allTasks.push(taskData);
        }
    });

    var stringData = JSON.stringify(allTasks);
    localStorage.setItem("activeTasks", stringData);
	updateHelpVisibility();
}

function loadActiveTasks() {
    var savedString = localStorage.getItem("activeTasks");
    
    if (savedString) {
        var savedTasks = JSON.parse(savedString);
        taskList.innerHTML = ""; 
        
        savedTasks.forEach(function(item) {
            var newBox = document.createElement("div");
            // Set class based on current view mode
            newBox.className = isPostIt ? "post-it-note" : "task";
            makeReminder(newBox, item.text, item.isRed);
            taskList.appendChild(newBox);
        });
    }
    // Only show the input box if we are NOT in Post-it mode
    if (!isPostIt) {
        addPreset();
    }
	updateHelpVisibility();
}

function addPreset() {
    // Safety check: Don't create the typing box if we are in Post-it mode
    if (isPostIt) return;

    var row = document.createElement("div");
    row.className = "task";

    var flag = document.createElement("div");
    flag.className = "flag";
    flag.onclick = function() {
        toggleFlag(flag);
        saveActiveTasks();
    };
    flag.ondblclick = function() {
        doubleClick(flag);
    };

    var typingArea = document.createElement("div");
    typingArea.className = "editable";
    typingArea.contentEditable = true;
    typingArea.innerHTML = "&#8203;"; 

    typingArea.onkeydown = function(event) {
        if (event.key === "Enter") {
            event.preventDefault(); 
            var userInput = typingArea.textContent.trim();
            if (userInput !== "") {
                makeReminder(row, userInput, flag.classList.contains("active"));
                saveActiveTasks();
                addPreset(); 
            }
        }
    };

    row.appendChild(flag);
    row.appendChild(typingArea);
    taskList.appendChild(row);
	typingArea.focus();
}

function makeReminder(row, message, isRed) {
    row.innerHTML = ""; 
    row.className = isPostIt ? "post-it-note" : "task";

    // Add random color if it's a post-it
    if (isPostIt) {
        var colors = ["neon-yellow", "neon-pink", "neon-green", "neon-blue"];
        row.classList.add(colors[Math.floor(Math.random() * colors.length)]);
    }

    var flag = document.createElement("div");
    flag.className = "flag";
    
    if (isRed === true) {
        flag.classList.add("active");
        flag.style.background = "#ff4d4d";
    }

    flag.onclick = function() {
        toggleFlag(flag);
        saveActiveTasks();
    };
    flag.ondblclick = function() {
        doubleClick(flag);
    };

    var textLabel = document.createElement("span");
    textLabel.textContent = message;
    textLabel.style.flex = "1";

    // List view buttons
    var editBtn = document.createElement("span");
    editBtn.textContent = "✏️";
    editBtn.className = "secondary-btn";
    editBtn.onclick = function() {
        var inputField = document.createElement("input");
        inputField.value = textLabel.textContent;
        row.replaceChild(inputField, textLabel);
        inputField.onblur = function() {
            textLabel.textContent = inputField.value;
            row.replaceChild(textLabel, inputField);
            saveActiveTasks();
        };
        inputField.focus();
    };

    var deleteBtn = document.createElement("span");
    deleteBtn.textContent = "🗑";
    deleteBtn.className = "secondary-btn";
    deleteBtn.onclick = function() {
        row.remove();
        saveActiveTasks();
    };

    row.appendChild(flag);
    row.appendChild(textLabel);
    row.appendChild(editBtn);
    row.appendChild(deleteBtn);
}

function toggleFlag(circle) {
    circle.classList.toggle("active");
    circle.style.background = circle.classList.contains("active") ? "#ff4d4d" : "transparent";
}

function doubleClick(circle) {
    circle.classList.add("done");
    circle.style.background = "#2ecc71"; 

    var taskText = circle.nextElementSibling.textContent;
    var completedList = JSON.parse(localStorage.getItem("myTasks") || "[]");
    completedList.push({ text: taskText, time: Date.now() });
    localStorage.setItem("myTasks", JSON.stringify(completedList));

    var wholeRow = circle.parentElement;
    wholeRow.style.transition = "opacity 0.5s";
    wholeRow.style.opacity = "0";
    
    setTimeout(function() {
        wholeRow.remove();
		updateHelpVisibility();
        saveActiveTasks();
    }, 500);
}

function togglePostItView() {
    var btn = document.getElementById("view-toggle-btn");
    var colors = ["neon-yellow", "neon-pink", "neon-green", "neon-blue"];

    isPostIt = !isPostIt; //Sets to false
    taskList.classList.toggle("post-it-mode"); 

    if (isPostIt) { //if true
        btn.textContent = "Revert View"; //button changes as mode is switched
        
        var preset = taskList.querySelector(".task"); //remove next free note
        if (preset && !preset.querySelector("span")) {
            preset.remove();
        }

        // 2. Convert existing tasks to squares
        var items = taskList.querySelectorAll(".task");
        items.forEach(function(item) {
            item.classList.remove("task"); //removes task
            item.classList.add("post-it-note"); //adds post-it to classList
            item.classList.add(colors[Math.floor(Math.random() * colors.length)]); //generates random (0-1), multiplies by length of array and rounds
        });
    } else {
        btn.textContent = "Post-it View"; //switches back
        
        var notes = taskList.querySelectorAll(".post-it-note"); //convert squares back to rows
        notes.forEach(function(note) {
            note.classList.remove("post-it-note", ...colors); //'...' converts array to list of strings
            note.classList.add("task");
        });

    }
    saveActiveTasks();
}
document.getElementById("view-toggle-btn").onclick = togglePostItView;

function updateHelpVisibility() {
    const helpCloud = document.getElementById('start-help');

    const allTasks = document.querySelectorAll('.task, .post-it-note');
    let hasSavedTask = false;
    allTasks.forEach(task => {
        const textSpan = task.querySelector('span');
        if (textSpan && textSpan.textContent.trim() !== "") {
            hasSavedTask = true;
        }
    });

    if (hasSavedTask) {
        helpCloud.classList.add('hide-cloud');
    } else {
        helpCloud.classList.remove('hide-cloud');
    }
}

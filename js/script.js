var taskList = document.getElementById("task-list");
loadActiveTasks();

function saveActiveTasks() {
    var allTasks = [];
    var allRows = document.querySelectorAll(".task");

    allRows.forEach(function(row) {
        var textSpan = row.querySelector("span");
        
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
}

function loadActiveTasks() {
    var savedString = localStorage.getItem("activeTasks");
    
    if (savedString) {
        var savedTasks = JSON.parse(savedString);
        taskList.innerHTML = ""; // Clear the screen first
        
        savedTasks.forEach(function(item) {
            var newBox = document.createElement("div");
            newBox.className = "task";
            makeReminder(newBox, item.text, item.isRed);
            taskList.appendChild(newBox);
        });
    }
    addPreset();
}


function addPreset() {
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
    typingArea.innerHTML = "&#8203;"; // Invisible space to keep it open

    typingArea.onkeydown = function(event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Stop it from making a real new line
            
            var userInput = typingArea.textContent.trim();
            
            if (userInput !== "") {
                // Change the "typing" box into a "saved" box
                makeReminder(row, userInput, flag.classList.contains("active"));
                saveActiveTasks();
                addPreset(); // Make a brand new empty row
            }
        }
    };
    row.appendChild(flag);
    row.appendChild(typingArea);
    taskList.appendChild(row);
}

function makeReminder(row, message, isRed) {
    row.innerHTML = ""; //

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
    if (circle.classList.contains("active")) {
        circle.style.background = "#ff4d4d";
    } else {
        circle.style.background = "transparent";
    }
}

function doubleClick(circle) {
    circle.classList.add("done");
    circle.style.background = "#2ecc71"; // Turn Green

    var taskText = circle.nextElementSibling.textContent;
    
    // Save to the "Completed" storage
    var completedList = JSON.parse(localStorage.getItem("myTasks") || "[]");
    completedList.push({ text: taskText, time: Date.now() });
    localStorage.setItem("myTasks", JSON.stringify(completedList));

    // Fade away animation
    var wholeRow = circle.parentElement;
    wholeRow.style.transition = "opacity 0.5s";
    wholeRow.style.opacity = "0";
    
    setTimeout(function() {
        wholeRow.remove();
        saveActiveTasks();
    }, 500);
}

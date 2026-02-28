const taskList = document.getElementById("task-list");
addPreset();

function addPreset() {
    const p = document.createElement("div");
    p.className = "task";
    p.style.display = "flex"; // Ensure the row is a flexbox
    p.style.alignItems = "center";
    p.style.gap = "10px";

    const flag = document.createElement("div");
    flag.className = "flag";
    flag.style.cursor = "pointer";
    flag.onclick = () => toggleFlag(flag);
    flag.ondblclick = () => handleDoubleClick(flag);

    const text = document.createElement("div");
    text.className = "editable";
    text.contentEditable = true;
    text.style.flex = "1"; // Glues icons to the right
    text.innerHTML = "&#8203;";

    text.onkeydown = e => {
        if (e.key === "Enter") {
            e.preventDefault();
            const t = text.textContent.replace("\u200B", "").trim();
            if (!t) return;
            const isRed = flag.classList.contains("active");
            makeReminder(p, t, isRed);
            addPreset();
        }
    };

    p.append(flag, text);
    taskList.appendChild(p);
}

function makeReminder(p, t, isRed) {
    p.innerHTML = "";

    const flag = document.createElement("div");
    flag.className = "flag";
    flag.style.cursor = "pointer";
    flag.onclick = () => toggleFlag(flag);
    flag.ondblclick = () => handleDoubleClick(flag);
    
    if (isRed) {
        flag.classList.add("active");
        flag.style.background = "#ff4d4d";
    }
    
    const span = document.createElement("span");
    span.style.flex = "1"; // This is the "glue" that pushes icons right
    span.textContent = t;

    const edit = document.createElement("span");
    edit.textContent = "✏️";
    edit.style.cursor = "pointer";
    edit.onclick = () => {
        const input = document.createElement("input");
        input.value = span.textContent;
        p.replaceChild(input, span);
        input.onblur = () => {
            span.textContent = input.value.trim() || t;
            p.replaceChild(span, input);
        };
        input.focus();
    };

    const del = document.createElement("span");
    del.textContent = "🗑";
    del.style.cursor = "pointer";
    del.onclick = () => {
        p.remove();
        if (taskList.children.length === 0) addPreset();
    };

    p.append(flag, span, edit, del);
}

function toggleFlag(flag) {
    if (flag.classList.contains("done")) return; //ensure user doesn't single click after double clicking - ends function if classList contains 'done'
    flag.classList.toggle("active");
    flag.style.background = flag.classList.contains("active") ? "#ff4d4d" : "transparent";
}

function handleDoubleClick(flag) {
    flag.classList.add("done");
    flag.style.background = "#2ecc71"; //green

    const textToSave = flag.nextElementSibling.textContent; //grabs content from element next to flag (the reminder itself) and sets to textToSave
    let savedList = JSON.parse(localStorage.getItem("myTasks")) || []; //sets savedList = already existing list in local storage OR a new one
    savedList.push(textToSave); //adds new task to end of list
    localStorage.setItem("myTasks", JSON.stringify(savedList)); //turns list into one long string so browser can store it

    const parent = flag.closest(".task"); //sets parent = whole task
    parent.style.transition = "opacity 1s"; //1s transition
    parent.style.opacity = "0"; //sets invisible
    setTimeout(() => { //sets timer for 1000ms for fade animation
        parent.remove(); //removes the reminder from the page
        if (taskList.children.length === 0) addPreset(); //if there are no more reminders, another is added
    }, 1000);
}

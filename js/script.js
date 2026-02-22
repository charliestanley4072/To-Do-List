const taskList = document.getElementById("task-list");
addPreset();

function addPreset() {
    const p = document.createElement("div"); // p=preset
    p.className = "task";

    const flag = document.createElement("div");
    flag.className = "flag";

    const text = document.createElement("div");
    text.className = "editable";
    text.contentEditable = true;
    text.innerHTML = "&#8203;";

    text.onkeydown = e => {
        if (e.key === "Enter") {
            e.preventDefault();
            const t = text.textContent.replace("\u200B", "").trim();
            if (!t) return;
            makeReminder(p, t);
            addPreset();
        }
    };

    p.append(flag, text);
    taskList.appendChild(p);
}

function makeReminder(p, t) {
    p.innerHTML = "";

    const flag = document.createElement("div");
    flag.className = "flag";
    flag.onclick = () => {
        flag.classList.toggle("active");
        flag.style.background = flag.classList.contains("active") ? "#ff4d4d" : "transparent";
    };

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = t;

    const edit = document.createElement("span");
    edit.className = "icon-btn icon-right";
    edit.textContent = "✏️";

    edit.onclick = () => {
        const input = document.createElement("input");
        input.value = span.textContent;

        p.replaceChild(input, span);

        input.onkeydown = e => {
            if (e.key === "Enter") {
                e.preventDefault();
                input.blur();
            }
        };

        input.onblur = () => {
            span.textContent = input.value.trim() || t;
            p.replaceChild(span, input);
        };
        input.focus();
    };

    const del = document.createElement("span");
    del.className = "icon-btn";
    del.textContent = "🗑";
    del.onclick = () => p.remove();
    p.append(flag, span, edit, del);
}

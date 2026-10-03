import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);

const PEOPLE = { vasyl: "Vasyl", oleg: "Oleg" };
const DAYS = [
  ["monday","Mon"], ["tuesday","Tue"], ["wednesday","Wed"],
  ["thursday","Thu"], ["friday","Fri"], ["saturday","Sat"], ["sunday","Sun"]
];

let app, db, auth;
let selectedPerson = localStorage.getItem("gymPerson") || "";
let schedule = { vasyl: {}, oleg: {} };
let weekKey = getMondayKey();
let saveTimer;

function getMondayKey() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return formatDate(d);
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getWeekDates() {
  const monday = new Date(`${weekKey}T12:00:00`);
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function setStatus(text, cls = "") {
  $("status").textContent = text;
  $("status").className = "status " + cls;
}

function showToast(text) {
  $("toast").textContent = text;
  $("toast").classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => $("toast").classList.remove("show"), 1800);
}

function renderWeek() {
  const dates = getWeekDates();
  $("weekLabel").textContent =
    `${dates[0].toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${dates[6].toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}`;
  $("weekKey").textContent = weekKey;

  $("days").innerHTML = DAYS.map(([key, short], i) => {
    const d = dates[i];
    const selected = !!schedule[selectedPerson]?.[key];
    const today = formatDate(new Date()) === formatDate(d);
    return `<button class="day ${selected ? "selected" : ""} ${today ? "today" : ""}" data-day="${key}">
      <span class="short">${short}</span>
      <span class="date">${d.getDate()}</span>
      <span class="check">${selected ? "✓" : "○"}</span>
    </button>`;
  }).join("");

  document.querySelectorAll(".day").forEach(btn => {
    btn.addEventListener("click", () => toggleDay(btn.dataset.day));
  });
}

function renderSummary() {
  const both = DAYS
    .filter(([key]) => schedule.vasyl?.[key] && schedule.oleg?.[key])
    .map(([, short]) => short);

  $("summary").innerHTML =
    (both.length ? `<div class="both-banner">🔥 Both can go: ${both.join(" · ")}</div>` : "") +
    Object.entries(PEOPLE).map(([id, name]) => {
      const chosen = DAYS.filter(([key]) => schedule[id]?.[key]).map(([,short]) => short);
      return `<div class="person-row">
        <div class="person-row-head"><span>👤 ${name}</span><span>${chosen.length}/7</span></div>
        ${chosen.length
          ? `<div class="pills">${chosen.map(x => `<span class="pill">${x}</span>`).join("")}</div>`
          : `<div class="empty">No days selected yet</div>`}
      </div>`;
    }).join("");
}

function render() {
  document.querySelectorAll(".person").forEach(b =>
    b.classList.toggle("active", b.dataset.person === selectedPerson)
  );
  $("planner").classList.toggle("hidden", !selectedPerson);
  renderWeek();
  renderSummary();
}

function toggleDay(day) {
  if (!selectedPerson || !auth?.currentUser) {
    showToast("Still connecting…");
    return;
  }

  schedule[selectedPerson] ||= {};
  schedule[selectedPerson][day] = !schedule[selectedPerson][day];
  render();
  queueSave();
}

function queueSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const updates = {};
      for (const [day] of DAYS) {
        updates[`weeks/${weekKey}/${selectedPerson}/${day}`] =
          !!schedule[selectedPerson]?.[day];
      }
      await update(ref(db), updates);
      $("updatedText").textContent = `${PEOPLE[selectedPerson]} just updated the schedule`;
      showToast("Saved ✓");
    } catch (error) {
      console.error("Firebase save error:", error);
      setStatus("Save failed", "error");
      showToast(error?.message || "Could not save");
    }
  }, 150);
}

document.querySelectorAll(".person").forEach(button => {
  button.addEventListener("click", () => {
    selectedPerson = button.dataset.person;
    localStorage.setItem("gymPerson", selectedPerson);
    render();
  });
});

$("clearBtn").addEventListener("click", () => {
  if (!selectedPerson) return;
  schedule[selectedPerson] = {};
  render();
  queueSave();
});

async function startFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    auth = getAuth(app);

    onAuthStateChanged(auth, user => {
      if (user) {
        setStatus("Live", "ok");

        onValue(ref(db, `weeks/${weekKey}`), snapshot => {
          const data = snapshot.val() || {};
          schedule = {
            vasyl: data.vasyl || {},
            oleg: data.oleg || {}
          };
          render();
          $("updatedText").textContent = "Live schedule · updates appear automatically";
        }, error => {
          console.error("Realtime Database error:", error);
          setStatus("Database error", "error");
          $("updatedText").textContent = error.message || "Database connection failed.";
        });
      }
    });

    await signInAnonymously(auth);
  } catch (error) {
    console.error("Firebase startup error:", error);
    setStatus("Firebase error", "error");
    $("weekLabel").textContent = "Firebase connection failed";
    $("updatedText").textContent = error?.message || "Check Firebase Authentication and Database settings.";
  }
}

render();
startFirebase();

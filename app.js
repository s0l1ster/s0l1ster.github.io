import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const PEOPLE = {
  vasyl: "Vasyl",
  oleg: "Oleg"
};
const DAYS = [
  ["monday","Mon"], ["tuesday","Tue"], ["wednesday","Wed"],
  ["thursday","Thu"], ["friday","Fri"], ["saturday","Sat"], ["sunday","Sun"]
];

let selectedPerson = localStorage.getItem("gymPerson") || "";
let schedule = { vasyl: {}, oleg: {} };
let weekKey = getMondayKey();
let saveTimer = null;

const $ = (id) => document.getElementById(id);
const personButtons = [...document.querySelectorAll(".person")];

function getMondayKey() {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  now.setDate(now.getDate() - day);
  return formatDate(now);
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
function setStatus(text, cls="") {
  $("status").textContent = text;
  $("status").className = "status " + cls;
}
function showToast(text) {
  $("toast").textContent = text;
  $("toast").classList.add("show");
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => $("toast").classList.remove("show"), 1800);
}
function renderWeek() {
  const dates = getWeekDates();
  const end = dates[6];
  $("weekLabel").textContent =
    `${dates[0].toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${end.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}`;
  $("weekKey").textContent = weekKey;
  $("days").innerHTML = DAYS.map(([key, short], i) => {
    const d = dates[i];
    const selected = !!(schedule[selectedPerson] && schedule[selectedPerson][key]);
    const today = formatDate(new Date()) === formatDate(d);
    return `<button class="day ${selected ? "selected":""} ${today ? "today":""}" data-day="${key}">
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
  const available = {};
  for (const key of DAYS.map(x => x[0])) {
    available[key] = [schedule.vasyl[key] ? "Vasyl" : "", schedule.oleg[key] ? "Oleg" : ""].filter(Boolean);
  }
  const both = DAYS.filter(([key]) => available[key].length === 2).map(([,short]) => short);
  $("summary").innerHTML = `
    ${both.length ? `<div class="both-banner">🔥 Both can go: ${both.join(" · ")}</div>` : ""}
    ${Object.entries(PEOPLE).map(([id,name]) => {
      const chosen = DAYS.filter(([key]) => schedule[id]?.[key]).map(([,short]) => short);
      return `<div class="person-row">
        <div class="person-row-head"><span>👤 ${name}</span><span>${chosen.length}/7</span></div>
        ${chosen.length ? `<div class="pills">${chosen.map(short => `<span class="pill">${short}</span>`).join("")}</div>` : `<div class="empty">No days selected yet</div>`}
      </div>`;
    }).join("")}
  `;
}
function render() {
  personButtons.forEach(b => b.classList.toggle("active", b.dataset.person === selectedPerson));
  $("planner").classList.toggle("hidden", !selectedPerson);
  renderWeek();
  renderSummary();
}
function toggleDay(day) {
  if (!selectedPerson || !auth.currentUser) return;
  schedule[selectedPerson] ||= {};
  schedule[selectedPerson][day] = !schedule[selectedPerson][day];
  render();
  queueSave();
}
function queueSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const updates = {};
    for (const day of DAYS.map(x => x[0])) {
      updates[`weeks/${weekKey}/${selectedPerson}/${day}`] = !!schedule[selectedPerson][day];
    }
    try {
      await update(ref(db), updates);
      const name = PEOPLE[selectedPerson];
      $("updatedText").textContent = `${name} just updated the schedule`;
      showToast("Saved ✓");
    } catch (e) {
      console.error(e);
      setStatus("Save failed", "error");
      showToast("Could not save");
    }
  }, 120);
}
personButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    selectedPerson = btn.dataset.person;
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

onAuthStateChanged(auth, user => {
  if (!user) return;
  setStatus("Live", "ok");
  const weekRef = ref(db, `weeks/${weekKey}`);
  onValue(weekRef, snapshot => {
    schedule = snapshot.val() || {vasyl:{}, oleg:{}};
    schedule.vasyl ||= {};
    schedule.oleg ||= {};
    render();
    $("updatedText").textContent = "Live schedule · updates appear automatically";
  }, error => {
    console.error(error);
    setStatus("Database error", "error");
  });
});

signInAnonymously(auth).catch(error => {
  console.error(error);
  setStatus("Auth error", "error");
  $("updatedText").textContent = "Enable Anonymous Authentication in Firebase.";
});

render();

const storageKey = "habit-streak-tracker-data";
const form = document.getElementById("habit-form");
const input = document.getElementById("habit-name");
const habitList = document.getElementById("habit-list");

let habits = loadHabits();

form.addEventListener("submit", addHabit);
render();

function loadHabits() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch (error) {
    return [];
  }
}

function saveHabits() {
  localStorage.setItem(storageKey, JSON.stringify(habits));
}

function addHabit(event) {
  event.preventDefault();

  const name = input.value.trim();
  if (!name) return;

  habits.unshift({
    id: Date.now(),
    name,
    completedDates: []
  });

  saveHabits();
  input.value = "";
  render();
}

function removeHabit(habitId) {
  habits = habits.filter((habit) => habit.id !== habitId);
  saveHabits();
  render();
}

function toggleHabitDate(habitId, dateKey) {
  const habit = habits.find((item) => item.id === habitId);
  if (!habit) return;

  const index = habit.completedDates.indexOf(dateKey);
  if (index >= 0) {
    habit.completedDates.splice(index, 1);
  } else {
    habit.completedDates.push(dateKey);
  }

  saveHabits();
  render();
}

function getLast30Dates() {
  const dates = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    dates.push({
      key: formatDate(date),
      label: date.getDate(),
      short: date.toLocaleDateString("en", { month: "short", day: "numeric" })
    });
  }

  return dates;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStreak(habit) {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = formatDate(date);

    if (habit.completedDates.includes(key)) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function render() {
  if (habits.length === 0) {
    habitList.innerHTML = '<div class="empty-state">No habits yet. Add your first one.</div>';
    return;
  }

  const dates = getLast30Dates();

  habitList.innerHTML = habits.map((habit) => {
    const streak = getStreak(habit);
    const completedCount = habit.completedDates.filter((date) =>
      dates.some((item) => item.key === date)
    ).length;
    const progress = Math.round((completedCount / dates.length) * 100);

    const calendarCells = dates
      .map((date) => {
        const done = habit.completedDates.includes(date.key);

        return `
          <button
            type="button"
            class="day ${done ? "done" : ""}"
            data-habit-id="${habit.id}"
            data-date="${date.key}"
            title="${date.short}"
          >
            <span class="day-number">${date.label}</span>
            <span class="day-mark">${done ? "✓" : ""}</span>
          </button>
        `;
      })
      .join("");

    return `
      <article class="habit-card">
        <div class="habit-header">
          <div>
            <h3>${escapeHtml(habit.name)}</h3>
            <p class="meta">${completedCount}/${dates.length} days completed</p>
          </div>
          <button type="button" class="delete-btn" data-habit-id="${habit.id}">Remove</button>
        </div>

        <div class="stats">
          <div>
            <strong>${streak}</strong>
            <span>day streak</span>
          </div>
          <div>
            <strong>${progress}%</strong>
            <span>last 30 days</span>
          </div>
        </div>

        <div class="calendar">${calendarCells}</div>
      </article>
    `;
  }).join("");

  attachEvents();
}

function attachEvents() {
  habitList.querySelectorAll(".day").forEach((button) => {
    button.addEventListener("click", () => {
      toggleHabitDate(Number(button.dataset.habitId), button.dataset.date);
    });
  });

  habitList.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      removeHabit(Number(button.dataset.habitId));
    });
  });
}
const monthYear = document.getElementById("month-year");
const calendarDays = document.getElementById("calendar-days");
const weekdays = document.getElementById("weekdays");
const modal = document.getElementById("event-modal");
const eventTitle = document.getElementById("event-title");
const selectedDateText = document.getElementById("selected-date");
const eventList = document.getElementById("event-list");

const appointmentsList = document.querySelector(".appointments-list");

// Nombres de los días de la semana
const weekNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
weekNames.forEach(day => {
  const div = document.createElement("div");
  div.textContent = day;
  div.classList.add("weekday");
  weekdays.appendChild(div);
});

let date = new Date();
const today = new Date();
let events = JSON.parse(localStorage.getItem("calendarEvents")) || {};
let selectedDate = null;

// Mock de citas de ejemplo (puedes cambiar)
const appointmentsMock = {
  "2025-10-15": [
    { patient: "Juan Pérez", time: "09:00" },
    { patient: "María López", time: "11:30" }
  ],
  "2025-10-16": [
    { patient: "Carlos Ruiz", time: "14:00" }
  ],
  "2025-10-17": [
    { patient: "Carlos Ruiz", time: "14:00" }
  ]
};

// Función para renderizar el calendario
const renderCalendar = () => {
  calendarDays.innerHTML = "";
  const year = date.getFullYear();
  const month = date.getMonth();

  monthYear.textContent = date.toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  // Espacios vacíos antes del primer día
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    calendarDays.appendChild(empty);
  }

  // Días del mes
  for (let day = 1; day <= lastDate; day++) {
    const div = document.createElement("div");
    div.textContent = day;
    div.classList.add("day");

    const fullDate = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

    // Punto de evento
    if ((events[fullDate] && events[fullDate].length > 0) || (appointmentsMock[fullDate] && appointmentsMock[fullDate].length > 0)) {
      const dot = document.createElement("div");
      dot.classList.add("event-dot");
      div.appendChild(dot);
    }

    // Día de hoy
    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      div.classList.add("today");
    }

    // Al hacer clic en un día
    div.onclick = () => {
      selectedDate = fullDate;
      openModal(fullDate);
      renderAppointments(fullDate);
    };

    calendarDays.appendChild(div);
  }
};

// Cambiar mes
document.getElementById("prev").onclick = () => {
  date.setMonth(date.getMonth() - 1);
  renderCalendar();
};

document.getElementById("next").onclick = () => {
  date.setMonth(date.getMonth() + 1);
  renderCalendar();
};

// Renderizar modal de eventos
function openModal(dateStr) {
  selectedDateText.textContent = `Eventos para ${dateStr}`;
  eventList.innerHTML = "";
  const eventArr = events[dateStr] || [];
  eventArr.forEach((ev, i) => {
    const div = document.createElement("div");
    div.classList.add("event-item");
    div.innerHTML = `<span>${ev}</span> <button class="delete-btn" data-index="${i}">✕</button>`;
    eventList.appendChild(div);
  });
  modal.style.display = "flex";

  // Eliminar evento
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = (e) => {
      const idx = e.target.dataset.index;
      events[dateStr].splice(idx, 1);
      if (events[dateStr].length === 0) delete events[dateStr];
      localStorage.setItem("calendarEvents", JSON.stringify(events));
      openModal(dateStr);
      renderCalendar();
    };
  });
}

document.getElementById("close-modal").onclick = () => {
  modal.style.display = "none";
  eventTitle.value = "";
};

document.getElementById("save-event").onclick = () => {
  const title = eventTitle.value.trim();
  if (!title) return;
  if (!events[selectedDate]) events[selectedDate] = [];
  events[selectedDate].push(title);
  localStorage.setItem("calendarEvents", JSON.stringify(events));
  eventTitle.value = "";
  openModal(selectedDate);
  renderCalendar();
};

// Cerrar modal al dar clic fuera
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

// Renderizar citas en la lista izquierda
function renderAppointments(dateStr) {
  appointmentsList.innerHTML = `<h3>Citas del día</h3>`;
  const appts = appointmentsMock[dateStr] || [];
  if (appts.length === 0) {
    appointmentsList.innerHTML += `<p>No hay citas programadas</p>`;
    return;
  }
  appts.forEach(appt => {
    const div = document.createElement("div");
    div.classList.add("appointment-item");
    div.innerHTML = `<span class="patient-name">${appt.patient}</span> <span class="appointment-time">${appt.time}</span>`;
    appointmentsList.appendChild(div);
  });
}

// Render inicial
renderCalendar();
renderAppointments(today.toISOString().split('T')[0]);

const state = {
  services: [],
  selectedService: null,
  selectedDate: null,
  selectedSlot: null,
  visibleMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
};

const servicesList = document.querySelector('#servicesList');
const calendarGrid = document.querySelector('#calendarGrid');
const monthLabel = document.querySelector('#monthLabel');
const prevMonth = document.querySelector('#prevMonth');
const nextMonth = document.querySelector('#nextMonth');
const slotsGrid = document.querySelector('#slotsGrid');
const selectedSummary = document.querySelector('#selectedSummary');
const bookingMessage = document.querySelector('#bookingMessage');
const appointmentForm = document.querySelector('#appointmentForm');

function currency(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function isoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function displayDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day));
}

function setMessage(text, type = 'error') {
  bookingMessage.textContent = text;
  bookingMessage.classList.toggle('success', type === 'success');
}

function renderServices() {
  servicesList.innerHTML = state.services.map((service) => `
    <button class="service-card ${state.selectedService?.id === service.id ? 'active' : ''}" data-service-id="${service.id}" type="button">
      <span>
        <strong>${service.name}</strong>
        <span class="muted">${service.durationMinutes} min</span>
      </span>
      <span class="price">${currency(service.priceCents)}</span>
    </button>
  `).join('');
}

function renderCalendar() {
  const now = new Date();
  const year = state.visibleMonth.getFullYear();
  const month = state.visibleMonth.getMonth();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  monthLabel.textContent = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).format(state.visibleMonth);

  prevMonth.disabled = first <= new Date(today.getFullYear(), today.getMonth(), 1);

  const cells = names.map((name) => `<div class="day-name">${name}</div>`);
  for (let index = 0; index < first.getDay(); index += 1) {
    cells.push('<div></div>');
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    const date = new Date(year, month, day);
    const value = isoDate(date);
    const available = date >= today;
    cells.push(`
      <button class="day-button ${available ? 'available' : ''} ${state.selectedDate === value ? 'active' : ''}"
        data-date="${value}" type="button" ${available ? '' : 'disabled'}>${day}</button>
    `);
  }

  calendarGrid.innerHTML = cells.join('');
}

function renderSlots(slots = []) {
  if (!state.selectedService) {
    selectedSummary.textContent = 'Selecione um servico primeiro';
    slotsGrid.innerHTML = '';
    return;
  }

  if (!state.selectedDate) {
    selectedSummary.textContent = 'Selecione uma data';
    slotsGrid.innerHTML = '';
    return;
  }

  selectedSummary.textContent = `${state.selectedService.name} em ${displayDate(state.selectedDate)}`;
  slotsGrid.innerHTML = slots.length
    ? slots.map((slot) => `<button class="slot-button ${state.selectedSlot === slot ? 'active' : ''}" data-slot="${slot}" type="button">${slot}</button>`).join('')
    : '<p class="muted mb-0">Nenhum horario disponivel para esta data.</p>';
}

async function loadAvailability() {
  state.selectedSlot = null;
  if (!state.selectedService || !state.selectedDate) {
    renderSlots();
    return;
  }

  const data = await API.request(`/api/availability?serviceId=${state.selectedService.id}&date=${state.selectedDate}`);
  renderSlots(data.slots);
}

async function init() {
  const data = await API.request('/api/services');
  state.services = data.services;
  renderServices();
  renderCalendar();
  renderSlots();
}

servicesList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-service-id]');
  if (!button) return;
  state.selectedService = state.services.find((service) => service.id === Number(button.dataset.serviceId));
  renderServices();
  await loadAvailability();
});

calendarGrid.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-date]');
  if (!button) return;
  state.selectedDate = button.dataset.date;
  renderCalendar();
  await loadAvailability();
});

prevMonth.addEventListener('click', () => {
  state.visibleMonth = new Date(state.visibleMonth.getFullYear(), state.visibleMonth.getMonth() - 1, 1);
  renderCalendar();
});

nextMonth.addEventListener('click', () => {
  state.visibleMonth = new Date(state.visibleMonth.getFullYear(), state.visibleMonth.getMonth() + 1, 1);
  renderCalendar();
});

slotsGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-slot]');
  if (!button) return;
  state.selectedSlot = button.dataset.slot;
  [...slotsGrid.querySelectorAll('.slot-button')].forEach((slot) => slot.classList.toggle('active', slot.dataset.slot === state.selectedSlot));
});

appointmentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('');

  if (!state.selectedService || !state.selectedDate || !state.selectedSlot) {
    setMessage('Selecione servico, data e horario.');
    return;
  }

  try {
    await API.request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        serviceId: state.selectedService.id,
        date: state.selectedDate,
        time: state.selectedSlot,
        customerName: document.querySelector('#customerName').value,
        customerPhone: document.querySelector('#customerPhone').value,
        customerEmail: document.querySelector('#customerEmail').value
      })
    });
    appointmentForm.reset();
    setMessage('Horario solicitado com sucesso. A barbearia entrara em contato para confirmar.', 'success');
    await loadAvailability();
  } catch (error) {
    setMessage(error.message);
  }
});

init().catch((error) => setMessage(error.message));

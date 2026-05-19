const appointmentsBody = document.querySelector('#appointmentsBody');
const appointmentsEmpty = document.querySelector('#appointmentsEmpty');
const appointmentsCount = document.querySelector('#appointmentsCount');
const pendingCount = document.querySelector('#pendingCount');
const todayCount = document.querySelector('#todayCount');
const welcomeText = document.querySelector('#welcomeText');
const dashboardMessage = document.querySelector('#dashboardMessage');

const statusLabels = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  rejected: 'Negado',
  completed: 'Concluido'
};

function setDashboardMessage(text, type = 'error') {
  dashboardMessage.textContent = text;
  dashboardMessage.classList.toggle('success', type === 'success');
}

function fillProfile(barber) {
  welcomeText.textContent = `${barber.shopName} - ${barber.name}`;
}

function todayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function normalizeDate(value) {
  return String(value).slice(0, 10).split('-').reverse().join('/');
}

function renderActionButtons(item) {
  if (item.status === 'pending') {
    return `
      <button class="btn btn-sm btn-orange" type="button" data-action="confirmed" data-id="${item.id}">Confirmar agendamento</button>
      <button class="btn btn-sm btn-outline-soft" type="button" data-action="rejected" data-id="${item.id}">Negar agendamento</button>
    `;
  }

  if (item.status === 'confirmed') {
    return `<button class="btn btn-sm btn-orange" type="button" data-action="completed" data-id="${item.id}">Concluir servico</button>`;
  }

  return '<span class="muted">Sem acao</span>';
}

function renderAppointments(appointments) {
  appointmentsCount.textContent = appointments.length;
  pendingCount.textContent = appointments.filter((item) => item.status === 'pending').length;
  todayCount.textContent = appointments.filter((item) => String(item.date).slice(0, 10) === todayKey()).length;
  appointmentsEmpty.textContent = appointments.length ? '' : 'Nenhuma solicitacao de horario ainda.';

  appointmentsBody.innerHTML = appointments.map((item) => `
    <tr>
      <td>
        <strong>${item.customerName}</strong>
        <div class="muted">${item.customerPhone}</div>
      </td>
      <td>${item.serviceName}</td>
      <td>${normalizeDate(item.date)}</td>
      <td>${item.time}</td>
      <td><span class="status-pill status-${item.status}">${statusLabels[item.status] || item.status}</span></td>
      <td><div class="appointment-actions">${renderActionButtons(item)}</div></td>
    </tr>
  `).join('');
}

async function updateAppointmentStatus(id, status) {
  setDashboardMessage('');

  try {
    await API.request(`/api/barber/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    setDashboardMessage('Status atualizado com sucesso.', 'success');
    await loadDashboard();
  } catch (error) {
    setDashboardMessage(error.message);
  }
}

async function clearSchedule() {
  const confirmed = window.confirm('Tem certeza que deseja limpar toda a agenda? Esta acao remove todos os agendamentos listados.');
  if (!confirmed) {
    return;
  }

  setDashboardMessage('');

  try {
    const result = await API.request('/api/barber/appointments', {
      method: 'DELETE'
    });
    setDashboardMessage(`${result.deleted} agendamento(s) removido(s).`, 'success');
    await loadDashboard();
  } catch (error) {
    setDashboardMessage(error.message);
  }
}

async function loadDashboard() {
  if (!API.token) {
    window.location.href = '/acesso-vieira';
    return;
  }

  try {
    const [profile, appointments] = await Promise.all([
      API.request('/api/barber/me'),
      API.request('/api/barber/appointments')
    ]);
    fillProfile(profile.barber);
    renderAppointments(appointments.appointments);
  } catch (error) {
    API.logout();
  }
}

document.querySelector('#logoutButton').addEventListener('click', () => API.logout());
document.querySelector('#refreshButton').addEventListener('click', loadDashboard);
document.querySelector('#clearScheduleButton').addEventListener('click', clearSchedule);
appointmentsBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action][data-id]');
  if (!button) {
    return;
  }

  updateAppointmentStatus(button.dataset.id, button.dataset.action);
});

loadDashboard();

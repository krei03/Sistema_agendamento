const profileForm = document.querySelector('#profileForm');
const profileMessage = document.querySelector('#profileMessage');
const appointmentsBody = document.querySelector('#appointmentsBody');
const appointmentsEmpty = document.querySelector('#appointmentsEmpty');
const appointmentsCount = document.querySelector('#appointmentsCount');
const pendingCount = document.querySelector('#pendingCount');
const welcomeText = document.querySelector('#welcomeText');

function setProfileMessage(text, type = 'error') {
  profileMessage.textContent = text;
  profileMessage.classList.toggle('success', type === 'success');
}

function fillProfile(barber) {
  document.querySelector('#name').value = barber.name;
  document.querySelector('#username').value = barber.username;
  document.querySelector('#email').value = barber.email;
  document.querySelector('#phone').value = barber.phone;
  document.querySelector('#shopName').value = barber.shopName;
  document.querySelector('#address').value = barber.address;
  welcomeText.textContent = `${barber.shopName} - ${barber.name}`;
}

function normalizeDate(value) {
  return String(value).slice(0, 10).split('-').reverse().join('/');
}

function renderAppointments(appointments) {
  appointmentsCount.textContent = appointments.length;
  pendingCount.textContent = appointments.filter((item) => item.status === 'pending').length;
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
      <td><span class="status-pill">${item.status}</span></td>
    </tr>
  `).join('');
}

async function loadDashboard() {
  if (!API.token) {
    window.location.href = '/login.html';
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

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setProfileMessage('');

  try {
    const data = await API.request('/api/barber/me', {
      method: 'PUT',
      body: JSON.stringify({
        name: document.querySelector('#name').value,
        email: document.querySelector('#email').value,
        phone: document.querySelector('#phone').value,
        shopName: document.querySelector('#shopName').value,
        address: document.querySelector('#address').value
      })
    });
    fillProfile(data.barber);
    setProfileMessage('Dados atualizados com sucesso.', 'success');
  } catch (error) {
    setProfileMessage(error.message);
  }
});

document.querySelector('#logoutButton').addEventListener('click', () => API.logout());
document.querySelector('#refreshButton').addEventListener('click', loadDashboard);

loadDashboard();

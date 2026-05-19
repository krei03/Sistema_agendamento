const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3000';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${body.error || 'erro sem corpo'}`);
  }

  return body;
}

async function requestExpectingError(path, expectedStatus, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));
  assert(
    response.status === expectedStatus,
    `${options.method || 'GET'} ${path} deveria retornar ${expectedStatus}, mas retornou ${response.status}.`
  );

  return body;
}

function futureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function main() {
  const stamp = Date.now();
  const username = `valida_${stamp}`;
  const email = `valida_${stamp}@teste.local`;
  const password = 'senha123';

  const health = await request('/health');
  assert(health.status === 'ok', 'Health check nao retornou ok.');

  const registered = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Barbeiro Validador',
      username,
      email,
      phone: '(11) 90000-0000',
      shopName: 'Vieira Barbearia',
      address: 'Rua de Teste, 100',
      password
    })
  });
  assert(registered.token, 'Cadastro nao retornou token.');

  const logged = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  assert(logged.token, 'Login nao retornou token.');

  const authHeader = { Authorization: `Bearer ${logged.token}` };
  const me = await request('/api/barber/me', { headers: authHeader });
  assert(me.barber.username === username, 'Rota protegida retornou barbeiro incorreto.');

  const updated = await request('/api/barber/me', {
    method: 'PUT',
    headers: authHeader,
    body: JSON.stringify({
      name: 'Barbeiro Validado',
      email,
      phone: '(11) 91111-1111',
      shopName: 'Vieira Barbearia Validada',
      address: 'Rua de Teste, 101'
    })
  });
  assert(updated.barber.name === 'Barbeiro Validado', 'Perfil nao foi atualizado.');

  const services = await request('/api/services');
  assert(Array.isArray(services.services) && services.services.length > 0, 'Servicos nao foram listados.');

  const date = futureDate(7);
  const availability = await request(`/api/availability?serviceId=${services.services[0].id}&date=${date}`);
  assert(Array.isArray(availability.slots) && availability.slots.length > 0, 'Disponibilidade vazia.');

  const appointment = await request('/api/appointments', {
    method: 'POST',
    body: JSON.stringify({
      serviceId: services.services[0].id,
      customerName: 'Cliente Teste',
      customerPhone: '(11) 98888-0000',
      customerEmail: 'cliente@teste.local',
      date,
      time: availability.slots[0],
      notes: 'Validacao automatizada'
    })
  });
  assert(appointment.appointment.id, 'Agendamento nao retornou id.');

  const pendingAvailability = await request(`/api/availability?serviceId=${services.services[0].id}&date=${date}`);
  assert(
    pendingAvailability.slots.includes(availability.slots[0]),
    'Horario pendente nao deveria bloquear a disponibilidade publica.'
  );

  const secondAppointment = await request('/api/appointments', {
    method: 'POST',
    body: JSON.stringify({
      serviceId: services.services[0].id,
      customerName: 'Cliente Pendente Concorrente',
      customerPhone: '(11) 97777-0000',
      date,
      time: availability.slots[0],
      notes: 'Validacao de disponibilidade pending'
    })
  });
  assert(secondAppointment.appointment.id, 'Segundo agendamento pendente nao retornou id.');

  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  assert(adminLogin.token, 'Login do barbeiro admin nao retornou token.');

  const appointments = await request('/api/barber/appointments', {
    headers: { Authorization: `Bearer ${adminLogin.token}` }
  });
  assert(appointments.appointments.length > 0, 'Dashboard nao lista agendamentos.');

  const confirmed = await request(`/api/barber/appointments/${appointment.appointment.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminLogin.token}` },
    body: JSON.stringify({ status: 'confirmed' })
  });
  assert(confirmed.appointment.status === 'confirmed', 'Agendamento nao foi confirmado.');

  const confirmedAvailability = await request(`/api/availability?serviceId=${services.services[0].id}&date=${date}`);
  assert(
    !confirmedAvailability.slots.includes(availability.slots[0]),
    'Horario confirmado deveria bloquear a disponibilidade publica.'
  );

  await requestExpectingError(`/api/barber/appointments/${secondAppointment.appointment.id}/status`, 409, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminLogin.token}` },
    body: JSON.stringify({ status: 'confirmed' })
  });

  const completed = await request(`/api/barber/appointments/${appointment.appointment.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminLogin.token}` },
    body: JSON.stringify({ status: 'completed' })
  });
  assert(completed.appointment.status === 'completed', 'Agendamento nao foi concluido.');

  const completedAvailability = await request(`/api/availability?serviceId=${services.services[0].id}&date=${date}`);
  assert(
    completedAvailability.slots.includes(availability.slots[0]),
    'Horario concluido deveria voltar para a disponibilidade publica.'
  );

  const rejected = await request(`/api/barber/appointments/${secondAppointment.appointment.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminLogin.token}` },
    body: JSON.stringify({ status: 'rejected' })
  });
  assert(rejected.appointment.status === 'rejected', 'Agendamento nao foi negado.');

  const rejectedAvailability = await request(`/api/availability?serviceId=${services.services[0].id}&date=${date}`);
  assert(
    rejectedAvailability.slots.includes(availability.slots[0]),
    'Horario negado deveria permanecer disponivel no calendario publico.'
  );

  const cleared = await request('/api/barber/appointments', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminLogin.token}` }
  });
  assert(cleared.deleted >= 1, 'Limpeza da agenda nao removeu agendamentos.');

  const emptyAppointments = await request('/api/barber/appointments', {
    headers: { Authorization: `Bearer ${adminLogin.token}` }
  });
  assert(emptyAppointments.appointments.length === 0, 'Agenda nao ficou vazia apos limpeza.');

  console.log('Validacao funcional concluida com sucesso.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

const express = require('express');
const { query } = require('../db');
const { clean, isDate, isEmail, isTime, validateRequired } = require('../validators');

const router = express.Router();

function formatService(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents
  };
}

function buildSlots() {
  const slots = [];
  for (let hour = 9; hour <= 18; hour += 1) {
    for (const minute of [0, 30]) {
      if (hour === 18 && minute > 0) {
        continue;
      }
      slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  return slots;
}

router.get('/services', async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT id, name, description, duration_minutes, price_cents FROM services WHERE active = 1 ORDER BY price_cents ASC'
    );
    return res.json({ services: rows.map(formatService) });
  } catch (error) {
    return next(error);
  }
});

router.get('/availability', async (req, res, next) => {
  try {
    const serviceId = Number(req.query.serviceId);
    const date = clean(req.query.date);

    if (!serviceId || !isDate(date)) {
      return res.status(400).json({ error: 'Informe serviceId e date no formato YYYY-MM-DD.' });
    }

    const services = await query('SELECT id FROM services WHERE id = ? AND active = 1', [serviceId]);
    if (!services.length) {
      return res.status(404).json({ error: 'Servico nao encontrado.' });
    }

    const barbers = await query('SELECT id FROM barbers ORDER BY id ASC LIMIT 1');
    if (!barbers.length) {
      return res.status(409).json({ error: 'Nenhum barbeiro cadastrado.' });
    }

    const booked = await query(
      `SELECT TIME_FORMAT(appointment_time, '%H:%i') AS appointment_time
         FROM appointments
        WHERE barber_id = ? AND appointment_date = ? AND status = 'confirmed'`,
      [barbers[0].id, date]
    );

    const bookedSet = new Set(booked.map((item) => item.appointment_time));
    return res.json({ slots: buildSlots().filter((slot) => !bookedSet.has(slot)) });
  } catch (error) {
    return next(error);
  }
});

router.post('/appointments', async (req, res, next) => {
  try {
    const body = {
      serviceId: Number(req.body.serviceId),
      customerName: clean(req.body.customerName),
      customerPhone: clean(req.body.customerPhone),
      customerEmail: clean(req.body.customerEmail || ''),
      date: clean(req.body.date),
      time: clean(req.body.time),
      notes: clean(req.body.notes || '')
    };

    const missing = validateRequired(body, ['customerName', 'customerPhone', 'date', 'time']);
    if (missing.length || !body.serviceId) {
      return res.status(400).json({ error: 'Informe servico, cliente, telefone, data e horario.' });
    }

    if (body.customerEmail && !isEmail(body.customerEmail)) {
      return res.status(400).json({ error: 'Email invalido.' });
    }

    if (!isDate(body.date) || !isTime(body.time)) {
      return res.status(400).json({ error: 'Data ou horario invalido.' });
    }

    const services = await query('SELECT id FROM services WHERE id = ? AND active = 1', [body.serviceId]);
    if (!services.length) {
      return res.status(404).json({ error: 'Servico nao encontrado.' });
    }

    const barbers = await query('SELECT id FROM barbers ORDER BY id ASC LIMIT 1');
    if (!barbers.length) {
      return res.status(409).json({ error: 'Nenhum barbeiro cadastrado.' });
    }

    const confirmedSlot = await query(
      `SELECT id, status FROM appointments
        WHERE barber_id = ? AND appointment_date = ? AND appointment_time = ?
          AND status = 'confirmed'
        LIMIT 1`,
      [barbers[0].id, body.date, `${body.time}:00`]
    );

    if (confirmedSlot.length) {
      return res.status(409).json({ error: 'Horario ja confirmado.' });
    }

    const result = await query(
      `INSERT INTO appointments
       (barber_id, service_id, customer_name, customer_phone, customer_email, appointment_date, appointment_time, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        barbers[0].id,
        body.serviceId,
        body.customerName,
        body.customerPhone,
        body.customerEmail || null,
        body.date,
        `${body.time}:00`,
        body.notes || null
      ]
    );

    return res.status(201).json({
      appointment: {
        id: result.insertId,
        serviceId: body.serviceId,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail || null,
        date: body.date,
        time: body.time,
        status: 'pending'
      }
    });
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Horario ja solicitado.' });
    }
    return next(error);
  }
});

module.exports = router;

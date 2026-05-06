const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../auth');
const { clean, isEmail, validateRequired } = require('../validators');

const router = express.Router();

function publicBarber(row) {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    shopName: row.shop_name,
    address: row.address
  };
}

router.use(requireAuth);

router.get('/me', (req, res) => {
  return res.json({ barber: publicBarber(req.barber) });
});

router.put('/me', async (req, res, next) => {
  try {
    const body = {
      name: clean(req.body.name),
      email: clean(req.body.email),
      phone: clean(req.body.phone),
      shopName: clean(req.body.shopName),
      address: clean(req.body.address)
    };

    const missing = validateRequired(body, ['name', 'email', 'phone', 'shopName', 'address']);
    if (missing.length) {
      return res.status(400).json({ error: `Campos obrigatorios: ${missing.join(', ')}.` });
    }

    if (!isEmail(body.email)) {
      return res.status(400).json({ error: 'Email invalido.' });
    }

    const duplicated = await query(
      'SELECT id FROM barbers WHERE email = ? AND id <> ? LIMIT 1',
      [body.email, req.barber.id]
    );

    if (duplicated.length) {
      return res.status(409).json({ error: 'Email ja cadastrado para outro barbeiro.' });
    }

    await query(
      'UPDATE barbers SET name = ?, email = ?, phone = ?, shop_name = ?, address = ? WHERE id = ?',
      [body.name, body.email, body.phone, body.shopName, body.address, req.barber.id]
    );

    const rows = await query(
      'SELECT id, name, username, email, phone, shop_name, address FROM barbers WHERE id = ?',
      [req.barber.id]
    );

    return res.json({ barber: publicBarber(rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.get('/appointments', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT a.id, a.customer_name, a.customer_phone, a.customer_email, a.appointment_date,
              TIME_FORMAT(a.appointment_time, '%H:%i') AS appointment_time,
              a.status, a.notes, s.name AS service_name, s.duration_minutes, s.price_cents
         FROM appointments a
         JOIN services s ON s.id = a.service_id
        WHERE a.barber_id = ?
        ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
      [req.barber.id]
    );

    return res.json({
      appointments: rows.map((row) => ({
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        customerEmail: row.customer_email,
        date: row.appointment_date,
        time: row.appointment_time,
        status: row.status,
        notes: row.notes,
        serviceName: row.service_name,
        durationMinutes: row.duration_minutes,
        priceCents: row.price_cents
      }))
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

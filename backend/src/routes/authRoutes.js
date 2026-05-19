const bcrypt = require('bcrypt');
const express = require('express');
const { query } = require('../db');
const { signToken } = require('../auth');
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

router.post('/register', async (req, res, next) => {
  try {
    const body = {
      name: clean(req.body.name),
      username: clean(req.body.username),
      email: clean(req.body.email),
      phone: clean(req.body.phone),
      shopName: clean(req.body.shopName || 'Vieira Barbearia'),
      address: clean(req.body.address || 'Borges de Medeiros 238'),
      password: req.body.password
    };

    const missing = validateRequired(body, ['name', 'username', 'email', 'phone', 'password']);
    if (missing.length) {
      return res.status(400).json({ error: `Campos obrigatorios: ${missing.join(', ')}.` });
    }

    if (!isEmail(body.email)) {
      return res.status(400).json({ error: 'Email invalido.' });
    }

    if (body.password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const existing = await query(
      'SELECT id FROM barbers WHERE username = ? OR email = ? LIMIT 1',
      [body.username, body.email]
    );

    if (existing.length) {
      return res.status(409).json({ error: 'Usuario ou email ja cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const result = await query(
      'INSERT INTO barbers (name, username, email, phone, shop_name, address, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [body.name, body.username, body.email, body.phone, body.shopName, body.address, passwordHash]
    );

    const rows = await query(
      'SELECT id, name, username, email, phone, shop_name, address FROM barbers WHERE id = ?',
      [result.insertId]
    );

    const token = signToken(rows[0]);
    return res.status(201).json({ token, barber: publicBarber(rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const username = clean(req.body.username);
    const password = req.body.password || '';

    if (!username || !password) {
      return res.status(400).json({ error: 'Informe usuario e senha.' });
    }

    const rows = await query(
      'SELECT * FROM barbers WHERE username = ? OR email = ? LIMIT 1',
      [username, username]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Credenciais invalidas.' });
    }

    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciais invalidas.' });
    }

    const token = signToken(rows[0]);
    return res.json({ token, barber: publicBarber(rows[0]) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

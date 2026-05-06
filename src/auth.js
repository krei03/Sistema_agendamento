const jwt = require('jsonwebtoken');
const config = require('./config');
const { query } = require('./db');

function signToken(barber) {
  return jwt.sign(
    { sub: barber.id, username: barber.username },
    config.jwtSecret,
    { expiresIn: '8h' }
  );
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');

  if (!token) {
    return res.status(401).json({ error: 'Token ausente.' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const rows = await query(
      'SELECT id, name, username, email, phone, shop_name, address FROM barbers WHERE id = ?',
      [payload.sub]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Usuario nao encontrado.' });
    }

    req.barber = rows[0];
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido ou expirado.' });
  }
}

module.exports = {
  requireAuth,
  signToken
};

require('dotenv').config();

const config = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD === undefined ? 'root' : process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'barber_schedule',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }
};

module.exports = config;

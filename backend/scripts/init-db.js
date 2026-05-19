const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const config = require('../src/config');

const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(attempts = 20) {
  let lastError;

  for (let index = 1; index <= attempts; index += 1) {
    try {
      return await mysql.createConnection({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        multipleStatements: true
      });
    } catch (error) {
      lastError = error;
      console.log(`Aguardando MySQL (${index}/${attempts})...`);
      await sleep(1500);
    }
  }

  throw lastError;
}

async function seed(connection) {
  await connection.query(`USE \`${config.db.database}\``);

  const services = [
    ['Corte Classico', 'Corte alinhado para o dia a dia.', 30, 6000],
    ['Barba', 'Modelagem e acabamento da barba.', 20, 4500],
    ['Corte + Barba', 'Experiencia completa com corte e barba.', 50, 9500],
    ['Barbear com Navalha', 'Acabamento tradicional com navalha.', 40, 8000],
    ['Corte Infantil', 'Corte pratico para criancas.', 25, 4500],
    ['Pacote Deluxe', 'Corte, barba, tratamento e finalizacao.', 90, 15000]
  ];

  for (const service of services) {
    await connection.query(
      `INSERT INTO services (name, description, duration_minutes, price_cents, active)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         description = VALUES(description),
         duration_minutes = VALUES(duration_minutes),
         price_cents = VALUES(price_cents),
         active = 1`,
      service
    );
  }

  const passwordHash = await bcrypt.hash('admin123', 10);
  await connection.query(
    `INSERT INTO barbers (name, username, email, phone, shop_name, address, password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       phone = VALUES(phone),
       shop_name = VALUES(shop_name),
       address = VALUES(address)`,
    [
      'Administrador',
      'admin',
      'admin@vieirabarbearia.com.br',
      '(13)99206-0409',
      'Vieira Barbearia',
      'Borges de Medeiros 238',
      passwordHash
    ]
  );
}

async function migrate(connection) {
  await connection.query(`USE \`${config.db.database}\``);
  await connection.query(
    "ALTER TABLE appointments MODIFY status ENUM('pending', 'confirmed', 'cancelled', 'rejected', 'completed') NOT NULL DEFAULT 'pending'"
  );
  await connection.query("UPDATE appointments SET status = 'rejected' WHERE status = 'cancelled'");
  await connection.query(
    "ALTER TABLE appointments MODIFY status ENUM('pending', 'confirmed', 'rejected', 'completed') NOT NULL DEFAULT 'pending'"
  );

  const [uniqueSlotIndexes] = await connection.query(
    `SELECT INDEX_NAME
       FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'appointments'
        AND INDEX_NAME = 'uq_appointment_slot'
      LIMIT 1`
  );

  if (uniqueSlotIndexes.length) {
    await connection.query('ALTER TABLE appointments DROP INDEX uq_appointment_slot');
  }

  const [slotIndexes] = await connection.query(
    `SELECT INDEX_NAME
       FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'appointments'
        AND INDEX_NAME = 'idx_appointments_slot'
      LIMIT 1`
  );

  if (!slotIndexes.length) {
    await connection.query(
      'ALTER TABLE appointments ADD INDEX idx_appointments_slot (barber_id, appointment_date, appointment_time)'
    );
  }
}

async function main() {
  const schema = await fs.readFile(schemaPath, 'utf8');
  const connection = await connectWithRetry();

  try {
    await connection.query(schema.replaceAll('barber_schedule', config.db.database));
    await migrate(connection);
    await seed(connection);
    console.log('Banco inicializado com sucesso.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Falha ao inicializar banco:', error.message);
  process.exit(1);
});

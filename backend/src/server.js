const path = require('path');
const cors = require('cors');
const express = require('express');
const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const barberRoutes = require('./routes/barberRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'public')));
app.use('/screens', express.static(path.join(__dirname, '..', '..', 'frontend', 'screens')));
app.use('/assets', express.static(path.join(__dirname, '..', '..', 'frontend', 'assets')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/barber', barberRoutes);
app.use('/api', publicRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada.' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Servidor iniciado em http://localhost:${config.port}`);
  });
}

module.exports = app;

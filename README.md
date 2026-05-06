npm# Sistema de Agendamento para Barbearia

Aplicacao web simples para uma barbearia, com landing page publica para solicitacao de horarios e area administrativa protegida para o barbeiro acompanhar agenda e editar seus dados.

## Stack

- Node.js
- Express
- MySQL
- JavaScript Vanilla
- Bootstrap e Bootstrap Icons
- Docker Compose

## Rodando com Docker

```bash
docker compose up --build
```

Depois acesse:

- Landing page: http://localhost:3000
- Login admin: http://localhost:3000/login.html
- Cadastro: http://localhost:3000/register.html
- Dashboard: http://localhost:3000/dashboard.html

Credenciais iniciais criadas pelo seed:

- Usuario: `admin`
- Senha: `admin123`

## Rodando localmente

1. Instale as dependencias:

```bash
npm install
```

2. Crie um banco MySQL acessivel com as variaveis do `.env.example`.

3. Copie `.env.example` para `.env` e ajuste se necessario.

4. Inicialize schema e dados:

```bash
npm run init-db
```

5. Inicie a aplicacao:

```bash
npm start
```

## Validacao

Com a aplicacao rodando e o banco inicializado:

```bash
npm run validate
```

O script valida:

- Health check
- Cadastro do barbeiro
- Login
- Rota protegida
- Atualizacao de perfil
- Listagem de servicos
- Consulta de disponibilidade
- Criacao de agendamento
- Listagem de agendamentos no dashboard

## Rotas principais

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/barber/me`
- `PUT /api/barber/me`
- `GET /api/barber/appointments`
- `GET /api/services`
- `GET /api/availability?serviceId=1&date=2026-05-01`
- `POST /api/appointments`

## Observacoes

O schema fica em `database/schema.sql` e pode ser aplicado varias vezes com `npm run init-db`. Os seeds sao idempotentes para servicos e usuario admin.

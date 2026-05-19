# Sistema de Agendamento para Barbearia

Aplicacao web simples para uma barbearia, com landing page publica para solicitacao de horarios e area administrativa protegida para o barbeiro acompanhar agenda e editar seus dados.

## Estrutura

- `backend/src`: servidor Express, configuracao, autenticacao e rotas.
- `backend/scripts`: scripts de inicializacao e validacao funcional.
- `backend/database`: schema SQL idempotente e seeds.
- `frontend/public`: paginas, estilos e JavaScript Vanilla.
- `frontend/screens`: imagens usadas como referencia/ativo visual da landing.

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

O Compose sobe dois servicos:

- `mysql`: MySQL 8.4 com banco `barber_schedule`, publicado por padrao em `localhost:3307` para evitar conflito com MySQL local na porta `3306`.
- `app`: Node.js na porta `3000`, executando `npm run init-db` antes de iniciar o servidor.

Se quiser usar outra porta externa para o MySQL do Docker, ajuste `MYSQL_HOST_PORT` no ambiente antes de subir:

```bash
MYSQL_HOST_PORT=3308 docker compose up --build
```

Depois acesse no navegador:

- Landing page: http://localhost:3000
- Login admin: http://localhost:3000/acesso-vieira
- Cadastro: http://localhost:3000/register.html
- Dashboard: http://localhost:3000/dashboard.html

Credenciais iniciais criadas pelo seed:

- Usuario: `admin`
- Senha: `admin123`

Para parar:

```bash
docker compose down
```

Para reiniciar o banco do zero, removendo o volume:

```bash
docker compose down -v
docker compose up --build
```

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

O schema fica em `backend/database/schema.sql` e pode ser aplicado varias vezes com `npm run init-db`. Os seeds sao idempotentes para servicos e usuario admin.

As paginas do frontend ficam em `frontend/public`, mas sao servidas pelo Express diretamente na raiz do site. A tela de login administrativo usa a rota discreta `/acesso-vieira`; o acesso direto a `/login.html` retorna 404 para nao expor o atalho na landing publica.
# landing-Page-advocacia-

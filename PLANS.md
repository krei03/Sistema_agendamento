# Sistema de agenda para barbeiro

Este ExecPlan e um documento vivo. Ele deve ser atualizado sempre que o escopo, as decisoes ou o estado real do projeto mudarem.

## Purpose / Big Picture

Criar um sistema web simples para uma barbearia, com uma landing page publica onde clientes consultam servicos, escolhem data e horario e solicitam um agendamento, e uma area interna onde o barbeiro consegue se cadastrar, fazer login, visualizar dashboard, ver e editar os proprios dados, acompanhar solicitacoes e sair do sistema.

O visual deve seguir as referencias da pasta `frontend/screens`: fundo escuro, destaque laranja para acoes, formularios com bordas discretas, landing page com imagem forte de barbearia, cards de servico e calendario.

## Progress

- [x] Revisar o estado inicial do repositorio, imagens de referencia e dependencias disponiveis.
- [x] Definir arquitetura Node.js + Express + MySQL + frontend Vanilla JS servido como arquivos estaticos.
- [x] Criar estrutura de pastas do backend, frontend, scripts SQL e configuracao Docker.
- [x] Criar `package.json` com scripts de desenvolvimento, start e validacao.
- [x] Instalar e registrar dependencias: `express`, `mysql2`, `dotenv`, `cors`, `bcrypt`, `jsonwebtoken`.
- [x] Implementar camada de configuracao e conexao MySQL com pool reutilizavel.
- [x] Criar schema idempotente do banco com tabelas `barbers`, `services` e `appointments`.
- [x] Criar seed idempotente de servicos e um barbeiro admin inicial para teste local.
- [x] Implementar API de cadastro do barbeiro com validacao e senha criptografada.
- [x] Implementar API de login com JWT e comparacao segura de senha.
- [x] Implementar middleware de autenticacao para rotas protegidas.
- [x] Implementar API protegida para ler e atualizar perfil do barbeiro autenticado.
- [x] Implementar API protegida para listar agendamentos do barbeiro.
- [x] Implementar API publica para listar servicos disponiveis.
- [x] Implementar API publica para consultar horarios disponiveis por servico e data.
- [x] Implementar API publica para solicitar agendamento validando dados do cliente, servico, data e horario.
- [x] Criar frontend publico em JavaScript Vanilla com landing page, selecao de servico, calendario, horarios e formulario de agendamento.
- [x] Criar tela de cadastro do barbeiro integrada ao backend.
- [x] Criar tela de login integrada ao backend.
- [x] Criar dashboard protegido com perfil editavel, agendamentos e logout.
- [x] Aplicar estilo responsivo inspirado em `frontend/screens/login.png`, `frontend/screens/home.png`, `frontend/screens/home_2.png` e `frontend/screens/home_3.png`.
- [x] Configurar Dockerfile e `docker-compose.yml` com app Node.js e MySQL.
- [x] Criar README com requisitos, configuracao, comandos, credenciais de teste e rotas principais.
- [x] Executar validacoes locais de sintaxe/configuracao.
- [x] Executar validacao funcional de API para cadastro, login, rota protegida, servicos e agendamento.
- [x] Atualizar Outcomes & Retrospective com resultado final, comandos executados e limitacoes conhecidas.
- [x] Corrigir calendario na landing page com navegacao entre meses e datas locais.
- [x] Remover texto sobreposto no banner da landing page.
- [x] Melhorar estrutura do projeto separando frontend e backend por pastas.
- [x] Ajustar Docker para rodar o projeto com a nova estrutura e incluir imagens da landing no build.
- [x] Melhorar README.md com informacoes de como rodar via Docker.
- [ ] Validar runtime Docker completo em ambiente onde o Docker daemon responda sem timeout.

## Surprises & Discoveries

- As imagens de referencia estavam disponiveis, mas nao havia codigo existente alem de um README minimo.
- O plano original tinha acentos quebrados por encoding; este documento foi normalizado em ASCII para evitar novas quebras.
- O `npm install` ficou preso dentro do sandbox duas vezes; a instalacao concluiu imediatamente quando executada com permissao escalada.
- O Docker nao estava instalado ou nao estava no PATH na primeira execucao registrada, entao a validacao Docker foi bloqueada antes de iniciar containers.
- O servidor Node sobe e responde `GET /health` com `{"status":"ok"}` mesmo sem conexao valida com MySQL.
- Nesta execucao, `npm` via PowerShell foi bloqueado por Execution Policy; `npm.cmd` funcionou corretamente.
- O MySQL local passou a aceitar as credenciais do `.env`, permitindo `npm.cmd run init-db` e `npm.cmd run validate` com sucesso.
- A validacao funcional original criava um barbeiro novo, mas o agendamento publico e vinculado ao primeiro barbeiro cadastrado. O script foi ajustado para validar a agenda do admin seedado.
- `docker compose config` validou o Compose, mas `docker compose up --build -d` nao concluiu: primeiro houve bloqueio de permissao no Docker API e, com permissao escalada, os comandos Docker ficaram em timeout.

## Decision Log

- Usar Express servindo a API em `/api/*` e o frontend estatico em `frontend/public`, reduzindo complexidade de deploy.
- Usar JWT armazenado no `localStorage` do frontend para proteger a area interna; e suficiente para este escopo simples e facilita testar sem sessao de servidor.
- Usar MySQL como fonte de dados principal, com schema idempotente executado por script SQL.
- Criar seed com servicos e barbeiro admin local para permitir teste imediato de login, mantendo tambem fluxo real de cadastro.
- Manter JavaScript Vanilla sem bundler para cumprir o requisito e simplificar Docker.
- Usar Bootstrap e Bootstrap Icons via CDN no frontend, com CSS proprio para reproduzir a identidade escura/laranja das telas.
- Servir `/screens` como pasta estatica para reaproveitar a imagem de referencia da landing como ativo visual sem duplicar arquivos binarios.
- Permitir `DB_PASSWORD=` explicitamente em `.env`, sem converter senha vazia para `root`.
- Separar a aplicacao em `backend/` e `frontend/`, mantendo `package.json` na raiz para preservar comandos simples.
- Manter o agendamento publico vinculado ao primeiro barbeiro cadastrado neste escopo de barbearia simples; por isso o seed `admin` e o responsavel pela agenda publica.
- Remover o bloco de chamada do banner da landing para atender ao pedido de nao exibir texto sobre a imagem, mantendo a marca apenas na navegacao.

## Outcomes & Retrospective

Implementacao concluida no repositorio:

- Backend Express criado com cadastro, login JWT, middleware de autenticacao, perfil protegido, listagem de agendamentos, servicos, disponibilidade e criacao de agendamento.
- MySQL modelado com schema idempotente para `barbers`, `services` e `appointments`, alem de seed idempotente de servicos e usuario admin.
- Frontend Vanilla criado para landing/agendamento publico, cadastro, login e dashboard protegido.
- Dockerfile e `docker-compose.yml` criados para app + MySQL.
- README criado com comandos, credenciais iniciais, rotas e validacao.
- Estrutura reorganizada para `backend/src`, `backend/scripts`, `backend/database`, `frontend/public` e `frontend/screens`.
- Landing atualizada com banner sem texto sobreposto e calendario navegavel por mes.
- README atualizado com estrutura do projeto e instrucoes Docker mais completas.
- Docker ajustado para incluir `frontend/screens` no build, necessario para renderizar a imagem da landing.

Validacoes executadas:

- `node --check` em todos os arquivos `.js`: passou.
- Servidor local iniciado com `node backend/src/server.js`; `GET /health`, `/` e `/screens/home.png`: passaram.
- `npm.cmd run init-db`: passou nesta execucao.
- `npm.cmd run validate`: passou nesta execucao apos ajuste do script ao barbeiro admin seedado.
- `docker compose config`: passou, com aviso de acesso ao `C:\Users\kakar\.docker\config.json`.
- `docker compose up --build -d`: tentou executar; sem permissao falhou no Docker API, com permissao escalada ficou em timeout. Runtime Docker segue pendente de ambiente/daemon responsivo.

Resultado: o codigo, a configuracao, a reorganizacao e a validacao local com MySQL foram entregues. A comprovacao runtime Docker depende de executar em um ambiente onde o Docker daemon responda sem timeout.

## Context and Orientation

O projeto comeca praticamente do zero.

Existe uma pasta chamada `frontend/screens` com imagens de referencia:

- `frontend/screens/login.png`
- `frontend/screens/home.png`
- `frontend/screens/home_2.png`
- `frontend/screens/home_3.png`

Essas imagens devem servir como base visual para as telas.

## Plan of Work

1. Preparar o projeto Node.js com scripts, dependencias, variaveis de ambiente e estrutura previsivel.
2. Implementar backend em camadas simples: configuracao, banco, middleware de auth, rotas de autenticacao, perfil, servicos e agendamentos.
3. Criar schema SQL idempotente para permitir recriar o ambiente sem apagar manualmente arquivos.
4. Criar frontend estatico com tres fluxos principais: landing/agendamento publico, cadastro/login, dashboard protegido.
5. Integrar frontend e backend usando `fetch` e respostas JSON padronizadas.
6. Dockerizar app e banco para execucao reproduzivel.
7. Validar com comandos automatizados e testes funcionais dos fluxos obrigatorios.
8. Atualizar README e finalizar este ExecPlan com evidencias.
9. Separar frontend e backend por pastas buscando deixar o projeto mais profissional.
10. Configurar o ambiente para rodar o projeto inteiro no Docker.
11. Quando o Docker daemon estiver responsivo, validar frontend, backend e projeto completo via Compose.

## Concrete Steps

1. Criar `backend/src/server.js`, `backend/src/db.js`, `backend/src/auth.js` e modulos de rotas em `backend/src/routes/`.
2. Criar `backend/database/schema.sql` com `CREATE TABLE IF NOT EXISTS`, indices e inserts idempotentes.
3. Criar `backend/scripts/init-db.js` para aplicar o schema via `mysql2/promise`.
4. Criar `frontend/public/index.html`, `frontend/public/login.html`, `frontend/public/register.html`, `frontend/public/dashboard.html`, `frontend/public/styles.css` e scripts JS.
5. Criar endpoints:
   - `GET /health`
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `GET /api/barber/me`
   - `PUT /api/barber/me`
   - `GET /api/barber/appointments`
   - `GET /api/services`
   - `GET /api/availability?serviceId=&date=`
   - `POST /api/appointments`
6. Criar `Dockerfile`, `.dockerignore`, `docker-compose.yml` e `.env.example`.
7. Criar script de validacao funcional em `backend/scripts/validate-api.js`.
8. Executar instalacao de dependencias, inicializacao de banco, validacao API e validacao Docker.
9. Atualizar `README.md` e marcar cada item concluido no `Progress`.

## Validation and Acceptance

O trabalho sera aceito quando:

- `npm install` concluir e `package-lock.json` refletir dependencias.
- `npm.cmd run init-db` criar/atualizar tabelas e dados iniciais sem erro.
- `npm.cmd run validate` testar cadastro, login, rota protegida, atualizacao de perfil, listagem de servicos, disponibilidade e criacao de agendamento.
- `docker compose up --build` subir app e MySQL, e `GET /health` responder `ok`.
- O navegador conseguir abrir:
  - `/` para landing e solicitacao de horario.
  - `/register.html` para cadastro do barbeiro.
  - `/login.html` para login.
  - `/dashboard.html` apenas com token valido.
- O README explicar como rodar localmente, via Docker e quais credenciais usar.
- Testar frontend no Docker.
- Testar backend no Docker.
- Testar o projeto inteiro no Docker.

## Idempotence and Recovery

- O schema usa `CREATE TABLE IF NOT EXISTS` e seeds com `ON DUPLICATE KEY UPDATE`, permitindo rodar `npm.cmd run init-db` varias vezes.
- O Docker Compose cria volume nomeado para MySQL; para recomecar do zero, parar os containers e remover o volume do projeto.
- Se a instalacao de dependencias falhar por rede, repetir `npm install` quando a conexao estiver disponivel.
- Se a API iniciar antes do MySQL no Docker, o container do app executa `npm run init-db` no start; reiniciar o servico depois que o banco estiver saudavel deve recuperar.
- O frontend usa URLs relativas para API, entao funciona tanto localmente quanto no Docker sem alterar codigo.

## Artifacts and Notes

Usar as imagens da pasta `frontend/screens` como referencia visual.

Arquivos alterados nesta execucao:

- `.dockerignore`
- `.env.example`
- `README.md`
- `PLANS.md`
- `package.json`
- `backend/scripts/validate-api.js`
- `backend/src/server.js`
- `frontend/public/index.html`
- `frontend/public/landing.js`
- `frontend/public/styles.css`
- Movidos: `src/` para `backend/src/`, `scripts/` para `backend/scripts/`, `database/` para `backend/database/`, `public/` para `frontend/public/`, `screens/` para `frontend/screens/`.

Comandos executados nesta execucao:

- `Get-Content -Raw -LiteralPath .\PLANS.md`
- `Get-ChildItem -Force`
- `git status --short`
- `rg --files`
- `Get-Content -Raw -LiteralPath .\package.json`
- `Get-Content -Raw` em arquivos principais de backend, frontend, Docker e README
- `git add .`
- `git commit -m "chore: registra base inicial do sistema"`
- `New-Item -ItemType Directory -Force -Path .\backend, .\frontend`
- `Move-Item` para reorganizar backend e frontend
- `rg "src/|src\\|public/|public\\|database/|database\\|scripts/|scripts\\" -n . -g "!node_modules/**" -g "!package-lock.json"`
- `Get-ChildItem -Recurse -Filter *.js -Path .\backend, .\frontend | ForEach-Object { node --check $_.FullName }`
- Servidor local com `node backend/src/server.js` e `curl.exe` para `/health`, `/` e `/screens/home.png`
- `npm run init-db` (bloqueado pela Execution Policy)
- `npm.cmd run init-db`
- `npm.cmd run validate`
- `docker compose config`
- `docker compose up --build -d`
- `docker compose ps`
- `docker compose logs --tail=80`

Observacoes:

- O uso de `npm.cmd` e necessario neste PowerShell quando a Execution Policy bloqueia `npm.ps1`.
- A validacao Docker nao foi concluida por timeout/acesso ao daemon, apesar do Compose estar sintaticamente valido.

## Interfaces and Dependencies

Quero usar:

- Node.js para backend
- Express
- MySQL
- JavaScript Vanilla
- Bootstrap
- Bootstrap icons

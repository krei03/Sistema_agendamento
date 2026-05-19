# Sistema de agenda para barbeiro

> Histórico completo movido para `Archive.md`

Este arquivo e o plano operacional vivo do projeto. Ele deve ficar curto, atual e voltado ao que ainda precisa ser feito ou lembrado para continuar o desenvolvimento.

## Purpose / Big Picture

Criar e manter um sistema web simples para uma barbearia, com:

- landing page publica para clientes consultarem servicos, escolherem data/horario e solicitarem agendamento;
- acesso administrativo oculto em `/acesso-vieira`;
- dashboard protegido para o barbeiro acompanhar solicitacoes, confirmar, negar, concluir servicos e limpar a agenda;
- backend Node.js + Express + MySQL;
- frontend em JavaScript Vanilla servido como arquivos estaticos.

O visual deve seguir as referencias em `frontend/screens` e os assets finais em `frontend/assets`: fundo escuro, destaque laranja, formularios discretos, hero com imagem forte de barbearia e identidade Vieira.

## Current Progress

- Projeto estruturado em `backend/`, `frontend/`, `backend/database` e `backend/scripts`.
- Backend Express implementado com autenticacao JWT, rotas publicas, rotas protegidas do barbeiro, status de agendamentos e limpeza de agenda.
- Banco MySQL modelado com schema idempotente e seed inicial.
- Frontend publico e administrativo implementado com JavaScript Vanilla.
- Landing atualizada com hero, logo, contato oficial, calendario e formulario sem campo de email.
- Login administrativo servido por `/acesso-vieira`; `/login.html` deve retornar 404.
- Dashboard administrativo refatorado para foco em agendamentos, sem sidebar e sem bloco `Meus dados`.
- Dockerfile, `docker-compose.yml`, README e scripts de validacao existem.
- Historico completo de implementacoes, commits, comandos e troubleshooting esta em `Archive.md`.

## Active Tasks / Progress

- [x] Corrigir fluxo de agendamento e calendario.
- [x] Revisar se a selecao de datas/horarios evita inconsistencias de timezone e datas locais.
- [x] Confirmar se horarios rejeitados/concluidos ficam disponiveis novamente como esperado.
- [x] Revalidar o fluxo completo de agendamento publico ate aparecer no dashboard administrativo.
- [x] Corrigir regra de bloqueio de horarios no calendario.
- [x] Fazer horarios `pending` continuarem disponiveis ate confirmacao do admin.
- [x] Garantir que apenas horarios `confirmed` fiquem bloqueados no calendario.
- [x] Garantir que horarios `rejected` e `completed` voltem automaticamente para disponibilidade.

## Current Bugs

- Nenhum bug funcional ativo confirmado apos a validacao desta rodada.
- MySQL local fora do Docker ainda recusou `root@localhost` com a senha configurada; o fluxo foi validado pelo Docker Compose.

## Surprises & Discoveries

- A disponibilidade publica bloqueava `pending` e `confirmed`, o que fazia uma simples solicitacao remover o horario antes da confirmacao administrativa.
- A chave unica `uq_appointment_slot` tambem impedia multiplas solicitacoes pendentes para o mesmo horario, mesmo que a regra desejada fosse bloquear apenas confirmados.
- A validacao funcional precisava cobrir estados concorrentes no mesmo horario para evitar regressao nessa regra.
- A validacao responsiva que antes falhava com `read ECONNRESET` passou nesta rodada usando Chrome headless.
- `npm.cmd run init-db` com MySQL local falhou por credenciais, mas `docker compose up --build -d` subiu app e MySQL com sucesso.

## Next Steps

1. Fazer validacao manual visual no navegador se houver necessidade de conferir microinteracoes da landing e do dashboard.
2. Corrigir credenciais do MySQL local fora do Docker, caso o desenvolvimento sem Compose seja necessario.
3. Manter `npm.cmd run validate` cobrindo qualquer nova regra de disponibilidade antes de alterar calendario/agendamento novamente.

## Current Decisions

- Manter Express servindo API em `/api/*` e frontend estatico em `frontend/public`.
- Manter MySQL como banco principal, com schema e seed idempotentes.
- Manter frontend sem bundler, usando JavaScript Vanilla, Bootstrap e Bootstrap Icons.
- Manter `package.json` na raiz para comandos simples.
- Manter acesso administrativo oculto em `/acesso-vieira`; a landing publica nao deve exibir botao `Admin`.
- Manter o arquivo fisico `frontend/public/login.html`, mas bloquear acesso direto por `/login.html`.
- Manter dados oficiais da barbearia sincronizados: `Borges de Medeiros 238` e `(13)99206-0409`.
- Manter limpeza da agenda protegida por JWT e filtrada por `barber_id`.
- Usar `npm.cmd` no PowerShell quando `npm.ps1` for bloqueado pela Execution Policy.

## Decision Log

- Em 2026-05-19, a disponibilidade publica passou a considerar apenas agendamentos `confirmed` como bloqueio real de horario.
- Em 2026-05-19, solicitacoes `pending` podem coexistir no mesmo horario ate o barbeiro escolher qual confirmar.
- Em 2026-05-19, o banco deixou de usar a chave unica geral `uq_appointment_slot`; ela foi substituida por indice normal para consulta por barbeiro, data e horario.
- Em 2026-05-19, a confirmacao administrativa passou a validar conflito com outro `confirmed` no mesmo barbeiro/data/horario antes de atualizar o status.
- Em 2026-05-19, `completed` e `rejected` foram mantidos como estados que nao bloqueiam disponibilidade publica.

## Validation Pending

- Teste manual visual no navegador do fluxo landing -> dashboard, caso seja necessario validar UX alem da API automatizada.
- Revalidar `npm.cmd run init-db` fora do Docker quando as credenciais do MySQL local forem corrigidas.
- Revalidar depois de qualquer nova mudanca no fluxo de calendario/agendamento.

## Validation and Acceptance

Concluido nesta rodada:

- [x] `node --check` em todos os arquivos JS.
- [x] `git diff --check`.
- [x] `docker compose up --build -d`.
- [x] `docker compose ps`.
- [x] `GET /health` retornando `200` e `{"status":"ok"}`.
- [x] `npm.cmd run validate` com banco e servidor no Docker.
- [x] `npm.cmd run validate:responsive`.
- [x] Validar que `pending` permanece disponivel no calendario publico.
- [x] Validar que `confirmed` bloqueia o horario.
- [x] Validar que conflito ao confirmar outro agendamento do mesmo horario retorna `409`.
- [x] Validar que `completed` libera o horario.
- [x] Validar que `rejected` mantem o horario disponivel.

Pendente:

- [ ] Validacao manual visual em navegador, se houver necessidade de conferir microinteracoes.

## Interfaces and Dependencies

- Node.js
- Express
- MySQL
- JavaScript Vanilla
- Bootstrap
- Bootstrap Icons
- Docker Compose

## Context and Orientation

Imagens de referencia visual:

- `frontend/screens/login.png`
- `frontend/screens/home.png`
- `frontend/screens/home_2.png`
- `frontend/screens/home_3.png`

Assets finais usados pela landing:

- `frontend/assets/hero.avif`
- `frontend/assets/logo-vieira.png`

Rotas principais:

- `/` landing publica.
- `/acesso-vieira` login administrativo.
- `/register.html` cadastro.
- `/dashboard.html` dashboard protegido.
- `/health` health check.

Scripts principais:

- `npm.cmd run init-db`
- `npm.cmd run validate`
- `npm.cmd run validate:responsive`
- `docker compose up --build -d`

## Plan of Work

1. Manter a regra de negocio do calendario centralizada no backend.
2. Preservar as decisoes ja tomadas sobre login oculto, dashboard focado em agenda e contato oficial.
3. Validar primeiro com checks rapidos e depois com fluxo funcional completo.
4. Registrar neste arquivo apenas o estado atual; mover evidencias longas, logs e retrospectivas para `Archive.md`.
5. Em novas mudancas, garantir consistencia entre frontend, disponibilidade da API e dashboard administrativo.

## Concrete Steps

1. [x] Ler `frontend/public/landing.js`, `frontend/public/index.html`, `frontend/public/api.js` e `backend/src/routes/publicRoutes.js`.
2. [x] Confirmar como o calendario gera datas e como o backend interpreta `date` e `time`.
3. [x] Testar endpoints publicos de servicos, disponibilidade e criacao de agendamento.
4. [x] Ajustar backend para bloquear disponibilidade apenas por `confirmed`.
5. [x] Remover a restricao unica geral de horario no schema e migracao.
6. [x] Proteger a confirmacao administrativa contra conflito com outro `confirmed`.
7. [x] Testar a exibicao do novo agendamento no fluxo administrativo via `npm.cmd run validate`.
8. [x] Rodar validacoes disponiveis no ambiente atual.
9. [x] Atualizar `PLANS.md` com conclusoes, decisoes e pendencias reais.

## Artifacts and Notes

Arquivos alterados nesta rodada:

- `PLANS.md`
- `Archive.md`
- `backend/database/schema.sql`
- `backend/scripts/init-db.js`
- `backend/scripts/validate-api.js`
- `backend/src/routes/barberRoutes.js`
- `backend/src/routes/publicRoutes.js`

Comandos executados nesta rodada:

- `Get-Content -Path PLANS.md`
- `Get-Content` em `backend/src/routes/publicRoutes.js`, `frontend/public/landing.js`, `frontend/public/api.js`, `backend/scripts/validate-api.js`, `backend/database/schema.sql`, `backend/scripts/init-db.js`, `backend/src/routes/barberRoutes.js` e `package.json`
- `Get-ChildItem -Recurse -Filter *.js -Path .\backend, .\frontend | ForEach-Object { node --check $_.FullName }`
- `git diff --check`
- `git diff --stat`
- `npm.cmd run init-db`
- `npm.cmd install`
- `docker compose up --build -d`
- `docker compose ps`
- `curl.exe -s -i http://127.0.0.1:3000/health`
- `npm.cmd run validate`
- `npm.cmd run validate:responsive`
- `git status --short`

Observacoes:

- `npm.cmd run init-db` local falhou por `Access denied for user 'root'@'localhost'`; a validacao funcional foi feita com MySQL do Docker.
- `npm.cmd install` restaurou `node_modules` local e nao alterou arquivos versionados.
- O Docker Compose ficou em execucao ao final da validacao com app em `localhost:3000` e MySQL em `localhost:3307`.

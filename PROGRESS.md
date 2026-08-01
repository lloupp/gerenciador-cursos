# Gerenciador de Cursos — Plano de Desenvolvimento Incremental

Este arquivo controla o progresso do desenvolvimento automatizado via cron job.
Cada fase é executada em uma execução do cron, com commit e push ao final.

## Status: Fase 6 pendente (Dashboard Geral)

## Skill de referência: `event-course-manager-builder`
TODAS as fases devem seguir a skill `event-course-manager-builder` (carregada no cron).
Ela contém o schema de dados, fluxo de UX, features, boas práticas e pitfalls.
A Fase 1 (pesquisa) pode ATUALIZAR essa skill com novos conhecimentos.

## Fases

### Fase 1 — Pesquisa de mercado [CONCLUÍDO — 01/08/2026]
**Objetivo:** Estudar os melhores apps de gerenciamento de cursos/eventos e enriquecer a skill com o que aprender.
- Pesquisa de Sympla, Eventbrite e Even3 via curl + análise de JSON-LD/schema.org
- Documento de pesquisa em docs/pesquisa-mercado.md com análise comparativa
- Skill atualizada (v1.1.0): schema expandido (lots, checkedIn, customFields, payee), categorias financeiras ampliadas, features pós-MVP adicionadas, boas práticas de UX, referências de mercado
- Commit: 866fadb

### Fase 2 — Layout e Navegação Base [CONCLUÍDO — 01/08/2026]
- Header com título "Gerenciador de Cursos" e subtítulo
- Tabs: Eventos | Inscrições | Financeiro | Relatórios (com ícones e aria-selected)
- Container que renderiza cada seção dinamicamente
- CSS completo: variáveis de tema escuro, grid/flex, cards, botões (primary/danger/sm/icon), inputs/select/textarea, tabelas, badges (success/danger/info/warning/muted/purple), empty states com ícone+descrição, stats-grid, toolbar/filters-bar, footer, responsividade (768px e 480px)
- Empty state em todas as 4 tabs quando não há dados
- app.js com navegação entre tabs, renderização de cada seção, escapeHTML anti-XSS, formatação de moeda/data via utils.js
- Commit: 1ef669d

### Fase 3 — CRUD de Eventos [CONCLUÍDO — 01/08/2026]
- js/events.js: CRUD completo de eventos (criar, listar, editar, excluir)
- Formulário com todos os campos do schema: nome, descrição, tipo (curso/evento/workshop), categoria, data início/término, local, vagas, preço, status
- Lista em cards com badges de tipo e status, barra de progresso de vagas, botões editar e excluir
- Validação: campos obrigatórios, data de término >= data de início
- Persistência em localStorage (gc_events) com prefixo gc_
- Confirmação ao excluir, remoção em cascata de inscrições e transações associadas
- Schema conforme skill: id, name, description, type, date, endDate, location, capacity, price, category, status, lots, createdAt, updatedAt
- js/app.js: integração com events.js via ES modules (initEvents, renderEventsTab, attachEventListeners)
- escapeHTML centralizado em events.js e reexportado
- Commit: 80150c5

### Fase 4 — Inscrições e Participantes [CONCLUÍDO — 01/08/2026]
- js/registrations.js: CRUD completo de inscrições (criar, listar, editar, excluir)
- Formulário com todos os campos do schema: nome, email, telefone, evento, status (confirmado/pendente/cancelado), pagamento (pago/pendente/gratuito), forma de pagamento (pix/cartao/dinheiro/transferencia)
- Lista em tabela com colunas: participante, email, telefone, evento, status, pagamento, data de inscrição, ações
- Filtros por evento, status e pagamento
- Contador de vagas: preenchidas vs total, bloquear inscrição quando evento esgotado
- Validação: nome obrigatório, evento obrigatório, verificação de vagas ao criar e ao reativar inscrição cancelada
- Persistência em localStorage (gc_registrations) com prefixo gc_
- Schema conforme skill: id, eventId, participantName, email, phone, status, paymentStatus, paymentMethod, registeredAt, paidAt, checkedIn, checkedInAt, customFields
- js/app.js: integração com registrations.js via ES modules (initRegistrations, renderRegistrationsTab, attachRegistrationListeners, getRegistrations)
- Empty state quando não há inscrições nem eventos
- escapeHTML importado de events.js para prevenir XSS
- Commit: 4b5e0e1

### Fase 5 — Controle Financeiro [CONCLUÍDO — 01/08/2026]
- js/finance.js: CRUD completo de transações (receitas e despesas)
- Categorias de despesa: local, material, palestrante, buffet, equipamentos, marketing, seguro, outros
- Categorias de receita: inscricao (auto), patrocinio, venda, doacao, outros
- Receita automática: inscrições pagas viram receita automaticamente (syncAutoIncomes)
- Sincronização bidirecional: adiciona/atualiza/remove receitas automáticas conforme status de pagamento das inscrições
- Dashboard do evento: total receitas, total despesas, lucro/prejuízo, margem %
- Cards de resumo geral (filtrável por evento)
- Gráfico de barras em Canvas: receitas x despesas por evento (com legenda, grid, labels)
- Tabela de resumo por evento (receitas, despesas, lucro/prejuízo)
- Tabela de transações com filtro por evento, badges de tipo, marcação de auto
- Formulário com tipo (receita/despesa), evento, categoria dinâmica (muda conforme tipo), valor, data, fornecedor, descrição
- Persistência em localStorage (gc_transactions) com prefixo gc_
- Schema conforme skill: id, eventId, type, category, description, amount, date, autoGenerated, payee, paidTo
- js/app.js: integração com finance.js via ES modules (initFinance, renderFinanceTab, attachFinanceListeners)
- css/style.css: regra para canvas (display:block, max-width:100%)
- Commit: fb392fa

### Fase 6 — Dashboard Geral [PENDENTE]
- Visão geral de todos os eventos: card por evento com resumo financeiro
- Gráfico de pizza: distribuição de custos por categoria (todos os eventos)
- Gráfico de barras: receitas x despesas por evento
- Indicadores: total receitas, total custos, lucro total, ticket médio, taxa de ocupação
- Commit: "feat: dashboard geral com gráficos"

### Fase 7 — Relatórios e Exportação [PENDENTE]
- Implementar js/reports.js
- Relatório de participantes por evento (tabela com filtros)
- Relatório financeiro detalhado por evento
- Relatório consolidado (todos os eventos)
- Exportação CSV (participantes e financeiro)
- Commit: "feat: relatórios e exportação CSV"

### Fase 8 — Polimento e UX [PENDENTE]
- Animações de transição entre seções
- Toast notifications para ações (salvar, excluir, erro)
- Modal de confirmação ao excluir
- Indicadores visuais (badges de status coloridos)
- Responsividade mobile (menu hambúrguer, cards empilhados)
- Validação completa: abrir no navegador, testar todas as features
- Commit: "feat: polimento e UX"

### Fase 9 — Deploy no GitHub Pages [PENDENTE]
- Configurar GitHub Pages
- Verificar que o app funciona na URL pública
- Atualizar README com URL e instruções
- Commit: "deploy: GitHub Pages"

## Regras do cron
1. Ler este arquivo para saber qual fase executar
2. Implementar a fase completa
3. Testar (verificar sintaxe JS, validar HTML, checar localStorage logic)
4. Commit + push
5. Atualizar o status desta checklist
6. Reportar o que foi feito

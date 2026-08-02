# Gerenciador de Cursos — Plano de Desenvolvimento Incremental

Este arquivo controla o progresso do desenvolvimento automatizado via cron job.
Cada fase é executada em uma execução do cron, com commit e push ao final.

## Status: Fase 9 pendente (Deploy no GitHub Pages)

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

### Fase 6 — Dashboard Geral [CONCLUÍDO — 01/08/2026]
- js/dashboard.js: módulo completo de dashboard geral consolidado
- Indicadores: receita total, custo total, lucro total, ticket médio, taxa de ocupação, total de inscritos
- Gráfico de pizza (Canvas): distribuição de custos por categoria (todos os eventos) com legenda HTML interativa
- Gráfico de barras (Canvas): receitas x despesas por evento (com grid, labels, legenda)
- Cards de resumo por evento: nome, tipo, status, data, local, receita, despesa, lucro, margem %, ocupação com barra de progresso
- Nova aba "Dashboard" entre Financeiro e Relatórios no index.html
- CSS: layout de gráficos lado a lado (.dashboard-charts), legenda do pizza (.chart-legend, .legend-item, etc.), responsividade (empilha em mobile)
- Integration via ES modules no app.js (initDashboard, renderDashboardTab, attachDashboardListeners)
- escapeHTML importado de events.js para prevenir XSS
- Commit: 789b35a

### Fase 7 — Relatórios e Exportação [CONCLUÍDO — 01/08/2026]
- js/reports.js: módulo completo de relatórios (initReports, renderReportsTab, attachReportsListeners)
- Relatório de Participantes: tabela com filtros por evento, status e pagamento; colunas com participante, email, telefone, evento, status, pagamento, forma de pagamento, data de inscrição e data de pagamento
- Relatório Financeiro: resumo financeiro por evento com breakdown de receitas e despesas por categoria, totais gerais, tabela de transações com tipo, categoria, descrição, data, valor e origem (auto/manual)
- Relatório Consolidado: visão geral de todos os eventos com indicadores globais (receita, despesa, lucro, margem, ticket médio, ocupação, inscritos, confirmados), tabela consolidada com linha de totais
- Exportação CSV: três botões de exportação (participantes, financeiro, consolidado) com Blob URL, BOM UTF-8 para Excel, escape de aspas e vírgulas, timestamp no nome do arquivo
- Sub-tabs internas para alternar entre os três tipos de relatório
- escapeHTML importado de events.js para prevenir XSS
- Persistência em localStorage (gc_events, gc_registrations, gc_transactions) com prefixo gc_
- js/app.js: integração via ES modules (initReports, renderReportsTab, attachReportsListeners); placeholder substituído pelo módulo completo
- css/style.css: regra .reports-tabs-bar para sub-tabs de relatórios
- Commit: ed5ca09

### Fase 8 — Polimento e UX [CONCLUÍDO — 01/08/2026]
- js/ui.js: sistema reutilizável de toast notifications (success/error/warning/info) com auto-remove e animação slide-in
- js/ui.js: modal de confirmação reutilizável (showConfirm retorna Promise<boolean>) com suporte a ESC, clique no overlay, botão fechar
- Substituição de TODOS os alert() por showToast() e confirm() por showConfirm() (async) em events.js, registrations.js, finance.js, reports.js
- Toast de sucesso em todas as ações: criar/editar/excluir evento, inscrição, transação; exportar CSV
- Animação fadeInSlide ao trocar de aba (tab-content-animate no app.js)
- Animação cardFadeIn para cards ao renderItem
- css/style.css: toast container, estilos de toast (cores por tipo), modal overlay/dialog (slide-in), menu hambúrguer mobile com animação X
- index.html: container de toast (#toast-container), modal de confirmação (#modal-overlay), botão menu-toggle no header
- Menu hambúrguer mobile: esconde tabs no mobile, exibe dropdown ao clicar, fecha ao trocar de aba
- Responsividade mobile expandida: stats-grid em coluna (480px), card-grid em coluna (480px), filtros verticais, modal 95% width
- Badges de status coloridos já implementados em fases anteriores (verde=ativo, amarelo=pendente, vermelho=cancelado, cinza=rascunho)
- Commit: b1a969a

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

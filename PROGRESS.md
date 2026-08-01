# Gerenciador de Cursos — Plano de Desenvolvimento Incremental

Este arquivo controla o progresso do desenvolvimento automatizado via cron job.
Cada fase é executada em uma execução do cron, com commit e push ao final.

## Status: Fase 1 pendente

## Skill de referência: `event-course-manager-builder`
TODAS as fases devem seguir a skill `event-course-manager-builder` (carregada no cron).
Ela contém o schema de dados, fluxo de UX, features, boas práticas e pitfalls.

## Fases

### Fase 1 — Layout e Navegação Base [PENDENTE]
- Header com título "Gerenciador de Cursos"
- Tabs: Eventos | Inscrições | Financeiro | Relatórios
- Container que renderiza cada seção
- CSS completo: grid/flex, cards, botões, inputs, tabelas, tema escuro
- Empty state quando não há dados
- Seguir skill event-course-manager-builder → "Fase 1"
- Commit: "feat: layout e navegação base"

### Fase 2 — CRUD de Eventos [PENDENTE]
- Implementar js/events.js
- Formulário: nome, descrição, data, local, vagas, preço, categoria (curso/evento/workshop)
- Lista de eventos com cards (nome, data, vagas preenchidas/total, status)
- Editar e excluir evento
- Persistência em localStorage
- Commit: "feat: cadastro e gestão de eventos"

### Fase 3 — Inscrições e Participantes [PENDENTE]
- Implementar js/registrations.js
- Formulário de inscrição: nome, email, telefone, evento, status (confirmado/pendente/cancelado), pagamento (pago/pendente)
- Lista de participantes por evento
- Filtro por evento e por status
- Contador de vagas preenchidas vs total
- Editar e excluir inscrição
- Persistência em localStorage
- Commit: "feat: inscrições e participantes"

### Fase 4 — Controle Financeiro [PENDENTE]
- Implementar js/finance.js
- Cadastro de custos por evento: categoria (local, material, palestrante, buffet, outros), descrição, valor
- Cadastro de receitas por evento: inscrições pagas (auto das inscrições), patrocínios, vendas extras
- Dashboard do evento: total receitas, total custos, lucro/prejuízo, margem %
- Gráfico de barras em Canvas: receitas x despesas por categoria
- Persistência em localStorage
- Commit: "feat: controle financeiro com dashboard"

### Fase 5 — Dashboard Geral [PENDENTE]
- Visão geral de todos os eventos: card por evento com resumo financeiro
- Gráfico de pizza: distribuição de custos por categoria (todos os eventos)
- Gráfico de barras: receitas x despesas por evento
- Indicadores: total receitas, total custos, lucro total, ticket médio, taxa de ocupação
- Commit: "feat: dashboard geral com gráficos"

### Fase 6 — Relatórios e Exportação [PENDENTE]
- Implementar js/reports.js
- Relatório de participantes por evento (tabela com filtros)
- Relatório financeiro detalhado por evento
- Relatório consolidado (todos os eventos)
- Exportação CSV (participantes e financeiro)
- Commit: "feat: relatórios e exportação CSV"

### Fase 7 — Polimento e UX [PENDENTE]
- Animações de transição entre seções
- Toast notifications para ações (salvar, excluir, erro)
- Modal de confirmação ao excluir
- Indicadores visuais (badges de status coloridos)
- Responsividade mobile (menu hambúrguer, cards empilhados)
- Validação completa: abrir no navegador, testar todas as features
- Commit: "feat: polimento e UX"

### Fase 8 — Deploy no GitHub Pages [PENDENTE]
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

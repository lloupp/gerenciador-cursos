# 🎓 Gerenciador de Cursos e Eventos

Aplicação web para organizar eventos e cursos do início ao fim: inscrições, participantes, custos, receitas e fechamento financeiro com lucro/prejuízo.

100% client-side, sem backend. Funciona offline no navegador do celular.

**🔗 Acesse online:** [https://lloupp.github.io/gerenciador-cursos/](https://lloupp.github.io/gerenciador-cursos/)

## Recursos

- 📅 **Cadastro de eventos** — nome, data, local, vagas, preço, descrição, status, categoria
- 👥 **Inscrições** — participantes com status (confirmado, pendente, cancelado) e pagamento
- 💸 **Controle de custos** — despesas por categoria (local, material, palestrante, buffet, equipamentos, marketing, seguro, outros)
- 💰 **Controle de receitas** — inscrições pagas geram receita automaticamente, mais patrocínios, vendas e doações
- 📊 **Dashboard geral** — visão consolidada de todos os eventos com gráficos de pizza e barras
- 📋 **Relatórios** — participantes, financeiro detalhado e consolidado, com exportação CSV
- 🌙 **Tema escuro** nativo
- 📱 **Responsivo** — celular, tablet e desktop
- 🔔 **Toast notifications** e modal de confirmação
- 💾 **Offline-first** — dados salvos no navegador (localStorage)

## Tech Stack

- HTML5 + CSS3 (tema escuro, sem frameworks)
- JavaScript vanilla (ES modules, sem build, sem dependências)
- Canvas API para gráficos
- localStorage para persistência
- Exportação CSV via Blob URL

## Estrutura

```
gerenciador-cursos/
├── index.html           — página principal
├── .nojekyll            — desabilita Jekyll no GitHub Pages
├── css/
│   └── style.css        — estilos + tema escuro + responsividade
├── js/
│   ├── app.js           — lógica principal e navegação entre abas
│   ├── events.js        — cadastro e gestão de eventos
│   ├── registrations.js — inscrições e participantes
│   ├── finance.js       — custos, receitas e dashboard do evento
│   ├── dashboard.js     — dashboard geral consolidado
│   ├── reports.js       — relatórios e exportação CSV
│   ├── ui.js            — toast notifications e modal de confirmação
│   └── utils.js         — formatação e helpers
└── README.md
```

## Como usar

### Online
Acesse: [https://lloupp.github.io/gerenciador-cursos/](https://lloupp.github.io/gerenciador-cursos/)

### Local
Abra `index.html` no navegador. Pronto.

## Licença

MIT

# 🎓 Gerenciador de Cursos e Eventos

Aplicação web para organizar eventos e cursos do início ao fim: inscrições, participantes, custos, receitas e fechamento financeiro com lucro/prejuízo.

100% client-side, sem backend. Funciona offline no navegador do celular.

## Recursos

- 📅 **Cadastro de eventos** — nome, data, local, vagas, preço, descrição
- 👥 **Inscrições** — participantes com status (confirmado, pendente, cancelado) e pagamento
- 💸 **Controle de custos** — despesas por categoria (local, material, palestrante, buffet, outros)
- 💰 **Controle de receitas** — inscrições pagas, patrocínios, vendas extras
- 📊 **Dashboard financeiro** — receitas x despesas = lucro/prejuízo por evento
- 📋 **Relatórios** — lista de participantes, resumo financeiro, exportação CSV
- 💾 **Offline-first** — dados salvos no navegador (localStorage)
- 🌙 **Tema escuro** nativo
- 📱 **Responsivo** — celular, tablet e desktop

## Tech Stack

- HTML5 + CSS3 (tema escuro, sem frameworks)
- JavaScript vanilla (sem build, sem dependências)
- Canvas API para gráficos
- localStorage para persistência
- Exportação CSV/PDF

## Estrutura

```
gerenciador-cursos/
├── index.html           — página principal
├── css/
│   └── style.css        — estilos + tema escuro
├── js/
│   ├── app.js           — lógica principal e navegação
│   ├── events.js        — cadastro e gestão de eventos
│   ├── registrations.js — inscrições e participantes
│   ├── finance.js       — custos, receitas e dashboard
│   ├── reports.js       — relatórios e exportação
│   └── utils.js         — formatação e helpers
└── README.md
```

## Como usar

Abra `index.html` no navegador. Pronto.

## Licença

MIT

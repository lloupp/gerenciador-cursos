// finance.js — Controle financeiro: transações, dashboard e gráficos
import { loadFromStorage, saveToStorage, generateId, formatCurrency, formatDate } from './utils.js';
import { escapeHTML } from './events.js';

// ===== Estado =====
let transactions = [];
let events = [];
let registrations = [];
let filterEventId = '';
let editingId = null;
let showForm = false;

// ===== Categorias =====
const EXPENSE_CATEGORIES = [
  { value: 'local', label: 'Local' },
  { value: 'material', label: 'Material' },
  { value: 'palestrante', label: 'Palestrante' },
  { value: 'buffet', label: 'Buffet' },
  { value: 'equipamentos', label: 'Equipamentos' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'outros', label: 'Outros' },
];

const INCOME_CATEGORIES = [
  { value: 'inscricao', label: 'Inscrição' },
  { value: 'patrocinio', label: 'Patrocínio' },
  { value: 'venda', label: 'Venda' },
  { value: 'doacao', label: 'Doação' },
  { value: 'outros', label: 'Outros' },
];

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

// ===== Inicialização =====
export function initFinance() {
  transactions = loadFromStorage('transactions', []);
  events = loadFromStorage('events', []);
  registrations = loadFromStorage('registrations', []);
  filterEventId = '';
  editingId = null;
  showForm = false;
}

export function getTransactions() {
  return transactions;
}

// ===== Renderização principal =====
export function renderFinanceTab() {
  events = loadFromStorage('events', []);
  registrations = loadFromStorage('registrations', []);

  if (showForm) {
    return renderTransactionForm();
  }

  if (events.length === 0) {
    return renderEmptyState(
      '💸',
      'Nenhum dado financeiro disponível',
      'Cadastre eventos e inscrições para visualizar o controle financeiro. Receitas, despesas e lucro por evento aparecerão aqui.'
    );
  }

  return renderFinanceOverview();
}

// ===== Renderização: overview (dashboard) =====
function renderFinanceOverview() {
  // Sincroniza receitas automáticas de inscrições pagas
  syncAutoIncomes();

  const summary = calcSummary();

  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">Financeiro</h2>
        <p class="section-description">Receitas, despesas e lucro por evento</p>
      </div>
      <button class="btn btn-primary" id="btn-new-transaction">+ Nova Transação</button>
    </div>

    <!-- Filtro por evento -->
    <div class="filters-bar">
      <select class="select" id="finance-filter-event" aria-label="Filtrar por evento">
        <option value="">Todos os eventos</option>
        ${events.map(ev => `<option value="${ev.id}" ${filterEventId === ev.id ? 'selected' : ''}>${escapeHTML(ev.name)}</option>`).join('')}
      </select>
    </div>

    <!-- Cards de resumo -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-label">💰 Receita Total</div>
        <div class="stat-card-value positive">${formatCurrency(summary.totalIncome)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">💸 Despesa Total</div>
        <div class="stat-card-value negative">${formatCurrency(summary.totalExpense)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">📈 Lucro/Prejuízo</div>
        <div class="stat-card-value ${summary.profit >= 0 ? 'positive' : 'negative'}">${formatCurrency(summary.profit)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">📊 Margem</div>
        <div class="stat-card-value">${summary.margin.toFixed(1)}%</div>
      </div>
    </div>

    <!-- Gráfico de barras -->
    <div class="card" style="margin-bottom:1.5rem">
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:1rem">📊 Receitas x Despesas por Evento</h3>
      <canvas id="finance-chart" width="800" height="300" style="width:100%;max-width:100%;height:auto"></canvas>
    </div>

    <!-- Lista de eventos com detalhes -->
    <div class="card" style="margin-bottom:1.5rem">
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:1rem">📋 Resumo por Evento</h3>
      <div class="table-container" style="border:none">
        <table>
          <thead>
            <tr>
              <th>Evento</th>
              <th style="text-align:right">Receitas</th>
              <th style="text-align:right">Despesas</th>
              <th style="text-align:right">Lucro/Prejuízo</th>
            </tr>
          </thead>
          <tbody>
            ${renderEventSummaryRows()}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Lista de transações -->
    <div class="card">
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:1rem">📒 Transações${filterEventId ? ` — ${escapeHTML(events.find(e => e.id === filterEventId)?.name || '')}` : ''}</h3>
      ${renderTransactionsTable()}
    </div>
  `;
}

// ===== Renderização: tabela de resumo por evento =====
function renderEventSummaryRows() {
  const eventList = filterEventId ? events.filter(e => e.id === filterEventId) : events;
  if (eventList.length === 0) {
    return `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:1.5rem">Nenhum evento</td></tr>`;
  }
  return eventList.map(ev => {
    const s = calcEventSummary(ev.id);
    return `
      <tr>
        <td style="font-weight:500">${escapeHTML(ev.name)}</td>
        <td style="text-align:right;color:var(--green)">${formatCurrency(s.income)}</td>
        <td style="text-align:right;color:var(--red)">${formatCurrency(s.expense)}</td>
        <td style="text-align:right;font-weight:600;color:${s.profit >= 0 ? 'var(--green)' : 'var(--red)'}">${formatCurrency(s.profit)}</td>
      </tr>
    `;
  }).join('');
}

// ===== Renderização: tabela de transações =====
function renderTransactionsTable() {
  const filtered = getFilteredTransactions();
  if (filtered.length === 0) {
    return `<p style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding:1.5rem">Nenhuma transação registrada.${filterEventId ? ' Tente remover o filtro ou criar uma transação.' : ''}</p>`;
  }
  return `
    <div class="table-container" style="border:none">
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Categoria</th>
            <th>Descrição</th>
            <th>Evento</th>
            <th>Data</th>
            <th style="text-align:right">Valor</th>
            <th style="text-align:right">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(renderTransactionRow).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderTransactionRow(t) {
  const ev = events.find(e => e.id === t.eventId);
  const evName = ev ? escapeHTML(ev.name) : '<span class="badge badge-muted">Evento removido</span>';
  const catLabel = ALL_CATEGORIES.find(c => c.value === t.category)?.label || t.category;
  const isAuto = t.autoGenerated;
  return `
    <tr>
      <td><span class="badge ${t.type === 'receita' ? 'badge-success' : 'badge-danger'}">${t.type === 'receita' ? 'Receita' : 'Despesa'}</span>${isAuto ? ' <span class="badge badge-muted" style="font-size:0.65rem">auto</span>' : ''}</td>
      <td>${escapeHTML(catLabel)}</td>
      <td>${escapeHTML(t.description || '—')}</td>
      <td style="font-size:0.85rem">${evName}</td>
      <td style="font-size:0.85rem;color:var(--text-secondary)">${formatDate(t.date)}</td>
      <td style="text-align:right;font-weight:600;color:${t.type === 'receita' ? 'var(--green)' : 'var(--red)'}">${t.type === 'receita' ? '+' : '-'}${formatCurrency(t.amount)}</td>
      <td style="text-align:right;white-space:nowrap">
        ${isAuto ? '<span style="color:var(--text-muted);font-size:0.8rem">—</span>' : `
          <button class="btn btn-sm" data-action="edit-tx" data-id="${t.id}">✏️</button>
          <button class="btn btn-sm btn-danger" data-action="delete-tx" data-id="${t.id}">🗑️</button>
        `}
      </td>
    </tr>
  `;
}

// ===== Renderização: formulário de transação =====
function renderTransactionForm() {
  const tx = editingId ? transactions.find(t => t.id === editingId) : null;
  const isEdit = !!tx;
  const title = isEdit ? 'Editar Transação' : 'Nova Transação';
  const currentType = tx ? tx.type : 'despesa';

  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">${title}</h2>
        <p class="section-description">${isEdit ? 'Altere os dados da transação' : 'Registre uma receita ou despesa'}</p>
      </div>
    </div>
    <div class="card" style="max-width:720px">
      <form id="tx-form" autocomplete="off">
        <div class="form-row">
          <div class="form-group">
            <label for="tx-type">Tipo *</label>
            <select id="tx-type" class="select">
              <option value="despesa" ${currentType === 'despesa' ? 'selected' : ''}>Despesa</option>
              <option value="receita" ${currentType === 'receita' ? 'selected' : ''}>Receita</option>
            </select>
          </div>
          <div class="form-group">
            <label for="tx-event">Evento *</label>
            <select id="tx-event" class="select" required>
              <option value="">Selecione um evento</option>
              ${events.map(ev => `<option value="${ev.id}" ${tx && tx.eventId === ev.id ? 'selected' : (filterEventId === ev.id ? 'selected' : '')}>${escapeHTML(ev.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="tx-category">Categoria *</label>
            <select id="tx-category" class="select">
              ${currentType === 'receita'
                ? INCOME_CATEGORIES.map(c => `<option value="${c.value}" ${tx && tx.category === c.value ? 'selected' : ''}>${c.label}</option>`).join('')
                : EXPENSE_CATEGORIES.map(c => `<option value="${c.value}" ${tx && tx.category === c.value ? 'selected' : ''}>${c.label}</option>`).join('')
              }
            </select>
          </div>
          <div class="form-group">
            <label for="tx-amount">Valor (R$) *</label>
            <input type="number" id="tx-amount" class="input" min="0" step="0.01" required
              value="${tx ? tx.amount : ''}" placeholder="0.00">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="tx-date">Data *</label>
            <input type="date" id="tx-date" class="input" required value="${tx ? (tx.date || '').split('T')[0] : new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group" id="tx-payee-group">
            <label for="tx-payee">Fornecedor / Beneficiário</label>
            <input type="text" id="tx-payee" class="input" maxlength="200"
              value="${tx ? escapeHTML(tx.payee || '') : ''}" placeholder="Nome do fornecedor (opcional)">
          </div>
        </div>
        <div class="form-group">
          <label for="tx-description">Descrição</label>
          <textarea id="tx-description" class="textarea" maxlength="500"
            placeholder="Descrição da transação">${tx ? escapeHTML(tx.description || '') : ''}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn" id="btn-cancel-tx">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alterações' : 'Registrar Transação'}</button>
        </div>
      </form>
    </div>
  `;
}

// ===== Empty state =====
function renderEmptyState(icon, title, description) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <h2 class="empty-title">${escapeHTML(title)}</h2>
      <p class="empty-description">${escapeHTML(description)}</p>
    </div>
  `;
}

// ===== Cálculos =====
function calcEventSummary(eventId) {
  const txs = transactions.filter(t => t.eventId === eventId);
  let income = 0, expense = 0;
  for (const t of txs) {
    if (t.type === 'receita') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, profit: income - expense };
}

function calcSummary() {
  let totalIncome = 0, totalExpense = 0;
  const eventList = filterEventId ? events.filter(e => e.id === filterEventId) : events;
  for (const ev of eventList) {
    const s = calcEventSummary(ev.id);
    totalIncome += s.income;
    totalExpense += s.expense;
  }
  const profit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
  return { totalIncome, totalExpense, profit, margin };
}

// ===== Sincroniza receitas automáticas de inscrições pagas =====
function syncAutoIncomes() {
  let changed = false;

  // 1. Remove receitas automáticas de inscrições que não são mais pagas
  transactions = transactions.filter(t => {
    if (!t.autoGenerated) return true;
    const reg = registrations.find(r => r.id === t.registrationId);
    // Remove se inscrição não existe mais, não está paga, ou foi cancelada
    if (!reg || reg.paymentStatus !== 'pago' || reg.status === 'cancelado') {
      changed = true;
      return false;
    }
    return true;
  });

  // 2. Adiciona/atualiza receitas automáticas para inscrições pagas
  for (const reg of registrations) {
    if (reg.paymentStatus !== 'pago' || reg.status === 'cancelado') continue;

    const ev = events.find(e => e.id === reg.eventId);
    if (!ev) continue;

    const amount = ev.price || 0;
    if (amount <= 0) continue;

    // Procura transação automática existente para esta inscrição
    const existingIdx = transactions.findIndex(
      t => t.autoGenerated && t.registrationId === reg.id
    );

    if (existingIdx !== -1) {
      // Atualiza valor se mudou
      if (transactions[existingIdx].amount !== amount) {
        transactions[existingIdx].amount = amount;
        transactions[existingIdx].date = reg.paidAt || reg.registeredAt;
        changed = true;
      }
    } else {
      // Cria nova
      transactions.push({
        id: generateId(),
        eventId: reg.eventId,
        registrationId: reg.id,
        type: 'receita',
        category: 'inscricao',
        description: `Inscrição de ${reg.participantName}`,
        amount: amount,
        date: reg.paidAt || reg.registeredAt,
        autoGenerated: true,
        payee: reg.participantName || null,
        paidTo: null,
      });
      changed = true;
    }
  }

  if (changed) {
    saveToStorage('transactions', transactions);
  }
}

// ===== Filtragem =====
function getFilteredTransactions() {
  return transactions
    .filter(t => !filterEventId || t.eventId === filterEventId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ===== Event listeners =====
export function attachFinanceListeners() {
  // Botão nova transação
  const btnNew = document.getElementById('btn-new-transaction');
  if (btnNew) btnNew.addEventListener('click', () => {
    showForm = true;
    editingId = null;
    renderFinanceTabAndAttach();
  });

  // Filtro de evento
  const filterSelect = document.getElementById('finance-filter-event');
  if (filterSelect) filterSelect.addEventListener('change', (e) => {
    filterEventId = e.target.value;
    renderFinanceTabAndAttach();
  });

  // Botões editar e excluir transação
  document.querySelectorAll('[data-action="edit-tx"]').forEach(btn => {
    btn.addEventListener('click', () => {
      editingId = btn.dataset.id;
      showForm = true;
      renderFinanceTabAndAttach();
    });
  });
  document.querySelectorAll('[data-action="delete-tx"]').forEach(btn => {
    btn.addEventListener('click', () => {
      handleDeleteTransaction(btn.dataset.id);
    });
  });

  // Formulário
  const form = document.getElementById('tx-form');
  if (form) {
    form.addEventListener('submit', handleSubmitTransaction);

    // Toggle categorias ao mudar tipo
    const typeSelect = document.getElementById('tx-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        updateCategoryOptions(e.target.value);
      });
    }
  }

  // Botão cancelar
  const btnCancel = document.getElementById('btn-cancel-tx');
  if (btnCancel) btnCancel.addEventListener('click', () => {
    showForm = false;
    editingId = null;
    renderFinanceTabAndAttach();
  });

  // Desenha gráfico após render
  requestAnimationFrame(drawChart);
}

// ===== Atualiza opções de categoria ao trocar tipo =====
function updateCategoryOptions(type) {
  const catSelect = document.getElementById('tx-category');
  if (!catSelect) return;
  const cats = type === 'receita' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  catSelect.innerHTML = cats.map(c => `<option value="${c.value}">${c.label}</option>`).join('');

  // Toggle visibilidade do campo fornecedor (só despesas)
  const payeeGroup = document.getElementById('tx-payee-group');
  if (payeeGroup) {
    payeeGroup.style.display = type === 'despesa' ? '' : 'none';
  }
}

// ===== Re-renderiza e reanexa listeners =====
function renderFinanceTabAndAttach() {
  const container = document.getElementById('tab-content');
  container.innerHTML = renderFinanceTab();
  attachFinanceListeners();
}

// ===== Submissão do formulário =====
function handleSubmitTransaction(e) {
  e.preventDefault();

  const type = document.getElementById('tx-type').value;
  const eventId = document.getElementById('tx-event').value;
  const category = document.getElementById('tx-category').value;
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const date = document.getElementById('tx-date').value;
  const description = document.getElementById('tx-description').value.trim();
  const payee = document.getElementById('tx-payee')?.value.trim() || null;

  // Validação
  if (!eventId) {
    alert('Por favor, selecione um evento.');
    return;
  }
  if (!category) {
    alert('Por favor, selecione uma categoria.');
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    alert('Por favor, informe um valor válido maior que zero.');
    return;
  }
  if (!date) {
    alert('Por favor, informe a data da transação.');
    return;
  }

  const txDate = new Date(date).toISOString();
  const now = new Date().toISOString();

  if (editingId) {
    const idx = transactions.findIndex(t => t.id === editingId);
    if (idx !== -1) {
      transactions[idx] = {
        ...transactions[idx],
        type,
        eventId,
        category,
        amount,
        date: txDate,
        description,
        payee: type === 'despesa' ? payee : null,
        paidTo: null,
      };
    }
  } else {
    transactions.push({
      id: generateId(),
      eventId,
      type,
      category,
      description,
      amount,
      date: txDate,
      autoGenerated: false,
      payee: type === 'despesa' ? payee : null,
      paidTo: null,
    });
  }

  saveToStorage('transactions', transactions);
  showForm = false;
  editingId = null;
  renderFinanceTabAndAttach();
}

// ===== Excluir transação =====
function handleDeleteTransaction(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  if (!confirm(`Deseja realmente excluir esta transação (${tx.type === 'receita' ? 'Receita' : 'Despesa'} — ${formatCurrency(tx.amount)})?`)) return;

  transactions = transactions.filter(t => t.id !== id);
  saveToStorage('transactions', transactions);
  renderFinanceTabAndAttach();
}

// ===== Gráfico de barras: Receitas x Despesas por evento =====
function drawChart() {
  const canvas = document.getElementById('finance-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 300 * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = 300;

  // Limpa
  ctx.clearRect(0, 0, w, h);

  // Eventos a exibir
  const eventList = filterEventId ? events.filter(e => e.id === filterEventId) : events;
  if (eventList.length === 0) {
    ctx.fillStyle = '#5a6373';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhum evento para exibir', w / 2, h / 2);
    return;
  }

  // Calcula dados
  const data = eventList.map(ev => {
    const s = calcEventSummary(ev.id);
    return { name: ev.name, income: s.income, expense: s.expense };
  });

  // Encontra valor máximo
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);

  // Layout
  const padding = { top: 20, right: 20, bottom: 60, left: 80 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const barGroupW = chartW / data.length;
  const barW = Math.min(barGroupW * 0.3, 40);
  const gap = 6;

  // Cores
  const incomeColor = '#22c55e';
  const expenseColor = '#ef4444';
  const textColor = '#8b919e';
  const gridColor = '#1e2535';

  // Desenha eixo Y (linhas de grade)
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.fillStyle = textColor;
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'right';
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartH / gridLines) * i;
    const val = maxVal - (maxVal / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillText(formatCurrencyShort(val), padding.left - 8, y + 4);
  }

  // Desenha barras
  data.forEach((d, i) => {
    const groupX = padding.left + barGroupW * i + barGroupW / 2;

    // Barra de receita (esquerda)
    const incomeH = (d.income / maxVal) * chartH;
    const incomeX = groupX - barW - gap / 2;
    const incomeY = padding.top + chartH - incomeH;
    ctx.fillStyle = incomeColor;
    ctx.fillRect(incomeX, incomeY, barW, incomeH);

    // Barra de despesa (direita)
    const expenseH = (d.expense / maxVal) * chartH;
    const expenseX = groupX + gap / 2;
    const expenseY = padding.top + chartH - expenseH;
    ctx.fillStyle = expenseColor;
    ctx.fillRect(expenseX, expenseY, barW, expenseH);

    // Label do evento (eixo X)
    ctx.fillStyle = textColor;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    const label = d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name;
    ctx.fillText(label, groupX, h - padding.bottom + 18);

    // Valores nas barras (se visível)
    if (incomeH > 15) {
      ctx.fillStyle = incomeColor;
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(formatCurrencyShort(d.income), incomeX + barW / 2, incomeY - 4);
    }
    if (expenseH > 15) {
      ctx.fillStyle = expenseColor;
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(formatCurrencyShort(d.expense), expenseX + barW / 2, expenseY - 4);
    }
  });

  // Legenda
  const legendY = h - 15;
  ctx.font = '12px Inter, sans-serif';
  ctx.textAlign = 'left';

  ctx.fillStyle = incomeColor;
  ctx.fillRect(padding.left, legendY - 2, 12, 12);
  ctx.fillStyle = textColor;
  ctx.fillText('Receitas', padding.left + 16, legendY + 8);

  ctx.fillStyle = expenseColor;
  ctx.fillRect(padding.left + 100, legendY - 2, 12, 12);
  ctx.fillStyle = textColor;
  ctx.fillText('Despesas', padding.left + 116, legendY + 8);
}

function formatCurrencyShort(value) {
  if (value >= 1000) {
    return 'R$ ' + (value / 1000).toFixed(1) + 'k';
  }
  return 'R$ ' + value.toFixed(0);
}

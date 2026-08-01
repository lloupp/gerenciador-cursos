// dashboard.js — Dashboard geral: indicadores consolidados, gráficos (pizza + barras)
import { loadFromStorage, formatCurrency, formatDate } from './utils.js';
import { escapeHTML } from './events.js';

// ===== Estado =====
let events = [];
let registrations = [];
let transactions = [];

// ===== Categorias para o gráfico de pizza =====
const EXPENSE_CATEGORIES = [
  { value: 'local', label: 'Local', color: '#3b82f6' },
  { value: 'material', label: 'Material', color: '#8b5cf6' },
  { value: 'palestrante', label: 'Palestrante', color: '#ec4899' },
  { value: 'buffet', label: 'Buffet', color: '#f59e0b' },
  { value: 'equipamentos', label: 'Equipamentos', color: '#10b981' },
  { value: 'marketing', label: 'Marketing', color: '#06b6d4' },
  { value: 'seguro', label: 'Seguro', color: '#f97316' },
  { value: 'outros', label: 'Outros', color: '#6b7280' },
];

// ===== Inicialização =====
export function initDashboard() {
  events = loadFromStorage('events', []);
  registrations = loadFromStorage('registrations', []);
  transactions = loadFromStorage('transactions', []);
}

// ===== Renderização principal =====
export function renderDashboardTab() {
  // Recarrega dados frescos do localStorage
  events = loadFromStorage('events', []);
  registrations = loadFromStorage('registrations', []);
  transactions = loadFromStorage('transactions', []);

  if (events.length === 0) {
    return renderEmptyState(
      '📊',
      'Nenhum dado para o dashboard',
      'Cadastre eventos, inscrições e transações para visualizar indicadores consolidados de todos os seus eventos.',
    );
  }

  const summary = calcOverallSummary();

  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">Dashboard Geral</h2>
        <p class="section-description">Visão consolidada de todos os eventos</p>
      </div>
    </div>

    <!-- Indicadores principais -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-label">💰 Receita Total</div>
        <div class="stat-card-value positive">${formatCurrency(summary.totalIncome)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">💸 Custo Total</div>
        <div class="stat-card-value negative">${formatCurrency(summary.totalExpense)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">📈 Lucro Total</div>
        <div class="stat-card-value ${summary.totalProfit >= 0 ? 'positive' : 'negative'}">${formatCurrency(summary.totalProfit)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">🎫 Ticket Médio</div>
        <div class="stat-card-value">${formatCurrency(summary.avgTicket)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">📋 Taxa de Ocupação</div>
        <div class="stat-card-value">${summary.occupancyRate.toFixed(1)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">👥 Inscritos</div>
        <div class="stat-card-value">${summary.totalRegistrations}</div>
      </div>
    </div>

    <!-- Gráficos lado a lado -->
    <div class="dashboard-charts">
      <div class="card dashboard-chart-card">
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:1rem">🍰 Distribuição de Custos por Categoria</h3>
        <canvas id="dashboard-pie-chart" width="400" height="300" style="width:100%;max-width:100%;height:auto"></canvas>
        <div id="pie-legend" class="chart-legend"></div>
      </div>
      <div class="card dashboard-chart-card">
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:1rem">📊 Receitas x Despesas por Evento</h3>
        <canvas id="dashboard-bar-chart" width="500" height="300" style="width:100%;max-width:100%;height:auto"></canvas>
      </div>
    </div>

    <!-- Cards de eventos -->
    <div class="section-header" style="margin-top:2rem">
      <div>
        <h3 style="font-size:1.1rem;font-weight:600">📋 Resumo por Evento</h3>
        <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:0.25rem">${events.length} evento${events.length > 1 ? 's' : ''}</p>
      </div>
    </div>
    <div class="card-grid">
      ${events.map(ev => eventSummaryCard(ev)).join('')}
    </div>
  `;
}

// ===== Card de resumo por evento =====
function eventSummaryCard(ev) {
  const s = calcEventSummary(ev.id);
  const regs = registrations.filter(r => r.eventId === ev.id && r.status !== 'cancelado');
  const capacity = ev.capacity || 0;
  const occRate = capacity > 0 ? Math.min((regs.length / capacity) * 100, 100) : 0;
  const margin = s.income > 0 ? ((s.profit / s.income) * 100) : 0;

  const typeLabel = { curso: 'Curso', evento: 'Evento', workshop: 'Workshop' }[ev.type] || ev.type;
  const statusLabel = { rascunho: 'Rascunho', aberto: 'Aberto', fechado: 'Fechado', concluido: 'Concluido', cancelado: 'Cancelado' }[ev.status] || ev.status;
  const statusClass = { aberto: 'badge-success', rascunho: 'badge-muted', fechado: 'badge-warning', concluido: 'badge-info', cancelado: 'badge-danger' }[ev.status] || 'badge-muted';

  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem">
        <h3 style="font-size:1rem;font-weight:600;flex:1">${escapeHTML(ev.name)}</h3>
        <span class="badge ${statusClass}">${escapeHTML(statusLabel)}</span>
      </div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.75rem">
        <span class="badge badge-purple" style="text-transform:none">${escapeHTML(typeLabel)}</span>
        <span>📅 ${formatDate(ev.date)}</span>
        ${ev.location ? `<span>📍 ${escapeHTML(ev.location)}</span>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;font-size:0.825rem;margin-bottom:0.75rem">
        <div>
          <span style="color:var(--text-secondary)">Receita:</span>
          <span style="color:var(--green);font-weight:600">${formatCurrency(s.income)}</span>
        </div>
        <div>
          <span style="color:var(--text-secondary)">Despesa:</span>
          <span style="color:var(--red);font-weight:600">${formatCurrency(s.expense)}</span>
        </div>
        <div>
          <span style="color:var(--text-secondary)">Lucro:</span>
          <span style="font-weight:600;color:${s.profit >= 0 ? 'var(--green)' : 'var(--red)'}">${formatCurrency(s.profit)}</span>
        </div>
        <div>
          <span style="color:var(--text-secondary)">Margem:</span>
          <span style="font-weight:600">${margin.toFixed(1)}%</span>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.825rem;color:var(--text-secondary)">
        <span>Ocupação: ${regs.length}${capacity > 0 ? '/' + capacity : ''} (${occRate.toFixed(0)}%)</span>
        <div style="background:var(--bg-input);border-radius:100px;height:6px;width:80px;overflow:hidden">
          <div style="background:${occRate >= 100 ? 'var(--red)' : 'var(--accent)'};height:100%;width:${Math.min(occRate, 100)}%;border-radius:100px"></div>
        </div>
      </div>
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

function calcOverallSummary() {
  let totalIncome = 0, totalExpense = 0;
  let totalRegs = 0;
  let totalCapacity = 0;
  let paidRegs = 0;

  for (const ev of events) {
    const s = calcEventSummary(ev.id);
    totalIncome += s.income;
    totalExpense += s.expense;

    const activeRegs = registrations.filter(r => r.eventId === ev.id && r.status !== 'cancelado');
    totalRegs += activeRegs.length;

    if (ev.capacity && ev.capacity > 0) {
      totalCapacity += ev.capacity;
    }

    paidRegs += activeRegs.filter(r => r.paymentStatus === 'pago').length;
  }

  const totalProfit = totalIncome - totalExpense;
  const avgTicket = paidRegs > 0 ? totalIncome / paidRegs : 0;
  const occupancyRate = totalCapacity > 0 ? (totalRegs / totalCapacity) * 100 : 0;

  return {
    totalIncome,
    totalExpense,
    totalProfit,
    avgTicket,
    occupancyRate,
    totalRegistrations: totalRegs,
  };
}

// ===== Event listeners =====
export function attachDashboardListeners() {
  // Desenha gráficos após render (requestAnimationFrame para garantir layout computado)
  requestAnimationFrame(() => {
    drawPieChart();
    drawBarChart();
  });
}

// ===== Re-renderiza e reanexa listeners =====
export function renderDashboardTabAndAttach() {
  const container = document.getElementById('tab-content');
  container.innerHTML = renderDashboardTab();
  attachDashboardListeners();
}

// ===== Gráfico de pizza: Distribuição de custos por categoria =====
function drawPieChart() {
  const canvas = document.getElementById('dashboard-pie-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 300 * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = 300;

  ctx.clearRect(0, 0, w, h);

  // Calcula despesas por categoria
  const expenseTxs = transactions.filter(t => t.type === 'despesa');
  const byCategory = {};
  for (const t of expenseTxs) {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  }

  // Monta dados para o gráfico
  const pieData = EXPENSE_CATEGORIES
    .map(cat => ({ ...cat, amount: byCategory[cat.value] || 0 }))
    .filter(d => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  if (pieData.length === 0) {
    ctx.fillStyle = '#5a6373';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhuma despesa registrada', w / 2, h / 2);
    // Renderiza legenda vazia
    const legendDiv = document.getElementById('pie-legend');
    if (legendDiv) legendDiv.innerHTML = '';
    return;
  }

  const total = pieData.reduce((sum, d) => sum + d.amount, 0);

  // Desenha pizza
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) / 2 - 20;
  let startAngle = -Math.PI / 2;

  for (const d of pieData) {
    const sliceAngle = (d.amount / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = d.color;
    ctx.fill();
    ctx.strokeStyle = '#0a0e17';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label percentual se a fatia for grande o suficiente
    const pct = (d.amount / total) * 100;
    if (pct >= 8) {
      const midAngle = startAngle + sliceAngle / 2;
      const labelX = cx + Math.cos(midAngle) * radius * 0.65;
      const labelY = cy + Math.sin(midAngle) * radius * 0.65;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pct.toFixed(0) + '%', labelX, labelY);
    }

    startAngle = endAngle;
  }

  // Renderiza legenda HTML
  const legendDiv = document.getElementById('pie-legend');
  if (legendDiv) {
    legendDiv.innerHTML = pieData.map(d => {
      const pct = ((d.amount / total) * 100).toFixed(1);
      return `
        <div class="legend-item">
          <span class="legend-color" style="background:${d.color}"></span>
          <span class="legend-label">${escapeHTML(d.label)}</span>
          <span class="legend-value">${formatCurrency(d.amount)}</span>
          <span class="legend-pct">${pct}%</span>
        </div>
      `;
    }).join('');
  }
}

// ===== Gráfico de barras: Receitas x Despesas por evento =====
function drawBarChart() {
  const canvas = document.getElementById('dashboard-bar-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 300 * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = 300;

  ctx.clearRect(0, 0, w, h);

  if (events.length === 0) {
    ctx.fillStyle = '#5a6373';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhum evento para exibir', w / 2, h / 2);
    return;
  }

  // Calcula dados
  const data = events.map(ev => {
    const s = calcEventSummary(ev.id);
    return { name: ev.name, income: s.income, expense: s.expense };
  });

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);

  // Layout
  const padding = { top: 20, right: 20, bottom: 60, left: 80 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const barGroupW = chartW / data.length;
  const barW = Math.min(barGroupW * 0.3, 40);
  const gap = 6;

  const incomeColor = '#22c55e';
  const expenseColor = '#ef4444';
  const textColor = '#8b919e';
  const gridColor = '#1e2535';

  // Eixo Y (linhas de grade)
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

  // Barras
  data.forEach((d, i) => {
    const groupX = padding.left + barGroupW * i + barGroupW / 2;

    const incomeH = (d.income / maxVal) * chartH;
    const incomeX = groupX - barW - gap / 2;
    const incomeY = padding.top + chartH - incomeH;
    ctx.fillStyle = incomeColor;
    ctx.fillRect(incomeX, incomeY, Math.max(barW, 1), Math.max(incomeH, 0));

    const expenseH = (d.expense / maxVal) * chartH;
    const expenseX = groupX + gap / 2;
    const expenseY = padding.top + chartH - expenseH;
    ctx.fillStyle = expenseColor;
    ctx.fillRect(expenseX, expenseY, Math.max(barW, 1), Math.max(expenseH, 0));

    // Label do evento
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

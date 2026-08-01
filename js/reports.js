// reports.js — Relatórios de participantes, financeiro e consolidado + exportação CSV
import { loadFromStorage, formatCurrency, formatDate } from './utils.js';
import { escapeHTML } from './events.js';

// ===== Estado =====
let events = [];
let registrations = [];
let transactions = [];
let activeReport = 'participants'; // 'participants' | 'financial' | 'consolidated'
let filterEventId = '';
let filterStatus = '';
let filterPayment = '';

// ===== Constantes =====
const REG_STATUS_LABELS = {
  confirmado: 'Confirmado',
  pendente: 'Pendente',
  cancelado: 'Cancelado',
};

const PAYMENT_STATUS_LABELS = {
  pago: 'Pago',
  pendente: 'Pendente',
  gratuito: 'Gratuito',
};

const PAYMENT_METHOD_LABELS = {
  pix: 'PIX',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferência',
};

const EVENT_STATUS_LABELS = {
  rascunho: 'Rascunho',
  aberto: 'Aberto',
  fechado: 'Fechado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const CATEGORY_LABELS = {
  inscricao: 'Inscrição',
  patrocinio: 'Patrocínio',
  venda: 'Venda',
  doacao: 'Doação',
  local: 'Local',
  material: 'Material',
  palestrante: 'Palestrante',
  buffet: 'Buffet',
  equipamentos: 'Equipamentos',
  marketing: 'Marketing',
  seguro: 'Seguro',
  outros: 'Outros',
};

// ===== Inicialização =====
export function initReports() {
  events = loadFromStorage('events', []);
  registrations = loadFromStorage('registrations', []);
  transactions = loadFromStorage('transactions', []);
  activeReport = 'participants';
  filterEventId = '';
  filterStatus = '';
  filterPayment = '';
}

// ===== Renderização principal =====
export function renderReportsTab() {
  // Recarrega dados frescos
  events = loadFromStorage('events', []);
  registrations = loadFromStorage('registrations', []);
  transactions = loadFromStorage('transactions', []);

  if (events.length === 0 && registrations.length === 0 && transactions.length === 0) {
    return renderEmptyState(
      '📊',
      'Nenhum dado para relatórios',
      'Cadastre eventos, inscrições e transações para gerar relatórios de participantes e financeiros com exportação em CSV.',
    );
  }

  // Selector de tipo de relatório
  const reportTabs = `
    <div class="reports-tabs-bar">
      <button class="btn ${activeReport === 'participants' ? 'btn-primary' : ''}" data-report="participants">👥 Participantes</button>
      <button class="btn ${activeReport === 'financial' ? 'btn-primary' : ''}" data-report="financial">💵 Financeiro</button>
      <button class="btn ${activeReport === 'consolidated' ? 'btn-primary' : ''}" data-report="consolidated">📦 Consolidado</button>
    </div>
  `;

  let reportContent = '';
  if (activeReport === 'participants') {
    reportContent = renderParticipantsReport();
  } else if (activeReport === 'financial') {
    reportContent = renderFinancialReport();
  } else {
    reportContent = renderConsolidatedReport();
  }

  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">Relatórios</h2>
        <p class="section-description">Participantes, financeiro e exportação</p>
      </div>
    </div>
    ${reportTabs}
    <div class="report-content-wrap" style="margin-top:1.5rem">
      ${reportContent}
    </div>
  `;
}

// ===== Relatório de Participantes =====
function renderParticipantsReport() {
  const filtered = getFilteredRegistrations();
  const totalExhibited = filtered.length;

  return `
    <div class="card" style="margin-bottom:1.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;margin-bottom:1rem">
        <h3 style="font-size:1rem;font-weight:600">📋 Relatório de Participantes</h3>
        <button class="btn btn-primary btn-sm" id="btn-export-participants-csv">📥 Exportar CSV</button>
      </div>
      <div class="filters-bar">
        <select class="select" id="report-filter-event" aria-label="Filtrar por evento">
          <option value="">Todos os eventos</option>
          ${events.map(ev => `<option value="${ev.id}" ${filterEventId === ev.id ? 'selected' : ''}>${escapeHTML(ev.name)}</option>`).join('')}
        </select>
        <select class="select" id="report-filter-status" aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          <option value="confirmado" ${filterStatus === 'confirmado' ? 'selected' : ''}>Confirmado</option>
          <option value="pendente" ${filterStatus === 'pendente' ? 'selected' : ''}>Pendente</option>
          <option value="cancelado" ${filterStatus === 'cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
        <select class="select" id="report-filter-payment" aria-label="Filtrar por pagamento">
          <option value="">Todos os pagamentos</option>
          <option value="pago" ${filterPayment === 'pago' ? 'selected' : ''}>Pago</option>
          <option value="pendente" ${filterPayment === 'pendente' ? 'selected' : ''}>Pendente</option>
          <option value="gratuito" ${filterPayment === 'gratuito' ? 'selected' : ''}>Gratuito</option>
        </select>
      </div>
      <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:1rem">
        ${totalExhibited} inscriç${totalExhibited === 1 ? 'ão' : 'ões'} encontrada${totalExhibited === 1 ? '' : 's'}
      </p>
      ${totalExhibited === 0 ? `
        <p style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding:2rem 1rem">Nenhuma inscrição corresponde aos filtros.</p>
      ` : `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Participante</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Evento</th>
                <th>Status</th>
                <th>Pagamento</th>
                <th>Forma</th>
                <th>Inscrição</th>
                <th>Pago em</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((reg, i) => {
                const ev = events.find(e => e.id === reg.eventId);
                const evName = ev ? escapeHTML(ev.name) : '<span class="badge badge-muted">Removido</span>';
                const statusClass = { confirmado: 'badge-success', pendente: 'badge-warning', cancelado: 'badge-danger' }[reg.status] || 'badge-muted';
                const payClass = { pago: 'badge-success', pendente: 'badge-warning', gratuito: 'badge-info' }[reg.paymentStatus] || 'badge-muted';
                return `
                  <tr>
                    <td style="color:var(--text-muted);font-size:0.8rem">${i + 1}</td>
                    <td style="font-weight:500">${escapeHTML(reg.participantName)}</td>
                    <td style="color:var(--text-secondary);font-size:0.85rem">${escapeHTML(reg.email || '—')}</td>
                    <td style="color:var(--text-secondary);font-size:0.85rem">${escapeHTML(reg.phone || '—')}</td>
                    <td style="font-size:0.85rem">${evName}</td>
                    <td><span class="badge ${statusClass}">${REG_STATUS_LABELS[reg.status] || reg.status}</span></td>
                    <td><span class="badge ${payClass}">${PAYMENT_STATUS_LABELS[reg.paymentStatus] || reg.paymentStatus}</span></td>
                    <td style="font-size:0.85rem;color:var(--text-secondary)">${reg.paymentMethod ? (PAYMENT_METHOD_LABELS[reg.paymentMethod] || reg.paymentMethod) : '—'}</td>
                    <td style="font-size:0.85rem;color:var(--text-secondary)">${formatDate(reg.registeredAt)}</td>
                    <td style="font-size:0.85rem;color:var(--text-secondary)">${reg.paidAt ? formatDate(reg.paidAt) : '—'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

// ===== Relatório Financeiro =====
function renderFinancialReport() {
  const eventList = filterEventId ? events.filter(e => e.id === filterEventId) : events;

  // Calcula totais gerais
  let grandIncome = 0, grandExpense = 0;
  const eventSummaries = eventList.map(ev => {
    const txs = transactions.filter(t => t.eventId === ev.id);
    let income = 0, expense = 0;
    const incomeBreakdown = {};
    const expenseBreakdown = {};
    for (const t of txs) {
      if (t.type === 'receita') {
        income += t.amount;
        incomeBreakdown[t.category] = (incomeBreakdown[t.category] || 0) + t.amount;
      } else {
        expense += t.amount;
        expenseBreakdown[t.category] = (expenseBreakdown[t.category] || 0) + t.amount;
      }
    }
    grandIncome += income;
    grandExpense += expense;
    return { event: ev, income, expense, profit: income - expense, incomeBreakdown, expenseBreakdown, txs };
  });

  const grandProfit = grandIncome - grandExpense;
  const grandMargin = grandIncome > 0 ? (grandProfit / grandIncome) * 100 : 0;

  return `
    <div class="card" style="margin-bottom:1.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;margin-bottom:1rem">
        <h3 style="font-size:1rem;font-weight:600">💵 Relatório Financeiro</h3>
        <button class="btn btn-primary btn-sm" id="btn-export-financial-csv">📥 Exportar CSV</button>
      </div>
      <div class="filters-bar">
        <select class="select" id="report-filter-event-fin" aria-label="Filtrar por evento">
          <option value="">Todos os eventos</option>
          ${events.map(ev => `<option value="${ev.id}" ${filterEventId === ev.id ? 'selected' : ''}>${escapeHTML(ev.name)}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- Totais gerais -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-label">💰 Receita Total</div>
        <div class="stat-card-value positive">${formatCurrency(grandIncome)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">💸 Despesa Total</div>
        <div class="stat-card-value negative">${formatCurrency(grandExpense)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">📈 Lucro/Prejuízo</div>
        <div class="stat-card-value ${grandProfit >= 0 ? 'positive' : 'negative'}">${formatCurrency(grandProfit)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">📊 Margem</div>
        <div class="stat-card-value">${grandMargin.toFixed(1)}%</div>
      </div>
    </div>

    ${eventSummaries.length === 0 ? `
      <div class="card">
        <p style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding:2rem 1rem">Nenhum evento para exibir.</p>
      </div>
    ` : eventSummaries.map(({ event: ev, income, expense, profit, incomeBreakdown, expenseBreakdown, txs }) => {
      const margin = income > 0 ? (profit / income) * 100 : 0;
      const sortedIncome = Object.entries(incomeBreakdown).sort((a, b) => b[1] - a[1]);
      const sortedExpense = Object.entries(expenseBreakdown).sort((a, b) => b[1] - a[1]);

      return `
        <div class="card" style="margin-bottom:1rem">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.75rem">
            <div>
              <h3 style="font-size:1rem;font-weight:600">${escapeHTML(ev.name)}</h3>
              <p style="color:var(--text-secondary);font-size:0.825rem;margin-top:0.25rem">
                ${formatDate(ev.date)} ${ev.location ? '— ' + escapeHTML(ev.location) : ''} ${txs.length} transaç${txs.length === 1 ? 'ão' : 'ões'}
              </p>
            </div>
            <div style="text-align:right">
              <span class="badge ${profit >= 0 ? 'badge-success' : 'badge-danger'}">${profit >= 0 ? 'Lucro' : 'Prejuízo'}: ${formatCurrency(profit)}</span>
            </div>
          </div>

          <!-- Totais do evento -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;margin-bottom:1rem">
            <div style="text-align:center;padding:0.75rem;background:var(--bg-input);border-radius:var(--radius-sm)">
              <div style="font-size:0.75rem;color:var(--text-secondary)">Receitas</div>
              <div style="font-size:1.1rem;font-weight:700;color:var(--green)">${formatCurrency(income)}</div>
            </div>
            <div style="text-align:center;padding:0.75rem;background:var(--bg-input);border-radius:var(--radius-sm)">
              <div style="font-size:0.75rem;color:var(--text-secondary)">Despesas</div>
              <div style="font-size:1.1rem;font-weight:700;color:var(--red)">${formatCurrency(expense)}</div>
            </div>
            <div style="text-align:center;padding:0.75rem;background:var(--bg-input);border-radius:var(--radius-sm)">
              <div style="font-size:0.75rem;color:var(--text-secondary)">Margem</div>
              <div style="font-size:1.1rem;font-weight:700">${margin.toFixed(1)}%</div>
            </div>
          </div>

          <!-- Breakdown por categoria -->
          ${(sortedIncome.length > 0 || sortedExpense.length > 0) ? `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
              ${sortedIncome.length > 0 ? `
                <div>
                  <p style="font-size:0.825rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.03em">Receitas por categoria</p>
                  ${sortedIncome.map(([cat, amount]) => `
                    <div style="display:flex;justify-content:space-between;padding:0.25rem 0;font-size:0.85rem;border-bottom:1px solid var(--border)">
                      <span>${escapeHTML(CATEGORY_LABELS[cat] || cat)}</span>
                      <span style="color:var(--green);font-weight:600">${formatCurrency(amount)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              ${sortedExpense.length > 0 ? `
                <div>
                  <p style="font-size:0.825rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.03em">Despesas por categoria</p>
                  ${sortedExpense.map(([cat, amount]) => `
                    <div style="display:flex;justify-content:space-between;padding:0.25rem 0;font-size:0.85rem;border-bottom:1px solid var(--border)">
                      <span>${escapeHTML(CATEGORY_LABELS[cat] || cat)}</span>
                      <span style="color:var(--red);font-weight:600">${formatCurrency(amount)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- Tabela de transações do evento -->
          ${txs.length > 0 ? `
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Data</th>
                    <th style="text-align:right">Valor</th>
                    <th>Origem</th>
                  </tr>
                </thead>
                <tbody>
                  ${txs.sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => `
                    <tr>
                      <td><span class="badge ${t.type === 'receita' ? 'badge-success' : 'badge-danger'}">${t.type === 'receita' ? 'Receita' : 'Despesa'}</span></td>
                      <td style="font-size:0.85rem">${escapeHTML(CATEGORY_LABELS[t.category] || t.category)}</td>
                      <td style="font-size:0.85rem">${escapeHTML(t.description || '—')}</td>
                      <td style="font-size:0.85rem;color:var(--text-secondary)">${formatDate(t.date)}</td>
                      <td style="text-align:right;font-weight:600;color:${t.type === 'receita' ? 'var(--green)' : 'var(--red)'}">${t.type === 'receita' ? '+' : '-'}${formatCurrency(t.amount)}</td>
                      <td style="font-size:0.8rem">${t.autoGenerated ? '<span class="badge badge-muted">auto</span>' : '<span style="color:var(--text-muted)">manual</span>'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem 0">Nenhuma transação para este evento.</p>'}
        </div>
      `;
    }).join('')}
  `;
}

// ===== Relatório Consolidado =====
function renderConsolidatedReport() {
  let totalIncome = 0, totalExpense = 0, totalRegs = 0, totalCapacity = 0;
  let paidRegs = 0, confirmedRegs = 0;

  const rows = events.map(ev => {
    const txs = transactions.filter(t => t.eventId === ev.id);
    let income = 0, expense = 0;
    for (const t of txs) {
      if (t.type === 'receita') income += t.amount;
      else expense += t.amount;
    }
    const profit = income - expense;
    const margin = income > 0 ? (profit / income) * 100 : 0;

    const activeRegs = registrations.filter(r => r.eventId === ev.id && r.status !== 'cancelado');
    const evPaidRegs = activeRegs.filter(r => r.paymentStatus === 'pago').length;
    const evConfirmedRegs = activeRegs.filter(r => r.status === 'confirmado').length;
    const capacity = ev.capacity || 0;
    const occRate = capacity > 0 ? Math.min((activeRegs.length / capacity) * 100, 100) : 0;
    const ticket = evPaidRegs > 0 ? income / evPaidRegs : 0;

    totalIncome += income;
    totalExpense += expense;
    totalRegs += activeRegs.length;
    totalCapacity += capacity;
    paidRegs += evPaidRegs;
    confirmedRegs += evConfirmedRegs;

    return { ev, income, expense, profit, margin, activeRegs: activeRegs.length, capacity, occRate, evPaidRegs, evConfirmedRegs, ticket };
  });

  const totalProfit = totalIncome - totalExpense;
  const totalMargin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0;
  const totalOccRate = totalCapacity > 0 ? (totalRegs / totalCapacity) * 100 : 0;
  const totalTicket = paidRegs > 0 ? totalIncome / paidRegs : 0;

  return `
    <div class="card" style="margin-bottom:1.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;margin-bottom:1rem">
        <h3 style="font-size:1rem;font-weight:600">📦 Relatório Consolidado</h3>
        <button class="btn btn-primary btn-sm" id="btn-export-consolidated-csv">📥 Exportar CSV</button>
      </div>
    </div>

    <!-- Indicadores globais -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-label">💰 Receita Total</div>
        <div class="stat-card-value positive">${formatCurrency(totalIncome)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">💸 Despesa Total</div>
        <div class="stat-card-value negative">${formatCurrency(totalExpense)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">📈 Lucro Total</div>
        <div class="stat-card-value ${totalProfit >= 0 ? 'positive' : 'negative'}">${formatCurrency(totalProfit)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">📊 Margem Global</div>
        <div class="stat-card-value">${totalMargin.toFixed(1)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">🎫 Ticket Médio</div>
        <div class="stat-card-value">${formatCurrency(totalTicket)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">📋 Taxa Ocupação</div>
        <div class="stat-card-value">${totalOccRate.toFixed(1)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">👥 Inscritos Ativos</div>
        <div class="stat-card-value">${totalRegs}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">✅ Confirmados</div>
        <div class="stat-card-value">${confirmedRegs}</div>
      </div>
    </div>

    <!-- Tabela consolidada -->
    ${events.length === 0 ? `
      <div class="card">
        <p style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding:2rem 1rem">Nenhum evento cadastrado.</p>
      </div>
    ` : `
      <div class="card">
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:1rem">📋 Resumo por Evento</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Data</th>
                <th style="text-align:right">Receitas</th>
                <th style="text-align:right">Despesas</th>
                <th style="text-align:right">Lucro</th>
                <th style="text-align:right">Margem</th>
                <th style="text-align:right">Inscritos</th>
                <th style="text-align:right">Ocupação</th>
                <th style="text-align:right">Ticket</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => {
                const typeLabel = { curso: 'Curso', evento: 'Evento', workshop: 'Workshop' }[row.ev.type] || row.ev.type;
                const statusLabel = EVENT_STATUS_LABELS[row.ev.status] || row.ev.status;
                const statusClass = { aberto: 'badge-success', rascunho: 'badge-muted', fechado: 'badge-warning', concluido: 'badge-info', cancelado: 'badge-danger' }[row.ev.status] || 'badge-muted';
                return `
                  <tr>
                    <td style="font-weight:500">${escapeHTML(row.ev.name)}</td>
                    <td><span class="badge badge-purple">${escapeHTML(typeLabel)}</span></td>
                    <td><span class="badge ${statusClass}">${escapeHTML(statusLabel)}</span></td>
                    <td style="font-size:0.85rem;color:var(--text-secondary)">${formatDate(row.ev.date)}</td>
                    <td style="text-align:right;color:var(--green)">${formatCurrency(row.income)}</td>
                    <td style="text-align:right;color:var(--red)">${formatCurrency(row.expense)}</td>
                    <td style="text-align:right;font-weight:600;color:${row.profit >= 0 ? 'var(--green)' : 'var(--red)'}">${formatCurrency(row.profit)}</td>
                    <td style="text-align:right">${row.margin.toFixed(1)}%</td>
                    <td style="text-align:right">${row.activeRegs}${row.capacity > 0 ? '/' + row.capacity : ''}</td>
                    <td style="text-align:right">${row.occRate.toFixed(0)}%</td>
                    <td style="text-align:right">${formatCurrency(row.ticket)}</td>
                  </tr>
                `;
              }).join('')}
              <!-- Linha de totais -->
              <tr style="border-top:2px solid var(--border-hover);font-weight:700">
                <td>TOTAL</td>
                <td colspan="3" style="color:var(--text-muted)">${events.length} evento${events.length > 1 ? 's' : ''}</td>
                <td style="text-align:right;color:var(--green)">${formatCurrency(totalIncome)}</td>
                <td style="text-align:right;color:var(--red)">${formatCurrency(totalExpense)}</td>
                <td style="text-align:right;color:${totalProfit >= 0 ? 'var(--green)' : 'var(--red)'}">${formatCurrency(totalProfit)}</td>
                <td style="text-align:right">${totalMargin.toFixed(1)}%</td>
                <td style="text-align:right">${totalRegs}${totalCapacity > 0 ? '/' + totalCapacity : ''}</td>
                <td style="text-align:right">${totalOccRate.toFixed(0)}%</td>
                <td style="text-align:right">${formatCurrency(totalTicket)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `}
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

// ===== Filtragem =====
function getFilteredRegistrations() {
  return registrations.filter(r => {
    if (filterEventId && r.eventId !== filterEventId) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterPayment && r.paymentStatus !== filterPayment) return false;
    return true;
  }).sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
}

// ===== Exportação CSV =====
function exportParticipantsCSV() {
  const filtered = getFilteredRegistrations();
  if (filtered.length === 0) {
    alert('Não há participantes para exportar com os filtros atuais.');
    return;
  }

  const headers = ['Participante', 'Email', 'Telefone', 'Evento', 'Status', 'Pagamento', 'Forma de Pagamento', 'Data de Inscrição', 'Data de Pagamento'];

  const rows = filtered.map(reg => {
    const ev = events.find(e => e.id === reg.eventId);
    const evName = ev ? ev.name : 'Evento removido';
    return [
      reg.participantName || '',
      reg.email || '',
      reg.phone || '',
      evName,
      REG_STATUS_LABELS[reg.status] || reg.status,
      PAYMENT_STATUS_LABELS[reg.paymentStatus] || reg.paymentStatus,
      reg.paymentMethod ? (PAYMENT_METHOD_LABELS[reg.paymentMethod] || reg.paymentMethod) : '',
      formatDate(reg.registeredAt),
      reg.paidAt ? formatDate(reg.paidAt) : '',
    ];
  });

  downloadCSV(headers, rows, 'relatorio-participantes');
}

function exportFinancialCSV() {
  const eventList = filterEventId ? events.filter(e => e.id === filterEventId) : events;
  if (eventList.length === 0) {
    alert('Não há eventos para exportar.');
    return;
  }

  const headers = ['Evento', 'Tipo', 'Status', 'Data', 'Categoria', 'Descrição', 'Tipo de Transação', 'Valor', 'Origem'];

  const rows = [];
  for (const ev of eventList) {
    const txs = transactions.filter(t => t.eventId === ev.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const t of txs) {
      rows.push([
        ev.name,
        { curso: 'Curso', evento: 'Evento', workshop: 'Workshop' }[ev.type] || ev.type,
        EVENT_STATUS_LABELS[ev.status] || ev.status,
        formatDate(t.date),
        CATEGORY_LABELS[t.category] || t.category,
        t.description || '',
        t.type === 'receita' ? 'Receita' : 'Despesa',
        t.amount.toFixed(2),
        t.autoGenerated ? 'Automatica' : 'Manual',
      ]);
    }
  }

  if (rows.length === 0) {
    alert('Nenhuma transação encontrada para exportar.');
    return;
  }

  downloadCSV(headers, rows, 'relatorio-financeiro');
}

function exportConsolidatedCSV() {
  if (events.length === 0) {
    alert('Nenhum evento cadastrado para exportar.');
    return;
  }

  const headers = ['Evento', 'Tipo', 'Status', 'Data', 'Local', 'Receitas', 'Despesas', 'Lucro/Prejuizo', 'Margem %', 'Inscritos', 'Capacidade', 'Ocupacao %', 'Ticket Medio'];

  const rows = events.map(ev => {
    const txs = transactions.filter(t => t.eventId === ev.id);
    let income = 0, expense = 0;
    for (const t of txs) {
      if (t.type === 'receita') income += t.amount;
      else expense += t.amount;
    }
    const profit = income - expense;
    const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : '0.0';
    const activeRegs = registrations.filter(r => r.eventId === ev.id && r.status !== 'cancelado');
    const paidRegs = activeRegs.filter(r => r.paymentStatus === 'pago').length;
    const capacity = ev.capacity || 0;
    const occRate = capacity > 0 ? Math.min((activeRegs.length / capacity) * 100, 100).toFixed(1) : '0.0';
    const ticket = paidRegs > 0 ? (income / paidRegs).toFixed(2) : '0.00';

    return [
      ev.name,
      { curso: 'Curso', evento: 'Evento', workshop: 'Workshop' }[ev.type] || ev.type,
      EVENT_STATUS_LABELS[ev.status] || ev.status,
      formatDate(ev.date),
      ev.location || '',
      income.toFixed(2),
      expense.toFixed(2),
      profit.toFixed(2),
      margin,
      activeRegs.length,
      capacity,
      occRate,
      ticket,
    ];
  });

  downloadCSV(headers, rows, 'relatorio-consolidado');
}

function downloadCSV(headers, rows, filename) {
  // Monta o conteúdo CSV com BOM UTF-8 para Excel
  const csvContent = '\uFEFF' + [headers, ...rows]
    .map(row => row.map(cell => {
      // Escape cells: wrap in quotes, escape inner quotes
      const str = String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }).join(','))
    .join('\n');

  // Cria Blob e download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `${filename}-${timestamp}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoga a URL após um pequeno delay para garantir o download
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ===== Event listeners =====
export function attachReportsListeners() {
  // Botões de troca de tipo de relatório
  document.querySelectorAll('[data-report]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeReport = btn.dataset.report;
      // Reset filtros ao trocar de relatório
      filterEventId = '';
      filterStatus = '';
      filterPayment = '';
      renderReportsTabAndAttach();
    });
  });

  // Filtros do relatório de participantes
  const filterEvent = document.getElementById('report-filter-event');
  if (filterEvent) filterEvent.addEventListener('change', (e) => {
    filterEventId = e.target.value;
    renderReportsTabAndAttach();
  });

  const filterStat = document.getElementById('report-filter-status');
  if (filterStat) filterStat.addEventListener('change', (e) => {
    filterStatus = e.target.value;
    renderReportsTabAndAttach();
  });

  const filterPay = document.getElementById('report-filter-payment');
  if (filterPay) filterPay.addEventListener('change', (e) => {
    filterPayment = e.target.value;
    renderReportsTabAndAttach();
  });

  // Filtro do relatório financeiro
  const filterEventFin = document.getElementById('report-filter-event-fin');
  if (filterEventFin) filterEventFin.addEventListener('change', (e) => {
    filterEventId = e.target.value;
    renderReportsTabAndAttach();
  });

  // Botões de exportação CSV
  const btnExportParticipants = document.getElementById('btn-export-participants-csv');
  if (btnExportParticipants) btnExportParticipants.addEventListener('click', exportParticipantsCSV);

  const btnExportFinancial = document.getElementById('btn-export-financial-csv');
  if (btnExportFinancial) btnExportFinancial.addEventListener('click', exportFinancialCSV);

  const btnExportConsolidated = document.getElementById('btn-export-consolidated-csv');
  if (btnExportConsolidated) btnExportConsolidated.addEventListener('click', exportConsolidatedCSV);
}

// ===== Re-renderiza e reanexa listeners =====
function renderReportsTabAndAttach() {
  const container = document.getElementById('tab-content');
  container.innerHTML = renderReportsTab();
  attachReportsListeners();
}

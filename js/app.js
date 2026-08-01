// app.js — Lógica principal e navegação entre telas
import { loadFromStorage, formatDate, formatCurrency } from './utils.js';

// ===== Estado global da aplicação =====
let currentTab = 'events';
let events = [];
let registrations = [];

// ===== Init =====
function init() {
  loadData();
  setupTabs();
  renderTab(currentTab);
}

function loadData() {
  events = loadFromStorage('events', []);
  registrations = loadFromStorage('registrations', []);
}

// ===== Tabs =====
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  currentTab = tab;
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  renderTab(tab);
}

// ===== Renderização por seção =====
function renderTab(tab) {
  const container = document.getElementById('tab-content');
  switch (tab) {
    case 'events':
      container.innerHTML = renderEventsTab();
      break;
    case 'registrations':
      container.innerHTML = renderRegistrationsTab();
      break;
    case 'finance':
      container.innerHTML = renderFinanceTab();
      break;
    case 'reports':
      container.innerHTML = renderReportsTab();
      break;
  }
}

// ===== Eventos =====
function renderEventsTab() {
  if (events.length === 0) {
    return renderEmptyState(
      '📅',
      'Nenhum evento cadastrado',
      'Crie seu primeiro evento para começar a gerenciar inscrições e finanças. Você pode adicionar cursos, workshops ou qualquer tipo de evento.',
      null
    );
  }
  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">Eventos</h2>
        <p class="section-description">${events.length} evento${events.length > 1 ? 's' : ''} cadastrado${events.length > 1 ? 's' : ''}</p>
      </div>
      <button class="btn btn-primary" onclick="alert('Funcionalidade disponível na próxima fase')">+ Novo Evento</button>
    </div>
    <div class="card-grid">
      ${events.map(eventCardHTML).join('')}
    </div>
  `;
}

function eventCardHTML(ev) {
  const totalRegs = registrations.filter(r => r.eventId === ev.id && r.status !== 'cancelado').length;
  const capacityPercent = ev.capacity ? Math.round((totalRegs / ev.capacity) * 100) : 0;
  return `
    <div class="card">
      <h3 style="font-size:1.1rem;font-weight:600;margin-bottom:0.5rem">${escapeHTML(ev.name)}</h3>
      <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:1rem">${escapeHTML(ev.description || 'Sem descrição')}</p>
      <div style="display:flex;gap:1rem;flex-wrap:wrap;font-size:0.825rem;color:var(--text-secondary);margin-bottom:0.75rem">
        <span>📅 ${formatDate(ev.date)}</span>
        ${ev.location ? `<span>📍 ${escapeHTML(ev.location)}</span>` : ''}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:0.85rem;color:var(--text-secondary)">Vagas: ${totalRegs} / ${ev.capacity || '∞'}</span>
        <div style="background:var(--bg-input);border-radius:100px;height:6px;width:80px;overflow:hidden">
          <div style="background:var(--accent);height:100%;width:${Math.min(capacityPercent, 100)}%;border-radius:100px"></div>
        </div>
      </div>
    </div>
  `;
}

// ===== Inscrições =====
function renderRegistrationsTab() {
  if (registrations.length === 0) {
    return renderEmptyState(
      '👥',
      'Nenhuma inscrição registrada',
      'Cadastre participantes para seus eventos. Você pode controlar status de pagamento, confirmar presença e mais.',
      null
    );
  }
  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">Inscrições</h2>
        <p class="section-description">${registrations.length} inscrição${registrations.length > 1 ? 'ões' : ''} registrada${registrations.length > 1 ? 's' : ''}</p>
      </div>
      <button class="btn btn-primary" onclick="alert('Funcionalidade disponível na próxima fase')">+ Nova Inscrição</button>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Participante</th>
            <th>Email</th>
            <th>Evento</th>
            <th>Status</th>
            <th>Pagamento</th>
          </tr>
        </thead>
        <tbody>
          ${registrations.map(reg => {
            const ev = events.find(e => e.id === reg.eventId);
            return `
              <tr>
                <td style="font-weight:500">${escapeHTML(reg.participantName)}</td>
                <td style="color:var(--text-secondary)">${escapeHTML(reg.email)}</td>
                <td>${ev ? escapeHTML(ev.name) : '<span class="badge badge-muted">Evento removido</span>'}</td>
                <td><span class="badge ${statusBadgeClass(reg.status)}">${escapeHTML(reg.status)}</span></td>
                <td><span class="badge ${paymentBadgeClass(reg.paymentStatus)}">${escapeHTML(reg.paymentStatus)}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===== Financeiro =====
function renderFinanceTab() {
  if (events.length === 0) {
    return renderEmptyState(
      '💸',
      'Nenhum dado financeiro disponível',
      'Cadastre eventos e inscrições para visualizar o controle financeiro. Receitas, despesas e lucro por evento aparecerão aqui.',
      null
    );
  }
  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">Financeiro</h2>
        <p class="section-description">Resumo financeiro dos eventos</p>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-label">💰 Receita Total</div>
        <div class="stat-card-value positive">${formatCurrency(0)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">💸 Despesa Total</div>
        <div class="stat-card-value negative">${formatCurrency(0)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">📈 Lucro/Prejuízo</div>
        <div class="stat-card-value">${formatCurrency(0)}</div>
      </div>
    </div>
    <div class="card" style="text-align:center;padding:2.5rem 1.5rem">
      <p style="color:var(--text-muted);font-size:0.9rem">📊 Funcionalidade completa de controle financeiro será implementada na Fase 5</p>
    </div>
  `;
}

// ===== Relatórios =====
function renderReportsTab() {
  if (events.length === 0 && registrations.length === 0) {
    return renderEmptyState(
      '📊',
      'Nenhum dado para relatórios',
      'Cadastre eventos e inscrições para gerar relatórios de participantes e financeiros com exportação em CSV.',
      null
    );
  }
  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">Relatórios</h2>
        <p class="section-description">Participantes, financeiro e exportação</p>
      </div>
    </div>
    <div class="card-grid">
      <div class="card">
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem">📋 Relatório de Participantes</h3>
        <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:1rem">Lista completa de inscritos por evento, com filtros e exportação CSV.</p>
        <button class="btn" onclick="alert('Fase 7')">Ver relatório</button>
      </div>
      <div class="card">
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem">💵 Relatório Financeiro</h3>
        <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:1rem">Detalhamento de receitas e despesas por evento, com exportação CSV.</p>
        <button class="btn" onclick="alert('Fase 7')">Ver relatório</button>
      </div>
      <div class="card">
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem">📦 Relatório Consolidado</h3>
        <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:1rem">Visão geral de todos os eventos em um único relatório.</p>
        <button class="btn" onclick="alert('Fase 7')">Ver relatório</button>
      </div>
    </div>
  `;
}

// ===== Helpers de renderização =====
function renderEmptyState(icon, title, description, _ctaButton) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <h2 class="empty-title">${escapeHTML(title)}</h2>
      <p class="empty-description">${escapeHTML(description)}</p>
    </div>
  `;
}

function statusBadgeClass(status) {
  const map = {
    'confirmado': 'badge-success',
    'pendente': 'badge-warning',
    'cancelado': 'badge-danger',
  };
  return map[status] || 'badge-muted';
}

function paymentBadgeClass(status) {
  const map = {
    'pago': 'badge-success',
    'pendente': 'badge-warning',
    'gratuito': 'badge-info',
  };
  return map[status] || 'badge-muted';
}

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== Boot =====
init();

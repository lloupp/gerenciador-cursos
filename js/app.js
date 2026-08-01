// app.js — Lógica principal e navegação entre telas
import { loadFromStorage, formatDate, formatCurrency } from './utils.js';
import { initEvents, renderEventsTab, attachEventListeners, getEvents, escapeHTML } from './events.js';

// ===== Estado global da aplicação =====
let currentTab = 'events';
let events = [];
let registrations = [];

// ===== Init =====
function init() {
  initEvents();
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
      // Atualiza dados do módulo de eventos
      events = getEvents();
      container.innerHTML = renderEventsTab();
      attachEventListeners();
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

// ===== Boot =====
init();

// app.js — Lógica principal e navegação entre telas
import { loadFromStorage, formatDate, formatCurrency } from './utils.js';
import { initEvents, renderEventsTab, attachEventListeners, getEvents, escapeHTML } from './events.js';
import { initRegistrations, renderRegistrationsTab, attachRegistrationListeners, getRegistrations } from './registrations.js';
import { initFinance, renderFinanceTab, attachFinanceListeners } from './finance.js';

// ===== Estado global da aplicação =====
let currentTab = 'events';
let events = [];

// ===== Init =====
function init() {
  initEvents();
  initRegistrations();
  initFinance();
  loadData();
  setupTabs();
  renderTab(currentTab);
}

function loadData() {
  events = loadFromStorage('events', []);
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
      events = getEvents();
      container.innerHTML = renderRegistrationsTab(events);
      attachRegistrationListeners();
      break;
    case 'finance':
      events = getEvents();
      container.innerHTML = renderFinanceTab();
      attachFinanceListeners();
      break;
    case 'reports':
      container.innerHTML = renderReportsTab();
      break;
  }
}

// ===== Financeiro (implementado em finance.js) =====

// ===== Relatórios =====
function renderReportsTab() {
  const registrations = getRegistrations();
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

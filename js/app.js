// app.js — Lógica principal e navegação entre telas
import { loadFromStorage, formatDate, formatCurrency } from './utils.js';
import { initEvents, renderEventsTab, attachEventListeners, getEvents, escapeHTML } from './events.js';
import { initRegistrations, renderRegistrationsTab, attachRegistrationListeners, getRegistrations } from './registrations.js';
import { initFinance, renderFinanceTab, attachFinanceListeners } from './finance.js';
import { initDashboard, renderDashboardTab, attachDashboardListeners } from './dashboard.js';
import { initReports, renderReportsTab, attachReportsListeners } from './reports.js';

// ===== Estado global da aplicação =====
let currentTab = 'events';
let events = [];

// ===== Init =====
function init() {
  initEvents();
  initRegistrations();
  initFinance();
  initDashboard();
  initReports();
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
    case 'dashboard':
      container.innerHTML = renderDashboardTab();
      attachDashboardListeners();
      break;
    case 'reports':
      container.innerHTML = renderReportsTab();
      attachReportsListeners();
      break;
  }
}

// ===== Financeiro (implementado em finance.js) =====

// ===== Relatórios (implementado em reports.js) =====

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

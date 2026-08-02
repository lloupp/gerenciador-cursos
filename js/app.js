// app.js — Lógica principal e navegação entre telas
import { loadFromStorage, formatDate, formatCurrency } from './utils.js';
import { initEvents, renderEventsTab, attachEventListeners, getEvents, escapeHTML } from './events.js';
import { initRegistrations, renderRegistrationsTab, attachRegistrationListeners, getRegistrations } from './registrations.js';
import { initFinance, renderFinanceTab, attachFinanceListeners } from './finance.js';
import { initDashboard, renderDashboardTab, attachDashboardListeners } from './dashboard.js';
import { initReports, renderReportsTab, attachReportsListeners } from './reports.js';
import { initModal, showToast } from './ui.js';

// Exportar showToast para que os módulos possam usar via import
export { showToast };

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
  initModal();
  setupTabs();
  setupMobileMenu();
  loadData();
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
      // Fecha o menu mobile ao trocar de tab
      closeMobileMenu();
    });
  });
}

function switchTab(tab) {
  if (tab === currentTab) return;
  currentTab = tab;
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  // Adiciona animação de fade ao trocar de aba
  const container = document.getElementById('tab-content');
  container.classList.remove('tab-content-animate');
  // Força reflow para reiniciar a animação
  void container.offsetWidth;
  container.classList.add('tab-content-animate');
  renderTab(tab);
}

// ===== Menu mobile (hambúrguer) =====
function setupMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const nav = document.getElementById('tabs-nav');
    const isOpen = nav.classList.contains('tabs-nav-open');
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });
}

function openMobileMenu() {
  const nav = document.getElementById('tabs-nav');
  const toggle = document.getElementById('menu-toggle');
  if (nav) nav.classList.add('tabs-nav-open');
  if (toggle) {
    toggle.classList.add('menu-toggle-open');
    toggle.setAttribute('aria-expanded', 'true');
  }
}

function closeMobileMenu() {
  const nav = document.getElementById('tabs-nav');
  const toggle = document.getElementById('menu-toggle');
  if (nav) nav.classList.remove('tabs-nav-open');
  if (toggle) {
    toggle.classList.remove('menu-toggle-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
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

// registrations.js — CRUD de inscrições e participantes
import { loadFromStorage, saveToStorage, generateId, formatCurrency, formatDate } from './utils.js';
import { escapeHTML } from './events.js';

// ===== Estado =====
let registrations = [];
let events = [];
let editingId = null;
let showForm = false;
let filterEventId = '';
let filterStatus = '';
let filterPayment = '';

// ===== Constantes =====
const REG_STATUS = [
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'cancelado', label: 'Cancelado' },
];

const PAYMENT_STATUS = [
  { value: 'pago', label: 'Pago' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'gratuito', label: 'Gratuito' },
];

const PAYMENT_METHODS = [
  { value: '', label: '—' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'transferencia', label: 'Transferência' },
];

// ===== Inicialização =====
export function initRegistrations() {
  registrations = loadFromStorage('registrations', []);
  events = loadFromStorage('events', []);
  // Reset filters and form state for each fresh init
  filterEventId = '';
  filterStatus = '';
  filterPayment = '';
  editingId = null;
  showForm = false;
}

export function getRegistrations() {
  return registrations;
}

export function setRegistrations(data) {
  registrations = data;
}

// ===== Renderização principal =====
export function renderRegistrationsTab(eventList) {
  events = eventList || loadFromStorage('events', []);

  if (showForm) {
    return renderRegistrationForm();
  }
  if (registrations.length === 0) {
    return renderEmptyRegistrations();
  }
  return renderRegistrationList();
}

// ===== Renderização: estado vazio =====
function renderEmptyRegistrations() {
  const hasEvents = events.length > 0;
  return `
    <div class="empty-state">
      <div class="empty-icon">👥</div>
      <h2 class="empty-title">Nenhuma inscrição registrada</h2>
      <p class="empty-description">${hasEvents ? 'Cadastre participantes para seus eventos. Controle status de pagamento, confirme presença e mais.' : 'Crie um evento antes de registrar inscrições de participantes.'}</p>
      ${hasEvents ? '<button class="btn btn-primary" id="btn-new-reg-empty">+ Nova Inscrição</button>' : ''}
    </div>
  `;
}

// ===== Renderização: lista de inscrições =====
function renderRegistrationList() {
  const filtered = getFilteredRegistrations();
  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">Inscrições</h2>
        <p class="section-description">${filtered.length} de ${registrations.length} inscrição${registrations.length > 1 ? 'ões' : ''} exibida${filtered.length > 1 ? 's' : ''}</p>
      </div>
      <button class="btn btn-primary" id="btn-new-reg">+ Nova Inscrição</button>
    </div>
    <div class="filters-bar">
      <select class="select" id="filter-event" aria-label="Filtrar por evento">
        <option value="">Todos os eventos</option>
        ${events.map(ev => `<option value="${ev.id}" ${filterEventId === ev.id ? 'selected' : ''}>${escapeHTML(ev.name)}</option>`).join('')}
      </select>
      <select class="select" id="filter-status" aria-label="Filtrar por status">
        <option value="">Todos os status</option>
        ${REG_STATUS.map(s => `<option value="${s.value}" ${filterStatus === s.value ? 'selected' : ''}>${s.label}</option>`).join('')}
      </select>
      <select class="select" id="filter-payment" aria-label="Filtrar por pagamento">
        <option value="">Todos os pagamentos</option>
        ${PAYMENT_STATUS.map(p => `<option value="${p.value}" ${filterPayment === p.value ? 'selected' : ''}>${p.label}</option>`).join('')}
      </select>
    </div>
    ${filtered.length === 0 ? `
      <div class="card" style="text-align:center;padding:2.5rem 1.5rem">
        <p style="color:var(--text-muted);font-size:0.9rem">Nenhuma inscrição corresponde aos filtros selecionados.</p>
      </div>
    ` : `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Participante</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Evento</th>
            <th>Status</th>
            <th>Pagamento</th>
            <th>Inscrição</th>
            <th style="text-align:right">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(regRowHTML).join('')}
        </tbody>
      </table>
    </div>
    `}
  `;
}

function regRowHTML(reg) {
  const ev = events.find(e => e.id === reg.eventId);
  const eventName = ev ? escapeHTML(ev.name) : '<span class="badge badge-muted">Evento removido</span>';
  return `
    <tr>
      <td style="font-weight:500">${escapeHTML(reg.participantName)}</td>
      <td style="color:var(--text-secondary);font-size:0.85rem">${escapeHTML(reg.email || '—')}</td>
      <td style="color:var(--text-secondary);font-size:0.85rem">${escapeHTML(reg.phone || '—')}</td>
      <td>${eventName}</td>
      <td><span class="badge ${statusBadgeClass(reg.status)}">${statusLabel(reg.status)}</span></td>
      <td><span class="badge ${paymentBadgeClass(reg.paymentStatus)}">${paymentLabel(reg.paymentStatus)}</span></td>
      <td style="color:var(--text-secondary);font-size:0.85rem">${formatDate(reg.registeredAt)}</td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn btn-sm" data-action="edit-reg" data-id="${reg.id}">✏️</button>
        <button class="btn btn-sm btn-danger" data-action="delete-reg" data-id="${reg.id}">🗑️</button>
      </td>
    </tr>
  `;
}

// ===== Renderização: formulário =====
function renderRegistrationForm() {
  const reg = editingId ? registrations.find(r => r.id === editingId) : null;
  const isEdit = !!reg;
  const title = isEdit ? 'Editar Inscrição' : 'Nova Inscrição';

  // Verifica se há eventos disponíveis
  if (events.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <h2 class="empty-title">Nenhum evento disponível</h2>
        <p class="empty-description">Você precisa criar pelo menos um evento antes de registrar inscrições.</p>
        <button class="btn" id="btn-cancel-reg">Voltar</button>
      </div>
    `;
  }

  // Determina evento selecionado (preenche com filterEventId ao criar novo)
  const selectedEventId = reg ? reg.eventId : (filterEventId || '');

  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">${title}</h2>
        <p class="section-description">${isEdit ? 'Altere os dados da inscrição' : 'Preencha os dados do participante'}</p>
      </div>
    </div>
    <div class="card" style="max-width:720px">
      <form id="reg-form" autocomplete="off">
        <div class="form-group">
          <label for="reg-name">Nome do participante *</label>
          <input type="text" id="reg-name" class="input" required maxlength="200"
            value="${reg ? escapeHTML(reg.participantName) : ''}" placeholder="Nome completo">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="reg-email">Email</label>
            <input type="email" id="reg-email" class="input" maxlength="200"
              value="${reg ? escapeHTML(reg.email || '') : ''}" placeholder="exemplo@email.com">
          </div>
          <div class="form-group">
            <label for="reg-phone">Telefone</label>
            <input type="tel" id="reg-phone" class="input" maxlength="30"
              value="${reg ? escapeHTML(reg.phone || '') : ''}" placeholder="(00) 00000-0000">
          </div>
        </div>
        <div class="form-group">
          <label for="reg-event">Evento *</label>
          <select id="reg-event" class="select" required ${isEdit ? 'disabled' : ''}>
            <option value="">Selecione um evento</option>
            ${events.map(ev => {
              const filled = registrations.filter(r => r.eventId === ev.id && r.status !== 'cancelado').length;
              const capacity = ev.capacity || 0;
              const isFull = capacity > 0 && filled >= capacity && ev.id !== selectedEventId;
              return `<option value="${ev.id}" ${selectedEventId === ev.id ? 'selected' : ''} ${isFull ? 'disabled' : ''} style="${isFull ? 'color:var(--text-muted)' : ''}">${escapeHTML(ev.name)}${isFull ? ' (esgotado)' : capacity ? ` (${filled}/${capacity})` : ''}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="reg-status">Status</label>
            <select id="reg-status" class="select">
              ${REG_STATUS.map(s => `<option value="${s.value}" ${reg && reg.status === s.value ? 'selected' : !reg && s.value === 'pendente' ? 'selected' : ''}>${s.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="reg-payment">Pagamento</label>
            <select id="reg-payment" class="select">
              ${PAYMENT_STATUS.map(p => `<option value="${p.value}" ${reg && reg.paymentStatus === p.value ? 'selected' : !reg && p.value === 'pendente' ? 'selected' : ''}>${p.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group" id="payment-method-group" style="${reg && reg.paymentStatus !== 'gratuito' ? '' : 'display:none'}">
          <label for="reg-payment-method">Forma de pagamento</label>
          <select id="reg-payment-method" class="select">
            ${PAYMENT_METHODS.map(m => `<option value="${m.value}" ${reg && reg.paymentMethod === m.value ? 'selected' : ''}>${m.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-actions">
          <button type="button" class="btn" id="btn-cancel-reg">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alterações' : 'Criar Inscrição'}</button>
        </div>
      </form>
    </div>
  `;
}

// ===== Manipulação de event listeners =====
export function attachRegistrationListeners() {
  // Botão "Nova Inscrição" (estado vazio ou lista)
  const btnNewEmpty = document.getElementById('btn-new-reg-empty');
  const btnNew = document.getElementById('btn-new-reg');
  if (btnNewEmpty) btnNewEmpty.addEventListener('click', () => { showForm = true; editingId = null; renderRegistrationsTabAndAttach(); });
  if (btnNew) btnNew.addEventListener('click', () => { showForm = true; editingId = null; renderRegistrationsTabAndAttach(); });

  // Filtros
  const filterEvent = document.getElementById('filter-event');
  const filterStat = document.getElementById('filter-status');
  const filterPay = document.getElementById('filter-payment');
  if (filterEvent) filterEvent.addEventListener('change', (e) => { filterEventId = e.target.value; renderRegistrationsTabAndAttach(); });
  if (filterStat) filterStat.addEventListener('change', (e) => { filterStatus = e.target.value; renderRegistrationsTabAndAttach(); });
  if (filterPay) filterPay.addEventListener('change', (e) => { filterPayment = e.target.value; renderRegistrationsTabAndAttach(); });

  // Botões editar e excluir
  document.querySelectorAll('[data-action="edit-reg"]').forEach(btn => {
    btn.addEventListener('click', () => {
      editingId = btn.dataset.id;
      showForm = true;
      renderRegistrationsTabAndAttach();
    });
  });
  document.querySelectorAll('[data-action="delete-reg"]').forEach(btn => {
    btn.addEventListener('click', () => {
      handleDeleteRegistration(btn.dataset.id);
    });
  });

  // Formulário
  const form = document.getElementById('reg-form');
  if (form) {
    form.addEventListener('submit', handleSubmitRegistration);
  }

  // Toggle payment method visibility
  const paymentSelect = document.getElementById('reg-payment');
  if (paymentSelect) {
    paymentSelect.addEventListener('change', (e) => {
      const methodGroup = document.getElementById('payment-method-group');
      if (methodGroup) {
        methodGroup.style.display = e.target.value === 'gratuito' ? 'none' : '';
      }
    });
  }

  // Botão cancelar
  const btnCancel = document.getElementById('btn-cancel-reg');
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      showForm = false;
      editingId = null;
      renderRegistrationsTabAndAttach();
    });
  }
}

// ===== Re-renderiza e reanexa listeners =====
function renderRegistrationsTabAndAttach() {
  const container = document.getElementById('tab-content');
  container.innerHTML = renderRegistrationsTab(events);
  attachRegistrationListeners();
}

// ===== Filtragem =====
function getFilteredRegistrations() {
  return registrations.filter(r => {
    if (filterEventId && r.eventId !== filterEventId) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterPayment && r.paymentStatus !== filterPayment) return false;
    return true;
  });
}

// ===== Submissão do formulário =====
function handleSubmitRegistration(e) {
  e.preventDefault();

  const participantName = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const eventId = document.getElementById('reg-event').value;
  const status = document.getElementById('reg-status').value;
  const paymentStatus = document.getElementById('reg-payment').value;
  const paymentMethodSelect = document.getElementById('reg-payment-method');
  const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value || null : null;

  // Validação
  if (!participantName) {
    alert('Por favor, informe o nome do participante.');
    return;
  }
  if (!eventId) {
    alert('Por favor, selecione um evento.');
    return;
  }

  // Verifica vagas ao criar nova inscrição
  if (!editingId) {
    const ev = events.find(e => e.id === eventId);
    if (ev && ev.capacity > 0) {
      const filled = registrations.filter(r => r.eventId === eventId && r.status !== 'cancelado').length;
      if (filled >= ev.capacity) {
        alert(`Este evento está com as vagas esgotadas (${filled}/${ev.capacity}).`);
        return;
      }
    }
  } else {
    // Ao editar, se mudar para status não-cancelado, verifica vagas considerando a própria inscrição
    const reg = registrations.find(r => r.id === editingId);
    if (reg && status !== 'cancelado' && reg.status === 'cancelado') {
      const ev = events.find(e => e.id === eventId);
      if (ev && ev.capacity > 0) {
        const filled = registrations.filter(r => r.eventId === eventId && r.status !== 'cancelado' && r.id !== editingId).length;
        if (filled >= ev.capacity) {
          alert(`Não há vagas disponíveis para reativar esta inscrição (${filled}/${ev.capacity}).`);
          return;
        }
      }
    }
  }

  const now = new Date().toISOString();

  if (editingId) {
    const idx = registrations.findIndex(r => r.id === editingId);
    if (idx !== -1) {
      const existing = registrations[idx];
      registrations[idx] = {
        ...existing,
        participantName,
        email,
        phone,
        status,
        paymentStatus,
        paymentMethod: paymentStatus === 'gratuito' ? null : paymentMethod,
        paidAt: paymentStatus === 'pago' && existing.paymentStatus !== 'pago' ? now : (paymentStatus === 'pago' ? existing.paidAt : null),
      };
    }
  } else {
    const newReg = {
      id: generateId(),
      eventId,
      participantName,
      email,
      phone,
      status,
      paymentStatus,
      paymentMethod: paymentStatus === 'gratuito' ? null : paymentMethod,
      registeredAt: now,
      paidAt: paymentStatus === 'pago' ? now : null,
      checkedIn: false,
      checkedInAt: null,
      customFields: null,
    };
    registrations.push(newReg);
  }

  saveToStorage('registrations', registrations);
  showForm = false;
  editingId = null;
  renderRegistrationsTabAndAttach();
}

// ===== Excluir inscrição =====
function handleDeleteRegistration(id) {
  const reg = registrations.find(r => r.id === id);
  if (!reg) return;

  const ev = events.find(e => e.id === reg.eventId);
  const evName = ev ? ev.name : 'evento removido';

  if (!confirm(`Deseja realmente excluir a inscrição de "${reg.participantName}" no evento "${evName}"?`)) return;

  registrations = registrations.filter(r => r.id !== id);
  saveToStorage('registrations', registrations);
  renderRegistrationsTabAndAttach();
}

// ===== Helpers =====
function statusBadgeClass(status) {
  const map = {
    'confirmado': 'badge-success',
    'pendente': 'badge-warning',
    'cancelado': 'badge-danger',
  };
  return map[status] || 'badge-muted';
}

function statusLabel(status) {
  const map = {
    'confirmado': 'Confirmado',
    'pendente': 'Pendente',
    'cancelado': 'Cancelado',
  };
  return map[status] || status;
}

function paymentBadgeClass(status) {
  const map = {
    'pago': 'badge-success',
    'pendente': 'badge-warning',
    'gratuito': 'badge-info',
  };
  return map[status] || 'badge-muted';
}

function paymentLabel(status) {
  const map = {
    'pago': 'Pago',
    'pendente': 'Pendente',
    'gratuito': 'Gratuito',
  };
  return map[status] || status;
}

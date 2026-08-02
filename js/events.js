// events.js — Cadastro e gestão de eventos (CRUD completo)
import { loadFromStorage, saveToStorage, generateId, formatCurrency, formatDate } from './utils.js';
import { showToast, showConfirm } from './ui.js';

// ===== Estado =====
let events = [];
let registrations = [];
let editingId = null;
let showForm = false;

// ===== Tipos e opções =====
const EVENT_TYPES = [
  { value: 'curso', label: 'Curso' },
  { value: 'evento', label: 'Evento' },
  { value: 'workshop', label: 'Workshop' },
];

const EVENT_STATUS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'aberto', label: 'Aberto' },
  { value: 'fechado', label: 'Fechado' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

// ===== Inicialização =====
export function initEvents() {
  events = loadFromStorage('events', []);
  registrations = loadFromStorage('registrations', []);
}

export function getEvents() {
  return events;
}

export function getRegistrations() {
  return registrations;
}

// ===== Renderização principal =====
export function renderEventsTab() {
  if (showForm) {
    return renderEventForm();
  }
  if (events.length === 0) {
    return renderEmptyEvents();
  }
  return renderEventList();
}

// ===== Renderização: estado vazio =====
function renderEmptyEvents() {
  return `
    <div class="empty-state">
      <div class="empty-icon">📅</div>
      <h2 class="empty-title">Nenhum evento cadastrado</h2>
      <p class="empty-description">Crie seu primeiro evento para começar a gerenciar inscrições e finanças. Você pode adicionar cursos, workshops ou qualquer tipo de evento.</p>
      <button class="btn btn-primary" id="btn-new-event-empty">+ Novo Evento</button>
    </div>
  `;
}

// ===== Renderização: lista de eventos =====
function renderEventList() {
  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">Eventos</h2>
        <p class="section-description">${events.length} evento${events.length > 1 ? 's' : ''} cadastrado${events.length > 1 ? 's' : ''}</p>
      </div>
      <button class="btn btn-primary" id="btn-new-event">+ Novo Evento</button>
    </div>
    <div class="card-grid">
      ${events.map(eventCardHTML).join('')}
    </div>
  `;
}

function eventCardHTML(ev) {
  const totalRegs = registrations.filter(r => r.eventId === ev.id && r.status !== 'cancelado').length;
  const capacityPercent = ev.capacity ? Math.round((totalRegs / ev.capacity) * 100) : 0;
  const typeLabel = EVENT_TYPES.find(t => t.value === ev.type)?.label || ev.type;
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem">
        <h3 style="font-size:1.1rem;font-weight:600;flex:1">${escapeHTML(ev.name)}</h3>
        <span class="badge ${statusBadgeClass(ev.status)}">${escapeHTML(statusLabel(ev.status))}</span>
      </div>
      <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:0.75rem">${escapeHTML(ev.description || 'Sem descrição')}</p>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;font-size:0.825rem;color:var(--text-secondary);margin-bottom:0.75rem">
        <span class="badge ${typeBadgeClass(ev.type)}">${escapeHTML(typeLabel)}</span>
        <span>📅 ${formatDate(ev.date)}</span>
        ${ev.location ? `<span>📍 ${escapeHTML(ev.location)}</span>` : ''}
        ${ev.price > 0 ? `<span>💰 ${formatCurrency(ev.price)}</span>` : '<span class="badge badge-info">Gratuito</span>'}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
        <span style="font-size:0.85rem;color:var(--text-secondary)">Vagas: ${totalRegs} / ${ev.capacity || '∞'}</span>
        <div style="background:var(--bg-input);border-radius:100px;height:6px;width:80px;overflow:hidden">
          <div style="background:var(--accent);height:100%;width:${Math.min(capacityPercent, 100)}%;border-radius:100px"></div>
        </div>
      </div>
      <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
        <button class="btn btn-sm" data-action="edit" data-id="${ev.id}">✏️ Editar</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${ev.id}">🗑️ Excluir</button>
      </div>
    </div>
  `;
}

// ===== Renderização: formulário =====
function renderEventForm() {
  const ev = editingId ? events.find(e => e.id === editingId) : null;
  const isEdit = !!ev;
  const title = isEdit ? 'Editar Evento' : 'Novo Evento';

  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">${title}</h2>
        <p class="section-description">${isEdit ? 'Altere os dados do evento' : 'Preencha os dados para criar um novo evento'}</p>
      </div>
    </div>
    <div class="card" style="max-width:720px">
      <form id="event-form" autocomplete="off">
        <div class="form-group">
          <label for="ev-name">Nome do evento *</label>
          <input type="text" id="ev-name" class="input" required maxlength="200"
            value="${ev ? escapeHTML(ev.name) : ''}" placeholder="Ex: Curso de JavaScript para Iniciantes">
        </div>
        <div class="form-group">
          <label for="ev-description">Descrição</label>
          <textarea id="ev-description" class="textarea" maxlength="500"
            placeholder="Breve descrição do evento">${ev ? escapeHTML(ev.description || '') : ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="ev-type">Tipo</label>
            <select id="ev-type" class="select">
              ${EVENT_TYPES.map(t => `<option value="${t.value}" ${ev && ev.type === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="ev-category">Categoria</label>
            <input type="text" id="ev-category" class="input" maxlength="50"
              value="${ev ? escapeHTML(ev.category || '') : ''}" placeholder="Ex: Tecnologia, Negócios, Educação">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="ev-date">Data de início *</label>
            <input type="date" id="ev-date" class="input" required value="${ev ? (ev.date || '').split('T')[0] : ''}">
          </div>
          <div class="form-group">
            <label for="ev-end-date">Data de término</label>
            <input type="date" id="ev-end-date" class="input" value="${ev ? (ev.endDate || '').split('T')[0] : ''}">
          </div>
        </div>
        <div class="form-row-3">
          <div class="form-group">
            <label for="ev-location">Local</label>
            <input type="text" id="ev-location" class="input" maxlength="200"
              value="${ev ? escapeHTML(ev.location || '') : ''}" placeholder="Online ou endereço">
          </div>
          <div class="form-group">
            <label for="ev-capacity">Vagas</label>
            <input type="number" id="ev-capacity" class="input" min="0" step="1"
              value="${ev ? (ev.capacity || '') : ''}" placeholder="0 = ilimitado">
          </div>
          <div class="form-group">
            <label for="ev-price">Preço (R$)</label>
            <input type="number" id="ev-price" class="input" min="0" step="0.01"
              value="${ev ? (ev.price || 0) : 0}" placeholder="0 = gratuito">
          </div>
        </div>
        <div class="form-group">
          <label for="ev-status">Status</label>
          <select id="ev-status" class="select">
            ${EVENT_STATUS.map(s => `<option value="${s.value}" ${ev && ev.status === s.value ? 'selected' : !ev && s.value === 'rascunho' ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-actions">
          <button type="button" class="btn" id="btn-cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alterações' : 'Criar Evento'}</button>
        </div>
      </form>
    </div>
  `;
}

// ===== Manipulação de eventos (event listeners) =====
export function attachEventListeners() {
  const container = document.getElementById('tab-content');

  // Botão "Novo Evento" (estado vazio ou lista)
  const btnNewEmpty = document.getElementById('btn-new-event-empty');
  const btnNew = document.getElementById('btn-new-event');
  if (btnNewEmpty) btnNewEmpty.addEventListener('click', () => { showForm = true; editingId = null; renderEventsTabAndAttach(); });
  if (btnNew) btnNew.addEventListener('click', () => { showForm = true; editingId = null; renderEventsTabAndAttach(); });

  // Botões editar e excluir nos cards
  document.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      editingId = btn.dataset.id;
      showForm = true;
      renderEventsTabAndAttach();
    });
  });
  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      handleDeleteEvent(id);
    });
  });

  // Formulário
  const form = document.getElementById('event-form');
  if (form) {
    form.addEventListener('submit', handleSubmitEvent);
  }

  // Botão cancelar
  const btnCancel = document.getElementById('btn-cancel');
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      showForm = false;
      editingId = null;
      renderEventsTabAndAttach();
    });
  }
}

// ===== Re-renderiza e reanexa listeners =====
function renderEventsTabAndAttach() {
  const container = document.getElementById('tab-content');
  container.innerHTML = renderEventsTab();
  attachEventListeners();
}

// ===== Submissão do formulário =====
function handleSubmitEvent(e) {
  e.preventDefault();

  const name = document.getElementById('ev-name').value.trim();
  const description = document.getElementById('ev-description').value.trim();
  const type = document.getElementById('ev-type').value;
  const category = document.getElementById('ev-category').value.trim();
  const date = document.getElementById('ev-date').value;
  const endDate = document.getElementById('ev-end-date').value || null;
  const location = document.getElementById('ev-location').value.trim();
  const capacity = parseInt(document.getElementById('ev-capacity').value) || 0;
  const price = parseFloat(document.getElementById('ev-price').value) || 0;
  const status = document.getElementById('ev-status').value;

  // Validação
  if (!name) {
    showToast('Por favor, informe o nome do evento.', 'warning');
    return;
  }
  if (!date) {
    showToast('Por favor, informe a data de início.', 'warning');
    return;
  }
  // Valida data de término posterior à data de início
  if (endDate && new Date(endDate) < new Date(date)) {
    showToast('A data de término deve ser posterior ou igual à data de início.', 'warning');
    return;
  }

  if (editingId) {
    // Editar existente
    const idx = events.findIndex(e => e.id === editingId);
    if (idx !== -1) {
      events[idx] = {
        ...events[idx],
        name,
        description,
        type,
        category,
        date: date ? new Date(date).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        location,
        capacity: capacity || null,
        price,
        status,
        updatedAt: new Date().toISOString(),
      };
    }
  } else {
    // Criar novo
    const newEvent = {
      id: generateId(),
      name,
      description,
      type,
      date: date ? new Date(date).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      location,
      capacity: capacity || null,
      price,
      category,
      status,
      lots: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    events.push(newEvent);
  }

  saveToStorage('events', events);
  showForm = false;
  editingId = null;
  showToast(editingId ? 'Alterações salvas com sucesso!' : 'Evento criado com sucesso!', 'success');
  renderEventsTabAndAttach();
}

// ===== Excluir evento =====
async function handleDeleteEvent(id) {
  const ev = events.find(e => e.id === id);
  if (!ev) return;

  // Verifica se há inscrições
  const hasRegistrations = registrations.some(r => r.eventId === id);
  let confirmed = false;
  if (hasRegistrations) {
    confirmed = await showConfirm(
      'Excluir evento',
      `O evento "${ev.name}" possui inscrições vinculadas. Excluir o evento também removerá todas as inscrições e transações associadas. Deseja continuar?`,
      { confirmText: 'Excluir', danger: true }
    );
  } else {
    confirmed = await showConfirm(
      'Excluir evento',
      `Deseja realmente excluir o evento "${ev.name}"?`,
      { confirmText: 'Excluir', danger: true }
    );
  }

  if (!confirmed) return;

  // Remove inscrições associadas
  if (hasRegistrations) {
    registrations = registrations.filter(r => r.eventId !== id);
    saveToStorage('registrations', registrations);
  }

  events = events.filter(e => e.id !== id);
  saveToStorage('events', events);

  // Remove transações associadas
  try {
    const transactions = loadFromStorage('transactions', []);
    const filtered = transactions.filter(t => t.eventId !== id);
    saveToStorage('transactions', filtered);
  } catch (e) {
    // ignore
  }

  showToast('Evento excluído com sucesso.', 'success');
  renderEventsTabAndAttach();
}

// ===== Helpers =====
function statusBadgeClass(status) {
  const map = {
    'aberto': 'badge-success',
    'rascunho': 'badge-muted',
    'fechado': 'badge-warning',
    'concluido': 'badge-info',
    'cancelado': 'badge-danger',
  };
  return map[status] || 'badge-muted';
}

function typeBadgeClass(type) {
  const map = {
    'curso': 'badge-purple',
    'evento': 'badge-info',
    'workshop': 'badge-warning',
  };
  return map[type] || 'badge-muted';
}

function statusLabel(status) {
  const map = {
    'rascunho': 'Rascunho',
    'aberto': 'Aberto',
    'fechado': 'Fechado',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado',
  };
  return map[status] || status;
}

export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ui.js — Toast notifications e modal de confirmação reutilizável

// ===== Toast Notifications =====
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-container');
  }
  return toastContainer;
}

/**
 * Exibe uma notificação toast.
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo: 'success' | 'error' | 'info' | 'warning'
 * @param {number} duration - Duração em ms (padrão 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = getToastContainer();
  if (!container) {
    // Fallback para alert se o container não existir
    console.warn('Toast container não encontrado, usando alert como fallback');
    alert(message);
    return;
  }

  const icons = {
    success: '\u2705',
    error: '\u274C',
    info: '\u2139\uFE0F',
    warning: '\u26A0\uFE0F',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message"></span>
  `;
  // Usa textContent para evitar XSS na mensagem
  toast.querySelector('.toast-message').textContent = message;

  container.appendChild(toast);

  // Animação de entrada
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  // Auto-remove após a duração
  const removeTimer = setTimeout(() => {
    removeToast(toast);
  }, duration);

  // Permite remover com clique
  toast.addEventListener('click', () => {
    clearTimeout(removeTimer);
    removeToast(toast);
  });
}

function removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.classList.remove('toast-show');
  toast.classList.add('toast-hide');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// ===== Modal de Confirmação =====
let modalOverlay = null;
let modalResolve = null;

/**
 * Exibe um modal de confirmação e retorna uma Promise<boolean>.
 * @param {string} title - Título do modal
 * @param {string} message - Mensagem de confirmação
 * @param {object} options - { confirmText, cancelText, danger }
 * @returns {Promise<boolean>}
 */
export function showConfirm(title, message, options = {}) {
  const {
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    danger = false,
  } = options;

  return new Promise((resolve) => {
    modalResolve = resolve;
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) {
      // Fallback para confirm nativo
      resolve(window.confirm(message));
      return;
    }

    // Preenche o modal
    const titleEl = overlay.querySelector('.modal-title');
    const messageEl = overlay.querySelector('.modal-message');
    const confirmBtn = overlay.querySelector('.modal-btn-confirm');
    const cancelBtn = overlay.querySelector('.modal-btn-cancel');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (confirmBtn) {
      confirmBtn.textContent = confirmText;
      confirmBtn.className = danger ? 'btn btn-danger modal-btn-confirm' : 'btn btn-primary modal-btn-confirm';
    }
    if (cancelBtn) cancelBtn.textContent = cancelText;

    // Exibe o modal com animação
    overlay.classList.add('modal-show');
    modalOverlay = overlay;

    // Foca no botão de confirmar para acessibilidade
    if (confirmBtn) confirmBtn.focus();
  });
}

export function closeModal(result) {
  if (!modalOverlay) return;
  modalOverlay.classList.remove('modal-show');
  modalOverlay.classList.add('modal-hide');
  setTimeout(() => {
    if (modalOverlay) {
      modalOverlay.classList.remove('modal-hide');
    }
  }, 200);
  if (modalResolve) {
    modalResolve(result);
    modalResolve = null;
  }
}

// ===== Inicialização do modal (deve ser chamada no boot) =====
export function initModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  const confirmBtn = overlay.querySelector('.modal-btn-confirm');
  const cancelBtn = overlay.querySelector('.modal-btn-cancel');
  const closeBtn = overlay.querySelector('.modal-close');

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => closeModal(true));
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => closeModal(false));
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal(false));
  }
  // Fecha ao clicar no overlay
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal(false);
    }
  });
  // Fecha com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('modal-show')) {
      closeModal(false);
    }
  });
}

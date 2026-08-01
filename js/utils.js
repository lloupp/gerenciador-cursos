// utils.js — Funções utilitárias (formatação, helpers)

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function formatPercent(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value || 0).toFixed(1)}%`;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function saveToStorage(key, data) {
  try {
    localStorage.setItem(`gc_${key}`, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Erro ao salvar:', e);
    return false;
  }
}

export function loadFromStorage(key, fallback = null) {
  try {
    const data = localStorage.getItem(`gc_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error('Erro ao carregar:', e);
    return fallback;
  }
}

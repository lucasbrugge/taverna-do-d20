const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const money = (value) => brl.format(Number(value ?? 0)); // Apenas exibição.
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
export const statusName = (status) => ({
  pending_payment: 'Aguardando pagamento', paid: 'Pago',
  shipped: 'Enviado', delivered: 'Entregue', canceled: 'Cancelado',
}[status] ?? status);
export const dateTime = (date) => date ? new Date(date).toLocaleString('pt-BR') : '—';

export function imageOf(product, className = 'card-img-top') {
  const src = product.image_url;
  if (typeof src === 'string' && (/^https?:\/\//i.test(src) || src.startsWith('/'))) {
    return `<img class="${className}" src="${escapeHtml(src)}" alt="${escapeHtml(product.name)}" loading="lazy">`;
  }
  return `<div class="image-fallback ${className}" role="img" aria-label="Produto sem imagem">D20</div>`;
}

export function statusBadge(status) {
  const cls = status === 'canceled' ? 'text-bg-danger' : status === 'pending_payment' ? 'text-bg-warning' : 'text-bg-success';
  return `<span class="badge ${cls}">${escapeHtml(statusName(status))}</span>`;
}

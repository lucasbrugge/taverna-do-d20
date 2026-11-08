import { escapeHtml } from './format.js';

function field(label, name, options = {}, value = '') {
  const { col = 'col-md-6', attr = '' } = options;
  return `<div class="${col}">
    <label class="form-label w-100" for="addr-${name}">${label}
      <input class="form-control" id="addr-${name}" name="${name}" value="${escapeHtml(value)}" ${attr}>
    </label>
    <div class="invalid-feedback" data-error="${name}"></div>
  </div>`;
}

export function addressFields(address = {}) {
  return `<div class="row g-3">
    ${field('Destinatário', 'recipient_name', {col: 'col-md-6', attr: 'required maxlength="255" autocomplete="name"'}, address.recipient_name)}
    <div class="col-md-6">
      <label class="form-label" for="addr-postal_code">CEP</label>
      <div class="input-group">
        <input class="form-control" id="addr-postal_code" name="postal_code" type="text"
          value="${escapeHtml(formatPostalCode(address.postal_code ?? ''))}"
          inputmode="numeric" autocomplete="postal-code" placeholder="00000-000"
          maxlength="9" pattern="[0-9]{5}-?[0-9]{3}" required>
        <button class="btn btn-outline-primary" type="button" data-action="lookup-cep">Buscar CEP</button>
      </div>
      <div class="invalid-feedback" data-error="postal_code"></div>
      <div class="form-text" data-cep-status role="status" aria-live="polite">Digite o CEP e clique em Buscar CEP ou saia do campo.</div>
    </div>
    ${field('Rua / logradouro', 'street', {col: 'col-md-8', attr: 'required maxlength="255" autocomplete="address-line1"'}, address.street)}
    ${field('Número', 'number', {col: 'col-md-4', attr: 'required maxlength="20" autocomplete="address-line2"'}, address.number)}
    ${field('Bairro', 'district', {col: 'col-md-6', attr: 'required maxlength="255"'}, address.district)}
    ${field('Cidade', 'city', {col: 'col-md-4', attr: 'required maxlength="255" autocomplete="address-level2"'}, address.city)}
    ${field('UF', 'state', {col: 'col-md-2', attr: 'required maxlength="2" minlength="2" pattern="[A-Za-z]{2}" autocomplete="address-level1"'}, address.state)}
    ${field('Complemento (opcional)', 'complement', {col: 'col-12', attr: 'maxlength="255"'}, address.complement)}
  </div>`;
}

export function formatPostalCode(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function addressForm(address = null) {
  const editing = Boolean(address?.id);
  return `<form data-form="address" ${editing ? `data-id="${Number(address.id)}" data-last-lookup="${escapeHtml(String(address.postal_code).replace(/\D/g, ''))}"` : ''} novalidate>
    ${addressFields(address ?? {})}
    <div class="d-flex gap-2 flex-wrap align-items-center mt-3">
      <button class="btn btn-primary" type="submit">${editing ? 'Salvar alterações' : 'Salvar endereço'}</button>
      ${editing ? '<button type="button" class="btn btn-outline-light" data-action="cancel-edit-address">Cancelar edição</button>' : ''}
    </div>
  </form>`;
}

export function addressLabel(a) {
  return `${escapeHtml(a.recipient_name)} — ${escapeHtml(a.street)}, ${escapeHtml(a.number)}, ${escapeHtml(a.district)} — ${escapeHtml(a.city)}/${escapeHtml(a.state)} (CEP ${escapeHtml(formatPostalCode(a.postal_code))})`;
}

/** Sinaliza erros por campo, sem converter mensagens do servidor em HTML. */
export function showAddressErrors(form, errors) {
  for (const input of form.querySelectorAll('[name]')) {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    const area = form.querySelector(`[data-error="${input.name}"]`);
    if (area) area.textContent = '';
  }
  for (const [key, reason] of Object.entries(errors)) {
    const input = form.elements.namedItem(key);
    if (!input) continue;
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    const area = form.querySelector(`[data-error="${key}"]`);
    if (area) {
      area.textContent = Array.isArray(reason) ? reason.join(' ') : String(reason);
      area.style.display = 'block';
    }
  }
}

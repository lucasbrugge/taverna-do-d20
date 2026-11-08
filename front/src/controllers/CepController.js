import { ViaCepService } from '../services/ViaCepService.js';
import { formatPostalCode, showAddressErrors } from '../ui/addressForm.js';

/** Coordena a experiência do formulário; a chamada externa fica no ViaCepService. */
export class CepController {
  constructor(viaCep = new ViaCepService()) {
    this.viaCep = viaCep;
    this.pending = new WeakMap();
  }

  onInput(event) {
    const input = event.target;
    if (!input?.matches('form[data-form="address"] [name="postal_code"]')) return;
    const form = input.closest('form');
    this.pending.get(form)?.abort();
    this.pending.delete(form);
    input.value = formatPostalCode(input.value);
    form.dataset.lastLookup = '';
    this.status(form, 'CEP alterado. Busque novamente para atualizar o endereço.', 'secondary');
  }

  onBlur(event) {
    const input = event.target;
    if (!input?.matches('form[data-form="address"] [name="postal_code"]')) return;
    // Se o foco foi para o botão, ele mesmo fará a única consulta.
    if (event.relatedTarget?.matches?.('[data-action="lookup-cep"]')) return;
    const form = input.closest('form');
    const cep = input.value.replace(/\D/g, '');
    if (cep.length === 8 && form.dataset.lastLookup !== cep) {
      void this.lookup(form);
    }
  }

  status(form, text, color = 'secondary') {
    const el = form.querySelector('[data-cep-status]');
    if (!el) return;
    el.textContent = text;
    el.className = `form-text text-${color}`;
  }

  async lookup(form, { force = false } = {}) {
    if (!form?.isConnected) return;
    const input = form.elements.namedItem('postal_code');
    const cep = input.value.replace(/\D/g, '');
    if (cep.length !== 8) {
      showAddressErrors(form, { postal_code: 'Informe um CEP com 8 números.' });
      this.status(form, 'CEP inválido. Informe 8 números.', 'danger');
      return;
    }
    if (!force && form.dataset.lastLookup === cep) return;

    this.pending.get(form)?.abort();
    const controller = new AbortController();
    this.pending.set(form, controller);
    const button = form.querySelector('[data-action="lookup-cep"]');
    if (button) button.disabled = true;
    this.status(form, 'Consultando ViaCEP...', 'secondary');

    try {
      const address = await this.viaCep.lookup(cep, { signal: controller.signal });
      if (!form.isConnected || input.value.replace(/\D/g, '') !== cep || controller.signal.aborted) return;
      for (const name of ['street', 'district', 'city', 'state']) {
        // CEP geral pode vir sem logradouro/bairro: permite preenchimento manual.
        if (address[name]) form.elements.namedItem(name).value = address[name];
      }
      form.dataset.lastLookup = cep;
      showAddressErrors(form, {});
      this.status(form, 'CEP encontrado. Confirme os dados e informe o número.', 'success');
      if (!form.elements.namedItem('number').value) form.elements.namedItem('number').focus();
    } catch (error) {
      if (error?.name !== 'AbortError') {
        this.status(form, error.message, 'warning');
      }
    } finally {
      if (this.pending.get(form) === controller) {
        this.pending.delete(form);
        if (button?.isConnected) button.disabled = false;
      }
    }
  }
}

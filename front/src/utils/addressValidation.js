const UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT',
  'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO',
  'RR', 'SC', 'SP', 'SE', 'TO',
]);

/** Validação de interface, complementar ao AddressRequest do Laravel. */
export class AddressValidator {
  static normalize(values) {
    return {
      recipient_name: String(values.recipient_name ?? '').trim(),
      postal_code: String(values.postal_code ?? '').replace(/\D/g, ''),
      street: String(values.street ?? '').trim(),
      number: String(values.number ?? '').trim(),
      complement: String(values.complement ?? '').trim(),
      district: String(values.district ?? '').trim(),
      city: String(values.city ?? '').trim(),
      state: String(values.state ?? '').trim().toUpperCase(),
    };
  }

  static validate(values) {
    const address = this.normalize(values);
    const errors = {};
    for (const key of ['recipient_name', 'street', 'number', 'district', 'city']) {
      if (!address[key]) errors[key] = 'Campo obrigatório.';
      else if (address[key].length > (key === 'number' ? 20 : 255)) {
        errors[key] = `Máximo de ${key === 'number' ? 20 : 255} caracteres.`;
      }
    }
    if (address.complement.length > 255) errors.complement = 'Máximo de 255 caracteres.';
    if (!/^\d{8}$/.test(address.postal_code)) {
      errors.postal_code = 'Informe um CEP com 8 números.';
    }
    if (!UFS.has(address.state)) {
      errors.state = 'Informe uma UF brasileira válida (ex.: PR).';
    }
    return { address, errors, valid: Object.keys(errors).length === 0 };
  }
}

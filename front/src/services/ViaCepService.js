/** Serviço externo. Não conhece o DOM, Axios nem o Laravel. */
export class ViaCepService {
  constructor(fetcher = (...args) => fetch(...args)) {
    this.fetcher = fetcher;
  }

  async lookup(postalCode, { signal } = {}) {
    const cep = String(postalCode ?? '').replace(/\D/g, '');
    if (!/^\d{8}$/.test(cep)) {
      throw new Error('Informe um CEP com exatamente 8 números.');
    }

    let response;
    try {
      response = await this.fetcher(`https://viacep.com.br/ws/${cep}/json/`, { signal });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw new Error('Não foi possível consultar o ViaCEP. Você pode preencher o endereço manualmente.');
    }

    if (!response.ok) {
      throw new Error('O ViaCEP está indisponível. Preencha o endereço manualmente.');
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('O ViaCEP retornou dados inválidos. Preencha manualmente.');
    }

    if (data?.erro === true || data?.erro === 'true') {
      throw new Error('CEP não encontrado no ViaCEP. Confira os números.');
    }

    if (!data || !data.localidade || !data.uf) {
      throw new Error('Endereço incompleto no ViaCEP. Preencha manualmente.');
    }

    return {
      postal_code: cep,
      street: String(data.logradouro ?? '').trim(),
      district: String(data.bairro ?? '').trim(),
      city: String(data.localidade ?? '').trim(),
      state: String(data.uf ?? '').trim().toUpperCase(),
    };
  }
}

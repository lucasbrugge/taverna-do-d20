import { http } from './HttpClient.js';

/** CRUD administrativo de produtos; usa FormData para arquivos de imagem. */
export class AdminProductService {
  constructor(client = http) { this.client = client; }

  list(page = 1) {
    return this.client.get('/api/admin/products', { params: { page } });
  }

  get(id) {
    return this.client.get(`/api/admin/products/${Number(id)}`);
  }

  create(formData) {
    // multipart/form-data: o Axios monta os cabeçalhos e o boundary automaticamente.
    return this.client.post('/api/admin/products', formData);
  }

  update(id, formData) {
    // PHP processa uploads multipart com POST; Laravel interpreta _method=PATCH.
    formData.set('_method', 'PATCH');
    return this.client.post(`/api/admin/products/${Number(id)}`, formData);
  }

  remove(id) {
    return this.client.delete(`/api/admin/products/${Number(id)}`);
  }
}

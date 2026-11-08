import { http } from './HttpClient.js';

/** HTTP de categorias: consulta pública, alterações somente no backend administrativo. */
export class AdminCategoryService {
  constructor(client = http) { this.client = client; }

  list() {
    return this.client.get('/api/categories');
  }

  create(data) {
    return this.client.post('/api/admin/categories', data);
  }

  update(id, data) {
    return this.client.put(`/api/admin/categories/${Number(id)}`, data);
  }

  remove(id) {
    return this.client.delete(`/api/admin/categories/${Number(id)}`);
  }
}

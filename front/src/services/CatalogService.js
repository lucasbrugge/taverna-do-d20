import { http } from './HttpClient.js';

export class CatalogService {
  constructor(client = http) { this.client = client; }
  list(filters) { return this.client.get('/api/products', { params: filters }); }
  get(id) { return this.client.get(`/api/products/${Number(id)}`); }
  categories() { return this.client.get('/api/categories'); }
}

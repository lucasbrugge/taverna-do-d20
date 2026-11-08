import { http } from './HttpClient.js';

export class OrderService {
  constructor(client = http) { this.client = client; }
  list(page = 1) { return this.client.get('/api/orders', { params: { page } }); }
  get(id) { return this.client.get(`/api/orders/${Number(id)}`); }
  checkout(addressId) { return this.client.post('/api/orders', { address_id: Number(addressId) }); }
  pay(id) { return this.client.post(`/api/orders/${Number(id)}/pay`); }
  cancel(id) { return this.client.post(`/api/orders/${Number(id)}/cancel`); }
}

import { http } from './HttpClient.js';

/** Apenas operações administrativas de pedidos; pagamento segue sendo do comprador. */
export class AdminOrderService {
  constructor(client = http) { this.client = client; }

  list({ page = 1, status = '' } = {}) {
    return this.client.get('/api/admin/orders', {
      params: { page, ...(status ? { status } : {}) },
    });
  }

  detail(id) {
    // OrderService::show permite acesso ao proprietário ou ao administrador.
    return this.client.get(`/api/orders/${Number(id)}`);
  }

  advance(id, status) {
    return this.client.patch(`/api/admin/orders/${Number(id)}/status`, { status });
  }
}

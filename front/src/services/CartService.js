import { http } from './HttpClient.js';

export class CartService {
  constructor(client = http) { this.client = client; }
  get() { return this.client.get('/api/cart'); }
  add(productId, quantity) {
    return this.client.post('/api/cart/items', {
      product_id: Number(productId), quantity: Number(quantity),
    });
  }
  update(itemId, quantity) {
    return this.client.patch(`/api/cart/items/${Number(itemId)}`, {
      quantity: Number(quantity),
    });
  }
  remove(itemId) { return this.client.delete(`/api/cart/items/${Number(itemId)}`); }
}

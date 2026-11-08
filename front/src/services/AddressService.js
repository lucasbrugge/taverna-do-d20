import { http } from './HttpClient.js';

/** CRUD: cada método sabe apenas qual verbo e endpoint utilizar. */
export class AddressService {
  constructor(client = http) { this.client = client; }
  list() { return this.client.get('/api/addresses'); }    // GET
  create(address) { return this.client.post('/api/addresses', address); } // POST
  update(id, address) { return this.client.put(`/api/addresses/${Number(id)}`, address); } // PUT
  remove(id) { return this.client.delete(`/api/addresses/${Number(id)}`); } // DELETE
}

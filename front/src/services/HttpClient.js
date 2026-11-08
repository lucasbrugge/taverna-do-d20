import { api } from '../api.js';

/** Uma única interface para os verbos HTTP. Retorna o corpo JSON, não o objeto Axios. */
export class HttpClient {
  constructor(transport = api) {
    this.transport = transport;
  }

  async get(url, config) {
    return (await this.transport.get(url, config)).data;
  }

  async post(url, body = {}) {
    return (await this.transport.post(url, body)).data;
  }

  async put(url, body) {
    return (await this.transport.put(url, body)).data;
  }

  async patch(url, body) {
    return (await this.transport.patch(url, body)).data;
  }

  async delete(url) {
    return (await this.transport.delete(url)).data;
  }
}

export const http = new HttpClient();

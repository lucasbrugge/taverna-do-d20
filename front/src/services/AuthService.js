import { http } from "./HttpClient.js";

export class AuthService {
  constructor(client = http) {
    this.client = client;
  }

  async csrf() {
    await this.client.get("/sanctum/csrf-cookie");
  }

  async current() {
    const result = await this.client.get("/api/auth/me");
    return result.data;
  }

  async register(formData) {
    await this.csrf();
    return this.client.post("/api/auth/register", formData);
  }

  async login(email, password) {
    await this.csrf();
    return this.client.post("/api/auth/login", { email, password });
  }

  async logout() {
    await this.csrf();
    return this.client.post("/api/auth/logout");
  }

  async updateProfile(data) {
    await this.csrf();

    return this.client.patch("/api/auth/me", data);
  }
}

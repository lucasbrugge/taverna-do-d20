import axios from "axios";

export const api = axios.create({
  baseURL: "/",
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: "application/json",
  },
});

export async function register(data) {
  await api.get("/sanctum/csrf-cookie");

  const response = await api.post("/api/auth/register", data);

  return response.data;
}

export async function login(email, password) {
  await api.get("/sanctum/csrf-cookie");

  const response = await api.post("/api/auth/login", { email, password });

  return response.data;
}

export async function me() {
  const response = await api.get("/api/auth/me");

  return response.data;
}

export async function logout() {
  await api.get("/sanctum/csrf-cookie");

  const response = await api.post("/api/auth/logout");

  return response.data;
}

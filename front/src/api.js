import axios from "axios";

// No Docker, a API é acessada pela mesma origem do frontend.
// A variável é incorporada ao bundle durante `npm run build`.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/",
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: "application/json" },
});

import axios from 'axios';

// Configuração central do Axios. Os endpoints e verbos HTTP estão nos Services.
export const api = axios.create({
  baseURL: '/',
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
});

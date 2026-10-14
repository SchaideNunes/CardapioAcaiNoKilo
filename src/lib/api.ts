// Endereço do backend. Em produção defina VITE_API_URL (ex.: https://api.seudominio.com.br) no build.
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export function apiUrl(path: `/${string}`): string {
  return `${API_BASE_URL}${path}`;
}

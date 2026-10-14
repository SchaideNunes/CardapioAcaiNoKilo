// Modo demonstração: permite abrir o painel admin com dados locais quando o servidor está offline.
// As alterações feitas nele ficam só no navegador; nenhuma credencial real deve morar aqui.

export const DEMO_TOKEN = "demo-token-123";

const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "admin";

/** Ligado por padrão; defina VITE_DEMO_MODE=false no ambiente de produção para desativar. */
export function isDemoModeEnabled(): boolean {
  return import.meta.env.VITE_DEMO_MODE !== "false";
}

export function isDemoCredentials(username: string, password: string): boolean {
  return username.trim().toLowerCase() === DEMO_USERNAME && password === DEMO_PASSWORD;
}

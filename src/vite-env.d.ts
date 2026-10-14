/// <reference types="vite/client" />

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";
declare module "*.webp";

interface ImportMetaEnv {
  /** URL do backend (ex.: https://api.seudominio.com.br); padrão http://localhost:3001 */
  readonly VITE_API_URL?: string;
  /** "false" desativa o login de demonstração offline */
  readonly VITE_DEMO_MODE?: string;
}

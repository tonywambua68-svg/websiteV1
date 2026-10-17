/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_STRIPE_PUBLIC_KEY: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_MAINTENANCE_MODE: string;
  readonly VITE_SITE_NAME: string;
  readonly VITE_SITE_TAGLINE: string;
  readonly VITE_CURRENCY: string;
  readonly VITE_LOCALE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

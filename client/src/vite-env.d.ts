/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API, including the /api prefix. */
  readonly VITE_API_URL?: string;
  /** Public origin of the site, used to build absolute canonical and social URLs. */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

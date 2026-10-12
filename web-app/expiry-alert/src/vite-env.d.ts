/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REACT_APP_GOOGLE_CLIENT_ID?: string;
  readonly REACT_APP_GOOGLE_CLIENT_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

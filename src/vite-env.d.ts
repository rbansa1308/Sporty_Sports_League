/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPORTSDB_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

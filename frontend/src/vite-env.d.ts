interface ImportMetaEnv {
  readonly VITE_GRAPHQL_URL: string
  readonly VITE_API_URL: string
  readonly VITE_AUTH_TOKEN_KEY: string
  readonly VITE_AUTH_USER_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
// web/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    strictPort: true,
  },
  define: {
    // Define the variables your app expects
    'import.meta.env.VITE_GRAPHQL_URL': JSON.stringify(
      process.env.VITE_GRAPHQL_URL || (process.env.NODE_ENV === 'production' 
        ? 'https://www.xbullet.me/graphql' 
        : 'http://localhost:3000/graphql')
    ),
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || (process.env.NODE_ENV === 'production' 
        ? 'https://www.xbullet.me' 
        : 'http://localhost:3000')
    ),
    'import.meta.env.VITE_AUTH_TOKEN_KEY': JSON.stringify('passport_buddy_token'),
    'import.meta.env.VITE_AUTH_USER_KEY': JSON.stringify('passport_buddy_user'),
  }
})
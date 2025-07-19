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
    __GRAPHQL_URL__: JSON.stringify(
      process.env.NODE_ENV === 'production' 
        ? 'http://138.197.72.196:3000/graphql' 
        : 'http://localhost:3000/graphql'
    ),
    __API_URL__: JSON.stringify(
      process.env.NODE_ENV === 'production' 
        ? 'http://138.197.72.196:3000' 
        : 'http://localhost:3000'
    ),
  }
})
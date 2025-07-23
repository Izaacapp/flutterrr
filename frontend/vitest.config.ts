import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    css: true,
    // 🔧 FIX #4: TEST ENVIRONMENT - Add environment variables for tests
    env: {
      VITE_API_URL: 'http://localhost:3000',
      VITE_AUTH_TOKEN_KEY: 'passport_buddy_token',
      VITE_GRAPHQL_ENDPOINT: 'http://localhost:3000/graphql',
      NODE_ENV: 'test'
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
    },
    // 🔧 FIX #4: Increase timeout for Apollo Client operations
    testTimeout: 10000,
    // 🔧 FIX #4: Mock modules that cause issues in test environment
    server: {
      deps: {
        inline: ['@apollo/client', 'graphql']
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 🔧 FIX #4: Define environment variables at build time for tests
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3000'),
    'import.meta.env.VITE_AUTH_TOKEN_KEY': JSON.stringify('passport_buddy_token'),
    'import.meta.env.VITE_GRAPHQL_ENDPOINT': JSON.stringify('http://localhost:3000/graphql'),
  }
});
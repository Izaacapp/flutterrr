// web/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { AuthProvider } from './contexts/AuthContext'

// Use Vite's environment variables instead
const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL

const client = new ApolloClient({
  uri: graphqlUrl,
  cache: new InMemoryCache(),
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ApolloProvider>
  </React.StrictMode>
);
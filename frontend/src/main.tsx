// web/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { gql } from '@apollo/client'

// Use Vite's environment variables instead
const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL

const httpLink = createHttpLink({
  uri: graphqlUrl,
})

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('passport_buddy_token')
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
})

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ApolloProvider>
  </React.StrictMode>
);

// Dev tools for console
if (import.meta.env.DEV) {
  // Import stress test
  import('./utils/stressTest').then(({ stressTest }) => {
    (window as any).runStressTest = async (type: string = 'help') => {
      console.log('🧪 Passport Buddy Stress Test Console');
      
      if (type === 'help') {
        console.log('\nAvailable commands:');
        console.log('  runStressTest("likes")     - Test concurrent likes');
        console.log('  runStressTest("comments")  - Test concurrent comments');
        console.log('  runStressTest("mixed")     - Test mixed operations');
        console.log('  runStressTest("rapid")     - Test rapid fire likes');
        console.log('  runStressTest("auth")      - Test authentication');
        return;
      }

      // Simple query to get posts from cache
      const GET_POSTS = gql`
        query GetPosts {
          posts {
            _id
          }
        }
      `;
      const posts = client.cache.readQuery({ query: GET_POSTS })?.posts;
      if (!posts?.length) {
        console.error('No posts available for testing. Create some posts first!');
        return;
      }

      stressTest.reset();
      const firstPostId = posts[0]._id;
      const postIds = posts.map((p: any) => p._id);

      switch(type) {
        case 'likes':
          await stressTest.runConcurrentLikeTest(firstPostId, 20);
          break;
        case 'comments':
          await stressTest.runConcurrentCommentTest(firstPostId, 15);
          break;
        case 'mixed':
          await stressTest.runMixedOperationsTest(postIds, 30);
          break;
        case 'rapid':
          await stressTest.runRapidFireTest(firstPostId, 3000);
          break;
        case 'auth':
          await stressTest.runAuthenticationStressTest(5);
          break;
        default:
          console.error('Unknown test type. Use runStressTest("help") for options.');
      }
    };
  });

  // Import seed data
  import('./utils/seedTestData').then(({ seedTestData }) => {
    (window as any).seedTestData = seedTestData;
  });
  
  // Log available dev tools
  console.log('🛠️ Passport Buddy Dev Tools loaded!');
  console.log('Available commands:');
  console.log('  seedTestData()         - Create test posts and comments');
  console.log('  runStressTest("help")  - Show stress test options');
}
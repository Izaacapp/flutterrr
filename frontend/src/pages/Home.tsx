import React from 'react';
import { CreatePost } from '../components/feed/CreatePost';
import { Feed } from '../components/feed/Feed';

export const Home: React.FC = () => {
  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0.75rem' }}>
      <CreatePost />
      <Feed />
    </div>
  );
};
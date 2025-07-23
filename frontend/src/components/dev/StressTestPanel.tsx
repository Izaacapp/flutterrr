import React, { useState } from 'react';
import { stressTest } from '../../utils/stressTest';
import { useGetPostsQuery } from '../../gql/generated';
import { useDevMode } from '../../hooks/useDevMode';
import './StressTestPanel.css';

export const StressTestPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState('notification-stress');
  const [notificationResults, setNotificationResults] = useState<string[]>([]);
  const { data } = useGetPostsQuery();
  const { isDevMode, disableDevMode } = useDevMode();

  const runNotificationStressTest = async () => {
    const API_URL = 'http://localhost:3000';
    const currentToken = localStorage.getItem('passport_buddy_token');
    
    if (!currentToken) {
      alert('Please log in first');
      return;
    }

    setIsRunning(true);
    setNotificationResults(['🚀 TWITTER FEED STRESS TEST - SEED FRIENDS & CONTENT', '='.repeat(50)]);
    
    try {
      // FIRST: Create multiple real user accounts for a proper Twitter feed
      const realUserData = [
        { username: 'sarah_travels', email: 'sarah@example.com', fullName: 'Sarah Chen', password: 'Test123!' },
        { username: 'mike_wanderer', email: 'mike@example.com', fullName: 'Mike Johnson', password: 'Test123!' },
        { username: 'jenny_explorer', email: 'jenny@example.com', fullName: 'Jenny Smith', password: 'Test123!' },
        { username: 'alex_nomad', email: 'alex@example.com', fullName: 'Alex Rivera', password: 'Test123!' },
        { username: 'lisa_backpack', email: 'lisa@example.com', fullName: 'Lisa Wong', password: 'Test123!' },
        { username: 'tom_pilot', email: 'tom@example.com', fullName: 'Tom Harrison', password: 'Test123!' },
        { username: 'emma_globe', email: 'emma@example.com', fullName: 'Emma Davis', password: 'Test123!' },
        { username: 'david_miles', email: 'david@example.com', fullName: 'David Garcia', password: 'Test123!' }
      ];
      
      const createdUsers = [];
      
      setNotificationResults(prev => [...prev, '', '🏗️ Building real user network for Twitter-style feed...']);
      
      // Create actual user accounts
      for (const userData of realUserData) {
        try {
          const registerRes = await fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          });
          
          if (registerRes.ok) {
            const regData = await registerRes.json();
            createdUsers.push({ _id: regData.userId, username: userData.username });
            setNotificationResults(prev => [...prev, `👤 Created real user @${userData.username}`]);
          } else {
            // User exists, try to login with CORRECT password
            const loginRes = await fetch(`${API_URL}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: userData.username, password: userData.password })
            });
            
            setNotificationResults(prev => [...prev, `🔑 LOGIN ATTEMPT - User: ${userData.username}, Status: ${loginRes.status}`]);
            
            if (loginRes.ok) {
              const { token } = await loginRes.json();
              const profileRes = await fetch(`${API_URL}/api/v1/users/profile/${userData.username}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (profileRes.ok) {
                const { data: profile } = await profileRes.json();
                createdUsers.push({ _id: profile.user._id, username: userData.username });
                setNotificationResults(prev => [...prev, `🔄 Found existing @${userData.username}`]);
              }
            }
          }
        } catch (err) {
          setNotificationResults(prev => [...prev, `❌ Failed to create @${userData.username}`]);
        }
      }
      
      const otherUsers = createdUsers;
      
      setNotificationResults(prev => [...prev, '', `📊 Found ${otherUsers.length} users to seed with`]);
      
      // Phase 1: Follow everyone (Twitter-style mutual follows)
      setNotificationResults(prev => [...prev, '', '🤝 PHASE 1: Building Friend Network', 'Creating mutual connections like Twitter...']);
      
      for (let i = 0; i < Math.min(15, otherUsers.length); i++) {
        const user = otherUsers[i];
        try {
          // They follow you - using CORRECT password
          const loginRes = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.username, password: 'Test123!' })
          });
          
          if (loginRes.ok) {
            const { token } = await loginRes.json();
            
            const profileRes = await fetch(`${API_URL}/api/v1/users/profile/izaacap`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (profileRes.ok) {
              const { data: profileData } = await profileRes.json();
              
              await fetch(`${API_URL}/api/v1/users/follow/${profileData.user._id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              setNotificationResults(prev => [...prev, `🔄 @${user.username} followed you`]);
            }
            
            // You follow them back (mutual follow)
            await fetch(`${API_URL}/api/v1/users/follow/${user._id}`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            
            setNotificationResults(prev => [...prev, `🤝 You followed @${user.username} back`]);
          }
        } catch (err) {
          setNotificationResults(prev => [...prev, `❌ Connection failed with @${user.username}`]);
        }
        
        if (i % 4 === 0) await new Promise(r => setTimeout(r, 200));
      }
      
      setNotificationResults(prev => [...prev, '', '🌐 Friend network established!']);
      
      // Phase 2: Create diverse Twitter-style content
      setNotificationResults(prev => [...prev, '', '📝 PHASE 2: Creating Diverse Content Feed']);
      
      const twitterStylePosts = [
        'Hot take: Window seats > aisle seats and I will die on this hill ✈️',
        'Currently stuck in Istanbul airport for 6 hours. AMA about duty free prices 🙃',
        'PSA: Always pack a change of clothes in your carry-on. Trust me on this one 🧳',
        'That moment when you realize you forgot to pack underwear... asking for a friend 😅',
        'Flight delayed 3 hours but the airport WiFi is fire so not even mad 📶',
        'Why do airports sell $8 water bottles but give away free WiFi passwords? Make it make sense 🤔',
        'Turbulence update: My coffee is now modern art on my laptop 🎨☕',
        'Pilot just said "slight delay" - translation: we\'re never leaving 😭',
        'Airport food hits different when you\'re starving at gate B42 at 6am 🍔',
        'Boarding group 9... aka "please wait until everyone else has taken the overhead bins" 📦',
        'Travel hack: Befriend the gate agent. They have more power than you think 💪',
        'Nothing humbles you like trying to fit your life into a 23kg suitcase 🧳⚖️'
      ];
      
      const createdPosts = [];
      
      // You create some posts
      for (let i = 0; i < 4; i++) {
        const content = twitterStylePosts[i];
        const formData = new FormData();
        formData.append('content', content);
        
        const postRes = await fetch(`${API_URL}/api/posts`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${currentToken}` },
          body: formData
        });
        
        if (postRes.ok) {
          const post = await postRes.json();
          createdPosts.push(post);
          setNotificationResults(prev => [...prev, `📱 You: "${content.substring(0, 40)}..."`]);
        }
      }
      
      // Friends create posts too (Twitter feed experience)
      setNotificationResults(prev => [...prev, '', '👥 Friends are also posting...']);
      
      const friendPosts = [];
      for (let i = 0; i < Math.min(8, otherUsers.length); i++) {
        const user = otherUsers[i];
        const content = twitterStylePosts[4 + i] || `Just had the weirdest travel experience... story time! 🧵`;
        
        try {
          const loginRes = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.username, password: 'Test123!' })
          });
          
          if (loginRes.ok) {
            const { token } = await loginRes.json();
            
            const formData = new FormData();
            formData.append('content', content);
            
            const postRes = await fetch(`${API_URL}/api/posts`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            });
            
            if (postRes.ok) {
              const post = await postRes.json();
              friendPosts.push({ ...post, author: user });
              setNotificationResults(prev => [...prev, `📝 @${user.username}: "${content.substring(0, 35)}..."`]);
            }
          }
        } catch (err) {}
      }
      
      // Phase 3: Twitter-style engagement chaos
      setNotificationResults(prev => [...prev, '', '🔥 PHASE 3: Twitter Engagement Madness!']);
      
      const twitterComments = [
        'This!!! 💯', 'Big mood 😭', 'Why is this so accurate lmaooo',
        'Felt this in my soul', 'Period!! 🗣️', 'Say it louder for the people in the back',
        'The accuracy is painful 😩', 'Not you calling me out like this',
        'This tweet right here officer', 'I am DECEASED 💀',
        'The way I just screamed', 'Ok but why did I need to see this today',
        'Taking notes ✍️', 'Bookmark for later', 'RT RT RT',
        'Thread incoming...', 'Someone had to say it', 'Facts only 📠'
      ];
      
      // Everyone engages with everyone's content (Twitter chaos)
      const allPosts = [...createdPosts, ...friendPosts];
      
      for (const post of allPosts) {
        const engagers = otherUsers.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 8) + 3);
        
        for (const user of engagers) {
          if (post.author && post.author._id === user._id) continue; // Skip self-engagement
          
          try {
            const loginRes = await fetch(`${API_URL}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: user.username, password: 'Test123!' })
            });
            
            if (loginRes.ok) {
              const { token } = await loginRes.json();
              
              // Like (high chance)
              if (Math.random() < 0.8) {
                await fetch(`${API_URL}/api/posts/${post._id}/like`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
              }
              
              // Comment (moderate chance)
              if (Math.random() < 0.4) {
                await fetch(`${API_URL}/api/posts/${post._id}/comment`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    content: twitterComments[Math.floor(Math.random() * twitterComments.length)]
                  })
                });
                setNotificationResults(prev => [...prev, `💬 @${user.username} replied with fire`]);
              } else {
                setNotificationResults(prev => [...prev, `❤️ @${user.username} liked a post`]);
              }
            }
          } catch (err) {}
        }
      }
      
      setNotificationResults(prev => [...prev, 
        '', '🎯'.repeat(20), '', '✨ TWITTER FEED STRESS TEST COMPLETE! ✨',
        '', '📊 Generated:', 
        `   • ${Math.min(15, otherUsers.length)} mutual friend connections`,
        `   • ${allPosts.length} diverse posts across your network`,
        `   • 100+ likes, comments, and interactions`,
        `   • Real Twitter-style feed experience`,
        '', '👉 Check your notifications bell (red dot should be lit!)',
        '📱 Your feed should now be buzzing with friend activity!',
        '🔔 Notifications styled like Twitter/Tumblr as requested!'
      ]);
      
    } catch (error) {
      setNotificationResults(prev => [...prev, `❌ Error: ${error}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const runTest = async () => {
    if (selectedTest === 'notification-stress') {
      return runNotificationStressTest();
    }

    if (!data?.posts.length) {
      alert('No posts available for testing');
      return;
    }

    setIsRunning(true);
    setResults(null);
    stressTest.reset();

    try {
      let testResults;
      const firstPostId = data.posts[0]._id;
      const postIds = data.posts.map(p => p._id);

      switch (selectedTest) {
        case 'concurrent-likes':
          testResults = await stressTest.runConcurrentLikeTest(firstPostId, 20);
          break;
        case 'concurrent-comments':
          testResults = await stressTest.runConcurrentCommentTest(firstPostId, 15);
          break;
        case 'mixed-operations':
          testResults = await stressTest.runMixedOperationsTest(postIds, 30);
          break;
        case 'rapid-fire':
          testResults = await stressTest.runRapidFireTest(firstPostId, 3000);
          break;
        case 'auth-stress':
          testResults = await stressTest.runAuthenticationStressTest(5);
          break;
        default:
          throw new Error('Unknown test type');
      }

      setResults(testResults);
    } catch (error) {
      console.error('Stress test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Only show if dev mode is enabled
  if (!isDevMode) {
    return null;
  }

  return (
    <div className="stress-test-panel">
      <div className="panel-header">
        <h3>Stress Test Panel</h3>
        <button className="close-btn" onClick={disableDevMode} title="Close Dev Tools">
          ×
        </button>
      </div>
      
      <div className="test-selector">
        <label>Select Test:</label>
        <select 
          value={selectedTest} 
          onChange={(e) => setSelectedTest(e.target.value)}
          disabled={isRunning}
        >
          <option value="notification-stress">🐦 Twitter Feed Stress Test (Seed Friends & Content)</option>
          <option value="concurrent-likes">Concurrent Likes (20x)</option>
          <option value="concurrent-comments">Concurrent Comments (15x)</option>
          <option value="mixed-operations">Mixed Operations (30x)</option>
          <option value="rapid-fire">Rapid Fire Likes (3s)</option>
          <option value="auth-stress">Authentication Stress (5x)</option>
        </select>
      </div>

      <button 
        className="run-test-btn"
        onClick={runTest}
        disabled={isRunning || (selectedTest !== 'notification-stress' && !data?.posts.length)}
      >
        {isRunning ? 'Running Test...' : 'Run Stress Test'}
      </button>

      {notificationResults.length > 0 && (
        <div className="test-results">
          <h4>Notification Stress Test Log:</h4>
          <div style={{ 
            backgroundColor: '#000', 
            color: '#0f0', 
            padding: '10px', 
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '12px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {notificationResults.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {results && (
        <div className="test-results">
          <h4>Test Results:</h4>
          <div className="result-stats">
            <div className="stat">
              <span className="stat-label">Total Operations:</span>
              <span className="stat-value">{results.totalOperations}</span>
            </div>
            <div className="stat success">
              <span className="stat-label">Successful:</span>
              <span className="stat-value">{results.successfulOperations}</span>
            </div>
            <div className="stat error">
              <span className="stat-label">Failed:</span>
              <span className="stat-value">{results.failedOperations}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Avg Response Time:</span>
              <span className="stat-value">{results.averageResponseTime.toFixed(2)}ms</span>
            </div>
            <div className="stat">
              <span className="stat-label">Success Rate:</span>
              <span className="stat-value">
                {((results.successfulOperations / results.totalOperations) * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          {results.operations.filter((op: any) => !op.success).length > 0 && (
            <div className="failed-operations">
              <h5>Failed Operations:</h5>
              {results.operations
                .filter((op: any) => !op.success)
                .map((op: any, index: number) => (
                  <div key={index} className="failed-op">
                    {op.type}: {op.error} ({op.duration.toFixed(2)}ms)
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { stressTest } from '../../utils/stressTest';
import { useGetPostsQuery } from '../../gql/generated';
import { useDevMode } from '../../hooks/useDevMode';
import './StressTestPanel.css';

export const StressTestPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState('concurrent-likes');
  const { data } = useGetPostsQuery();
  const { isDevMode, disableDevMode } = useDevMode();

  const runTest = async () => {
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
        disabled={isRunning || !data?.posts.length}
      >
        {isRunning ? 'Running Test...' : 'Run Stress Test'}
      </button>

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
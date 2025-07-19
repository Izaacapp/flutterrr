// Add this to your API server
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.BUILD_NUMBER || 'local'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

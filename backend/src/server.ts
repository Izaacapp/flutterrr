import mongoose from 'mongoose';
import { createServer } from 'http';
import app from './app'; // Import the configured app from app.ts
import { startCleanupJob } from './jobs/cleanupExpiredAccounts';
import { socketService } from './services/socket.service';

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

const start = async () => {
  if (!PORT) {
    throw new Error('PORT must be defined in your environment variables');
  }
  
  if (!MONGO_URI) {
    throw new Error('MONGO_URI must be defined in your environment variables');
  }

  try {
    // 1. Connect to the database
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected successfully.');

    // 2. Start cleanup job for expired accounts
    startCleanupJob();

    // 3. Create HTTP server and initialize Socket.io
    const httpServer = createServer(app);
    socketService.initialize(httpServer);

    // 4. Start the server listening for requests
    httpServer.listen(PORT, () => {
      console.log(`🚀 API Server running on port ${PORT}`);
      console.log(`🚀 GraphQL endpoint at http://${process.env.API_HOST}:${PORT}/graphql`);
      console.log(`🚀 WebSocket server ready for real-time updates`);
    });

  } catch (error) {
    console.error('❌ Failed to start server', error);
    process.exit(1);
  }
};

// Execute the start function
start();
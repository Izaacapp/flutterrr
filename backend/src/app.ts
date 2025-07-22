import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { ApolloServer } from 'apollo-server-express';
import graphqlSchema from './routes/graphql/schema';
import graphqlResolvers from './routes/graphql/resolvers';
import postRoutes from './routes/v1/post.routes';
import authRoutes from './routes/auth';
import userRoutes from './routes/v1/user.routes';
import healthRoutes from './routes/health';
import flightRoutes from './routes/v1/flight.routes';
import { env } from './config/env';
import errorHandler from './middleware/errorHandler';
import { validationRouter } from './services/boardingPassValidation.service';

const app = express();

// --- Middleware Setup ---
app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:3001']
}));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files when using local storage
if (env.STORAGE_TYPE === 'local') {
  const uploadsPath = path.resolve(env.UPLOAD_DIR);
  console.log('Serving static files from:', uploadsPath);
  app.use('/uploads', express.static(uploadsPath));
}

// --- Apollo Server Setup ---
const apolloServer = new ApolloServer({
  typeDefs: graphqlSchema,
  resolvers: graphqlResolvers,
  context: async ({ req }) => {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    
    // Verify the token and get user info
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET!;
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        
        // Import User model
        const User = require('./models/User').default;
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user) {
          return { userId: user._id.toString(), user };
        }
      } catch (error) {
        // Invalid token, return empty context
      }
    }
    
    return {};
  },
});

// We must start Apollo before applying it as middleware
apolloServer.start().then(() => {
  apolloServer.applyMiddleware({ app: app as any, path: '/graphql' });
});

// --- Route Setup ---
app.get('/', (_req, res) => res.json({ message: 'API running' }));

// Health and monitoring routes
app.use('/api', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/boarding-pass', validationRouter);

// --- Final Error Handler ---
app.use(errorHandler);


export default app;
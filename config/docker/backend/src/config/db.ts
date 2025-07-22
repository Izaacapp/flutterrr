import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import mongoose from 'mongoose';

const connectDB = async () => {
  // Configure mongoose connection settings
  mongoose.set('strictQuery', true);
  
  const connectionOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4
  };

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!, connectionOptions);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Event listeners for connection health
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose disconnected from DB');
    });

    // Close connection on process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    // Retry connection after delay
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
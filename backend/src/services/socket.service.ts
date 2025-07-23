import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map();

  initialize(httpServer: HttpServer) {
    console.log('🔌 SOCKET_SERVER: Initializing Socket.IO server...');
    
    this.io = new Server(httpServer, {
      cors: {
        origin: [
          process.env.FRONTEND_URL || 'http://localhost:3001',
          'http://localhost:5173',
          'http://localhost:3000'
        ],
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Authorization']
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    console.log('✅ SOCKET_SERVER: Server initialized with CORS origins:', [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:5173', 
      'http://localhost:3000'
    ]);

    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        console.log('🔐 SOCKET_AUTH: Authentication attempt for socket:', socket.id);
        console.log('🔐 SOCKET_AUTH: Handshake auth:', socket.handshake.auth);
        
        const token = socket.handshake.auth.token;
        if (!token) {
          console.log('❌ SOCKET_AUTH: No token provided');
          return next(new Error('No authentication token provided'));
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
        console.log('🔐 SOCKET_AUTH: Token verified for user:', payload.userId);
        
        const user = await User.findById(payload.userId).select('-password');
        if (!user) {
          console.log('❌ SOCKET_AUTH: User not found in database');
          return next(new Error('User not found'));
        }

        socket.userId = payload.userId;
        socket.user = user;
        console.log('✅ SOCKET_AUTH: Authentication successful for:', user.username);
        next();
      } catch (error) {
        console.error('❌ SOCKET_AUTH: Authentication failed:', (error as Error).message);
        next(new Error(`Authentication failed: ${(error as Error).message}`));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected`);

      if (socket.userId) {
        this.addUserSocket(socket.userId, socket.id);
        
        // Join user to their own room for private notifications
        socket.join(`user:${socket.userId}`);
        
        // Join user to their friends' feeds for real-time updates
        if (socket.user?.following) {
          socket.user.following.forEach((followingId: string) => {
            socket.join(`feed:${followingId}`);
          });
        }
      }

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        if (socket.userId) {
          this.removeUserSocket(socket.userId, socket.id);
        }
      });
    });
  }

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)?.add(socketId);
  }

  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  // Send notification to specific user
  sendNotification(userId: string, notification: any) {
    this.io?.to(`user:${userId}`).emit('newNotification', notification);
  }

  // Send to all followers when user creates a post
  notifyFollowers(userId: string, event: string, data: any) {
    this.io?.to(`feed:${userId}`).emit(event, data);
  }

  // Real-time post updates
  emitPostUpdate(postId: string, event: string, data: any) {
    this.io?.emit(`post:${event}`, { postId, ...data });
  }

  // Follow/unfollow events
  emitFollowEvent(followerId: string, followedId: string, isFollowing: boolean) {
    // Notify the followed user
    this.sendNotification(followedId, {
      type: 'follow',
      from: followerId,
      action: isFollowing ? 'followed' : 'unfollowed',
      timestamp: new Date()
    });

    // Update follower's feed subscriptions
    const followerSockets = this.userSockets.get(followerId);
    if (followerSockets) {
      followerSockets.forEach(socketId => {
        const socket = this.io?.sockets.sockets.get(socketId);
        if (socket) {
          if (isFollowing) {
            socket.join(`feed:${followedId}`);
          } else {
            socket.leave(`feed:${followedId}`);
          }
        }
      });
    }
  }

  getIO() {
    return this.io;
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}

export const socketService = new SocketService();
import { strictDateExtraction } from "../../../utils/dateStrict";
import mongoose from 'mongoose';
import { AuthenticationError } from 'apollo-server-express';
import Post, { IPost } from '../../../models/Post';
import User from '../../../models/User';
import { createPostSchema } from '@my-app/shared';
import { ZodError } from 'zod';

// KEY CHANGE: Changed `export const resolvers =` to `export default`
export default {
  RootQuery: {
    posts: async () => {
      try {
        if (mongoose.connection.readyState !== 1) {
          throw new Error('Database not connected');
        }
        const posts = await Post.find()
          .populate('author', 'username fullName avatar bio location homeAirport passportCountry milesFlown countriesVisited emailVerified')
          .populate('comments.author', 'username fullName avatar')
          .sort({ createdAt: -1 })
          .lean();
        
        return posts.map((post: any) => ({
          _id: post._id.toString(),
          author: post.author ? {
            _id: post.author._id.toString(),
            username: post.author.username,
            fullName: post.author.fullName,
            avatar: post.author.avatar
          } : null,
          content: post.content,
          images: post.images || [],
          likes: Array.isArray(post.likes) ? post.likes.map((id: any) => id?.toString() || '') : [],
          comments: (post.comments || []).map((comment: any) => ({
            _id: comment._id?.toString() || '',
            author: comment.author ? {
              _id: comment.author._id?.toString() || '',
              username: comment.author.username || '',
              fullName: comment.author.fullName || '',
              avatar: comment.author.avatar || null
            } : null,
            content: comment.content,
            createdAt: comment.createdAt ? comment.createdAt.toISOString() : strictDateExtraction().toISOString()
          })),
          createdAt: post.createdAt.toISOString()
        }));
      } catch (err) {
        console.error('Error fetching posts:', err);
        throw new Error('An error occurred while fetching posts.');
      }
    },
    user: async (_: any, { userId }: { userId?: string }, context: any) => {
      try {
        const id = userId || context.userId;
        if (!id) {
          throw new AuthenticationError('User ID required');
        }
        
        const user = await User.findById(id).lean();
        if (!user) {
          throw new Error('User not found');
        }
        
        return {
          _id: user._id.toString(),
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location,
          homeAirport: user.homeAirport,
          passportCountry: user.passportCountry,
          milesFlown: user.milesFlown,
          countriesVisited: user.countriesVisited || [],
          emailVerified: user.emailVerified
        };
      } catch (err) {
        console.error('Error fetching user:', err);
        throw err;
      }
    },
    me: async (_: any, __: any, context: any) => {
      try {
        if (!context.userId) {
          throw new AuthenticationError('Not authenticated');
        }
        
        const user = await User.findById(context.userId).lean();
        if (!user) {
          throw new Error('User not found');
        }
        
        return {
          _id: user._id.toString(),
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location,
          homeAirport: user.homeAirport,
          passportCountry: user.passportCountry,
          milesFlown: user.milesFlown,
          countriesVisited: user.countriesVisited || [],
          emailVerified: user.emailVerified
        };
      } catch (err) {
        console.error('Error fetching current user:', err);
        throw err;
      }
    }
  },
  RootMutation: {
    createPost: async (_: any, { postInput }: { postInput: { content: string } }, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.userId) {
          throw new AuthenticationError('You must be logged in to create a post');
        }
        
        const validated = createPostSchema.parse(postInput);
        const newPost = new Post({ 
          content: validated.content,
          author: context.userId,
          images: []
        });
        await newPost.save();
        
        await newPost.populate('author', 'username fullName avatar bio location homeAirport passportCountry milesFlown countriesVisited emailVerified');
        
        return {
          _id: newPost._id.toString(),
          author: newPost.author ? {
            _id: (newPost.author as any)._id.toString(),
            username: (newPost.author as any).username,
            fullName: (newPost.author as any).fullName,
            avatar: (newPost.author as any).avatar
          } : null,
          content: newPost.content,
          images: newPost.images || [],
          likes: [],
          comments: [],
          createdAt: newPost.createdAt.toISOString()
        };
      } catch (err) {
        if (err instanceof ZodError) {
          const validationErrorMessage = err.errors.map(e => e.message).join(', ');
          throw new AuthenticationError(`Validation error: ${validationErrorMessage}`);
        }
        console.error('Error creating post:', err);
        throw new Error('An error occurred while creating the post.');
      }
    },
    updateProfile: async (_: any, { input }: { input: any }, context: any) => {
      try {
        if (!context.userId) {
          throw new AuthenticationError('You must be logged in to update your profile');
        }
        
        // Build update object with only provided fields
        const updateData: any = {};
        
        if (input.fullName !== undefined) updateData.fullName = input.fullName;
        if (input.bio !== undefined) updateData.bio = input.bio;
        if (input.location !== undefined) updateData.location = input.location;
        if (input.homeAirport !== undefined) updateData.homeAirport = input.homeAirport;
        if (input.passportCountry !== undefined) updateData.passportCountry = input.passportCountry;
        if (input.avatar !== undefined) updateData.avatar = input.avatar;
        
        const user = await User.findByIdAndUpdate(
          context.userId,
          updateData,
          {
            new: true,
            runValidators: true
          }
        ).lean();
        
        if (!user) {
          throw new Error('User not found');
        }
        
        return {
          _id: user._id.toString(),
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location,
          homeAirport: user.homeAirport,
          passportCountry: user.passportCountry,
          milesFlown: user.milesFlown,
          countriesVisited: user.countriesVisited || [],
          emailVerified: user.emailVerified
        };
      } catch (err) {
        console.error('Error updating profile:', err);
        throw err;
      }
    }
  }
};
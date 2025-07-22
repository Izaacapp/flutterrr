import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import { NotificationService } from '../services/notification.service';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';

interface AuthRequest extends Request {
  userId?: string;
}

export const updateProfile = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { fullName, username, bio, location, homeAirport, passportCountry, avatar } = req.body;
  
  if (!req.userId) {
    return next(new AppError('User not authenticated', 401));
  }

  // Check if username is taken by another user (if username is being updated)
  if (username !== undefined) {
    const existingUser = await User.findOne({ 
      username: username.toLowerCase(), 
      _id: { $ne: req.userId } 
    });
    
    if (existingUser) {
      return next(new AppError('Username is already taken', 400));
    }
  }

  // Build update object with only provided fields
  const updateData: any = {};
  
  if (fullName !== undefined) updateData.fullName = fullName;
  if (username !== undefined) updateData.username = username.toLowerCase();
  if (bio !== undefined) updateData.bio = bio;
  if (location !== undefined) updateData.location = location;
  if (homeAirport !== undefined) updateData.homeAirport = homeAirport;
  if (passportCountry !== undefined) updateData.passportCountry = passportCountry;
  if (avatar !== undefined) updateData.avatar = avatar;

  // Update user
  const user = await User.findByIdAndUpdate(
    req.userId,
    updateData,
    {
      new: true,
      runValidators: true,
      select: '-password -otp -otpExpires -resetPasswordOTP -resetPasswordOTPExpires'
    }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

export const uploadAvatar = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (!req.uploadedAvatar) {
    return next(new AppError('No avatar uploaded', 400));
  }

  // Update user with new avatar URL
  const user = await User.findByIdAndUpdate(
    req.userId,
    { avatar: req.uploadedAvatar.url },
    {
      new: true,
      runValidators: true,
      select: '-password -otp -otpExpires -resetPasswordOTP -resetPasswordOTPExpires'
    }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
      avatar: req.uploadedAvatar
    }
  });
});

export const getProfile = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.params.userId || req.userId;
  
  const user = await User.findById(userId)
    .select('-password -otp -otpExpires -resetPasswordOTP -resetPasswordOTPExpires');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: user.toObject()
    }
  });
});

export const getProfileByUsername = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { username } = req.params;
  
  const user = await User.findOne({ username })
    .select('-password -otp -otpExpires -resetPasswordOTP -resetPasswordOTPExpires')
    .populate('followers', 'username fullName avatar')
    .populate('following', 'username fullName avatar');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if current user is following this user
  const isFollowing = req.userId ? user.followers?.some((follower: any) => follower._id.toString() === req.userId) : false;
  
  // Check if current user has blocked this user
  const currentUser = req.userId ? await User.findById(req.userId).select('blockedUsers') : null;
  const isBlocked = currentUser ? currentUser.blockedUsers?.includes(user._id as any) : false;

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        ...user.toObject(),
        isFollowing,
        isBlocked,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0
      }
    }
  });
});

export const followUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.userId;

  if (!currentUserId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (currentUserId === targetUserId) {
    return next(new AppError('You cannot follow yourself', 400));
  }

  const targetUser = await User.findById(targetUserId);
  const currentUser = await User.findById(currentUserId);

  if (!targetUser || !currentUser) {
    return next(new AppError('User not found', 404));
  }

  // Check if already following
  const isAlreadyFollowing = targetUser.followers?.includes(currentUserId as any);
  if (isAlreadyFollowing) {
    return next(new AppError('You are already following this user', 400));
  }

  // Add to target user's followers and current user's following
  await User.findByIdAndUpdate(targetUserId, {
    $addToSet: { followers: currentUserId }
  });
  
  await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { following: targetUserId }
  });

  // Create follow notification
  try {
    await NotificationService.createFollowNotification(
      targetUserId,
      currentUserId,
      currentUser
    );
  } catch (notificationError) {
    console.error('Error creating follow notification:', notificationError);
  }

  res.status(200).json({
    status: 'success',
    message: 'User followed successfully'
  });
});

export const unfollowUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.userId;

  if (!currentUserId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (currentUserId === targetUserId) {
    return next(new AppError('You cannot unfollow yourself', 400));
  }

  const targetUser = await User.findById(targetUserId);
  const currentUser = await User.findById(currentUserId);

  if (!targetUser || !currentUser) {
    return next(new AppError('User not found', 404));
  }

  // Check if not following
  const isFollowing = targetUser.followers?.includes(currentUserId as any);
  if (!isFollowing) {
    return next(new AppError('You are not following this user', 400));
  }

  // Remove from target user's followers and current user's following
  await User.findByIdAndUpdate(targetUserId, {
    $pull: { followers: currentUserId }
  });
  
  await User.findByIdAndUpdate(currentUserId, {
    $pull: { following: targetUserId }
  });

  res.status(200).json({
    status: 'success',
    message: 'User unfollowed successfully'
  });
});

export const blockUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.userId;

  if (!currentUserId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (currentUserId === targetUserId) {
    return next(new AppError('You cannot block yourself', 400));
  }

  const targetUser = await User.findById(targetUserId);
  const currentUser = await User.findById(currentUserId);

  if (!targetUser || !currentUser) {
    return next(new AppError('User not found', 404));
  }

  // Check if already blocked
  const isAlreadyBlocked = currentUser.blockedUsers?.includes(targetUserId as any);
  if (isAlreadyBlocked) {
    return next(new AppError('You have already blocked this user', 400));
  }

  // Block user - add to blocked list and remove from following/followers
  await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { blockedUsers: targetUserId },
    $pull: { following: targetUserId }
  });
  
  await User.findByIdAndUpdate(targetUserId, {
    $pull: { followers: currentUserId }
  });

  res.status(200).json({
    status: 'success',
    message: 'User blocked successfully'
  });
});

export const unblockUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.userId;

  if (!currentUserId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (currentUserId === targetUserId) {
    return next(new AppError('You cannot unblock yourself', 400));
  }

  const targetUser = await User.findById(targetUserId);
  const currentUser = await User.findById(currentUserId);

  if (!targetUser || !currentUser) {
    return next(new AppError('User not found', 404));
  }

  // Check if not blocked
  const isBlocked = currentUser.blockedUsers?.includes(targetUserId as any);
  if (!isBlocked) {
    return next(new AppError('You have not blocked this user', 400));
  }

  // Unblock user
  await User.findByIdAndUpdate(currentUserId, {
    $pull: { blockedUsers: targetUserId }
  });

  res.status(200).json({
    status: 'success',
    message: 'User unblocked successfully'
  });
});

export const bookmarkPost = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { postId } = req.params;
  const currentUserId = req.userId;

  if (!currentUserId) {
    return next(new AppError('User not authenticated', 401));
  }

  const post = await Post.findById(postId);
  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  const user = await User.findById(currentUserId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if post is already bookmarked
  const isBookmarked = user.bookmarks?.includes(postId as any);
  if (isBookmarked) {
    return next(new AppError('Post is already bookmarked', 400));
  }

  // Add post to bookmarks
  await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { bookmarks: postId }
  });

  res.status(200).json({
    status: 'success',
    message: 'Post bookmarked successfully'
  });
});

export const unbookmarkPost = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { postId } = req.params;
  const currentUserId = req.userId;

  if (!currentUserId) {
    return next(new AppError('User not authenticated', 401));
  }

  const user = await User.findById(currentUserId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if post is bookmarked
  const isBookmarked = user.bookmarks?.includes(postId as any);
  if (!isBookmarked) {
    return next(new AppError('Post is not bookmarked', 400));
  }

  // Remove post from bookmarks
  await User.findByIdAndUpdate(currentUserId, {
    $pull: { bookmarks: postId }
  });

  res.status(200).json({
    status: 'success',
    message: 'Post removed from bookmarks successfully'
  });
});

export const getBookmarks = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const currentUserId = req.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  if (!currentUserId) {
    return next(new AppError('User not authenticated', 401));
  }

  const user = await User.findById(currentUserId)
    .populate({
      path: 'bookmarks',
      populate: {
        path: 'author',
        select: 'username fullName avatar'
      },
      options: {
        sort: { createdAt: -1 },
        skip: skip,
        limit: limit
      }
    })
    .select('bookmarks');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get total bookmarks count for pagination
  const totalBookmarks = user.bookmarks?.length || 0;
  const totalPages = Math.ceil(totalBookmarks / limit);

  res.status(200).json({
    status: 'success',
    data: {
      bookmarks: user.bookmarks || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalBookmarks,
        hasMore: page < totalPages
      }
    }
  });
});
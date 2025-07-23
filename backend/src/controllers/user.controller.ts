import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import { notificationService } from '../services/notification.service';
import { socketService } from '../services/socket.service';

interface AuthRequest extends Request {
  userId?: string;
}

export const updateProfile = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { fullName, bio, location, homeAirport, passportCountry, avatar } = req.body;
  
  if (!req.userId) {
    return next(new AppError('User not authenticated', 401));
  }

  // Build update object with only provided fields
  const updateData: any = {};
  
  if (fullName !== undefined) updateData.fullName = fullName;
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
      user
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
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        homeAirport: user.homeAirport,
        passportCountry: user.passportCountry,
        milesFlown: user.milesFlown,
        countriesVisited: user.countriesVisited,
        emailVerified: user.emailVerified,
        isFollowing,
        isBlocked,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        followers: user.followers,
        following: user.following
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

  // Create notification
  await notificationService.createNotification({
    recipientId: targetUserId,
    senderId: currentUserId,
    type: 'follow',
    entityId: currentUserId,
    entityType: 'user'
  });

  // Emit real-time event
  socketService.emitFollowEvent(currentUserId, targetUserId, true);

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

  // Emit real-time event for unfollow
  socketService.emitFollowEvent(currentUserId, targetUserId, false);

  res.status(200).json({
    status: 'success',
    message: 'User unfollowed successfully'
  });
});

export const blockUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.userId;

  console.log(`[BLOCK_USER] Attempting to block user. Current user: ${currentUserId}, Target user: ${targetUserId}`);

  if (!currentUserId) {
    console.log('[BLOCK_USER] Failed: User not authenticated');
    return next(new AppError('User not authenticated', 401));
  }

  if (currentUserId === targetUserId) {
    console.log('[BLOCK_USER] Failed: User attempting to block themselves');
    return next(new AppError('You cannot block yourself', 400));
  }

  const targetUser = await User.findById(targetUserId);
  const currentUser = await User.findById(currentUserId);

  if (!targetUser || !currentUser) {
    console.log(`[BLOCK_USER] Failed: User not found. Target user exists: ${!!targetUser}, Current user exists: ${!!currentUser}`);
    return next(new AppError('User not found', 404));
  }

  console.log(`[BLOCK_USER] Found users. Target: ${targetUser.username}, Current: ${currentUser.username}`);

  // Check if already blocked
  const isAlreadyBlocked = currentUser.blockedUsers?.includes(targetUserId as any);
  console.log(`[BLOCK_USER] Is already blocked: ${isAlreadyBlocked}`);
  
  if (isAlreadyBlocked) {
    console.log('[BLOCK_USER] Failed: User already blocked');
    return next(new AppError('You have already blocked this user', 400));
  }

  console.log('[BLOCK_USER] Starting block operation...');

  // Block user - add to blocked list and remove from following/followers
  const currentUserUpdate = await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { blockedUsers: targetUserId },
    $pull: { following: targetUserId }
  });
  
  const targetUserUpdate = await User.findByIdAndUpdate(targetUserId, {
    $pull: { followers: currentUserId }
  });

  console.log(`[BLOCK_USER] Block operation completed. Current user updated: ${!!currentUserUpdate}, Target user updated: ${!!targetUserUpdate}`);

  // Verify the block was successful
  const updatedCurrentUser = await User.findById(currentUserId).select('blockedUsers following');
  const isNowBlocked = updatedCurrentUser?.blockedUsers?.includes(targetUserId as any);
  const isStillFollowing = updatedCurrentUser?.following?.includes(targetUserId as any);
  
  console.log(`[BLOCK_USER] Verification - User is now blocked: ${isNowBlocked}, Still following: ${isStillFollowing}`);

  res.status(200).json({
    status: 'success',
    message: 'User blocked successfully'
  });
});

export const unblockUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.userId;

  console.log(`[UNBLOCK_USER] Attempting to unblock user. Current user: ${currentUserId}, Target user: ${targetUserId}`);

  if (!currentUserId) {
    console.log('[UNBLOCK_USER] Failed: User not authenticated');
    return next(new AppError('User not authenticated', 401));
  }

  if (currentUserId === targetUserId) {
    console.log('[UNBLOCK_USER] Failed: User attempting to unblock themselves');
    return next(new AppError('You cannot unblock yourself', 400));
  }

  const targetUser = await User.findById(targetUserId);
  const currentUser = await User.findById(currentUserId);

  if (!targetUser || !currentUser) {
    console.log(`[UNBLOCK_USER] Failed: User not found. Target user exists: ${!!targetUser}, Current user exists: ${!!currentUser}`);
    return next(new AppError('User not found', 404));
  }

  console.log(`[UNBLOCK_USER] Found users. Target: ${targetUser.username}, Current: ${currentUser.username}`);

  // Check if not blocked
  const isBlocked = currentUser.blockedUsers?.includes(targetUserId as any);
  console.log(`[UNBLOCK_USER] Is currently blocked: ${isBlocked}`);
  
  if (!isBlocked) {
    console.log('[UNBLOCK_USER] Failed: User was not blocked');
    return next(new AppError('You have not blocked this user', 400));
  }

  console.log('[UNBLOCK_USER] Starting unblock operation...');

  // Unblock user
  const updateResult = await User.findByIdAndUpdate(currentUserId, {
    $pull: { blockedUsers: targetUserId }
  });

  console.log(`[UNBLOCK_USER] Unblock operation completed. User updated: ${!!updateResult}`);

  // Verify the unblock was successful
  const updatedCurrentUser = await User.findById(currentUserId).select('blockedUsers');
  const isStillBlocked = updatedCurrentUser?.blockedUsers?.includes(targetUserId as any);
  
  console.log(`[UNBLOCK_USER] Verification - User is still blocked: ${isStillBlocked}`);

  res.status(200).json({
    status: 'success',
    message: 'User unblocked successfully'
  });
});

export const searchUsers = catchAsync(async (req: AuthRequest, res: Response) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.json({
      status: 'success',
      users: []
    });
  }

  const searchQuery = q.trim();
  
  // Search by username or full name (case insensitive)
  const users = await User.find({
    $or: [
      { username: { $regex: searchQuery, $options: 'i' } },
      { fullName: { $regex: searchQuery, $options: 'i' } }
    ]
  })
  .select('username fullName avatar bio')
  .limit(10);

  res.json({
    status: 'success',
    users
  });
});
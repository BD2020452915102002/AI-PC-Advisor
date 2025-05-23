const { User, Profile } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Get user profile by user ID
 */
exports.getProfileByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const profile = await Profile.findOne({
      where: { userId },
      include: [{ model: User, attributes: ['id', 'username', 'email', 'isActive'] }]
    });
    
    if (!profile) {
      return next(new ApiError('Profile not found', 'NotFoundError'));
    }
    
    res.status(200).json(profile);
  } catch (error) {
    logger.error(`Error fetching profile for user ID ${req.params.userId}:`, error);
    next(new ApiError('Failed to fetch profile', 'ServerError', error.message));
  }
};

/**
 * Get current user's profile
 */
exports.getCurrentUserProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(new ApiError('User not authenticated', 'AuthenticationError'));
    }
    
    // First find the internal user by Keycloak ID
    const user = await User.findOne({
      where: { keycloakId: req.user.id }
    });
    
    if (!user) {
      return next(new ApiError('User not found in database', 'NotFoundError'));
    }
    
    // Then get the profile
    const profile = await Profile.findOne({
      where: { userId: user.id }
    });
    
    if (!profile) {
      return next(new ApiError('Profile not found for this user', 'NotFoundError'));
    }
    
    res.status(200).json(profile);
  } catch (error) {
    logger.error('Error fetching current user profile:', error);
    next(new ApiError('Failed to fetch profile', 'ServerError', error.message));
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Validate if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new ApiError('User not found', 'NotFoundError'));
    }
    
    // Check if user is allowed to update this profile
    const isAdmin = req.user.roles.includes('admin');
    const isOwnProfile = user.keycloakId === req.user.id;
    
    if (!isAdmin && !isOwnProfile) {
      return next(new ApiError('You are not authorized to update this profile', 'ForbiddenError'));
    }
    
    // Find or create the profile
    let profile = await Profile.findOne({ where: { userId } });
    
    if (!profile) {
      profile = await Profile.create({
        userId,
        ...updateData
      });
      
      return res.status(201).json(profile);
    }
    
    // Update the profile
    await profile.update(updateData);
    
    res.status(200).json(profile);
  } catch (error) {
    logger.error(`Error updating profile for user ID ${req.params.userId}:`, error);
    next(new ApiError('Failed to update profile', 'ServerError', error.message));
  }
};

/**
 * Update profile picture
 * In a real implementation, this would handle file uploads
 */
exports.updateProfilePicture = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // In a real implementation, this would process the uploaded file
    // For now, we just update the avatar URL from the request
    const { avatarUrl } = req.body;
    
    if (!avatarUrl) {
      return next(new ApiError('Avatar URL is required', 'ValidationError'));
    }
    
    // Validate if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new ApiError('User not found', 'NotFoundError'));
    }
    
    // Check if user is allowed to update this profile
    const isAdmin = req.user.roles.includes('admin');
    const isOwnProfile = user.keycloakId === req.user.id;
    
    if (!isAdmin && !isOwnProfile) {
      return next(new ApiError('You are not authorized to update this profile', 'ForbiddenError'));
    }
    
    // Find or create the profile
    let profile = await Profile.findOne({ where: { userId } });
    
    if (!profile) {
      profile = await Profile.create({
        userId,
        avatar: avatarUrl
      });
      
      return res.status(201).json(profile);
    }
    
    // Update the profile picture
    await profile.update({ avatar: avatarUrl });
    
    res.status(200).json(profile);
  } catch (error) {
    logger.error(`Error updating profile picture for user ID ${req.params.userId}:`, error);
    next(new ApiError('Failed to update profile picture', 'ServerError', error.message));
  }
}; 
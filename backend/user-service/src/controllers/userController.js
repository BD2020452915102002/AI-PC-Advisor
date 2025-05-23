const { User, Profile } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows: users } = await User.findAndCountAll({
      limit,
      offset,
      include: [{ model: Profile, as: 'profile' }],
      order: [['createdAt', 'DESC']]
    });
    
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      users,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    next(new ApiError('Failed to fetch users', 'ServerError', error.message));
  }
};

/**
 * Get user by ID
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      include: [{ model: Profile, as: 'profile' }]
    });
    
    if (!user) {
      return next(new ApiError('User not found', 'NotFoundError'));
    }
    
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Error fetching user with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to fetch user', 'ServerError', error.message));
  }
};

/**
 * Get current user profile (based on token)
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(new ApiError('User not authenticated', 'AuthenticationError'));
    }
    
    // Find user by Keycloak ID
    const user = await User.findOne({
      where: { keycloakId: req.user.id },
      include: [{ model: Profile, as: 'profile' }]
    });
    
    if (!user) {
      return next(new ApiError('User not found in database', 'NotFoundError'));
    }
    
    res.status(200).json(user);
  } catch (error) {
    logger.error('Error fetching current user:', error);
    next(new ApiError('Failed to fetch current user', 'ServerError', error.message));
  }
};

/**
 * Create or update user from Keycloak data
 * This is called after successful Keycloak authentication
 */
exports.syncUserFromKeycloak = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(new ApiError('User data not available', 'ValidationError'));
    }
    
    const keycloakUser = req.user;
    
    // Find or create the user
    const [user, created] = await User.findOrCreate({
      where: { keycloakId: keycloakUser.id },
      defaults: {
        email: keycloakUser.email,
        username: keycloakUser.preferred_username,
        emailVerified: keycloakUser.email_verified || false,
        userRole: keycloakUser.roles.includes('admin') ? 'admin' : 'customer',
        lastLogin: new Date()
      }
    });
    
    // If user already exists, update the details
    if (!created) {
      await user.update({
        email: keycloakUser.email,
        username: keycloakUser.preferred_username,
        emailVerified: keycloakUser.email_verified || false,
        userRole: keycloakUser.roles.includes('admin') ? 'admin' : 'customer',
        lastLogin: new Date()
      });
    }
    
    // Create or update profile
    let profile = await Profile.findOne({ where: { userId: user.id } });
    
    if (!profile) {
      profile = await Profile.create({
        userId: user.id,
        firstName: keycloakUser.given_name || '',
        lastName: keycloakUser.family_name || ''
      });
    } else {
      await profile.update({
        firstName: keycloakUser.given_name || profile.firstName,
        lastName: keycloakUser.family_name || profile.lastName
      });
    }
    
    const result = await User.findByPk(user.id, {
      include: [{ model: Profile, as: 'profile' }]
    });
    
    res.status(created ? 201 : 200).json(result);
  } catch (error) {
    logger.error('Error syncing user from Keycloak:', error);
    next(new ApiError('Failed to sync user data', 'ServerError', error.message));
  }
};

/**
 * Update user information (partial update)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validate if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return next(new ApiError('User not found', 'NotFoundError'));
    }
    
    // Check if user is allowed to update this profile
    const isAdmin = req.user.roles.includes('admin');
    const isOwnProfile = user.keycloakId === req.user.id;
    
    if (!isAdmin && !isOwnProfile) {
      return next(new ApiError('You are not authorized to update this user', 'ForbiddenError'));
    }
    
    // Prevent updating certain fields
    const forbiddenFields = ['id', 'keycloakId', 'email', 'username', 'emailVerified'];
    const hasIllegalFields = forbiddenFields.some(field => updateData[field] !== undefined);
    
    if (hasIllegalFields) {
      return next(new ApiError('Cannot update protected fields', 'ForbiddenError'));
    }
    
    // Only admins can update user role
    if (updateData.userRole && !isAdmin) {
      return next(new ApiError('Only administrators can update user roles', 'ForbiddenError'));
    }
    
    await user.update(updateData);
    
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Error updating user with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to update user', 'ServerError', error.message));
  }
};

/**
 * Deactivate a user account
 */
exports.deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return next(new ApiError('User not found', 'NotFoundError'));
    }
    
    // Check if user is allowed to deactivate this account
    const isAdmin = req.user.roles.includes('admin');
    const isOwnProfile = user.keycloakId === req.user.id;
    
    if (!isAdmin && !isOwnProfile) {
      return next(new ApiError('You are not authorized to deactivate this user', 'ForbiddenError'));
    }
    
    await user.update({ isActive: false });
    
    // In a real implementation, you might also want to notify Keycloak to disable the user there
    
    res.status(200).json({ message: 'User account deactivated successfully', user });
  } catch (error) {
    logger.error(`Error deactivating user with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to deactivate user', 'ServerError', error.message));
  }
}; 
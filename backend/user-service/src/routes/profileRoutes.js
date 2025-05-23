const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { isAuthenticated, hasRole, extractUserInfo } = require('../middlewares/auth');
const { User } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');

// Protected routes
router.get('/me', isAuthenticated, extractUserInfo, profileController.getCurrentUserProfile);
router.put('/me', isAuthenticated, extractUserInfo, (req, res, next) => {
  // Get the user ID from the current user and pass it to updateProfile
  if (req.user && req.user.id) {
    const user = User.findOne({ where: { keycloakId: req.user.id } });
    if (user) {
      req.params.userId = user.id;
      return profileController.updateProfile(req, res, next);
    }
  }
  return next(new ApiError('User not authenticated', 'AuthenticationError'));
});

// User profile routes
router.get('/users/:userId', isAuthenticated, extractUserInfo, profileController.getProfileByUserId);
router.put('/users/:userId', isAuthenticated, extractUserInfo, profileController.updateProfile);
router.post('/users/:userId/avatar', isAuthenticated, extractUserInfo, profileController.updateProfilePicture);

module.exports = router; 
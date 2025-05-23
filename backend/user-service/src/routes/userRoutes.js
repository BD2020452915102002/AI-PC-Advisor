const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, hasRole, extractUserInfo } = require('../middlewares/auth');

// Public routes
router.post('/sync', isAuthenticated, extractUserInfo, userController.syncUserFromKeycloak);

// Protected routes
router.get('/me', isAuthenticated, extractUserInfo, userController.getCurrentUser);
router.put('/me', isAuthenticated, extractUserInfo, userController.updateUser);

// Admin only routes
router.get('/', isAuthenticated, extractUserInfo, hasRole('admin'), userController.getAllUsers);
router.get('/:id', isAuthenticated, extractUserInfo, userController.getUserById);
router.put('/:id', isAuthenticated, extractUserInfo, userController.updateUser);
router.put('/:id/deactivate', isAuthenticated, extractUserInfo, userController.deactivateUser);

module.exports = router; 
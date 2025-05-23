const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { isAuthenticated, extractUserInfo } = require('../middlewares/auth');
const { User } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');

// Get user addresses
router.get('/users/:userId', isAuthenticated, extractUserInfo, addressController.getUserAddresses);

// Get, update, delete specific address
router.get('/:id', isAuthenticated, extractUserInfo, addressController.getAddressById);
router.put('/:id', isAuthenticated, extractUserInfo, addressController.updateAddress);
router.delete('/:id', isAuthenticated, extractUserInfo, addressController.deleteAddress);
router.put('/:id/default', isAuthenticated, extractUserInfo, addressController.setDefaultAddress);

// Create new address
router.post('/users/:userId', isAuthenticated, extractUserInfo, addressController.createAddress);

module.exports = router; 
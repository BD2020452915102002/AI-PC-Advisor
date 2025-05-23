const { User, Address, sequelize } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Get all addresses for a user
 */
exports.getUserAddresses = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Validate if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new ApiError('User not found', 'NotFoundError'));
    }
    
    // Check if user is allowed to access these addresses
    const isAdmin = req.user.roles.includes('admin');
    const isOwnAddresses = user.keycloakId === req.user.id;
    
    if (!isAdmin && !isOwnAddresses) {
      return next(new ApiError('You are not authorized to access these addresses', 'ForbiddenError'));
    }
    
    const addresses = await Address.findAll({
      where: { userId },
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });
    
    res.status(200).json(addresses);
  } catch (error) {
    logger.error(`Error fetching addresses for user ID ${req.params.userId}:`, error);
    next(new ApiError('Failed to fetch addresses', 'ServerError', error.message));
  }
};

/**
 * Get a specific address by ID
 */
exports.getAddressById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const address = await Address.findByPk(id);
    
    if (!address) {
      return next(new ApiError('Address not found', 'NotFoundError'));
    }
    
    // Fetch the user to check authorization
    const user = await User.findByPk(address.userId);
    
    // Check if user is allowed to access this address
    const isAdmin = req.user.roles.includes('admin');
    const isOwnAddress = user.keycloakId === req.user.id;
    
    if (!isAdmin && !isOwnAddress) {
      return next(new ApiError('You are not authorized to access this address', 'ForbiddenError'));
    }
    
    res.status(200).json(address);
  } catch (error) {
    logger.error(`Error fetching address with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to fetch address', 'ServerError', error.message));
  }
};

/**
 * Create a new address for a user
 */
exports.createAddress = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const addressData = req.body;
    
    // Validate if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new ApiError('User not found', 'NotFoundError'));
    }
    
    // Check if user is allowed to create an address for this user
    const isAdmin = req.user.roles.includes('admin');
    const isOwnAddress = user.keycloakId === req.user.id;
    
    if (!isAdmin && !isOwnAddress) {
      return next(new ApiError('You are not authorized to create addresses for this user', 'ForbiddenError'));
    }
    
    // Check if this will be the first address (make it default)
    const addressCount = await Address.count({ where: { userId } });
    if (addressCount === 0) {
      addressData.isDefault = true;
    }
    
    // Create the address
    const address = await Address.create({
      ...addressData,
      userId
    });
    
    res.status(201).json(address);
  } catch (error) {
    logger.error(`Error creating address for user ID ${req.params.userId}:`, error);
    next(new ApiError('Failed to create address', 'ServerError', error.message));
  }
};

/**
 * Update an address
 */
exports.updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find the address
    const address = await Address.findByPk(id);
    
    if (!address) {
      return next(new ApiError('Address not found', 'NotFoundError'));
    }
    
    // Fetch the user to check authorization
    const user = await User.findByPk(address.userId);
    
    // Check if user is allowed to update this address
    const isAdmin = req.user.roles.includes('admin');
    const isOwnAddress = user.keycloakId === req.user.id;
    
    if (!isAdmin && !isOwnAddress) {
      return next(new ApiError('You are not authorized to update this address', 'ForbiddenError'));
    }
    
    // Update the address
    await address.update(updateData);
    
    res.status(200).json(address);
  } catch (error) {
    logger.error(`Error updating address with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to update address', 'ServerError', error.message));
  }
};

/**
 * Set an address as default
 */
exports.setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the address
    const address = await Address.findByPk(id);
    
    if (!address) {
      return next(new ApiError('Address not found', 'NotFoundError'));
    }
    
    // Fetch the user to check authorization
    const user = await User.findByPk(address.userId);
    
    // Check if user is allowed to update this address
    const isAdmin = req.user.roles.includes('admin');
    const isOwnAddress = user.keycloakId === req.user.id;
    
    if (!isAdmin && !isOwnAddress) {
      return next(new ApiError('You are not authorized to update this address', 'ForbiddenError'));
    }
    
    // Set all other addresses as non-default
    await Address.update(
      { isDefault: false },
      { 
        where: { 
          userId: address.userId,
          addressType: address.addressType,
          id: { [sequelize.Sequelize.Op.ne]: id }
        }
      }
    );
    
    // Set this address as default
    await address.update({ isDefault: true });
    
    res.status(200).json(address);
  } catch (error) {
    logger.error(`Error setting address ${req.params.id} as default:`, error);
    next(new ApiError('Failed to set default address', 'ServerError', error.message));
  }
};

/**
 * Delete an address
 */
exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the address
    const address = await Address.findByPk(id);
    
    if (!address) {
      return next(new ApiError('Address not found', 'NotFoundError'));
    }
    
    // Fetch the user to check authorization
    const user = await User.findByPk(address.userId);
    
    // Check if user is allowed to delete this address
    const isAdmin = req.user.roles.includes('admin');
    const isOwnAddress = user.keycloakId === req.user.id;
    
    if (!isAdmin && !isOwnAddress) {
      return next(new ApiError('You are not authorized to delete this address', 'ForbiddenError'));
    }
    
    // Check if this is the default address
    if (address.isDefault) {
      // Find another address to make default
      const otherAddress = await Address.findOne({
        where: {
          userId: address.userId,
          addressType: address.addressType,
          id: { [sequelize.Sequelize.Op.ne]: id }
        }
      });
      
      if (otherAddress) {
        await otherAddress.update({ isDefault: true });
      }
    }
    
    // Delete the address
    await address.destroy();
    
    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting address with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to delete address', 'ServerError', error.message));
  }
}; 
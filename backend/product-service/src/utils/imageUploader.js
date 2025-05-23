const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} folder - Folder to upload to on Cloudinary
 * @returns {Promise<Object>} - Upload result with public_id and secure_url
 */
const uploadImage = async (fileBuffer, folder = 'products') => {
  try {
    // Convert buffer to base64
    const base64Image = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
    
    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(base64Image, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1000, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    });
    
    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    logger.error(`Error uploading image to Cloudinary: ${error.message}`);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} - Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error(`Error deleting image from Cloudinary: ${error.message}`);
    throw error;
  }
};

module.exports = {
  uploadImage,
  deleteImage
}; 
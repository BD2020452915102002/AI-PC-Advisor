const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductImage = sequelize.define('ProductImage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    publicId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Cloudinary public ID for image management'
    },
    alt: {
      type: DataTypes.STRING,
      allowNull: true
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Display order of images'
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isMain: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this is the main product image'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'product_images',
    timestamps: true,
    indexes: [
      {
        fields: ['productId']
      },
      {
        fields: ['isMain']
      }
    ]
  });

  return ProductImage;
}; 
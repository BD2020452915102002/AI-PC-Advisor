const { DataTypes } = require('sequelize');
const slugify = require('slugify');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 100]
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    shortDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    compareAtPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    dimensions: {
      type: DataTypes.JSONB, // { length, width, height }
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isHighlighted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isNew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isOnSale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 5
      }
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
    tableName: 'products',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug']
      },
      {
        fields: ['categoryId']
      },
      {
        fields: ['brandId']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['isHighlighted']
      }
    ],
    hooks: {
      beforeValidate: (product) => {
        if (product.name) {
          product.slug = slugify(product.name, {
            lower: true,
            strict: true,
            trim: true,
            remove: /[*+~.()'"!:@]/g
          });
          
          // Ensure unique slug by adding a timestamp if name wasn't changed
          if (product.changed('name') === false && product.changed('slug') === false) {
            product.slug = `${product.slug}-${Date.now()}`;
          }
        }
      }
    }
  });

  return Product;
}; 
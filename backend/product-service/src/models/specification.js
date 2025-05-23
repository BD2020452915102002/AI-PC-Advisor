const { DataTypes } = require('sequelize');
const slugify = require('slugify');

module.exports = (sequelize) => {
  const Specification = sequelize.define('Specification', {
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
        len: [2, 50]
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Unit of measurement (e.g., GHz, GB, mm)'
    },
    dataType: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'date'),
      defaultValue: 'string',
      comment: 'Data type for validation'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isFilterable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this spec can be used as a filter'
    },
    isComparable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this spec can be used in product comparisons'
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Optional category association for category-specific specs'
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
    tableName: 'specifications',
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
        fields: ['isFilterable']
      }
    ],
    hooks: {
      beforeValidate: (specification) => {
        if (specification.name) {
          specification.slug = slugify(specification.name, {
            lower: true,
            strict: true,
            trim: true
          });
        }
      }
    }
  });

  // Category association defined in index.js
  
  return Specification;
}; 
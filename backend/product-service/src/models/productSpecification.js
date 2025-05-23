const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductSpecification = sequelize.define('ProductSpecification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    specificationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'specifications',
        key: 'id'
      }
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Specification value (stored as string, convert based on dataType)'
    },
    displayValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Formatted value for display (includes unit)'
    },
    numericValue: {
      type: DataTypes.DECIMAL(15, 5),
      allowNull: true,
      comment: 'Numeric value for sorting and filtering (if applicable)'
    },
    isHighlighted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this spec should be highlighted in product listing'
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
    tableName: 'product_specifications',
    timestamps: true,
    indexes: [
      {
        fields: ['productId']
      },
      {
        fields: ['specificationId']
      },
      {
        unique: true,
        fields: ['productId', 'specificationId']
      },
      {
        fields: ['isHighlighted']
      }
    ],
    hooks: {
      beforeCreate: async (productSpec) => {
        await formatSpecificationValue(productSpec, sequelize);
      },
      beforeUpdate: async (productSpec) => {
        if (productSpec.changed('value')) {
          await formatSpecificationValue(productSpec, sequelize);
        }
      }
    }
  });

  return ProductSpecification;
};

/**
 * Format specification value based on data type
 */
async function formatSpecificationValue(productSpec, sequelize) {
  try {
    const specification = await sequelize.models.Specification.findByPk(productSpec.specificationId);
    
    if (specification) {
      // Set numeric value for sorting/filtering if applicable
      if (specification.dataType === 'number') {
        const numValue = parseFloat(productSpec.value);
        productSpec.numericValue = isNaN(numValue) ? null : numValue;
      }
      
      // Create displayValue with unit if applicable
      if (specification.unit) {
        productSpec.displayValue = `${productSpec.value} ${specification.unit}`;
      } else {
        productSpec.displayValue = productSpec.value;
      }
    }
  } catch (error) {
    console.error('Error formatting specification value:', error);
  }
} 
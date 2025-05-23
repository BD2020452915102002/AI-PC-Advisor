const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Address = sequelize.define('Address', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    addressType: {
      type: DataTypes.ENUM('shipping', 'billing', 'both'),
      defaultValue: 'shipping'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    recipientName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    streetAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    apartmentNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    district: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ward: {
      type: DataTypes.STRING,
      allowNull: true
    },
    province: {
      type: DataTypes.STRING,
      allowNull: false
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: 'Vietnam'
    },
    additionalInfo: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'addresses',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      }
    ]
  });

  // Class methods
  Address.associate = (models) => {
    Address.belongsTo(models.User, { foreignKey: 'userId' });
  };
  
  // Hooks to ensure only one default address
  Address.beforeCreate(async (address, options) => {
    if (address.isDefault) {
      await updateDefaultAddresses(address, options);
    }
  });

  Address.beforeUpdate(async (address, options) => {
    if (address.isDefault && address.changed('isDefault')) {
      await updateDefaultAddresses(address, options);
    }
  });

  // Helper function to ensure only one default address for a user
  const updateDefaultAddresses = async (address, options) => {
    // Only update other addresses if this one is being set as default
    if (address.isDefault) {
      await sequelize.models.Address.update(
        { isDefault: false },
        { 
          where: { 
            userId: address.userId, 
            addressType: address.addressType,
            id: { [sequelize.Sequelize.Op.ne]: address.id || null }
          },
          transaction: options.transaction
        }
      );
    }
  };
  
  return Address;
}; 
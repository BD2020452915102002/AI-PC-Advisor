const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    keycloakId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'User ID from Keycloak'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    userRole: {
      type: DataTypes.ENUM('customer', 'admin', 'support'),
      defaultValue: 'customer'
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[0-9\+\-\s]+$/i // Basic phone validation
      }
    },
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['keycloakId']
      },
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['username']
      }
    ]
  });

  // Class methods
  User.associate = (models) => {
    User.hasOne(models.Profile, { foreignKey: 'userId', as: 'profile' });
    User.hasMany(models.Address, { foreignKey: 'userId', as: 'addresses' });
  };

  // Instance methods
  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    // Remove sensitive data
    delete values.password;
    delete values.keycloakId;
    return values;
  };

  return User;
}; 
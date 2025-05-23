const { DataTypes } = require('sequelize');
const slugify = require('slugify');

module.exports = (sequelize) => {
  const Category = sequelize.define('Category', {
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
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metaTitle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metaDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    path: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Full path of category hierarchy (e.g., /components/storage/ssd)'
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Hierarchy level (1 = root, 2 = child of root, etc.)'
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
    tableName: 'categories',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug']
      },
      {
        fields: ['parentId']
      },
      {
        fields: ['isActive']
      }
    ],
    hooks: {
      beforeValidate: (category) => {
        if (category.name) {
          category.slug = slugify(category.name, {
            lower: true,
            strict: true,
            trim: true
          });
        }
      },
      afterCreate: async (category) => {
        if (!category.parentId) {
          // Root category
          await category.update({
            path: `/${category.slug}`,
            level: 1
          });
        } else {
          // Child category - find parent and build path
          const parent = await sequelize.models.Category.findByPk(category.parentId);
          if (parent) {
            await category.update({
              path: `${parent.path}/${category.slug}`,
              level: parent.level + 1
            });
          }
        }
      }
    }
  });

  return Category;
}; 
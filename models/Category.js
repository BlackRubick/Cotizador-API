const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.STRING(300),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 300]
    }
  },
  slug: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true
  },
  imageFilename: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  imageOriginalName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  imagePath: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  imageSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  imageMimetype: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  parentCategoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  productCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'categories',
  hooks: {
    beforeSave: (category) => {
      // Generate slug from name
      if (category.changed('name')) {
        category.slug = category.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim('-');
      }
    }
  }
});

// Self-referencing association for parent-child relationship
Category.belongsTo(Category, { 
  as: 'parentCategory', 
  foreignKey: 'parentCategoryId' 
});

Category.hasMany(Category, { 
  as: 'subcategories', 
  foreignKey: 'parentCategoryId' 
});

module.exports = Category;
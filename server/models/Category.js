'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define(
    'Category',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      description: { type: DataTypes.STRING(500), allowNull: true },
      iconUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'icon_url' },
      cloudinaryPublicId: { type: DataTypes.STRING(255), allowNull: true, field: 'cloudinary_public_id' },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    },
    { tableName: 'categories', indexes: [{ fields: ['is_active'] }] }
  );

  Category.associate = (models) => {
    Category.hasMany(models.ClothingItem, { foreignKey: 'categoryId', as: 'items' });
    Category.belongsToMany(models.User, {
      through: models.UserInterests,
      foreignKey: 'categoryId',
      otherKey: 'userId',
      as: 'interestedUsers',
    });
  };

  return Category;
};

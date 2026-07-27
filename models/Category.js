const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('spending', 'saving'),
    allowNull: false,
  },
}, {
  tableName: 'categories',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name', 'type'],
    },
  ],
});

module.exports = Category;

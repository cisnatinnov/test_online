const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const News = sequelize.define('News', {
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.ENUM('sports', 'politics', 'criminal'),
    allowNull: false,
  },
  source: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'news',
  timestamps: true,
  indexes: [
    { fields: ['category'] },
    { fields: ['published_at'] },
    { fields: ['category', 'published_at'] },
  ],
});

module.exports = News;

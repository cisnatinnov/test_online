const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Saving = sequelize.define('Saving', {
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'savings',
  timestamps: true,
});

module.exports = Saving;

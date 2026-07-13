const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Estate = sequelize.define('Estate', {
  width: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  length: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
}, {
  tableName: 'estates',
  timestamps: true,
});

module.exports = Estate;

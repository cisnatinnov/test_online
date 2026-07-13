const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tree = sequelize.define('Tree', {
  x: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0 },
  },
  y: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0 },
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 30 },
  },
}, {
  tableName: 'trees',
  timestamps: true,
});

module.exports = Tree;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BloodSugar = sequelize.define('BloodSugar', {
  age: {
    type: DataTypes.INTEGER,
  },
  result: {
    type: DataTypes.STRING(50),
  },
  conclusion: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING(10),
    defaultValue: 'current',
  },
}, {
  tableName: 'bloodsugar',
  timestamps: true,
});

module.exports = BloodSugar;

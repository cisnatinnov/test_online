const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BMI = sequelize.define('BMI', {
  weight: {
    type: DataTypes.DECIMAL,
  },
  age: {
    type: DataTypes.INTEGER,
  },
  result: {
    type: DataTypes.FLOAT,
  },
  bmi_status: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING(10),
    defaultValue: 'current',
  },
}, {
  tableName: 'bmi',
  timestamps: true,
});

module.exports = BMI;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Identity = sequelize.define('Identity', {
  nik: {
    type: DataTypes.STRING(20),
  },
  name: {
    type: DataTypes.STRING(255),
  },
  height: {
    type: DataTypes.DECIMAL,
  },
  birthplace: {
    type: DataTypes.STRING(255),
  },
  birthdate: {
    type: DataTypes.DATEONLY,
  },
  address: {
    type: DataTypes.STRING(255),
  },
}, {
  tableName: 'identity',
  timestamps: true,
});

module.exports = Identity;

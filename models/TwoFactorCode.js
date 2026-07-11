const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TwoFactorCode = sequelize.define('TwoFactorCode', {
  code: {
    type: DataTypes.STRING(6),
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  channel: {
    type: DataTypes.STRING(20),
    defaultValue: 'email',
  },
}, {
  tableName: 'two_factor_codes',
  timestamps: true,
});

module.exports = TwoFactorCode;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HealthTraffic = sequelize.define('HealthTraffic', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  method: { type: DataTypes.STRING(10), allowNull: false },
  path: { type: DataTypes.STRING(255), allowNull: false },
  status_code: { type: DataTypes.INTEGER, allowNull: false },
  response_time_ms: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  ip: { type: DataTypes.STRING(45), allowNull: true },
  user_agent: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'health_traffic',
  timestamps: true,
});

module.exports = HealthTraffic;

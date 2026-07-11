const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VitalSigns = sequelize.define('VitalSigns', {
  systolic: {
    type: DataTypes.INTEGER,
    comment: 'Blood pressure systolic (mmHg)',
  },
  diastolic: {
    type: DataTypes.INTEGER,
    comment: 'Blood pressure diastolic (mmHg)',
  },
  heart_rate: {
    type: DataTypes.INTEGER,
    comment: 'Heart rate (bpm)',
  },
  temperature: {
    type: DataTypes.DECIMAL(4, 1),
    comment: 'Body temperature (Celsius)',
  },
  spo2: {
    type: DataTypes.INTEGER,
    comment: 'Blood oxygen saturation (%)',
  },
  respiratory_rate: {
    type: DataTypes.INTEGER,
    comment: 'Respiratory rate (breaths/min)',
  },
  age: {
    type: DataTypes.INTEGER,
  },
  status: {
    type: DataTypes.STRING(10),
    defaultValue: 'current',
  },
}, {
  tableName: 'vital_signs',
  timestamps: true,
});

module.exports = VitalSigns;

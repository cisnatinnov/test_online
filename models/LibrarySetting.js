const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LibrarySetting = sequelize.define('LibrarySetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  borrow_duration_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7,
    comment: 'Lama peminjaman buku dalam hari',
  },
  fine_per_day: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 500,
    comment: 'Denda per hari keterlambatan dalam Rupiah',
  },
  overdue_tolerance_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Hari toleransi sebelum denda dikenakan',
  },
}, {
  tableName: 'library_settings',
  timestamps: true,
});

module.exports = LibrarySetting;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Borrowing = sequelize.define('Borrowing', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  book_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  borrow_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  return_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'borrowed',
    validate: { isIn: [['borrowed', 'returned', 'overdue']] },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fine: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Denda keterlambatan dalam Rupiah (Rp 500/hari)',
  },
}, {
  tableName: 'borrowings',
  timestamps: true,
});

module.exports = Borrowing;

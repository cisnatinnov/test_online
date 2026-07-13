const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatParticipant = sequelize.define('ChatParticipant', {
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
  },
}, {
  tableName: 'chat_participants',
  timestamps: true,
});

module.exports = ChatParticipant;

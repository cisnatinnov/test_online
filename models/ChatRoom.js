const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatRoom = sequelize.define('ChatRoom', {
  name: {
    type: DataTypes.STRING(100),
  },
  type: {
    type: DataTypes.ENUM('direct', 'group'),
    allowNull: false,
    defaultValue: 'group',
  },
  created_by: {
    type: DataTypes.INTEGER,
  },
}, {
  tableName: 'chat_rooms',
  timestamps: true,
});

module.exports = ChatRoom;

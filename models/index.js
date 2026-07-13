const sequelize = require('../config/database');
const User = require('./User');
const TwoFactorCode = require('./TwoFactorCode');
const Identity = require('./Identity');
const BMI = require('./BMI');
const BloodSugar = require('./BloodSugar');
const VitalSigns = require('./VitalSigns');
const Expense = require('./Expense');
const Saving = require('./Saving');
const Estate = require('./Estate');
const Tree = require('./Tree');
const ChatRoom = require('./ChatRoom');
const ChatMessage = require('./ChatMessage');
const ChatParticipant = require('./ChatParticipant');

User.hasMany(TwoFactorCode, { foreignKey: 'user_id' });
TwoFactorCode.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Identity, { foreignKey: 'id_user' });
Identity.belongsTo(User, { foreignKey: 'id_user' });

Identity.hasMany(BMI, { foreignKey: 'id_identity' });
BMI.belongsTo(Identity, { foreignKey: 'id_identity' });

Identity.hasMany(BloodSugar, { foreignKey: 'id_identity' });
BloodSugar.belongsTo(Identity, { foreignKey: 'id_identity' });

Identity.hasMany(VitalSigns, { foreignKey: 'id_identity' });
VitalSigns.belongsTo(Identity, { foreignKey: 'id_identity' });

User.hasMany(Expense, { foreignKey: 'user_id' });
Expense.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Saving, { foreignKey: 'user_id' });
Saving.belongsTo(User, { foreignKey: 'user_id' });

Estate.hasMany(Tree, { foreignKey: 'estate_id' });
Tree.belongsTo(Estate, { foreignKey: 'estate_id' });

User.hasMany(ChatRoom, { foreignKey: 'created_by' });
ChatRoom.belongsTo(User, { foreignKey: 'created_by' });

ChatRoom.hasMany(ChatMessage, { foreignKey: 'room_id' });
ChatMessage.belongsTo(ChatRoom, { foreignKey: 'room_id' });

ChatRoom.hasMany(ChatParticipant, { foreignKey: 'room_id' });
ChatParticipant.belongsTo(ChatRoom, { foreignKey: 'room_id' });

User.hasMany(ChatMessage, { foreignKey: 'user_id' });
ChatMessage.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ChatParticipant, { foreignKey: 'user_id' });
ChatParticipant.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { sequelize, User, TwoFactorCode, Identity, BMI, BloodSugar, VitalSigns, Expense, Saving, Estate, Tree, ChatRoom, ChatMessage, ChatParticipant };

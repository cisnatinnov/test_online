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

module.exports = { sequelize, User, TwoFactorCode, Identity, BMI, BloodSugar, VitalSigns, Expense, Saving, Estate, Tree };

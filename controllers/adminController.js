const { User, Identity, BMI, BloodSugar } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { calculateAge, hitungKesimpulan, buildSugarCriteria, formatPatientResponse } = require('../utils/helpers');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'phone', 'role', 'createdAt'],
      order: [['id', 'ASC']],
    });
    return apiResponse(res, { data: users });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getAllData = async (req, res) => {
  try {
    const identities = await Identity.findAll({
      include: [{ model: User, as: 'User', attributes: ['id', 'username', 'email', 'role'] }],
      order: [['id', 'ASC']],
    });

    const formattedData = [];
    for (const identity of identities) {
      const bmiRow = await BMI.findOne({ where: { id_identity: identity.id, status: 'current' }, order: [['id', 'DESC']] });
      const sugarRow = await BloodSugar.findOne({ where: { id_identity: identity.id, status: 'current' }, order: [['id', 'DESC']] });

      const age = calculateAge(identity.birthdate) ?? bmiRow?.age ?? sugarRow?.age ?? null;
      const kes = hitungKesimpulan(Number(bmiRow?.weight), Number(identity.height));
      const sugarCriteria = buildSugarCriteria(sugarRow?.conclusion, sugarRow?.description);
      formattedData.push(formatPatientResponse(identity, bmiRow, sugarRow, kes, sugarCriteria));
    }

    return apiResponse(res, { data: formattedData });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

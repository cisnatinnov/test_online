const { User, Identity, BMI, BloodSugar } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { calculateAge, hitungKesimpulan, buildSugarCriteria, formatPatientResponse } = require('../utils/helpers');
const { parsePagination, paginateResponse } = require('../utils/pagination');

exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows } = await User.findAndCountAll({
      attributes: ['id', 'username', 'email', 'phone', 'role', 'createdAt'],
      order: [['id', 'ASC']],
      limit,
      offset,
    });
    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: rows, itemName: 'users' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getAllData = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows: identities } = await Identity.findAndCountAll({
      include: [{ model: User, as: 'User', attributes: ['id', 'username', 'email', 'role'] }],
      order: [['id', 'ASC']],
      limit,
      offset,
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

    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: formattedData, itemName: 'patients' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

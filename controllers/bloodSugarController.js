const { Identity, BMI, BloodSugar } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { calculateAge, hitungKriteriaGula, hitungKesimpulan, formatPatientResponse } = require('../utils/helpers');
const sequelize = require('../config/database');
const { parsePagination, paginateResponse } = require('../utils/pagination');

const getUserIdFilter = (req) => req.user.role === 'admin' ? {} : { id_user: req.user.id };

exports.createBloodSugar = async (req, res) => {
  const { identity_id, sugar } = req.body;
  try {
    if (!identity_id || sugar == null) {
      return apiResponse(res, { error: 'identity_id dan sugar wajib diisi', status: 400 });
    }

    const where = { id: identity_id, ...getUserIdFilter(req) };
    const identity = await Identity.findOne({ where });
    if (!identity) {
      return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    }

    const age = calculateAge(identity.birthdate);
    const sugarCriteria = hitungKriteriaGula(age, sugar);

    const bloodSugar = await sequelize.transaction(async (t) => {
      await BloodSugar.update({ status: 'past' }, { where: { id_identity: identity.id, status: 'current' }, transaction: t });
      return BloodSugar.create({
        id_identity: identity.id,
        age,
        result: Number(sugar),
        conclusion: sugarCriteria?.label || null,
        description: sugarCriteria?.description || null,
        status: 'current',
      }, { transaction: t });
    });

    const existingBmi = await BMI.findOne({ where: { id_identity: identity.id, status: 'current' }, order: [['id', 'DESC']] });
    const kesimpulan = existingBmi ? hitungKesimpulan(Number(existingBmi.weight), Number(identity.height)) : null;

    return apiResponse(res, { data: formatPatientResponse(identity, existingBmi, bloodSugar, kesimpulan, sugarCriteria) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.updateBloodSugar = async (req, res) => {
  const { identityId } = req.params;
  const { sugar } = req.body;
  try {
    if (sugar == null) {
      return apiResponse(res, { error: 'sugar wajib diisi', status: 400 });
    }

    const where = { id: identityId, ...getUserIdFilter(req) };
    const identity = await Identity.findOne({ where });
    if (!identity) {
      return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    }

    const age = calculateAge(identity.birthdate);
    const sugarCriteria = hitungKriteriaGula(age, sugar);

    const bloodSugar = await sequelize.transaction(async (t) => {
      await BloodSugar.update({ status: 'past' }, { where: { id_identity: identity.id, status: 'current' }, transaction: t });
      return BloodSugar.create({
        id_identity: identity.id,
        age,
        result: Number(sugar),
        conclusion: sugarCriteria?.label || null,
        description: sugarCriteria?.description || null,
        status: 'current',
      }, { transaction: t });
    });

    const existingBmi = await BMI.findOne({ where: { id_identity: identity.id, status: 'current' }, order: [['id', 'DESC']] });
    const kesimpulan = existingBmi ? hitungKesimpulan(Number(existingBmi.weight), Number(identity.height)) : null;

    return apiResponse(res, { data: formatPatientResponse(identity, existingBmi, bloodSugar, kesimpulan, sugarCriteria) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getHistoryBloodSugar = async (req, res) => {
  try {
    const { identityId } = req.params;
    const identity = await Identity.findOne({ where: { id: identityId, ...getUserIdFilter(req) } });
    if (!identity) return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows } = await BloodSugar.findAndCountAll({
      where: { id_identity: identityId },
      order: [['id', 'DESC']],
      limit,
      offset,
    });
    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: rows, itemName: 'history' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

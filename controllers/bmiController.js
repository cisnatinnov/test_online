const { Identity, BMI, BloodSugar } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { calculateAge, hitungKesimpulan, buildSugarCriteria, formatPatientResponse } = require('../utils/helpers');
const sequelize = require('../config/database');
const { parsePagination, paginateResponse } = require('../utils/pagination');

const getUserIdFilter = (req) => req.user.role === 'admin' ? {} : { id_user: req.user.id };

exports.createBMI = async (req, res) => {
  let { identity_id, weight } = req.body;
  try {
    if (weight == null) {
      return apiResponse(res, { error: 'weight wajib diisi', status: 400 });
    }

    if (!identity_id) {
      if (req.user.role === 'admin') {
        return apiResponse(res, { error: 'identity_id wajib diisi', status: 400 });
      }
      const userIdentity = await Identity.findOne({ where: { id_user: req.user.id }, order: [['id', 'ASC']] });
      if (!userIdentity) {
        return apiResponse(res, { error: 'Data identitas tidak ditemukan', status: 404 });
      }
      identity_id = userIdentity.id;
    }

const where = { id: identity_id, ...getUserIdFilter(req) };
    const identity = await Identity.findOne({ where });
    if (!identity) {
      return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    }
    if (!identity.height || Number(identity.height) <= 0) {
      return apiResponse(res, { error: 'height identitas tidak valid', status: 400 });
    }
    const age = calculateAge(identity.birthdate);
    const kesimpulan = hitungKesimpulan(Number(weight), Number(identity.height), age, identity.gender);

    const bmi = await sequelize.transaction(async (t) => {
      await BMI.update({ status: 'past' }, { where: { id_identity: identity.id, status: 'current' }, transaction: t });
      return BMI.create({
        id_identity: identity.id,
        weight: Number(weight),
        age,
        result: Number(kesimpulan.bmi),
        bmi_status: kesimpulan.status,
        status: 'current',
      }, { transaction: t });
    });

    const existingSugar = await BloodSugar.findOne({
      where: { id_identity: identity.id, status: 'current' },
      order: [['id', 'DESC']],
    });

    return apiResponse(res, {
      data: formatPatientResponse(identity, bmi, existingSugar, kesimpulan, existingSugar ? buildSugarCriteria(existingSugar.conclusion, existingSugar.description) : null),
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.updateBMI = async (req, res) => {
  const { identityId } = req.params;
  const { weight } = req.body;
  try {
    if (weight == null) {
      return apiResponse(res, { error: 'weight wajib diisi', status: 400 });
    }

const where = { id: identityId, ...getUserIdFilter(req) };
    const identity = await Identity.findOne({ where });
    if (!identity) {
      return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    }
    if (!identity.height || Number(identity.height) <= 0) {
      return apiResponse(res, { error: 'height identitas tidak valid', status: 400 });
    }
    const age = calculateAge(identity.birthdate);
    const kesimpulan = hitungKesimpulan(Number(weight), Number(identity.height), age, identity.gender);

    const bmi = await sequelize.transaction(async (t) => {
      await BMI.update({ status: 'past' }, { where: { id_identity: identity.id, status: 'current' }, transaction: t });
      return BMI.create({
        id_identity: identity.id,
        weight: Number(weight),
        age,
        result: Number(kesimpulan.bmi),
        bmi_status: kesimpulan.status,
        status: 'current',
      }, { transaction: t });
    });

    const existingSugar = await BloodSugar.findOne({
      where: { id_identity: identity.id, status: 'current' },
      order: [['id', 'DESC']],
    });

    return apiResponse(res, {
      data: formatPatientResponse(identity, bmi, existingSugar, kesimpulan, existingSugar ? buildSugarCriteria(existingSugar.conclusion, existingSugar.description) : null),
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getBMIList = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows: identities } = await Identity.findAndCountAll({
      where: getUserIdFilter(req),
      order: [['id', 'ASC']],
      limit,
      offset,
    });

    const formattedData = [];
    for (const identity of identities) {
      const bmiRow = await BMI.findOne({ where: { id_identity: identity.id, status: 'current' }, order: [['id', 'DESC']] });
      const sugarRow = await BloodSugar.findOne({ where: { id_identity: identity.id, status: 'current' }, order: [['id', 'DESC']] });

      const age = calculateAge(identity.birthdate) ?? bmiRow?.age ?? sugarRow?.age ?? null;
      const sugarCriteria = buildSugarCriteria(sugarRow?.conclusion, sugarRow?.description);
      if (bmiRow) {
        const kes = hitungKesimpulan(Number(bmiRow.weight), Number(identity.height), age, identity.gender);
        formattedData.push(formatPatientResponse(identity, bmiRow, sugarRow, kes, sugarCriteria));
      } else {
        formattedData.push(formatPatientResponse(identity, bmiRow, sugarRow, null, sugarCriteria));
      }
    }

    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: formattedData, itemName: 'patients' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getHistoryBMI = async (req, res) => {
  try {
    const { identityId } = req.params;
    const identity = await Identity.findOne({ where: { id: identityId, ...getUserIdFilter(req) } });
    if (!identity) return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows } = await BMI.findAndCountAll({
      where: { id_identity: identityId },
      order: [['id', 'DESC']],
      limit,
      offset,
    });
    const enriched = rows.map(r => {
      const plain = r.get({ plain: true });
      plain.age = calculateAge(identity?.birthdate) ?? plain.age ?? null;
      plain.bmi_value = plain.result != null ? Number(plain.result) : null;
      plain.result = plain.bmi_status || null;
      return plain;
    });
    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: enriched, itemName: 'history' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

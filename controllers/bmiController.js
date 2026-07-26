const { Identity, BMI, BloodSugar } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { calculateAge, hitungKesimpulan, buildSugarCriteria, formatPatientResponse } = require('../utils/helpers');
const sequelize = require('../config/database');

const getUserIdFilter = (req) => req.user.role === 'admin' ? {} : { id_user: req.user.id };

exports.createBMI = async (req, res) => {
  const { identity_id, weight } = req.body;
  try {
    if (!identity_id || weight == null) {
      return apiResponse(res, { error: 'identity_id dan weight wajib diisi', status: 400 });
    }

    const where = { id: identity_id, ...getUserIdFilter(req) };
    const identity = await Identity.findOne({ where });
    if (!identity) {
      return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    }

    const age = calculateAge(identity.birthdate);
    const kesimpulan = hitungKesimpulan(Number(weight), Number(identity.height));

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

    const age = calculateAge(identity.birthdate);
    const kesimpulan = hitungKesimpulan(Number(weight), Number(identity.height));

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
    const identities = await Identity.findAll({ where: getUserIdFilter(req), order: [['id', 'ASC']] });

    const formattedData = [];
    for (const identity of identities) {
      const bmiRow = await BMI.findOne({ where: { id_identity: identity.id, status: 'current' }, order: [['id', 'DESC']] });
      const sugarRow = await BloodSugar.findOne({ where: { id_identity: identity.id, status: 'current' }, order: [['id', 'DESC']] });

      const age = calculateAge(identity.birthdate) ?? bmiRow?.age ?? sugarRow?.age ?? null;
      const sugarCriteria = buildSugarCriteria(sugarRow?.conclusion, sugarRow?.description);
      if (bmiRow) {
        const kes = hitungKesimpulan(Number(bmiRow.weight), Number(identity.height));
        formattedData.push(formatPatientResponse(identity, bmiRow, sugarRow, kes, sugarCriteria));
      } else {
        formattedData.push(formatPatientResponse(identity, bmiRow, sugarRow, null, sugarCriteria));
      }
    }

    return apiResponse(res, { data: formattedData });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const userFilter = getUserIdFilter(req);
    const totalPatients = await Identity.count({ where: userFilter });

    const bmiWhere = { status: 'current' };
    const bmiData = await BMI.findAll({
      attributes: ['bmi_status'],
      include: [{ model: Identity, where: userFilter, attributes: [] }],
      where: bmiWhere,
    });

    const sugarData = await BloodSugar.findAll({
      attributes: ['conclusion'],
      include: [{ model: Identity, where: userFilter, attributes: [] }],
      where: { status: 'current' },
    });

    const bmiResults = bmiData.map((r) => r.bmi_status);
    const sugarResults = sugarData.map((r) => r.conclusion);

    return apiResponse(res, {
      data: {
        totalPatients,
        totalBmi: bmiResults.length,
        normalBmi: bmiResults.filter((r) => r === 'Normal').length,
        totalSugar: sugarResults.length,
        highSugar: sugarResults.filter((r) => r === 'Tinggi').length,
      },
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getHistoryBMI = async (req, res) => {
  try {
    const { identityId } = req.params;
    const identity = await Identity.findOne({ where: { id: identityId, ...getUserIdFilter(req) } });
    if (!identity) return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    const results = await BMI.findAll({ where: { id_identity: identityId }, order: [['id', 'DESC']] });
    const enriched = results.map(r => {
      const plain = r.get({ plain: true });
      plain.age = calculateAge(identity?.birthdate) ?? plain.age ?? null;
      plain.bmi_value = plain.result != null ? Number(plain.result) : null;
      plain.result = plain.bmi_status || null;
      return plain;
    });
    return apiResponse(res, { data: enriched });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

const { Identity, VitalSigns } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { calculateAge, evalBloodPressure, evalHeartRate, evalTemperature, evalSpO2, evalRespiratoryRate } = require('../utils/helpers');
const sequelize = require('../config/database');
const { parsePagination, paginateResponse } = require('../utils/pagination');

const getUserIdFilter = (req) => req.user.role === 'admin' ? {} : { id_user: req.user.id };

exports.createVitalSigns = async (req, res) => {
  const { identity_id, systolic, diastolic, heart_rate, temperature, spo2, respiratory_rate } = req.body;
  try {
    if (!identity_id) {
      return apiResponse(res, { error: 'identity_id wajib diisi', status: 400 });
    }

    const where = { id: identity_id, ...getUserIdFilter(req) };
    const identity = await Identity.findOne({ where });
    if (!identity) return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });

    const age = calculateAge(identity.birthdate);

    const vs = await sequelize.transaction(async (t) => {
      await VitalSigns.update({ status: 'past' }, { where: { id_identity: identity.id, status: 'current' }, transaction: t });
      return VitalSigns.create({
        id_identity: identity.id,
        systolic: systolic != null ? Number(systolic) : null,
        diastolic: diastolic != null ? Number(diastolic) : null,
        heart_rate: heart_rate != null ? Number(heart_rate) : null,
        temperature: temperature != null ? Number(temperature) : null,
        spo2: spo2 != null ? Number(spo2) : null,
        respiratory_rate: respiratory_rate != null ? Number(respiratory_rate) : null,
        age,
        status: 'current',
      }, { transaction: t });
    });

    const evaluation = evaluateVitalSigns(vs, age);

    return apiResponse(res, {
      data: {
        patientId: identity.id,
        name: identity.name,
        age,
        vitalSigns: formatVitalSigns(vs),
        evaluation,
      },
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.updateVitalSigns = async (req, res) => {
  const { identityId } = req.params;
  const { systolic, diastolic, heart_rate, temperature, spo2, respiratory_rate } = req.body;
  try {
    const where = { id: identityId, ...getUserIdFilter(req) };
    const identity = await Identity.findOne({ where });
    if (!identity) return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });

    const age = calculateAge(identity.birthdate);

    const vs = await sequelize.transaction(async (t) => {
      await VitalSigns.update({ status: 'past' }, { where: { id_identity: identity.id, status: 'current' }, transaction: t });
      return VitalSigns.create({
        id_identity: identity.id,
        systolic: systolic != null ? Number(systolic) : null,
        diastolic: diastolic != null ? Number(diastolic) : null,
        heart_rate: heart_rate != null ? Number(heart_rate) : null,
        temperature: temperature != null ? Number(temperature) : null,
        spo2: spo2 != null ? Number(spo2) : null,
        respiratory_rate: respiratory_rate != null ? Number(respiratory_rate) : null,
        age,
        status: 'current',
      }, { transaction: t });
    });

    const evaluation = evaluateVitalSigns(vs, age);

    return apiResponse(res, {
      data: {
        patientId: identity.id,
        name: identity.name,
        age,
        vitalSigns: formatVitalSigns(vs),
        evaluation,
      },
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getLatestVitalSigns = async (req, res) => {
  try {
    const { identityId } = req.params;
    const where = { id: identityId, ...getUserIdFilter(req) };
    const identity = await Identity.findOne({ where });
    if (!identity) return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });

    const vs = await VitalSigns.findOne({
      where: { id_identity: identityId, status: 'current' },
      order: [['id', 'DESC']],
    });

    if (!vs) return apiResponse(res, { data: null });

    const age = calculateAge(identity.birthdate) ?? vs.age;
    const evaluation = evaluateVitalSigns(vs, age);

    return apiResponse(res, {
      data: {
        patientId: identity.id,
        name: identity.name,
        age,
        vitalSigns: formatVitalSigns(vs),
        evaluation,
      },
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getHistoryVitalSigns = async (req, res) => {
  try {
    const { identityId } = req.params;
    const identity = await Identity.findOne({ where: { id: identityId, ...getUserIdFilter(req) } });
    if (!identity) return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows } = await VitalSigns.findAndCountAll({
      where: { id_identity: identityId },
      order: [['id', 'DESC']],
      limit,
      offset,
    });
    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: rows.map(formatVitalSigns), itemName: 'history' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getVitalSignsList = async (req, res) => {
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
      const vs = await VitalSigns.findOne({
        where: { id_identity: identity.id, status: 'current' },
        order: [['id', 'DESC']],
      });

      const age = calculateAge(identity.birthdate) ?? vs?.age ?? null;
      const evaluation = vs ? evaluateVitalSigns(vs, age) : null;

      formattedData.push({
        id: identity.id,
        nik: identity.nik ?? '',
        name: identity.name ?? '',
        age,
        vitalSigns: vs ? formatVitalSigns(vs) : null,
        evaluation,
      });
    }

    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: formattedData, itemName: 'patients' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

function formatVitalSigns(vs) {
  if (!vs) return null;
  return {
    systolic: vs.systolic,
    diastolic: vs.diastolic,
    heart_rate: vs.heart_rate,
    temperature: vs.temperature ? Number(vs.temperature) : null,
    spo2: vs.spo2,
    respiratory_rate: vs.respiratory_rate,
    status: vs.status,
    date: vs.createdAt,
  };
}

function evaluateVitalSigns(vs, age) {
  const results = {};
  let hasAbnormal = false;

  if (vs.systolic != null && vs.diastolic != null) {
    results.bloodPressure = evalBloodPressure(vs.systolic, vs.diastolic);
    if (results.bloodPressure.label !== 'Normal') hasAbnormal = true;
  }

  if (vs.heart_rate != null) {
    results.heartRate = evalHeartRate(vs.heart_rate, age);
    if (results.heartRate.label !== 'Normal') hasAbnormal = true;
  }

  if (vs.temperature != null) {
    results.temperature = evalTemperature(Number(vs.temperature));
    if (results.temperature.label !== 'Normal') hasAbnormal = true;
  }

  if (vs.spo2 != null) {
    results.spo2 = evalSpO2(vs.spo2);
    if (results.spo2.label !== 'Normal') hasAbnormal = true;
  }

  if (vs.respiratory_rate != null) {
    results.respiratoryRate = evalRespiratoryRate(vs.respiratory_rate, age);
    if (results.respiratoryRate.label !== 'Normal') hasAbnormal = true;
  }

  results.overall = hasAbnormal ? 'Ada abnormalitas' : 'Semua normal';
  return results;
}

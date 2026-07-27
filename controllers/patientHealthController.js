const { Identity, BMI, BloodSugar } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { calculateAge, hitungKesimpulan, buildSugarCriteria, hitungRisikoKesehatan, analisisTren } = require('../utils/helpers');
const { parsePagination, paginateResponse } = require('../utils/pagination');

const getUserIdFilter = (req) => req.user.role === 'admin' ? {} : { id_user: req.user.id };

exports.getHealthRisk = async (req, res) => {
  try {
    const { identityId } = req.params;
    const where = { id: identityId, ...getUserIdFilter(req) };
    const identity = await Identity.findOne({ where });
    if (!identity) return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });

    const bmiRow = await BMI.findOne({ where: { id_identity: identityId, status: 'current' }, order: [['id', 'DESC']] });
    const sugarRow = await BloodSugar.findOne({ where: { id_identity: identityId, status: 'current' }, order: [['id', 'DESC']] });

    const age = calculateAge(identity.birthdate) ?? bmiRow?.age ?? sugarRow?.age ?? null;
    const bmiResult = bmiRow ? hitungKesimpulan(Number(bmiRow.weight), Number(identity.height)) : null;
    const sugarCriteria = sugarRow ? buildSugarCriteria(sugarRow.conclusion, sugarRow.description) : null;

    const risk = hitungRisikoKesehatan(bmiResult, sugarCriteria, age);

    return apiResponse(res, {
      data: {
        patientId: identity.id,
        name: identity.name,
        age,
        bmi: bmiResult,
        bloodSugar: sugarCriteria,
        risk,
      },
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getHealthTrend = async (req, res) => {
  try {
    const { identityId } = req.params;
    const where = { id: identityId, ...getUserIdFilter(req) };
    const identity = await Identity.findOne({ where });
    if (!identity) return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });

    const bmiHistory = await BMI.findAll({ where: { id_identity: identityId }, order: [['createdAt', 'ASC']] });
    const sugarHistory = await BloodSugar.findAll({ where: { id_identity: identityId }, order: [['createdAt', 'ASC']] });

    const trend = analisisTren(bmiHistory, sugarHistory, identity.height);

    return apiResponse(res, {
      data: {
        patientId: identity.id,
        name: identity.name,
        trend,
      },
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows: identities } = await Identity.findAndCountAll({
      where: getUserIdFilter(req),
      order: [['id', 'ASC']],
      limit,
      offset,
    });
    const alerts = [];

    for (const identity of identities) {
      const bmiRow = await BMI.findOne({ where: { id_identity: identity.id, status: 'current' }, order: [['id', 'DESC']] });
      const sugarRow = await BloodSugar.findOne({ where: { id_identity: identity.id, status: 'current' }, order: [['id', 'DESC']] });

      const age = calculateAge(identity.birthdate) ?? bmiRow?.age ?? sugarRow?.age ?? null;
      const bmiResult = bmiRow ? hitungKesimpulan(Number(bmiRow.weight), Number(identity.height)) : null;
      const sugarCriteria = sugarRow ? buildSugarCriteria(sugarRow.conclusion, sugarRow.description) : null;
      const risk = hitungRisikoKesehatan(bmiResult, sugarCriteria, age);

      if (risk.level === 'tinggi') {
        alerts.push({
          patientId: identity.id,
          name: identity.name,
          level: risk.level,
          reasons: risk.reasons,
        });
      }
    }

    return apiResponse(res, { data: { count: alerts.length, ...paginateResponse({ total: count, page, limit, items: alerts, itemName: 'alerts' }) } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getPopulationStats = async (req, res) => {
  try {
    const userFilter = getUserIdFilter(req);
    const identities = await Identity.findAll({ where: userFilter });

    const bmiDistribution = { 'Sangat kurus': 0, Kurus: 0, Normal: 0, Gemuk: 0, Obesitas: 0 };
    const sugarDistribution = { Rendah: 0, Normal: 0, Tinggi: 0 };
    let riskCounts = { rendah: 0, sedang: 0, tinggi: 0 };

    for (const identity of identities) {
      const bmiRow = await BMI.findOne({ where: { id_identity: identity.id, status: 'current' }, order: [['id', 'DESC']] });
      const sugarRow = await BloodSugar.findOne({ where: { id_identity: identity.id, status: 'current' }, order: [['id', 'DESC']] });

      if (bmiRow) {
        const bmiResult = hitungKesimpulan(Number(bmiRow.weight), Number(identity.height));
        if (bmiDistribution[bmiResult.status] !== undefined) bmiDistribution[bmiResult.status]++;
      }

      if (sugarRow && sugarDistribution[sugarRow.conclusion] !== undefined) {
        sugarDistribution[sugarRow.conclusion]++;
      }

      const age = calculateAge(identity.birthdate) ?? bmiRow?.age ?? sugarRow?.age ?? null;
      const bmiRes = bmiRow ? hitungKesimpulan(Number(bmiRow.weight), Number(identity.height)) : null;
      const sugarCrit = sugarRow ? buildSugarCriteria(sugarRow.conclusion, sugarRow.description) : null;
      const risk = hitungRisikoKesehatan(bmiRes, sugarCrit, age);
      riskCounts[risk.level]++;
    }

    return apiResponse(res, {
      data: {
        totalPatients: identities.length,
        bmiDistribution,
        sugarDistribution,
        riskDistribution: riskCounts,
      },
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

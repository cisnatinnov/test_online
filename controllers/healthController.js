const { sequelize } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');

const appStartTime = Date.now();

exports.getHealth = async (req, res) => {
  const checks = {};
  let overallStatus = 'healthy';

  try {
    const start = Date.now();
    await sequelize.authenticate();
    checks.database = { status: 'up', latencyMs: Date.now() - start };
  } catch (err) {
    checks.database = { status: 'down', error: err.message };
    overallStatus = 'degraded';
  }

  const mem = process.memoryUsage();
  checks.memory = {
    rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    external: `${(mem.external / 1024 / 1024).toFixed(2)} MB`,
  };

  const cpus = process.cpuUsage();
  checks.cpu = {
    user: `${(cpus.user / 1000).toFixed(2)} ms`,
    system: `${(cpus.system / 1000).toFixed(2)} ms`,
  };

  checks.uptime = {
    serverSeconds: Math.floor((Date.now() - appStartTime) / 1000),
    processSeconds: Math.floor(process.uptime()),
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  return apiResponse(res, {
    status: statusCode,
    data: { status: overallStatus, timestamp: new Date().toISOString(), checks },
  });
};

exports.getReady = async (req, res) => {
  try {
    await sequelize.authenticate();
    return apiResponse(res, { data: { status: 'ready' } });
  } catch (err) {
    return apiResponse(res, { status: 503, data: { status: 'not ready', error: err.message } });
  }
};

exports.getLive = (req, res) => {
  return apiResponse(res, { data: { status: 'alive' } });
};

exports.getStats = async (req, res) => {
  try {
    const { Identity, BMI, BloodSugar, User } = require('../models');

    const [totalUsers, totalPatients, totalBmiRecords, totalSugarRecords] = await Promise.all([
      User.count(),
      Identity.count(),
      BMI.count(),
      BloodSugar.count(),
    ]);

    return apiResponse(res, {
      data: {
        users: totalUsers,
        patients: totalPatients,
        bmiRecords: totalBmiRecords,
        bloodSugarRecords: totalSugarRecords,
        uptime: Math.floor((Date.now() - appStartTime) / 1000),
        nodeVersion: process.version,
        platform: process.platform,
      },
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

const { HealthTraffic, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { apiResponse } = require('../middlewares/apiResponse');

exports.getTrafficStats = async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    let since;
    if (period === '1h') since = new Date(Date.now() - 60 * 60 * 1000);
    else if (period === '7d') since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (period === '30d') since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    else since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const where = { createdAt: { [Op.gte]: since } };

    const [totalRequests, avgResponseTime, statusCounts, methodCounts, recentRequests, hourlyTraffic] = await Promise.all([
      HealthTraffic.count({ where }),
      HealthTraffic.findAll({
        attributes: [[fn('AVG', col('response_time_ms')), 'avg']],
        where,
        raw: true,
      }),
      HealthTraffic.findAll({
        attributes: ['status_code', [fn('COUNT', col('id')), 'count']],
        where,
        group: ['status_code'],
        raw: true,
      }),
      HealthTraffic.findAll({
        attributes: ['method', [fn('COUNT', col('id')), 'count']],
        where,
        group: ['method'],
        raw: true,
      }),
      HealthTraffic.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 50,
        include: [{ model: User, attributes: ['username'], required: false }],
      }),
      HealthTraffic.findAll({
        attributes: [
          [fn('date_trunc', 'hour', col('createdAt')), 'hour'],
          [fn('COUNT', col('id')), 'count'],
          [fn('AVG', col('response_time_ms')), 'avg_time'],
        ],
        where,
        group: [fn('date_trunc', 'hour', col('createdAt'))],
        order: [[fn('date_trunc', 'hour', col('createdAt')), 'ASC']],
        raw: true,
      }),
    ]);

    const statusBreakdown = {};
    statusCounts.forEach(s => { statusBreakdown[s.status_code] = parseInt(s.count); });

    const methodBreakdown = {};
    methodCounts.forEach(m => { methodBreakdown[m.method] = parseInt(m.count); });

    return apiResponse(res, {
      data: {
        totalRequests,
        avgResponseTime: Math.round(parseFloat(avgResponseTime[0]?.avg) || 0),
        statusBreakdown,
        methodBreakdown,
        hourlyTraffic: hourlyTraffic.map(h => ({
          hour: h.hour,
          count: parseInt(h.count),
          avgTime: Math.round(parseFloat(h.avg_time) || 0),
        })),
        recentRequests: recentRequests.map(r => ({
          id: r.id,
          method: r.method,
          path: r.path,
          statusCode: r.status_code,
          responseTimeMs: r.response_time_ms,
          user: r.User?.username || 'anonymous',
          ip: r.ip,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (err) {
    return apiResponse(res, { status: 500, error: err.message });
  }
};

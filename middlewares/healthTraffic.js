const { HealthTraffic } = require('../models');

function healthTrafficMiddleware(req, res, next) {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function (...args) {
    res.end = originalEnd;
    res.end(...args);
    const responseTimeMs = Date.now() - start;
    const userId = req.user?.id || null;
    HealthTraffic.create({
      method: req.method,
      path: req.originalUrl,
      status_code: res.statusCode,
      response_time_ms: responseTimeMs,
      user_id: userId,
      ip: req.ip || req.connection?.remoteAddress,
      user_agent: req.get('user-agent'),
    }).catch(() => {});
  };
  next();
}

module.exports = healthTrafficMiddleware;

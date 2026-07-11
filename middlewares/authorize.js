const { apiResponse } = require('./apiResponse');

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return apiResponse(res, { error: 'Akses ditolak, role tidak memenuhi', status: 403 });
    }
    next();
  };
}

module.exports = authorize;

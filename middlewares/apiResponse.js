function apiResponse(res, { success, data = null, error = null, status = 200 }) {
  const isError = error !== null || status >= 400;
  const body = { success: success !== undefined ? success : !isError };
  if (data !== null) body.data = data;
  if (error !== null) body.error = error;
  return res.status(status).json(body);
}

function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
  return res.status(500).json({ success: false, error: err.message });
}

module.exports = { apiResponse, errorHandler };

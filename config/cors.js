function matchesOrigin(origin, allowed) {
  if (origin === allowed) return true;
  if (!allowed.endsWith(':*')) return false;
  try {
    const candidate = new URL(origin);
    const pattern = new URL(allowed.slice(0, -1) + '1');
    // Only the port is variable; scheme and hostname must still match exactly.
    return candidate.origin === origin &&
      candidate.protocol === pattern.protocol &&
      candidate.hostname === pattern.hostname;
  } catch {
    return false;
  }
}

function createCorsOptions(value) {
  const allowedOrigins = (value || '').split(',').map(origin => origin.trim()).filter(Boolean);
  return {
    origin(origin, callback) {
      if (!origin || !allowedOrigins.length || allowedOrigins.includes('*') ||
          allowedOrigins.some(allowed => matchesOrigin(origin, allowed))) {
        return callback(null, true);
      }
      return callback(new Error('CORS origin not allowed'), false);
    },
    credentials: true,
  };
}

module.exports = { createCorsOptions, matchesOrigin };

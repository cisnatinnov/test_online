const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Akses ditolak, token diperlukan' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      const status = err.name === 'TokenExpiredError' ? 401 : 403;
      const message = err.name === 'TokenExpiredError' ? 'Token kedaluwarsa' : 'Token tidak valid';
      return res.status(status).json({ error: message });
    }
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;

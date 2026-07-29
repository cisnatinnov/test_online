process.env.JWT_SECRET = 'test-secret-key-vitasuite-2024';
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

describe('authenticateToken middleware', () => {
  const authenticateToken = require('../middlewares/authenticate');

  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('returns 401 when no token provided', () => {
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Akses ditolak, token diperlukan' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when token is invalid', () => {
    req.headers['authorization'] = 'Bearer invalidtoken';
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token tidak valid' });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next and attaches user when token is valid', () => {
    const payload = { id: 1, username: 'test' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    req.headers['authorization'] = `Bearer ${token}`;

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(1);
    expect(req.user.username).toBe('test');
  });
});

const authorize = require('../middlewares/authorize');
const { apiResponse } = require('../middlewares/apiResponse');

describe('authorize middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('should allow access when user role matches', () => {
    req.user = { id: 1, role: 'admin' };
    const middleware = authorize('admin');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('should deny access when user role does not match', () => {
    req.user = { id: 1, role: 'user' };
    const middleware = authorize('admin');
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('should deny access when user is not set', () => {
    const middleware = authorize('admin');
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('should allow access when multiple roles and user matches one', () => {
    req.user = { id: 1, role: 'user' };
    const middleware = authorize('admin', 'user');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

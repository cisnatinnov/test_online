const { apiResponse, errorHandler } = require('../middlewares/apiResponse');

describe('apiResponse', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('returns success with data by default', () => {
    apiResponse(res, { data: { id: 1 } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
  });

  test('returns error with custom status', () => {
    apiResponse(res, { error: 'Not found', status: 404 });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Not found' });
  });

  test('returns success without data or error', () => {
    apiResponse(res, {});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test('returns data and ignores null error', () => {
    apiResponse(res, { data: 'ok', error: null });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: 'ok' });
  });
});

describe('errorHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('returns 500 with error message', () => {
    const err = new Error('Something failed');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Something failed' });
  });
});

const { matchesOrigin, createCorsOptions } = require('../config/cors');

test.each(['http://localhost', 'http://localhost:3000', 'http://localhost:5174', 'http://localhost:65535'])('wildcard port accepts %s', origin => {
  expect(matchesOrigin(origin, 'http://localhost:*')).toBe(true);
});
test.each(['https://localhost:3000', 'http://localhost.evil.example:3000', 'http://evil.example:3000', 'http://localhost:3000/path', 'http://user@localhost:3000', 'null', 'invalid'])('wildcard port rejects %s', origin => {
  expect(matchesOrigin(origin, 'http://localhost:*')).toBe(false);
});
test('exact configured origins continue to require the specified port', () => {
  expect(matchesOrigin('https://example.com:8443', 'https://example.com:8443')).toBe(true);
  expect(matchesOrigin('https://example.com:8444', 'https://example.com:8443')).toBe(false);
});
test('CORS callback shares wildcard-port policy across HTTP and sockets', () => {
  const options = createCorsOptions('http://localhost:*, http://127.0.0.1:*');
  const allowed = jest.fn(); options.origin('http://127.0.0.1:9876', allowed);
  expect(allowed).toHaveBeenCalledWith(null, true);
  const denied = jest.fn(); options.origin('https://untrusted.example', denied);
  expect(denied).toHaveBeenCalledWith(expect.any(Error), false);
  expect(options.credentials).toBe(true);
});

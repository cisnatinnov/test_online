const { getHistoryDate } = require('../public/history-utils');

describe('getHistoryDate', () => {
  test('uses createdAt when present', () => {
    expect(getHistoryDate({ createdAt: '2024-05-10T12:00:00.000Z' })).toBe('10/05/2024');
  });

  test('falls back to created_at', () => {
    expect(getHistoryDate({ created_at: '2024-06-01T08:30:00.000Z' })).toBe('01/06/2024');
  });

  test('returns dash for missing value', () => {
    expect(getHistoryDate({})).toBe('-');
  });
});

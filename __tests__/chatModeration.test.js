const { containsProfanity } = require('../utils/chatModeration');
afterEach(() => { delete process.env.CHAT_BLOCKED_WORDS; });

test.each([
  'fuck', 'FUCK!', 'fucking', 'you asshole', 'SHIT', 'sh1t', 'sh!t', '$hit', 'b1tch',
  'f.u.c.k', 'f u c k', 'f---u---c---k', 'fuuuuuuuck', 'f\u200buck', 'ｆｕｃｋ', 'fūçk',
  'bіtch', 'fuck123', 'goblok', 'BANGSAT!', 'k0nt0l', 'bajingan', 'ngentot',
  'mierda', 'pendejo', 'cabrón', 'caralho', 'merda',
])('blocks inappropriate term or common disguise: %s', value => {
  expect(containsProfanity(value)).toBe(true);
});
test.each([
  'Hello everyone!', 'This was a bad experience.', 'I feel sad today.',
  'My blood pressure is high.', 'The class starts tomorrow.', 'Scunthorpe',
  'Please assist me with this assignment.', 'The classic design looks nice.',
  'Ashiitake mushroom is edible.', 'Passage to the library', '',
])('allows ordinary messages and innocent substrings: %s', value => {
  expect(containsProfanity(value)).toBe(false);
});
test('supports additional server-configured words without treating configuration as regex', () => {
  process.env.CHAT_BLOCKED_WORDS = 'customword';
  expect(containsProfanity('CUSTOMWORD!')).toBe(true);
  expect(containsProfanity('ordinary message')).toBe(false);
  process.env.CHAT_BLOCKED_WORDS = '';
  expect(containsProfanity('customword')).toBe(false);
});
test('handles punctuation-heavy messages and malformed values safely', () => {
  expect(containsProfanity('$!'.repeat(2500))).toBe(false);
  expect(containsProfanity(null)).toBe(false);
});

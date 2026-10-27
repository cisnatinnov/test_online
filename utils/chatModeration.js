// Whole-word rules avoid blocking innocent substrings (for example "class").
// Keep this server-side: clients must not be able to bypass the policy.
const DEFAULT_BLOCKED_WORDS = [
  'fuck', 'fucking', 'fucked', 'fucker', 'fuckers', 'motherfucker', 'motherfuckers',
  'fck', 'fuk', 'shit', 'shitty', 'bullshit', 'bitch', 'bitches', 'bastard', 'bastards',
  'asshole', 'assholes', 'dumbass', 'cunt', 'cunts', 'dickhead', 'wanker', 'wtf', 'stfu',
  'nigger', 'nigga', 'faggot',
  'anjing', 'anjir', 'bangsat', 'bajingan', 'kontol', 'memek', 'ngentot', 'ngewe', 'goblok', 'tolol',
  'mierda', 'puta', 'puto', 'pendejo', 'pendeja', 'cabron', 'gilipollas', 'joder',
  'porra', 'caralho', 'merda', 'foda', 'foder',
];
const substitutions = { a: '[a4@]', b: '[b8]', e: '[e3]', g: '[g9]', i: '[i1!|]', o: '[o0]', s: '[s5$]', t: '[t7+]' };
const lookalikes = { 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y', 'і': 'i', 'ѕ': 's' };
const separator = '[\\p{P}\\p{Z}\\p{S}\\s_]{0,5}';
function normalise(text) {
  return text.normalize('NFKD').toLowerCase().replace(/[\p{M}\p{Cf}]/gu, '')
    .replace(/[аеорсхуіѕ]/gu, letter => lookalikes[letter])
    .replace(/(.)\1{2,}/gu, '$1$1');
}
function patternFor(word) {
  const letters = [...normalise(word)].filter(letter => /[a-z]/.test(letter));
  if (!letters.length) return null;
  return new RegExp('(?<![\\p{L}])' + letters.map(letter => (substitutions[letter] || letter) + '+').join(separator) + '(?![\\p{L}])', 'u');
}
const defaultPatterns = DEFAULT_BLOCKED_WORDS.map(patternFor);
let cachedExtra = null, extraPatterns = [];
function containsProfanity(text) {
  if (typeof text !== 'string') return false;
  const extra = process.env.CHAT_BLOCKED_WORDS || '';
  if (extra !== cachedExtra) {
    cachedExtra = extra;
    extraPatterns = extra.split(',').map(word => word.trim()).filter(Boolean).map(patternFor).filter(Boolean);
  }
  const value = normalise(text);
  return defaultPatterns.some(pattern => pattern.test(value)) || extraPatterns.some(pattern => pattern.test(value));
}
module.exports = { containsProfanity };

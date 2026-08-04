// Konsonan dasar (vokal 'a' otomatis melekat)
export const consonants = {
  k: 'ᮊ', g: 'ᮌ', ng: 'ᮍ',
  c: 'ᮎ', j: 'ᮏ', ny: 'ᮑ',
  t: 'ᮒ', d: 'ᮓ', n: 'ᮔ',
  p: 'ᮕ', b: 'ᮘ', m: 'ᮙ',
  y: 'ᮚ', r: 'ᮛ', l: 'ᮜ',
  w: 'ᮝ', s: 'ᮞ', h: 'ᮠ',
  v: 'ᮗ', z: 'ᮐ', x: 'ᮟ',
  f: 'ᮖ',
}

// Vokal mandiri (awal kata / tanpa konsonan)
export const independentVowels = {
  a: 'ᮃ', i: 'ᮄ', u: 'ᮅ',
  é: 'ᮆ', e: 'ᮇ', o: 'ᮈ',
}

// Sandhangan vokal (melekat pada konsonan)
export const vowelSigns = {
  i: 'ᮤ', u: 'ᮥ', é: 'ᮦ',
  o: 'ᮧ', e: 'ᮨ',
}

// Pamaéh (virama)
export const virama = '᮪'

// Consonant keys sorted by length (longest first) to match digraphs like "ng","ny"
const CONS_KEYS = Object.keys(consonants).sort((a, b) => b.length - a.length)
const VOWELS = new Set(Object.keys(independentVowels))
const IS_LETTER = (ch) => /\p{L}/u.test(ch)

export function toAksaraSunda(text) {
  if (text === null || text === undefined) {
    return { status: 400, message: 'No text provided', data: {} }
  }

  let result = ''
  // split by spaces but preserve multiple spaces by iterating words and adding single space back
  const words = String(text).toLowerCase().split(' ')
  for (let wIdx = 0; wIdx < words.length; wIdx++) {
    const word = words[wIdx]
    if (word === '') {
      result += ' '
      continue
    }

    let i = 0
    while (i < word.length) {
      const ch = word[i]

      // preserve non-alpha characters
      if (!IS_LETTER(ch)) {
        result += ch
        i += 1
        continue
      }

      // Try to match consonant (prefer digraphs)
      let matchKey = null
      for (const k of CONS_KEYS) {
        if (word.startsWith(k, i)) {
          matchKey = k
          break
        }
      }

      if (matchKey) {
        const consSym = consonants[matchKey]
        i += matchKey.length

        // peek next char
        const nextChar = i < word.length ? word[i] : ''

        // if next is vowel
        if (VOWELS.has(nextChar)) {
          if (nextChar === 'a') {
            // inherent 'a' - no vowel sign, keep consonant as-is
            result += consSym
          } else {
            // attach vowel sign
            const sign = vowelSigns[nextChar] || ''
            result += consSym + sign
          }
          i += 1 // consume vowel
          continue
        }

        // next is consonant or end or non-letter -> add virama to suppress inherent 'a'
        result += consSym + virama
        continue
      }

      // Not a consonant digraph/key -> maybe independent vowel
      if (Object.prototype.hasOwnProperty.call(independentVowels, ch)) {
        result += independentVowels[ch]
        i += 1
        continue
      }

      // fallback: copy character
      result += ch
      i += 1
    }

    // add space between words (preserve original single space)
    if (wIdx < words.length - 1) {
      result += ' '
    }
  }

  return {
    status: 200,
    message: '',
    data: {
      result: result.trim(),
    },
  }
}

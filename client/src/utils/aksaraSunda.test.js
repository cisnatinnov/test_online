import { describe, it, expect } from 'vitest'
import { toAksaraSunda, consonants, independentVowels, vowelSigns, virama } from './aksaraSunda'

const result = (text) => toAksaraSunda(text).data.result

describe('toAksaraSunda', () => {
  it('returns 400 for null/undefined input', () => {
    expect(toAksaraSunda(null).status).toBe(400)
    expect(toAksaraSunda(undefined).status).toBe(400)
  })

  it('returns 200 with empty result for empty string', () => {
    const res = toAksaraSunda('')
    expect(res.status).toBe(200)
    expect(result('')).toBe('')
  })

  it('translates single consonants with inherent a', () => {
    expect(result('ka')).toBe(consonants.k)
    expect(result('ta')).toBe(consonants.t)
    expect(result('sa')).toBe(consonants.s)
  })

  it('attaches vowel signs after consonants', () => {
    expect(result('ki')).toBe(consonants.k + vowelSigns.i)
    expect(result('ku')).toBe(consonants.k + vowelSigns.u)
    expect(result('rét')).toBe(consonants.r + vowelSigns.é + consonants.t + virama)
  })

  it('adds pamaéh to suppress inherent a on final consonants', () => {
    expect(result('sunda')).toBe(consonants.s + vowelSigns.u + consonants.n + virama + consonants.d)
    expect(result('nulis')).toBe(consonants.n + vowelSigns.u + consonants.l + vowelSigns.i + consonants.s + virama)
  })

  it('matches digraphs ng and ny before single letters', () => {
    expect(result('nga')).toBe(consonants.ng)
    expect(result('nge')).toBe(consonants.ng + vowelSigns.e)
    expect(result('nyi')).toBe(consonants.ny + vowelSigns.i)
  })

  it('uses independent vowels at word start', () => {
    expect(result('a')).toBe(independentVowels.a)
    expect(result('o')).toBe(independentVowels.o)
    expect(result('aksara')).toBe(independentVowels.a + consonants.k + virama + consonants.s + consonants.r)
  })

  it('lowercases input and handles mixed case', () => {
    expect(result('KITA')).toBe(result('kita'))
  })

  it('preserves non-alpha characters', () => {
    expect(result('123')).toBe('123')
    expect(result('a-b')).toBe(independentVowels.a + '-' + consonants.b + virama)
  })

  it('preserves multiple spaces between words', () => {
    expect(result('sareng  éli')).toBe(
      consonants.s + consonants.r + vowelSigns.e + consonants.ng + virama + '  ' + independentVowels.é + consonants.l + vowelSigns.i
    )
  })

  it('translates a full sentence', () => {
    expect(result('ka ta nulis aksara sunda')).toBe(
      consonants.k + ' ' + consonants.t + ' ' +
      consonants.n + vowelSigns.u + consonants.l + vowelSigns.i + consonants.s + virama + ' ' +
      independentVowels.a + consonants.k + virama + consonants.s + consonants.r + ' ' +
      consonants.s + vowelSigns.u + consonants.n + virama + consonants.d
    )
  })
})

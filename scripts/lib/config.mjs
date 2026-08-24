import { join } from 'node:path'

export const ROOT = process.cwd()
export const DIRS = {
  raw: join(ROOT, 'data', 'raw'),
  normalized: join(ROOT, 'data', 'normalized'),
  blacklists: join(ROOT, 'data', 'blacklists'),
  output: join(ROOT, 'data', 'output'),
  finalOutput: join(ROOT, 'output'),
}

// The Bosnian Latin alphabet has 30 letters. Five are digraphs written with two
// Unicode code points (dž, lj, nj) but are treated as ONE letter for spelling,
// alphabetization, and — for this project — Wordle tile purposes.
export const DIGRAPHS = ['dž', 'lj', 'nj']
export const SINGLE_LETTERS = [
  'a', 'b', 'c', 'č', 'ć', 'd', 'đ', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'r', 's', 'š', 't', 'u', 'v', 'z', 'ž',
]
export const ALL_GRAPHEMES = [...DIGRAPHS, ...SINGLE_LETTERS]

// Longest-match-first regex so "lj" is captured before falling through to "l"+"j".
const GRAPHEME_PATTERN = new RegExp(DIGRAPHS.map(d => d).join('|') + '|' + SINGLE_LETTERS.join('|'), 'gu')

/**
 * Splits a lowercase Bosnian word into its grapheme sequence, e.g.
 * "ljepota" -> ["lj","e","p","o","t","a"], "džem" -> ["dž","e","m"].
 * Returns null if the word contains any character outside the Bosnian alphabet.
 */
export function toGraphemes(word) {
  const graphemes = []
  let index = 0
  while (index < word.length) {
    const two = word.slice(index, index + 2)
    if (DIGRAPHS.includes(two)) {
      graphemes.push(two)
      index += 2
      continue
    }
    const one = word[index]
    if (SINGLE_LETTERS.includes(one)) {
      graphemes.push(one)
      index += 1
      continue
    }
    return null
  }
  return graphemes
}

export function isFiveLetterWord(word) {
  const graphemes = toGraphemes(word)
  return graphemes !== null && graphemes.length === 5
}

const DIACRITIC_FOLD_MAP = { č: 'c', ć: 'c', đ: 'd', š: 's', ž: 'z' }
export function foldDiacritics(word) {
  return [...word].map(ch => DIACRITIC_FOLD_MAP[ch] ?? ch).join('')
}

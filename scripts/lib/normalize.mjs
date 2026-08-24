// Normalizes raw source tokens into clean lowercase Bosnian-Latin word candidates.
// Handles: Unicode NFC folding, case folding, stripping punctuation/digits/affix
// flags, and rejecting anything that isn't a pure Bosnian-alphabet word.

const NON_ALPHA_TRAILER = /[^\p{L}]+$/gu
const NON_ALPHA_LEADER = /^[^\p{L}]+/gu
const HAS_DIGIT = /\d/u
const HAS_NON_LETTER = /[^\p{L}]/u
// Bosnian Latin letters only — rejects Cyrillic, German umlauts, stray Latin
// letters (q, w, x, y) that don't belong to the Bosnian alphabet, etc.
const BOSNIAN_LETTER_SET = new Set([..."abcčćdđefghijklmnoprsštuvzž"])

export function normalizeToken(raw) {
  if (typeof raw !== 'string') return null
  let word = raw.normalize('NFC').trim()
  // Hunspell .dic lines: "riječ/AFFIX_FLAGS" or "riječ  # comment"
  word = word.split('/')[0].split('#')[0].trim()
  word = word.replace(NON_ALPHA_LEADER, '').replace(NON_ALPHA_TRAILER, '')
  if (!word) return null
  word = word.toLowerCase()
  if (HAS_DIGIT.test(word)) return null
  if (HAS_NON_LETTER.test(word)) return null
  for (const ch of word) {
    if (!BOSNIAN_LETTER_SET.has(ch)) return null
  }
  return word
}

export function normalizeTokens(rawTokens) {
  const seen = new Set()
  for (const raw of rawTokens) {
    const normalized = normalizeToken(raw)
    if (normalized) seen.add(normalized)
  }
  return seen
}

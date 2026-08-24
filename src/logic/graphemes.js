// The Bosnian Latin alphabet has 30 letters. Five of them are digraphs
// written with two Unicode code points — dž, lj, nj — but each counts as ONE
// letter for spelling, alphabetization, and (in this game) one Wordle tile.
// Every part of the game that deals with "how many letters" or "which tile"
// must go through toGraphemes() rather than splitting the raw string.
export const DIGRAPHS = ['dž', 'lj', 'nj']
export const SINGLE_LETTERS = [
  'a', 'b', 'c', 'č', 'ć', 'd', 'đ', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'r', 's', 'š', 't', 'u', 'v', 'z', 'ž',
]

/**
 * Splits a lowercase Bosnian word into its grapheme sequence, e.g.
 * "ljepota" -> ["lj","e","p","o","t","a"], "džem" -> ["dž","e","m"].
 * Returns null if any part of the string isn't a recognized Bosnian letter.
 */
export function toGraphemes(word) {
  const lower = String(word).toLowerCase()
  const graphemes = []
  let index = 0
  while (index < lower.length) {
    const two = lower.slice(index, index + 2)
    if (DIGRAPHS.includes(two)) {
      graphemes.push(two)
      index += 2
      continue
    }
    const one = lower[index]
    if (SINGLE_LETTERS.includes(one)) {
      graphemes.push(one)
      index += 1
      continue
    }
    return null
  }
  return graphemes
}

export function isValidFiveLetterWord(word) {
  const graphemes = toGraphemes(word)
  return graphemes !== null && graphemes.length === 5
}

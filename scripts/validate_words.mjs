// Validates the final generated word list. Exits with a non-zero status and
// prints the offending words if ANY check fails — never reports a fake
// success. Run with: node scripts/validate_words.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { DIRS } from './lib/config.mjs'
import { toGraphemes } from './lib/config.mjs'

const EXPECTED_ALLOWED_COUNT = 15000
const BOSNIAN_LETTER_PATTERN = /^[abcčćdđefghijklmnoprsštuvzž]+$/u

function loadJSON(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    if (fallback !== null) return fallback
    throw new Error(`Could not read ${path}: ${error.message}`)
  }
}

function loadBlacklistSet() {
  const merged = new Set()
  let files = []
  try {
    files = readdirSync(DIRS.blacklists).filter(f => f.endsWith('.json') && f !== '_report.json')
  } catch {
    files = []
  }
  for (const file of files) {
    for (const w of loadJSON(join(DIRS.blacklists, file), [])) merged.add(w)
  }
  return merged
}

const { allowedWords, answerWords } = await import('../src/data/words.js?cachebust=' + Date.now())

const failures = []

function fail(checkName, message, offenders = []) {
  failures.push({ checkName, message, offenders: offenders.slice(0, 25), offenderCount: offenders.length })
}

// 1. Exactly 15,000 allowed words
if (allowedWords.length !== EXPECTED_ALLOWED_COUNT) {
  fail('exact-count', `Expected exactly ${EXPECTED_ALLOWED_COUNT} allowedWords, found ${allowedWords.length}.`)
}

// 2. No duplicates (allowedWords)
{
  const seen = new Set()
  const dupes = []
  for (const w of allowedWords) {
    if (seen.has(w)) dupes.push(w)
    seen.add(w)
  }
  if (dupes.length) fail('no-duplicates', `${dupes.length} duplicate word(s) in allowedWords.`, dupes)
}

// 3. Every word has exactly 5 Unicode/grapheme letters (digraph-aware)
{
  const badLength = allowedWords.filter(w => {
    const graphemes = toGraphemes(w)
    return graphemes === null || graphemes.length !== 5
  })
  if (badLength.length) fail('exact-5-graphemes', `${badLength.length} word(s) do not have exactly 5 Bosnian letters.`, badLength)
}

// 4. No disallowed characters (only lowercase Bosnian Latin alphabet)
{
  const badChars = allowedWords.filter(w => !BOSNIAN_LETTER_PATTERN.test(w))
  if (badChars.length) fail('allowed-characters', `${badChars.length} word(s) contain characters outside the Bosnian Latin alphabet or are not lowercase.`, badChars)
}

// 5-8. Blacklist (proper nouns, geography, countries/cities/rivers/mountains all live in the same blacklist set)
{
  const blacklist = loadBlacklistSet()
  const hits = allowedWords.filter(w => blacklist.has(w))
  if (hits.length) fail('blacklist-clean', `${hits.length} word(s) from allowedWords are present in the blacklist (names/geography/etc).`, hits)
}

// 9. No vulgarities specifically (subset check for a clearer report line)
{
  const vulgar = new Set(loadJSON(join(DIRS.blacklists, 'vulgarities.json'), []))
  const hits = allowedWords.filter(w => vulgar.has(w))
  if (hits.length) fail('no-vulgarities', `${hits.length} vulgar word(s) found in allowedWords.`, hits)
}

// 10. No obvious abbreviations
{
  const abbrev = new Set(loadJSON(join(DIRS.blacklists, 'abbreviations.json'), []))
  const hits = allowedWords.filter(w => abbrev.has(w))
  if (hits.length) fail('no-abbreviations', `${hits.length} abbreviation(s) found in allowedWords.`, hits)
}

// Extra: answerWords must be a subset of allowedWords
{
  const allowedSet = new Set(allowedWords)
  const orphans = answerWords.filter(w => !allowedSet.has(w))
  if (orphans.length) fail('answers-subset-of-allowed', `${orphans.length} answerWords are not present in allowedWords.`, orphans)
}

// Extra: answerWords has no duplicates either
{
  const seen = new Set()
  const dupes = []
  for (const w of answerWords) {
    if (seen.has(w)) dupes.push(w)
    seen.add(w)
  }
  if (dupes.length) fail('answers-no-duplicates', `${dupes.length} duplicate word(s) in answerWords.`, dupes)
}

console.log('--- Validation report ---')
if (failures.length === 0) {
  console.log(`PASS: all checks succeeded. allowedWords=${allowedWords.length}, answerWords=${answerWords.length}`)
  process.exit(0)
}

for (const f of failures) {
  console.error(`\nFAIL [${f.checkName}]: ${f.message}`)
  if (f.offenderCount > 0) {
    console.error(`  Sample offenders (${Math.min(f.offenderCount, 25)} of ${f.offenderCount}): ${f.offenders.join(', ')}`)
  }
}
console.error(`\n${failures.length} check(s) failed. Fix the pipeline and regenerate — do not hand-edit words.js.`)
process.exit(1)

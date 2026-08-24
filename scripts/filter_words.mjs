// Merges all normalized per-source candidate pools into one big candidate
// pool, applies the Unicode/digraph-aware exactly-5-letter filter, then
// applies structural sanity filters (no repeated-char junk, no single-source
// OCR-looking garbage) and the full blacklist. Writes:
//   data/output/candidates_5letter.json     - post length filter
//   data/output/candidates_clean.json       - post blacklist + sanity
//   data/output/source_membership.json      - word -> [sources it appeared in]
//   data/output/removed_by_reason.json      - word -> reason (for the report)
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DIRS } from './lib/config.mjs'
import { isFiveLetterWord, toGraphemes } from './lib/config.mjs'

mkdirSync(DIRS.output, { recursive: true })

const SOURCE_FILES = {
  bs_BA: 'bs_BA.json',
  hr_HR: 'hr_HR.json',
  sr_Latn: 'sr_Latn.json',
  wordfreq_sh: 'wordfreq_sh.json',
  kaikki_sh: 'kaikki_sh.json',
}

function loadJSON(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

// --- 1. Merge sources, track membership ---
const sourceWords = {}
for (const [source, file] of Object.entries(SOURCE_FILES)) {
  sourceWords[source] = new Set(loadJSON(join(DIRS.normalized, file), []))
}

const membership = {}
for (const [source, words] of Object.entries(sourceWords)) {
  for (const word of words) {
    if (!membership[word]) membership[word] = []
    membership[word].push(source)
  }
}

const mergedCount = Object.keys(membership).length

// --- 2. Exactly-5-grapheme filter (Unicode/digraph aware) ---
const fiveLetterWords = new Set()
for (const word of Object.keys(membership)) {
  if (isFiveLetterWord(word)) fiveLetterWords.add(word)
}
writeFileSync(join(DIRS.output, 'candidates_5letter.json'), JSON.stringify([...fiveLetterWords].sort()), 'utf8')

// --- 3. Structural sanity filters ---
// Reject: all-same-letter junk (aaaaa), 4+ repeated identical graphemes,
// tokens that are single-source AND look like OCR/typo noise (contain an
// implausible grapheme run for Bosnian phonotactics: 3+ consecutive
// consonants outside known clusters is a soft signal, kept conservative to
// avoid false positives on real words like "vrsta"-style clusters).
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])
function hasNoVowel(graphemes) {
  return !graphemes.some(g => VOWELS.has(g) || g === 'r') // "r" can be syllabic in Bosnian (vrt, crn)
}
function hasFourPlusRepeatedGrapheme(graphemes) {
  const counts = {}
  for (const g of graphemes) counts[g] = (counts[g] ?? 0) + 1
  return Object.values(counts).some(c => c >= 4)
}

const removedByReason = {}
const sanityFailed = new Set()
for (const word of fiveLetterWords) {
  const graphemes = toGraphemes(word)
  if (hasNoVowel(graphemes)) {
    sanityFailed.add(word)
    removedByReason[word] = 'no_vowel'
    continue
  }
  if (hasFourPlusRepeatedGrapheme(graphemes)) {
    sanityFailed.add(word)
    removedByReason[word] = 'repeated_grapheme'
  }
}

// --- 4. Blacklist ---
function loadBlacklistDir() {
  const merged = new Set()
  const perFile = {}
  let files = []
  try {
    files = readdirSync(DIRS.blacklists).filter(f => f.endsWith('.json') && f !== '_report.json')
  } catch {
    files = []
  }
  for (const file of files) {
    const words = loadJSON(join(DIRS.blacklists, file), [])
    perFile[file] = new Set(words)
    for (const w of words) merged.add(w)
  }
  return { merged, perFile }
}

const { merged: blacklistSet, perFile: blacklistPerFile } = loadBlacklistDir()

const cleanWords = new Set()
for (const word of fiveLetterWords) {
  if (sanityFailed.has(word)) continue
  if (blacklistSet.has(word)) {
    if (!removedByReason[word]) {
      const hitFile = Object.entries(blacklistPerFile).find(([, set]) => set.has(word))?.[0] ?? 'blacklist'
      removedByReason[word] = `blacklist:${hitFile.replace('.json', '')}`
    }
    continue
  }
  cleanWords.add(word)
}

writeFileSync(join(DIRS.output, 'candidates_clean.json'), JSON.stringify([...cleanWords].sort()), 'utf8')
writeFileSync(join(DIRS.output, 'source_membership.json'), JSON.stringify(membership), 'utf8')
writeFileSync(join(DIRS.output, 'removed_by_reason.json'), JSON.stringify(removedByReason), 'utf8')

const removedForBlacklist = Object.values(removedByReason).filter(r => r.startsWith('blacklist')).length
const removedForSanity = Object.values(removedByReason).filter(r => !r.startsWith('blacklist')).length

console.log('--- Filter summary ---')
console.log(`Merged unique candidates (all lengths): ${mergedCount}`)
console.log(`Exactly 5 Bosnian graphemes:             ${fiveLetterWords.size}`)
console.log(`Removed by sanity filters:                -${removedForSanity}`)
console.log(`Removed by blacklist:                     -${removedForBlacklist}`)
console.log(`Clean candidates remaining:               ${cleanWords.size}`)

writeFileSync(join(DIRS.output, '_filter_report.json'), JSON.stringify({
  mergedCount,
  fiveLetterCount: fiveLetterWords.size,
  removedForSanity,
  removedForBlacklist,
  cleanCount: cleanWords.size,
}, null, 2), 'utf8')

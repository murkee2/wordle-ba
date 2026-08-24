// Scores every clean candidate word for (a) how confidently it's a real,
// standard Bosnian word, and (b) how good a Wordle word it is. Writes
// data/output/scored_words.json: [{ word, score, breakdown, isBosnianCore }]
//
// Scoring model (transparent, additive):
//   +3   present in bs_BA (Bosnian Hunspell) — direct Bosnian dictionary hit
//   +1   present in hr_HR (Croatian Hunspell) — shared štokavski vocabulary signal
//   +1   present in sr_Latn (Serbian, transliterated) — shared vocabulary signal
//   +2   present in kaikki/Wiktionary Serbo-Croatian — independent lexicographic source
//   +0 to +4   wordfreq "sh" frequency bucket, scaled (higher bucket = more common)
//   +1   cross-source bonus: appears in 3+ independent sources
//   +1   POS is a common open class (noun/verb/adjective/adverb) per kaikki
//   -2   POS is a closed/rare class per kaikki (interjection, particle, proper noun leftover)
//   -3   only appears in a single non-Bosnian source (hr or sr only, no bs_BA/kaikki/wordfreq)
//        — "exists but not attested as Bosnian usage"
//
// isBosnianCore = true when the word has direct Bosnian attestation (bs_BA
// dictionary OR wordfreq/kaikki frequency support), used later to build the
// stricter answerWords set.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIRS } from './lib/config.mjs'

function loadJSON(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

const cleanWords = loadJSON(join(DIRS.output, 'candidates_clean.json'), [])
const membership = loadJSON(join(DIRS.output, 'source_membership.json'), {})
const wordfreqFrequencies = loadJSON(join(DIRS.normalized, 'wordfreq_sh.frequencies.json'), {})
const kaikkiPos = loadJSON(join(DIRS.normalized, 'kaikki_sh.pos.json'), {})
const kaikkiCategories = loadJSON(join(DIRS.normalized, 'kaikki_sh.categories.json'), {})

const OPEN_CLASS_POS = new Set(['noun', 'verb', 'adj', 'adv'])
const CLOSED_OR_RARE_POS = new Set(['intj', 'particle', 'name', 'phrase', 'proverb', 'abbrev', 'symbol', 'character'])

// wordfreq bucket indices in this dataset run roughly 1 (rarest) to ~600
// (most common). Normalize to a 0-4 additive bonus on a log-ish scale.
function wordfreqBonus(bucketIndex) {
  if (bucketIndex == null) return 0
  if (bucketIndex >= 550) return 4
  if (bucketIndex >= 450) return 3
  if (bucketIndex >= 300) return 2
  if (bucketIndex >= 150) return 1
  return 0
}

const scored = []
for (const word of cleanWords) {
  const sources = new Set(membership[word] ?? [])
  const breakdown = {}

  breakdown.bs_BA = sources.has('bs_BA') ? 3 : 0
  breakdown.hr_HR = sources.has('hr_HR') ? 1 : 0
  breakdown.sr_Latn = sources.has('sr_Latn') ? 1 : 0
  breakdown.kaikki = sources.has('kaikki_sh') ? 2 : 0

  const bucket = wordfreqFrequencies[word]
  breakdown.wordfreq = sources.has('wordfreq_sh') ? wordfreqBonus(bucket) : 0

  breakdown.crossSourceBonus = sources.size >= 3 ? 1 : 0

  const posTags = kaikkiPos[word] ?? []
  const hasOpenClass = posTags.some(p => OPEN_CLASS_POS.has(p))
  const hasClosedClass = posTags.some(p => CLOSED_OR_RARE_POS.has(p))
  breakdown.posBonus = hasOpenClass ? 1 : 0
  breakdown.posPenalty = hasClosedClass ? -2 : 0

  const categories = kaikkiCategories[word] ?? []
  const looksProperNounish = categories.some(c => /surname|given name|place name|toponym/i.test(c))
  breakdown.residualProperNounPenalty = looksProperNounish ? -3 : 0

  const isBosnianCore = sources.has('bs_BA') || sources.has('wordfreq_sh') || sources.has('kaikki_sh')
  breakdown.soleForeignSourcePenalty = !isBosnianCore && sources.size <= 1 ? -3 : 0

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0)

  scored.push({ word, score, sources: [...sources].sort(), breakdown, isBosnianCore })
}

scored.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word))

writeFileSync(join(DIRS.output, 'scored_words.json'), JSON.stringify(scored), 'utf8')

const histogram = {}
for (const { score } of scored) histogram[score] = (histogram[score] ?? 0) + 1

console.log('--- Score summary ---')
console.log(`Total scored candidates: ${scored.length}`)
console.log(`Bosnian-core attested:   ${scored.filter(s => s.isBosnianCore).length}`)
console.log('Score histogram:')
for (const score of Object.keys(histogram).map(Number).sort((a, b) => b - a)) {
  console.log(`  score ${String(score).padStart(3)}: ${histogram[score]}`)
}

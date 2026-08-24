// Parses every downloaded raw source into a per-source list of normalized
// candidate words (data/normalized/<source>.json) plus a frequency signal
// where the source provides one (wordfreq).
import { readFileSync, writeFileSync, mkdirSync, existsSync, createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { createGunzip } from 'node:zlib'
import { join } from 'node:path'
import { decode } from '@msgpack/msgpack'
import { DIRS } from './lib/config.mjs'
import { normalizeTokens, normalizeToken } from './lib/normalize.mjs'

mkdirSync(DIRS.normalized, { recursive: true })

function readRaw(file) {
  return readFileSync(join(DIRS.raw, file), 'utf8')
}

function parseHunspellDic(text) {
  // First line is the approximate word count; skip it.
  const lines = text.split(/\r?\n/u).slice(1)
  return lines.map(line => line.trim().split(/\s+/u)[0]).filter(Boolean)
}

async function parseWordfreqSh() {
  const path = join(DIRS.raw, 'wordfreq_small_sh.msgpack.gz')
  if (!existsSync(path)) return { words: new Set(), frequencies: {} }
  const chunks = []
  await new Promise((resolve, reject) => {
    createReadStream(path).pipe(createGunzip())
      .on('data', c => chunks.push(c))
      .on('end', resolve)
      .on('error', reject)
  })
  const buffer = Buffer.concat(chunks)
  // wordfreq's msgpack payload is [header, bucket_1, bucket_2, ..., bucket_N]
  // where the array index IS the centibel frequency-rank bucket: index 1 is the
  // rarest bucket, higher indices are progressively more common (per wordfreq's
  // cB format). We convert the bucket index directly into a frequency score.
  const decoded = decode(buffer)
  const frequencies = {}
  const words = new Set()
  if (Array.isArray(decoded)) {
    for (let bucketIndex = 1; bucketIndex < decoded.length; bucketIndex += 1) {
      const bucketWords = decoded[bucketIndex]
      if (!Array.isArray(bucketWords)) continue
      for (const raw of bucketWords) {
        const normalized = normalizeToken(raw)
        if (!normalized) continue
        words.add(normalized)
        if (!(normalized in frequencies) || bucketIndex > frequencies[normalized]) {
          frequencies[normalized] = bucketIndex
        }
      }
    }
  }
  return { words, frequencies }
}

async function parseKaikkiWiktionary() {
  const path = join(DIRS.raw, 'kaikki_serbocroatian.jsonl')
  const result = {
    words: new Set(),
    // word -> Set of lowercase category strings (used later for blacklist signals)
    categories: {},
    // word -> Set of part-of-speech tags
    pos: {},
  }
  if (!existsSync(path)) return result

  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity })
  let lineCount = 0
  for await (const line of rl) {
    lineCount += 1
    if (!line.trim()) continue
    let entry
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }
    const wordRaw = entry.word
    const normalized = normalizeToken(wordRaw)
    if (!normalized) continue
    result.words.add(normalized)
    const cats = new Set(result.categories[normalized] ?? [])
    const addCategory = c => {
      const name = typeof c === 'string' ? c : c?.name
      if (name) cats.add(String(name).toLowerCase())
    }
    for (const c of entry.categories ?? []) addCategory(c)
    for (const sense of entry.senses ?? []) {
      for (const c of sense.categories ?? []) addCategory(c)
      for (const tag of sense.tags ?? []) cats.add(`tag:${String(tag).toLowerCase()}`)
    }
    if (cats.size) result.categories[normalized] = [...cats]
    if (entry.pos) {
      const posSet = new Set(result.pos[normalized] ?? [])
      posSet.add(entry.pos)
      result.pos[normalized] = [...posSet]
    }
  }
  console.log(`  kaikki: parsed ${lineCount} JSONL lines`)
  return result
}

function saveWordSet(name, words) {
  const sorted = [...words].sort()
  writeFileSync(join(DIRS.normalized, `${name}.json`), JSON.stringify(sorted), 'utf8')
  return sorted.length
}

const report = {}

console.log('Parsing bs_BA Hunspell...')
report.bs_BA = saveWordSet('bs_BA', normalizeTokens(parseHunspellDic(readRaw('bs_BA.dic'))))

console.log('Parsing hr_HR Hunspell...')
report.hr_HR = saveWordSet('hr_HR', normalizeTokens(parseHunspellDic(readRaw('hr_HR.dic'))))

console.log('Parsing sr_Latn Hunspell...')
report.sr_Latn = saveWordSet('sr_Latn', normalizeTokens(parseHunspellDic(readRaw('sr_Latn.dic'))))

console.log('Parsing wordfreq (sh)...')
const wordfreq = await parseWordfreqSh()
report.wordfreq_sh = saveWordSet('wordfreq_sh', wordfreq.words)
writeFileSync(join(DIRS.normalized, 'wordfreq_sh.frequencies.json'), JSON.stringify(wordfreq.frequencies), 'utf8')

console.log('Parsing kaikki (Serbo-Croatian Wiktionary)... this can take a few minutes for a 290MB file')
const kaikki = await parseKaikkiWiktionary()
report.kaikki_sh = saveWordSet('kaikki_sh', kaikki.words)
writeFileSync(join(DIRS.normalized, 'kaikki_sh.categories.json'), JSON.stringify(kaikki.categories), 'utf8')
writeFileSync(join(DIRS.normalized, 'kaikki_sh.pos.json'), JSON.stringify(kaikki.pos), 'utf8')

writeFileSync(join(DIRS.normalized, '_report.json'), JSON.stringify(report, null, 2), 'utf8')
console.log('\n--- Parse summary (normalized candidate counts per source) ---')
for (const [source, count] of Object.entries(report)) console.log(`${String(count).padStart(8)}  ${source}`)

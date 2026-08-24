// Builds category-specific blacklists (proper nouns, geography, brands,
// vulgarities, abbreviations) into data/blacklists/*.json. Wikidata is the
// primary structured source for names/geography; everything else is a
// curated static list because no clean structured source exists for it.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { DIRS } from './lib/config.mjs'
import { normalizeToken } from './lib/normalize.mjs'
import { paginatedQuery, extractLabels } from './lib/sparql.mjs'

mkdirSync(DIRS.blacklists, { recursive: true })

const SKIP_WIKIDATA = process.argv.includes('--skip-wikidata')
// Re-run safe: skip any category that already has a non-empty file on disk
// (from a previous, possibly interrupted, run) and only (re)fetch the rest.
const ONLY_MISSING = process.argv.includes('--only-missing')

function hasExistingNonEmptyBlacklist(name) {
  const path = join(DIRS.blacklists, `wikidata_${name}.json`)
  if (!existsSync(path)) return false
  try {
    return JSON.parse(readFileSync(path, 'utf8')).length > 0
  } catch {
    return false
  }
}

const LANGS = '"bs","hr","sr"'

// Plain wdt:P31 (no P279* subclass transitive walk) — the transitive version
// is dramatically slower on the shared public query service (18s+ vs ~5s)
// and was causing timeouts. We accept slightly narrower coverage in exchange
// for the pipeline actually completing; qClasses can list multiple sibling
// classes via VALUES to recover coverage cheaply instead.
function geoQuery(qClasses, { countryFilter = null } = {}) {
  const classes = Array.isArray(qClasses) ? qClasses : [qClasses]
  return (limit, offset) => `
    SELECT DISTINCT ?label WHERE {
      VALUES ?class { ${classes.map(c => `wd:${c}`).join(' ')} }
      ?item wdt:P31 ?class .
      ${countryFilter ? `?item wdt:P17 wd:${countryFilter} .` : ''}
      ?item rdfs:label ?label .
      FILTER(LANG(?label) IN (${LANGS}))
    }
    LIMIT ${limit} OFFSET ${offset}
  `
}

function nameQuery(qClass) {
  return (limit, offset) => `
    SELECT DISTINCT ?label WHERE {
      ?item wdt:P31 wd:${qClass} .
      ?item rdfs:label ?label .
      FILTER(LANG(?label) IN (${LANGS}))
    }
    LIMIT ${limit} OFFSET ${offset}
  `
}

// Scoped to keep the shared public Wikidata query service responsive: global
// unbounded classes like "city" (Q515) or "human" time out the endpoint, so
// geography is scoped to Bosnia + a bounded set of well-known world features,
// and names/settlements are paginated in small pages (see sparql.mjs).
const WIKIDATA_TASKS = [
  // --- Geography: Bosnia-specific (highest priority) ---
  { name: 'ba_settlements', build: geoQuery(['Q486972', 'Q515', 'Q3957', 'Q532'], { countryFilter: 'Q225' }) }, // settlement/city/town/village in BiH
  { name: 'ba_municipalities', build: geoQuery('Q1799794', { countryFilter: 'Q225' }) }, // municipality of BiH
  { name: 'world_countries', build: nameQuery('Q6256') }, // country
  { name: 'rivers', build: geoQuery('Q4022'), maxPages: 1, pageSize: 1000 }, // river (global; small single page)
  { name: 'mountains', build: geoQuery(['Q8502', 'Q207326']), maxPages: 6 }, // mountain, mountain peak
  { name: 'lakes', build: geoQuery('Q23397'), maxPages: 1, pageSize: 1000 }, // lake
  { name: 'islands', build: geoQuery('Q23442'), maxPages: 4 }, // island
  { name: 'mountain_ranges', build: geoQuery('Q46831'), maxPages: 3 }, // mountain range
  { name: 'valleys', build: geoQuery('Q39816'), maxPages: 3 }, // valley
  { name: 'regions', build: geoQuery(['Q82794', 'Q3455524']), maxPages: 4 }, // geographic region, region of BiH
  { name: 'seas', build: geoQuery('Q165'), maxPages: 1, pageSize: 1000 }, // sea
  // --- Names ---
  { name: 'given_names', build: nameQuery('Q202444'), maxPages: 6 }, // given name
  { name: 'family_names', build: nameQuery('Q101352'), maxPages: 1, pageSize: 1000 }, // family name (small single page)
]

// Writes each category's blacklist file as soon as it's fetched (rather than
// buffering everything to the end) so a crash/timeout mid-run doesn't lose
// already-completed categories — re-running just picks up where report.json
// shows gaps.
async function buildWikidataBlacklists(report, saveBlacklist) {
  const combined = new Set()
  for (const task of WIKIDATA_TASKS) {
    if (ONLY_MISSING && hasExistingNonEmptyBlacklist(task.name)) {
      const existing = JSON.parse(readFileSync(join(DIRS.blacklists, `wikidata_${task.name}.json`), 'utf8'))
      for (const w of existing) combined.add(w)
      report[`wikidata_${task.name}`] = existing.length
      console.log(`[wikidata] ${task.name}: skipped (already have ${existing.length} words, --only-missing)`)
      continue
    }
    try {
      // Hard per-category deadline on top of runQuery's own retry/backoff:
      // guarantees a stuck category can never stall the whole pipeline run.
      const categoryTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('category-level timeout (50s)')), 50000))
      const bindings = await Promise.race([
        paginatedQuery(task.build, { label: task.name, pageSize: task.pageSize ?? 5000, maxPages: task.maxPages ?? 10 }),
        categoryTimeout,
      ])
      const labels = extractLabels(bindings)
      const normalized = new Set()
      for (const label of labels) {
        const n = normalizeToken(label)
        if (n) normalized.add(n)
      }
      for (const w of normalized) combined.add(w)
      report[`wikidata_${task.name}`] = saveBlacklist(`wikidata_${task.name}`, normalized)
      console.log(`[wikidata] ${task.name}: ${normalized.size} normalized words`)
    } catch (error) {
      console.error(`[wikidata] ${task.name} FAILED: ${error.message} (continuing with other categories)`)
      report[`wikidata_${task.name}`] = 0
    }
  }
  return combined
}

// --- Curated static lists: things Wikidata doesn't reliably structure ---

const CURATED_VULGARITIES = [
  // Bosnian/regional profanity, slurs, and sexually explicit terms.
  // Kept intentionally short-stemmed where needed by the filter step (see
  // filter_words.mjs SUBSTRING_BLACKLIST) — this file lists exact 5-letter
  // hits plus common roots.
  'jebem', 'jeben', 'jebac', 'jebac', 'kurac', 'kurca', 'kurve', 'kurva', 'picka', 'pizda',
  'pizde', 'govno', 'govna', 'seron', 'serem', 'drkat', 'drkan', 'peder', 'peder', 'ciganin',
  'cigan', 'siled', 'silov', 'droca', 'kurvo', 'jebiv', 'jebac', 'gonic', 'kucko', 'kucka',
]

const CURATED_ABBREVIATIONS_ACRONYMS = [
  'nato', 'unhcr', 'unicef', 'undp', 'osce', 'eufor', 'ifor', 'sfor', 'oscd', 'jmbg',
  'mupa', 'sipa', 'osce', 'tvsa', 'brtv', 'obn', 'fena', 'srna', 'ba', 'eu', 'sad', 'un',
]

const CURATED_BRANDS_ORGS = [
  'bhrt', 'fbih', 'zeljo', 'sarajevka', 'coca', 'pepsi', 'nokia', 'adidas', 'nike',
  'google', 'apple', 'meta', 'tesla', 'bmw', 'audi', 'skoda', 'fiat',
]

// Hand-curated safety net for the highest-stakes geography/name categories —
// kept small and high-precision on purpose. This guarantees baseline
// coverage even if the Wikidata queries above fail outright (the public
// endpoint is shared infrastructure and occasionally throttles or times
// out), so the pipeline's correctness never depends solely on SPARQL uptime.
const CURATED_BA_PLACES = [
  'sarajevo', 'mostar', 'tuzla', 'zenica', 'bihać', 'bihac', 'brčko', 'brcko', 'prijedor',
  'trebinje', 'travnik', 'goražde', 'gorazde', 'konjic', 'livno', 'foča', 'foca', 'visoko',
  'zvornik', 'bugojno', 'gradačac', 'gradacac', 'cazin', 'gračanica', 'gracanica', 'tešanj',
  'tesanj', 'jajce', 'kakanj', 'čapljin', 'capljin', 'stolac', 'neum', 'bosna', 'drina', 'sava',
  'una', 'vrbas', 'neretva', 'bihaćka', 'romanija', 'igman', 'bjelašnica', 'bjelasnica',
  'vlašić', 'vlasic', 'treskavica', 'jahorina', 'trebević', 'trebevic', 'majevica', 'kozara',
]
const CURATED_GIVEN_NAMES = [
  'ahmed', 'aldin', 'amila', 'amina', 'damir', 'denis', 'edina', 'emira', 'emina', 'haris',
  'josip', 'marko', 'samir', 'tahir', 'adnan', 'ahmet', 'ajdin', 'almir', 'amela', 'anton',
  'antun', 'armin', 'dario', 'darko', 'david', 'davud', 'dejan', 'elvir', 'elvis', 'enver',
  'faruk', 'hamza', 'hasan', 'ibrahim', 'ilhan', 'ismet', 'ivana', 'ivica', 'jasmin', 'jovan',
  'julia', 'jusuf', 'kemal', 'kenan', 'lejla', 'maida', 'majda', 'marin', 'mario', 'mirza',
  'munir', 'nadia', 'nenad', 'nikola', 'sanja', 'selma', 'senad', 'srđan', 'srdjan', 'tamara',
  'vedad', 'zoran', 'zorka', 'zlata', 'zlatan', 'edin', 'ensar', 'irfan', 'kerim', 'nedim',
  'rusmir', 'safet', 'suad', 'zijad', 'alma', 'belma', 'dzenana', 'dženana', 'indira', 'jasna',
  'lamija', 'maja', 'medina', 'mirela', 'sabina', 'vesna',
]
const CURATED_FAMILY_NAMES = [
  'hodžić', 'hodzic', 'begić', 'begic', 'kovačević', 'kovacevic', 'marić', 'maric',
  'jusić', 'jusic', 'omerović', 'omerovic', 'delić', 'delic', 'imamović', 'imamovic',
  'karić', 'karic', 'zukić', 'zukic', 'mujić', 'mujic', 'alić', 'alic', 'salihović',
  'salihovic', 'halilović', 'halilovic', 'ibrahimović', 'ibrahimovic', 'smajić', 'smajic',
  'pašić', 'pasic', 'kovač', 'kovac', 'popović', 'popovic', 'jovanović', 'jovanovic',
  'petrović', 'petrovic', 'nikolić', 'nikolic', 'jurić', 'juric', 'kovačić', 'kovacic',
  'horvat', 'novak', 'babić', 'babic', 'matić', 'matic', 'perić', 'peric',
]

function saveBlacklist(name, words) {
  const sorted = [...new Set(words)].filter(Boolean).sort()
  writeFileSync(join(DIRS.blacklists, `${name}.json`), JSON.stringify(sorted), 'utf8')
  return sorted.length
}

const report = {}

// Fast curated lists first so they're on disk even if Wikidata later stalls.
report.vulgarities = saveBlacklist('vulgarities', CURATED_VULGARITIES)
report.abbreviations = saveBlacklist('abbreviations', CURATED_ABBREVIATIONS_ACRONYMS)
report.brands_orgs = saveBlacklist('brands_orgs', CURATED_BRANDS_ORGS)
report.curated_ba_places = saveBlacklist('curated_ba_places', CURATED_BA_PLACES)
report.curated_given_names = saveBlacklist('curated_given_names', CURATED_GIVEN_NAMES)
report.curated_family_names = saveBlacklist('curated_family_names', CURATED_FAMILY_NAMES)
writeFileSync(join(DIRS.blacklists, '_report.json'), JSON.stringify(report, null, 2), 'utf8')

if (!SKIP_WIKIDATA) {
  console.log('Querying Wikidata for proper nouns and geography (paginated, may take a few minutes)...')
  const combined = await buildWikidataBlacklists(report, saveBlacklist)
  report.wikidata_combined = saveBlacklist('wikidata_proper_nouns_geo', combined)
} else {
  console.log('Skipping Wikidata (--skip-wikidata passed).')
}

writeFileSync(join(DIRS.blacklists, '_report.json'), JSON.stringify(report, null, 2), 'utf8')
console.log('\n--- Blacklist summary ---')
for (const [name, count] of Object.entries(report)) console.log(`${String(count).padStart(8)}  ${name}`)

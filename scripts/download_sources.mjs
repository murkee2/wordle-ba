// Downloads every raw source used by the pipeline into data/raw/.
// Re-run safe: skips files that already exist unless --force is passed.
import { mkdirSync, existsSync, createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { join } from 'node:path'
import { DIRS } from './lib/config.mjs'

const FORCE = process.argv.includes('--force')
const SKIP_HEAVY = process.argv.includes('--skip-heavy')

mkdirSync(DIRS.raw, { recursive: true })

const SOURCES = [
  {
    id: 'bs_BA_hunspell_dic',
    url: 'https://raw.githubusercontent.com/ebukva/bs_BA/master/bs_BA.dic',
    file: 'bs_BA.dic',
  },
  {
    id: 'bs_BA_hunspell_aff',
    url: 'https://raw.githubusercontent.com/ebukva/bs_BA/master/bs_BA.aff',
    file: 'bs_BA.aff',
  },
  {
    id: 'bs_BA_hunspell_license',
    url: 'https://raw.githubusercontent.com/ebukva/bs_BA/master/license.txt',
    file: 'bs_BA.LICENSE.txt',
  },
  {
    id: 'hr_HR_hunspell_dic',
    url: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/hr_HR/hr_HR.dic',
    file: 'hr_HR.dic',
  },
  {
    id: 'hr_HR_hunspell_license',
    url: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/hr_HR/README_hr_HR.txt',
    file: 'hr_HR.LICENSE.txt',
  },
  {
    id: 'sr_Latn_hunspell_dic',
    url: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/sr/sr-Latn.dic',
    file: 'sr_Latn.dic',
    fallbackUrl: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/sr/sr.dic',
  },
  {
    id: 'sr_Latn_hunspell_license',
    url: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/sr/README.txt',
    file: 'sr_Latn.LICENSE.txt',
  },
  {
    id: 'wordfreq_sh',
    url: 'https://raw.githubusercontent.com/rspeer/wordfreq/master/wordfreq/data/small_sh.msgpack.gz',
    file: 'wordfreq_small_sh.msgpack.gz',
    binary: true,
  },
  {
    id: 'wordfreq_license',
    url: 'https://raw.githubusercontent.com/rspeer/wordfreq/master/NOTICE.md',
    file: 'wordfreq.NOTICE.md',
  },
  {
    id: 'kaikki_serbocroatian_wiktionary',
    url: 'https://kaikki.org/dictionary/Serbo-Croatian/kaikki.org-dictionary-SerboCroatian.jsonl',
    file: 'kaikki_serbocroatian.jsonl',
    binary: true,
    heavy: true,
  },
]

async function downloadOne(source) {
  const dest = join(DIRS.raw, source.file)
  if (existsSync(dest) && !FORCE) {
    console.log(`[skip] ${source.id} (already exists at data/raw/${source.file})`)
    return { id: source.id, status: 'skipped' }
  }
  if (source.heavy && SKIP_HEAVY) {
    console.log(`[skip-heavy] ${source.id}`)
    return { id: source.id, status: 'skipped-heavy' }
  }

  let response = await fetch(source.url)
  if (!response.ok && source.fallbackUrl) {
    console.warn(`[warn] ${source.id} primary failed (${response.status}); trying fallback`)
    response = await fetch(source.fallbackUrl)
  }
  if (!response.ok) {
    console.error(`[fail] ${source.id}: HTTP ${response.status}`)
    return { id: source.id, status: 'failed', httpStatus: response.status }
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(dest))
  console.log(`[ok] ${source.id} -> data/raw/${source.file}`)
  return { id: source.id, status: 'downloaded' }
}

const results = []
for (const source of SOURCES) {
  try {
    results.push(await downloadOne(source))
  } catch (error) {
    console.error(`[error] ${source.id}: ${error.message}`)
    results.push({ id: source.id, status: 'error', error: error.message })
  }
}

const failed = results.filter(r => r.status === 'failed' || r.status === 'error')
console.log('\n--- Download summary ---')
for (const r of results) console.log(`${r.status.padEnd(14)} ${r.id}`)
if (failed.length > 0) {
  console.error(`\n${failed.length} source(s) failed. Pipeline may still proceed with reduced coverage.`)
}

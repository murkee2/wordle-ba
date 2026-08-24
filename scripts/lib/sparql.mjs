const ENDPOINT = 'https://query.wikidata.org/sparql'
const USER_AGENT = 'WordleBA-wordlist-pipeline/1.0 (educational word game; contact: dajiceniz@gmail.com)'

// Wikidata occasionally emits raw control characters inside JSON string
// literals (invalid per the JSON spec) for a small number of labels;
// stripping them is safer than losing the whole page to a parse error.
// Keeps \t \n \r (0x09, 0x0A, 0x0D) since those are legal JSON whitespace;
// strips everything else in the C0 control range.
function stripInvalidJsonControlChars(text) {
  let result = ''
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i)
    const isDisallowedControl = code <= 0x1f && code !== 0x09 && code !== 0x0a && code !== 0x0d
    if (!isDisallowedControl) result += text[i]
  }
  return result
}

async function runQuery(query, attempt = 1) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45000)
  try {
    const response = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': USER_AGENT },
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const text = await response.text()
    const json = JSON.parse(stripInvalidJsonControlChars(text))
    return json.results.bindings
  } catch (error) {
    if (attempt <= 4) {
      const waitMs = attempt * 3000
      await new Promise(r => setTimeout(r, waitMs))
      return runQuery(query, attempt + 1)
    }
    throw new Error(`SPARQL query failed after ${attempt} attempts: ${error.message}`)
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Paginated SPARQL SELECT over Wikidata. `buildQuery(limit, offset)` must
 * return a full query string with LIMIT/OFFSET baked in. Stops when a page
 * returns fewer rows than `pageSize`. A small delay between pages avoids
 * hammering the shared public endpoint.
 */
export async function paginatedQuery(buildQuery, { pageSize = 5000, label = 'query', maxPages = 40 } = {}) {
  const allBindings = []
  let offset = 0
  let page = 0
  for (;;) {
    const query = buildQuery(pageSize, offset)
    const bindings = await runQuery(query)
    allBindings.push(...bindings)
    process.stdout.write(`  [${label}] offset=${offset} +${bindings.length} (total ${allBindings.length})\n`)
    page += 1
    if (bindings.length < pageSize || page >= maxPages) break
    offset += pageSize
    await new Promise(r => setTimeout(r, 500))
  }
  return allBindings
}

export function extractLabels(bindings, variable = 'label') {
  return bindings.map(b => b[variable]?.value).filter(Boolean)
}

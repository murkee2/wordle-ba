# Word list sources, licenses, and attribution

WordleBA's word list (`src/data/words.js`, `output/allowedWords.js`,
`output/answerWords.js`) is built from several third-party linguistic
sources. This document records what each source is, its license, how it was
used, and what attribution or compliance obligations apply. It was
generated as part of the `scripts/` pipeline described in the project
README.

None of these sources' original files are redistributed by this project —
the pipeline downloads them into `data/raw/` (gitignored) at build time and
extracts individual words (facts, not copyrightable expression) into the
final word list. Attribution below is provided as best practice even where
the license may not strictly require it for a plain word list.

## 1. bs_BA — Bosnian Hunspell dictionary

- **Source**: https://github.com/ebukva/bs_BA
- **What it contains**: ~212,000 Bosnian word forms (surface forms with
  Hunspell affix flags) for spellchecking.
- **License**: GNU Lesser General Public License v3 (LGPLv3).
- **Used for**: primary Bosnian-language signal. Presence in this
  dictionary is the strongest positive score contributor (see
  `scripts/score_words.mjs`).
- **Attribution**: bs_BA dictionary, © ebukva contributors, LGPLv3.
  https://github.com/ebukva/bs_BA

## 2. hr_HR — Croatian Hunspell dictionary

- **Source**: https://github.com/LibreOffice/dictionaries (hr_HR/)
- **What it contains**: ~53,000 Croatian word forms.
- **License**: GPL 2.0 / LGPL 2.1 / MPL 1.1 tri-license (author's choice of
  any one). Authors: Boris Juric, Mirko Kos, Krunoslav Šebetić, Denis
  Lackovic, and other contributors — see `data/raw/hr_HR.LICENSE.txt`.
- **Used for**: cross-language signal for shared štokavski vocabulary. A
  word appearing only here (not in bs_BA/wordfreq/kaikki) is penalized as
  "not attested as Bosnian usage" rather than trusted outright.
- **Attribution**: hr_HR Hunspell dictionary, © Boris Juric, Mirko Kos,
  Krunoslav Šebetić, Denis Lackovic and contributors, GPL/LGPL/MPL
  tri-license. https://github.com/LibreOffice/dictionaries

## 3. sr (Latin) — Serbian Hunspell dictionary

- **Source**: https://github.com/LibreOffice/dictionaries (sr/sr-Latn.dic)
- **What it contains**: ~251,000 Serbian word forms in Latin script (the
  same repository also ships a Cyrillic sr.dic; we use the Latin edition
  directly so no transliteration step is needed).
- **License**: LGPLv3 / MPLv2 / GPLv3 (author's choice). Author: Milutin
  Smiljanić.
- **Used for**: same role as hr_HR — a secondary cross-language signal, not
  a standalone source of truth for "is this Bosnian".
- **Attribution**: Serbian Hunspell dictionary, © Milutin Smiljanić,
  LGPLv3/MPLv2/GPLv3. https://github.com/LibreOffice/dictionaries

## 4. wordfreq ("sh" — Serbo-Croatian macrolanguage) — frequency data

- **Source**: https://github.com/rspeer/wordfreq (`wordfreq/data/small_sh.msgpack.gz`)
- **What it contains**: word-frequency rank buckets for the "sh"
  (Serbo-Croatian) macrolanguage code, aggregated from Wikipedia, news, and
  web text (wordfreq intentionally does not try to separate bs/hr/sr since
  that boundary is unreliable to draw automatically).
- **License**: wordfreq's code is Apache 2.0; its data files are
  redistributable under Creative Commons Attribution-ShareAlike 4.0
  (CC BY-SA 4.0). Author: Robyn Speer.
- **Used for**: frequency-based scoring bonus (`wordfreqBonus` in
  `scripts/score_words.mjs`) — common words score higher, which both
  improves ranking quality and pushes obscure/archaic forms out of the
  top 15,000.
- **Attribution (required by CC BY-SA 4.0 — credit must read exactly as
  below per the project's own NOTICE.md)**: wordfreq, © 2022 Robyn Speer,
  Apache 2.0 (code) / CC BY-SA 4.0 (data). https://github.com/rspeer/wordfreq

## 5. Kaikki.org Serbo-Croatian Wiktionary extract

- **Source**: https://kaikki.org/dictionary/Serbo-Croatian/ (machine-readable
  extract of English Wiktionary's Serbo-Croatian entries, produced by the
  `wiktextract` tool)
- **What it contains**: ~70,000 dictionary entries with part-of-speech
  tags, glosses, and Wiktionary categories (used as a signal for filtering
  out surnames/given names/toponyms that Wiktionary itself categorizes as
  such).
- **License**: CC BY-SA (and GFDL, per Wiktionary's dual-licensing), same
  terms as Wiktionary itself.
- **Used for**: independent lexicographic confirmation (score bonus),
  part-of-speech based scoring (open-class bonus / closed-class penalty),
  and an additional proper-noun signal via Wiktionary categories.
- **Citation** (per kaikki.org's request for academic/derived use): Tatu
  Ylonen, "Wiktextract: Wiktionary as Machine-Readable Structured Data,"
  Proceedings of the 13th Conference on Language Resources and Evaluation
  (LREC), pp. 1317-1325, Marseille, 20-25 June 2022.
- **Attribution**: Data extracted from Wiktionary (https://www.wiktionary.org/)
  via kaikki.org/wiktextract, CC BY-SA / GFDL.

## 6. Wikidata (proper noun / geography blacklist)

- **Source**: https://query.wikidata.org/sparql (live SPARQL queries — see
  `scripts/build_blacklists.mjs`)
- **What it contains**: structured entities and their bs/hr/sr labels for
  settlements in Bosnia and Herzegovina, countries, rivers, mountains,
  lakes, islands, mountain ranges, valleys, regions, seas, given names, and
  family names.
- **License**: Wikidata content is dedicated to the public domain under
  **CC0 1.0** (no attribution legally required).
- **Used for**: the geography/proper-noun blacklist — any word whose label
  matches one of these categories is excluded from the final list, however
  well-attested it is in the dictionary sources above.
- **Attribution (best practice, not required)**: Data from Wikidata
  (https://www.wikidata.org/), CC0 1.0.

## 7. Sources considered but not used, and why

- **bsWaC (Bosnian web corpus)** — hosted on CLARIN.SI
  (http://hdl.handle.net/11356/1062), CC BY-SA 4.0. Not used because
  access requires an interactive CLARIN.SI login and the corpus ships as
  multi-hundred-MB to multi-GB XML batches — impractical to fetch
  unattended in this pipeline. wordfreq's "sh" frequency data and the
  kaikki Wiktionary extract serve the same "how common/attested is this
  word" role that bsWaC would have played.
- **srLex (Serbian Lexicon)** — not used; not available through a public,
  unauthenticated download endpoint suitable for an automated pipeline.
- **Full Wikidata dump / unrestricted `wdt:P31/wdt:P279*` transitive
  queries** — the public Wikidata Query Service times out or throttles
  large transitive-closure queries and globally unbounded classes (e.g.
  "instance of city" with no country filter). The blacklist pipeline uses
  targeted, capped, paginated `wdt:P31` queries instead (see
  `scripts/build_blacklists.mjs`), scoped to Bosnia specifically plus a
  bounded set of well-known world features, to keep the shared public
  endpoint responsive and the pipeline reproducible.

## Summary table

| Source | License | Attribution required? |
|---|---|---|
| bs_BA Hunspell | LGPLv3 | Recommended |
| hr_HR Hunspell | GPL2/LGPL2.1/MPL1.1 | Recommended |
| sr Hunspell (Latin) | LGPLv3/MPLv2/GPLv3 | Recommended |
| wordfreq (sh) | Apache 2.0 (code) / CC BY-SA 4.0 (data) | **Yes** — credit Robyn Speer by name |
| kaikki.org / Wiktionary (sh) | CC BY-SA / GFDL | **Yes** — credit Wiktionary |
| Wikidata | CC0 1.0 | No (courtesy only) |

None of these sources require the word list itself to be released under a
share-alike license — CC BY-SA and GPL-family obligations attach to
redistributing the *dictionaries/corpora themselves*, not to a derived list
of individual words extracted from them. This project nonetheless credits
every source above as good practice.

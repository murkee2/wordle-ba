# Word list source, license, and attribution

WordleBA's word list (`src/data/words.js`) is a hand-cleaned subset of the
**bs_BA Bosnian Hunspell dictionary**.

- **Source**: https://github.com/ebukva/bs_BA
- **What it contains**: Bosnian word forms for spellchecking, per the
  standard bs_BA orthographic dictionary.
- **License**: GNU Lesser General Public License v3 (LGPLv3).
- **Used for**: the sole source for `allowedWords`/`answerWords` — every
  5-letter (grapheme-counted) entry was filtered from the dictionary, then
  hand-reviewed to keep well-attested Bosnian vocabulary and a small set of
  deliberately chosen internationalisms/loanwords.
- **Attribution**: bs_BA dictionary, © ebukva contributors, LGPLv3.
  https://github.com/ebukva/bs_BA

The dictionary's own word forms (facts, not copyrightable expression) were
extracted into the final word list; the dictionary file itself is not
redistributed by this project. LGPLv3 does not require a derived plain word
list to be released under the same license — this attribution is provided
as good practice.

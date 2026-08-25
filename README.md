# WordleBA

A Bosnian-language Wordle clone. Guess a 5-letter Bosnian word in 6 tries.

## Playing / developing

```sh
npm install
npm run dev      # local dev server
npm run build    # production build
```

## The word list

The game's word list lives directly in `src/data/words.js` — `allowedWords`
(every word a player may type as a guess), `answerWords` (the stricter
subset eligible to be the daily/free answer), and the `getDailyWord()` /
`getRandomWord()` helpers. It's a plain, hand-maintained data file: edit the
arrays directly to add or remove words. See `LICENSE_ATTRIBUTION.md` for the
source the list was drawn from.

## The dž / lj / nj digraphs

The Bosnian Latin alphabet has 30 letters, five of which are digraphs
written with two Unicode code points but pronounced (and alphabetized) as a
single letter: **dž, lj, nj**. This project treats them as one Wordle tile:
`src/logic/graphemes.js` tokenizes a word into its grapheme sequence rather
than splitting the raw string, and the board, keyboard, and guess evaluation
all go through that tokenizer. The virtual keyboard has dedicated dž/lj/nj
keys, and typing the two Latin letters on a physical keyboard (e.g. "d" then
"ž") merges them into the digraph automatically.

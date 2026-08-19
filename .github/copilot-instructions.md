# Wordle BA - Project Rules & Context

## Tech Stack
- Vite (Vanilla JavaScript, ES Modules)
- Tailwind CSS
- HTML5 / LocalStorage
- Deployment: GitHub Pages (base: './')

## Game Rules & Specifics (Bosanski jezik)
- Word length: Exactly 5 characters.
- Alphabet: Bosanska latinica. Letters Č, Ć, Đ, Š, Ž count as single characters (length 1).
- Digraphs (DŽ, LJ, NJ) are typed as two individual characters.
- 6 attempts to guess the daily word.
- Evaluation Algorithm: MUST use a strict 2-pass algorithm to handle duplicate letters correctly.
- Virtual keyboard layout: standard keys + Č, Ć, Đ, Š, Ž, Enter, Backspace.
- Daily mode: Deterministic date hash (YYYY-MM-DD) to pick the word from TARGET_WORDS.
- State persistence: Store guesses, current game status, and stats in LocalStorage.
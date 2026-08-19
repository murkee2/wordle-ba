import './style.css'
import confetti from 'canvas-confetti'
import { VALID_GUESSES, getDailyWord, getRandomWord } from './data/words.js'
import { GAME_MODES, GAME_STATUS, evaluateGuess, loadGameState, saveGameState, clearGameState } from './logic/game.js'

const STATS_KEY = 'wordle-ba-stats'
const MODE_KEY = 'wordle-ba-mode'
const WORD_LENGTH = 5
const MAX_GUESSES = 6
const board = document.querySelector('#board')
const keyboard = document.querySelector('#keyboard')
const message = document.querySelector('#message')
const modal = document.querySelector('#game-modal')
const modeButton = document.querySelector('#mode-button')
const today = new Date().toISOString().slice(0, 10)

let gameMode = localStorage.getItem(MODE_KEY) === GAME_MODES.FREE ? GAME_MODES.FREE : GAME_MODES.DAILY
let targetWord = ''
let guesses = []
let currentGuess = ''
let gameStatus = GAME_STATUS.IN_PROGRESS
let isSubmitting = false
const keyboardLetterStatuses = {}
const statusPriority = { absent: 1, present: 2, correct: 3 }

function readStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) ?? { played: 0, wins: 0, streak: 0, bestStreak: 0 } }
  catch { return { played: 0, wins: 0, streak: 0, bestStreak: 0 } }
}

function resetKeyboard() {
  Object.keys(keyboardLetterStatuses).forEach(letter => delete keyboardLetterStatuses[letter])
  keyboard.querySelectorAll('.key').forEach(button => button.classList.remove(
    'key-correct', 'key-present', 'key-absent',
    'bg-emerald-600', 'border-emerald-600', 'bg-amber-600', 'border-amber-600',
    'bg-zinc-800', 'border-zinc-800', 'text-zinc-500', 'text-white', 'font-bold', 'opacity-60',
  ))
  keyboard.querySelectorAll('.key').forEach(button => button.classList.add('bg-zinc-700/80', 'text-zinc-100', 'border-zinc-600'))
}

function createBoard() {
  board.replaceChildren()
  for (let index = 0; index < MAX_GUESSES * WORD_LENGTH; index += 1) {
    const tile = document.createElement('div')
    tile.className = 'tile'
    tile.setAttribute('aria-label', `Polje ${Math.floor(index / WORD_LENGTH) + 1}, ${index % WORD_LENGTH + 1}`)
    board.append(tile)
  }
}

function createKeyboard() {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P', 'Š', 'Đ'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Č', 'Ć', 'Ž'],
    ['ENTER', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
  ]
  rows.forEach((row, rowIndex) => row.forEach(key => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `${key.length > 1 ? 'key key-wide' : 'key'} bg-zinc-700/80 text-zinc-100 border-zinc-600`
    button.dataset.key = key
    button.textContent = key === 'BACKSPACE' ? '⌫' : key === 'ENTER' ? 'Enter' : key
    button.setAttribute('aria-label', key === 'BACKSPACE' ? 'Backspace' : button.textContent)
    keyboard.querySelector(`[data-row="${rowIndex + 1}"]`).append(button)
  }))
}

function persistState() {
  saveGameState({ date: today, mode: gameMode, target: targetWord, guesses, currentGuess, status: gameStatus })
}

function renderBoard(animatedRow = -1) {
  [...board.children].forEach((tile, tileIndex) => {
    const rowIndex = Math.floor(tileIndex / WORD_LENGTH)
    const columnIndex = tileIndex % WORD_LENGTH
    const submittedGuess = guesses[rowIndex]
    const letters = submittedGuess ? [...submittedGuess.word] : rowIndex === guesses.length ? [...currentGuess] : []
    tile.textContent = letters[columnIndex] ?? ''
    tile.className = 'tile'
    tile.style.removeProperty('--flip-delay')
    if (letters[columnIndex]) tile.classList.add('tile-filled')
    if (submittedGuess) {
      tile.classList.add(`tile-${submittedGuess.result[columnIndex]}`)
      if (rowIndex === animatedRow) {
        tile.style.setProperty('--flip-delay', `${columnIndex * 150}ms`)
        tile.classList.add('is-flipping')
      }
    }
  })
}

function updateKeyboard() {
  guesses.forEach(({ word, result }) => [...word].forEach((letter, index) => {
    const status = result[index]
    if (!keyboardLetterStatuses[letter] || statusPriority[status] > statusPriority[keyboardLetterStatuses[letter]]) {
      keyboardLetterStatuses[letter] = status
    }
  }))
  keyboard.querySelectorAll('.key').forEach(button => {
    const status = keyboardLetterStatuses[button.dataset.key]
    button.classList.remove('key-correct', 'key-present', 'key-absent', 'bg-emerald-600', 'border-emerald-600', 'bg-amber-600', 'border-amber-600', 'bg-zinc-800', 'border-zinc-800', 'text-zinc-500', 'text-white', 'font-bold', 'opacity-60')
    button.classList.add('bg-zinc-700/80', 'text-zinc-100', 'border-zinc-600')
    if (status === 'correct') button.classList.add('key-correct', 'bg-emerald-600', 'border-emerald-600', 'text-white', 'font-bold')
    if (status === 'present') button.classList.add('key-present', 'bg-amber-600', 'border-amber-600', 'text-white', 'font-bold')
    if (status === 'absent') button.classList.add('key-absent', 'bg-zinc-800', 'border-zinc-800', 'text-zinc-500', 'opacity-60')
  })
}

function startNewRound(mode = gameMode) {
  const previousTarget = targetWord
  gameMode = mode
  targetWord = gameMode === GAME_MODES.FREE ? getRandomWord() : getDailyWord()
  if (gameMode === GAME_MODES.FREE && targetWord === previousTarget) targetWord = getRandomWord()
  guesses = []
  currentGuess = ''
  gameStatus = GAME_STATUS.IN_PROGRESS
  isSubmitting = false
  localStorage.setItem(MODE_KEY, gameMode)
  clearGameState()
  resetKeyboard()
  renderBoard()
  closeModal('game-modal')
  modeButton.textContent = gameMode === GAME_MODES.DAILY ? 'Dnevno' : 'Vježbanje'
  modeButton.setAttribute('aria-label', gameMode === GAME_MODES.DAILY ? 'Prebaci na slobodnu igru' : 'Prebaci na dnevni izazov')
}

function restoreRound() {
  const stored = loadGameState()
  const validStoredRound = stored?.date === today && stored.mode === gameMode && typeof stored.target === 'string'
  if (validStoredRound) {
    targetWord = stored.target
    guesses = Array.isArray(stored.guesses) ? stored.guesses : []
    currentGuess = typeof stored.currentGuess === 'string' ? stored.currentGuess : ''
    gameStatus = Object.values(GAME_STATUS).includes(stored.status) ? stored.status : GAME_STATUS.IN_PROGRESS
  } else {
    targetWord = gameMode === GAME_MODES.FREE ? getRandomWord() : getDailyWord()
  }
}

function shakeRow() {
  const rowTiles = [...board.children].slice(guesses.length * WORD_LENGTH, (guesses.length + 1) * WORD_LENGTH)
  rowTiles.forEach(tile => tile.classList.remove('is-shaking'))
  void board.offsetWidth
  rowTiles.forEach(tile => tile.classList.add('is-shaking'))
}

function showMessage(text) {
  message.textContent = text
  message.classList.add('is-visible')
  window.setTimeout(() => message.classList.remove('is-visible'), 1800)
}

function addLetter(letter) {
  if (gameStatus !== GAME_STATUS.IN_PROGRESS || isSubmitting || [...currentGuess].length >= WORD_LENGTH) return
  const normalized = letter.toUpperCase()
  if (!/^[A-ZČĆĐŠŽ]+$/.test(normalized) || [...currentGuess, ...normalized].length > WORD_LENGTH) return
  currentGuess += normalized
  renderBoard()
  persistState()
}

function removeLetter() {
  if (gameStatus !== GAME_STATUS.IN_PROGRESS || isSubmitting) return
  currentGuess = [...currentGuess].slice(0, -1).join('')
  renderBoard()
  persistState()
}

async function submitGuess() {
  if (gameStatus !== GAME_STATUS.IN_PROGRESS || isSubmitting) return
  if ([...currentGuess].length !== WORD_LENGTH) { shakeRow(); showMessage('Riječ mora imati 5 slova'); return }
  if (!VALID_GUESSES.includes(currentGuess)) { shakeRow(); showMessage('Riječ nije u rječniku'); return }

  isSubmitting = true
  const word = currentGuess
  guesses.push({ word, result: evaluateGuess(word, targetWord) })
  currentGuess = ''
  renderBoard(guesses.length - 1)
  persistState()
  await new Promise(resolve => window.setTimeout(resolve, 650 + (WORD_LENGTH - 1) * 150))
  updateKeyboard()
  gameStatus = word === targetWord ? GAME_STATUS.WON : guesses.length === MAX_GUESSES ? GAME_STATUS.LOST : GAME_STATUS.IN_PROGRESS
  isSubmitting = false
  persistState()
  if (gameStatus !== GAME_STATUS.IN_PROGRESS) finishGame()
}

function finishGame() {
  if (gameMode === GAME_MODES.DAILY) {
    const stats = readStats()
    stats.played += 1
    if (gameStatus === GAME_STATUS.WON) {
      stats.wins += 1
      stats.streak += 1
      stats.bestStreak = Math.max(stats.bestStreak, stats.streak)
    } else stats.streak = 0
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  }
  openResultModal()
  if (gameStatus === GAME_STATUS.WON && gameMode === GAME_MODES.DAILY) {
    const fire = () => confetti({ particleCount: 90, spread: 65, origin: { y: 0.62 } })
    fire(); window.setTimeout(fire, 420); window.setTimeout(fire, 820)
  }
}

function openResultModal() {
  const stats = readStats()
  document.querySelector('#modal-title').textContent = gameStatus === GAME_STATUS.WON ? 'BRAVO!' : 'KRAJ IGRE'
  document.querySelector('#modal-subtitle').textContent = gameMode === GAME_MODES.FREE
    ? `Riječ je bila: ${targetWord}`
    : gameStatus === GAME_STATUS.WON ? `Pogođeno iz ${guesses.length}/6 pokušaja` : `Tačna riječ je ${targetWord}`
  document.querySelector('#stat-played').textContent = stats.played
  document.querySelector('#stat-win-rate').textContent = `${stats.played ? Math.round((stats.wins / stats.played) * 100) : 0}%`
  document.querySelector('#stat-streak').textContent = stats.streak
  document.querySelector('#stat-best').textContent = stats.bestStreak
  document.querySelector('#share-button').hidden = gameMode !== GAME_MODES.DAILY
  document.querySelector('#new-game-button').hidden = gameMode !== GAME_MODES.FREE
  document.querySelector('.countdown-wrap').hidden = gameMode !== GAME_MODES.DAILY
  document.querySelector('.stats-grid').hidden = gameMode === GAME_MODES.FREE
  openModal('game-modal')
}

function openStatsModal() {
  const stats = readStats()
  document.querySelector('#modal-title').textContent = 'STATISTIKA'
  document.querySelector('#modal-subtitle').textContent = 'Tvoj Wordle BA učinak'
  document.querySelector('#stat-played').textContent = stats.played
  document.querySelector('#stat-win-rate').textContent = `${stats.played ? Math.round((stats.wins / stats.played) * 100) : 0}%`
  document.querySelector('#stat-streak').textContent = stats.streak
  document.querySelector('#stat-best').textContent = stats.bestStreak
  document.querySelector('#share-button').hidden = true
  document.querySelector('#new-game-button').hidden = true
  document.querySelector('.countdown-wrap').hidden = true
  document.querySelector('.stats-grid').hidden = false
  openModal('game-modal')
}

function openModal(id) {
  const element = document.querySelector(`#${id}`)
  element.hidden = false
  requestAnimationFrame(() => element.classList.add('is-open'))
}

function closeModal(id) {
  const element = document.querySelector(`#${id}`)
  if (!element) return
  element.classList.remove('is-open')
  window.setTimeout(() => { element.hidden = true }, 220)
}

function shareResult() {
  const dateLabel = new Intl.DateTimeFormat('bs-BA').format(new Date(`${today}T12:00:00`))
  const rows = guesses.map(({ result }) => result.map(status => status === 'correct' ? '🟩' : status === 'present' ? '🟨' : '⬛').join('')).join('\n')
  const text = `Wordle BA - ${dateLabel} ${gameStatus === GAME_STATUS.WON ? `${guesses.length}/6` : 'X/6'}\n${rows}`
  navigator.clipboard?.writeText(text).then(() => showMessage('Kopirano u međuspremnik!')).catch(() => showMessage(text))
}

function updateCountdown() {
  const now = new Date(); const next = new Date(now); next.setHours(24, 0, 0, 0)
  const seconds = Math.max(0, Math.floor((next - now) / 1000))
  document.querySelector('#countdown').textContent = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function handleKey(key) { if (key === 'ENTER') submitGuess(); else if (key === 'BACKSPACE') removeLetter(); else addLetter(key) }

createBoard()
createKeyboard()
restoreRound()
renderBoard()
updateKeyboard()
updateCountdown()
window.setInterval(updateCountdown, 1000)
keyboard.addEventListener('click', event => { const button = event.target.closest('.key'); if (button) handleKey(button.dataset.key) })
document.addEventListener('keydown', event => { if (event.key === 'Enter') handleKey('ENTER'); else if (event.key === 'Backspace') handleKey('BACKSPACE'); else if (/^[a-zčćđšž]$/i.test(event.key)) handleKey(event.key) })
document.querySelector('#share-button').addEventListener('click', shareResult)
document.querySelector('#stats-button').addEventListener('click', openStatsModal)
document.querySelector('#new-game-button').addEventListener('click', () => startNewRound(GAME_MODES.FREE))
document.querySelector('#close-modal').addEventListener('click', () => closeModal('game-modal'))
document.querySelector('#help-button').addEventListener('click', () => openModal('help-modal'))
document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', () => closeModal(button.dataset.closeModal)))
document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', event => { if (event.target === backdrop) closeModal(backdrop.id) }))
modeButton.addEventListener('click', () => startNewRound(gameMode === GAME_MODES.DAILY ? GAME_MODES.FREE : GAME_MODES.DAILY))
modeButton.textContent = gameMode === GAME_MODES.DAILY ? 'Dnevno' : 'Vježbanje'
if (gameStatus !== GAME_STATUS.IN_PROGRESS) openResultModal()

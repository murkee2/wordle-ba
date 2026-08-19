import './style.css'
import confetti from 'canvas-confetti'
import { VALID_GUESSES, getDailyWord } from './data/words.js'
import { evaluateGuess, loadGameState, saveGameState } from './logic/game.js'

const STATS_KEY = 'wordle-ba-stats'
const WORD_LENGTH = 5
const MAX_GUESSES = 6
const board = document.querySelector('#board')
const keyboard = document.querySelector('#keyboard')
const message = document.querySelector('#message')
const modal = document.querySelector('#game-modal')
const targetWord = getDailyWord()
const today = new Date().toISOString().slice(0, 10)
const storedState = loadGameState()
const isCurrentGame = storedState?.date === today && storedState?.target === targetWord

let guesses = isCurrentGame && Array.isArray(storedState.guesses) ? storedState.guesses : []
let currentGuess = isCurrentGame && typeof storedState.currentGuess === 'string' ? storedState.currentGuess : ''
let gameStatus = isCurrentGame && ['playing', 'won', 'lost'].includes(storedState.status) ? storedState.status : 'playing'
let isSubmitting = false

function readStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) ?? { played: 0, wins: 0, streak: 0, bestStreak: 0 } }
  catch { return { played: 0, wins: 0, streak: 0, bestStreak: 0 } }
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
    button.className = key.length > 1 ? 'key key-wide' : 'key'
    button.dataset.key = key
    button.textContent = key === 'BACKSPACE' ? '⌫' : key === 'ENTER' ? 'Enter' : key
    button.setAttribute('aria-label', key === 'BACKSPACE' ? 'Backspace' : button.textContent)
    keyboard.querySelector(`[data-row="${rowIndex + 1}"]`).append(button)
  }))
}

function persistState() { saveGameState({ date: today, target: targetWord, guesses, currentGuess, status: gameStatus }) }

function renderBoard(animatedRow = -1) {
  [...board.children].forEach((tile, tileIndex) => {
    const rowIndex = Math.floor(tileIndex / WORD_LENGTH)
    const columnIndex = tileIndex % WORD_LENGTH
    const submittedGuess = guesses[rowIndex]
    const letters = submittedGuess ? [...submittedGuess.word] : rowIndex === guesses.length ? [...currentGuess] : []
    tile.textContent = letters[columnIndex] ?? ''
    tile.className = 'tile'
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
  const priority = { absent: 1, present: 2, correct: 3 }
  const statuses = new Map()
  guesses.forEach(({ word, result }) => [...word].forEach((letter, index) => {
    if (!statuses.has(letter) || priority[result[index]] > priority[statuses.get(letter)]) statuses.set(letter, result[index])
  }))
  keyboard.querySelectorAll('.key').forEach(button => {
    const statusesForKey = [...button.dataset.key].map(letter => statuses.get(letter)).filter(Boolean)
    const status = statusesForKey.sort((a, b) => priority[b] - priority[a])[0]
    button.classList.remove('key-correct', 'key-present', 'key-absent')
    if (status) button.classList.add(`key-${status}`)
  })
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
  if (gameStatus !== 'playing' || isSubmitting || [...currentGuess].length >= WORD_LENGTH) return
  const normalized = letter.toUpperCase()
  if (!/^[A-ZČĆĐŠŽ]+$/.test(normalized) || [...currentGuess, ...normalized].length > WORD_LENGTH) return
  currentGuess += normalized
  renderBoard()
  persistState()
}

function removeLetter() {
  if (gameStatus !== 'playing' || isSubmitting) return
  currentGuess = [...currentGuess].slice(0, -1).join('')
  renderBoard()
  persistState()
}

async function submitGuess() {
  if (gameStatus !== 'playing' || isSubmitting) return
  if ([...currentGuess].length !== WORD_LENGTH) { shakeRow(); showMessage('Riječ mora imati 5 slova'); return }
  if (!VALID_GUESSES.includes(currentGuess)) { shakeRow(); showMessage('Riječ nije u rječniku'); return }
  isSubmitting = true
  const word = currentGuess
  guesses.push({ word, result: evaluateGuess(word, targetWord) })
  currentGuess = ''
  renderBoard(guesses.length - 1)
  updateKeyboard()
  persistState()
  await new Promise(resolve => window.setTimeout(resolve, 650 + (WORD_LENGTH - 1) * 150))
  if (word === targetWord) gameStatus = 'won'
  else if (guesses.length === MAX_GUESSES) gameStatus = 'lost'
  isSubmitting = false
  persistState()
  if (gameStatus !== 'playing') finishGame()
}

function finishGame() {
  const stats = readStats()
  stats.played += 1
  if (gameStatus === 'won') {
    stats.wins += 1
    stats.streak += 1
    stats.bestStreak = Math.max(stats.bestStreak, stats.streak)
  } else stats.streak = 0
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  openModal(stats)
  if (gameStatus === 'won') {
    const fire = () => confetti({ particleCount: 90, spread: 65, origin: { y: 0.62 } })
    fire(); window.setTimeout(fire, 420); window.setTimeout(fire, 820)
  }
}

function openModal(stats = readStats(), showResult = gameStatus !== 'playing') {
  document.querySelector('#modal-title').textContent = showResult ? (gameStatus === 'won' ? 'BRAVO!' : 'KRAJ IGRE') : 'STATISTIKA'
  document.querySelector('#modal-subtitle').textContent = showResult
    ? (gameStatus === 'won' ? `Pogođeno iz ${guesses.length}/6 pokušaja` : `Tačna riječ je ${targetWord}`)
    : 'Tvoj Wordle BA učinak'
  document.querySelector('#stat-played').textContent = stats.played
  document.querySelector('#stat-win-rate').textContent = `${stats.played ? Math.round((stats.wins / stats.played) * 100) : 0}%`
  document.querySelector('#stat-streak').textContent = stats.streak
  document.querySelector('#stat-best').textContent = stats.bestStreak
  document.querySelector('#share-button').hidden = !showResult
  modal.hidden = false
  requestAnimationFrame(() => modal.classList.add('is-open'))
}

function shareResult() {
  const dateLabel = new Intl.DateTimeFormat('bs-BA').format(new Date(`${today}T12:00:00`))
  const rows = guesses.map(({ result }) => result.map(status => status === 'correct' ? '🟩' : status === 'present' ? '🟨' : '⬛').join('')).join('\n')
  const text = `Wordle BA - ${dateLabel} ${gameStatus === 'won' ? `${guesses.length}/6` : 'X/6'}\n${rows}`
  navigator.clipboard?.writeText(text).then(() => showToast('Kopirano u međuspremnik!')).catch(() => showToast(text))
}

function showToast(text) {
  const toast = document.querySelector('#toast')
  toast.textContent = text; toast.classList.add('is-visible')
  window.setTimeout(() => toast.classList.remove('is-visible'), 2500)
}

function updateCountdown() {
  const now = new Date(); const next = new Date(now); next.setHours(24, 0, 0, 0)
  const seconds = Math.max(0, Math.floor((next - now) / 1000))
  document.querySelector('#countdown').textContent = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function handleKey(key) { if (key === 'ENTER') submitGuess(); else if (key === 'BACKSPACE') removeLetter(); else addLetter(key) }

createBoard(); createKeyboard(); renderBoard(); updateKeyboard(); updateCountdown(); window.setInterval(updateCountdown, 1000)
keyboard.addEventListener('click', event => { const button = event.target.closest('.key'); if (button) handleKey(button.dataset.key) })
document.addEventListener('keydown', event => { if (event.key === 'Enter') handleKey('ENTER'); else if (event.key === 'Backspace') handleKey('BACKSPACE'); else if (/^[a-zčćđšž]$/i.test(event.key)) handleKey(event.key) })
document.querySelector('#share-button').addEventListener('click', shareResult)
document.querySelector('#stats-button').addEventListener('click', () => openModal(readStats(), false))
document.querySelector('#close-modal').addEventListener('click', () => { modal.classList.remove('is-open'); window.setTimeout(() => { modal.hidden = true }, 220) })
if (gameStatus !== 'playing') openModal(readStats())

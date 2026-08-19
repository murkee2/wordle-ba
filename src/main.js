import './style.css'
import confetti from 'canvas-confetti'
import { VALID_GUESSES, getDailyWord } from './data/words.js'
import { evaluateGuess, loadGameState, saveGameState } from './logic/game.js'

const board = document.querySelector('section[aria-label="Tabla za pogađanje"]')
const tiles = [...board.querySelectorAll(':scope > div')]
const keyboardButtons = [...document.querySelectorAll('section[aria-label="Virtuelna tastatura"] button')]
const targetWord = getDailyWord()
const today = new Date().toISOString().slice(0, 10)
const storedState = loadGameState()

let guesses = storedState?.date === today && Array.isArray(storedState.guesses)
	? storedState.guesses.filter(guess => guess && typeof guess.word === 'string' && Array.isArray(guess.result))
	: []
let currentGuess = storedState?.date === today && typeof storedState.currentGuess === 'string'
	? storedState.currentGuess
	: ''
let gameStatus = storedState?.date === today && ['playing', 'won', 'lost'].includes(storedState.status)
	? storedState.status
	: 'playing'

const statusClasses = {
	correct: 'tile-correct',
	present: 'tile-present',
	absent: 'tile-absent',
}

const keyboardStatusPriority = {
	absent: 1,
	present: 2,
	correct: 3,
}

function persistState() {
	saveGameState({
		date: today,
		guesses,
		currentGuess,
		status: gameStatus,
	})
}

function renderBoard(animatedRow = -1) {
	tiles.forEach((tile, tileIndex) => {
		const rowIndex = Math.floor(tileIndex / 5)
		const columnIndex = tileIndex % 5
		const submittedGuess = guesses[rowIndex]
		const letter = submittedGuess
			? [...submittedGuess.word][columnIndex]
			: rowIndex === guesses.length
				? [...currentGuess][columnIndex]
				: ''

		tile.textContent = letter ?? ''
		tile.classList.remove('tile-filled', 'tile-correct', 'tile-present', 'tile-absent', 'is-flipping')

		if (letter) {
			tile.classList.add('tile-filled')
		}

		if (submittedGuess) {
			const status = submittedGuess.result[columnIndex]
			if (statusClasses[status]) {
				tile.classList.add(statusClasses[status])
			}
			if (rowIndex === animatedRow) {
				tile.style.animationDelay = `${columnIndex * 90}ms`
				tile.classList.add('is-flipping')
			}
		}
	})
}

function updateKeyboard() {
	const statuses = new Map()

	guesses.forEach(({ word, result }) => {
		;[...word].forEach((letter, index) => {
			const nextStatus = result[index]
			const previousStatus = statuses.get(letter)
			if (!previousStatus || keyboardStatusPriority[nextStatus] > keyboardStatusPriority[previousStatus]) {
				statuses.set(letter, nextStatus)
			}
		})
	})

	keyboardButtons.forEach(button => {
		const key = button.textContent.trim().toUpperCase()
		const keyStatuses = [...key].map(letter => statuses.get(letter)).filter(Boolean)
		const status = keyStatuses.sort((first, second) => keyboardStatusPriority[second] - keyboardStatusPriority[first])[0]
		button.classList.remove('key-correct', 'key-present', 'key-absent')
		if (status) {
			button.classList.add(`key-${status}`)
		}
	})
}

function shakeBoard() {
	board.classList.remove('is-shaking')
	void board.offsetWidth
	board.classList.add('is-shaking')
}

function addLetter(letter) {
	if (gameStatus !== 'playing' || [...currentGuess].length >= 5) {
		return
	}

	const normalizedLetter = letter.toUpperCase()
	if (!/^[A-ZČĆĐŠŽ]+$/.test(normalizedLetter) || [...currentGuess, ...normalizedLetter].length > 5) {
		return
	}

	currentGuess += normalizedLetter
	renderBoard()
	persistState()
}

function removeLetter() {
	if (gameStatus !== 'playing') {
		return
	}

	currentGuess = [...currentGuess].slice(0, -1).join('')
	renderBoard()
	persistState()
}

function submitGuess() {
	if (gameStatus !== 'playing') {
		return
	}

	if ([...currentGuess].length !== 5 || !VALID_GUESSES.includes(currentGuess)) {
		shakeBoard()
		return
	}

	const result = evaluateGuess(currentGuess, targetWord)
	guesses.push({ word: currentGuess, result })
	const submittedWord = currentGuess
	currentGuess = ''
	renderBoard(guesses.length - 1)
	updateKeyboard()

	if (submittedWord === targetWord) {
		gameStatus = 'won'
		confetti({ particleCount: 160, spread: 75, origin: { y: 0.65 } })
	} else if (guesses.length === 6) {
		gameStatus = 'lost'
	}

	persistState()
}

function handleKey(key) {
	if (key === 'Enter') {
		submitGuess()
	} else if (key === 'Backspace' || key === '⌫') {
		removeLetter()
	} else {
		addLetter(key)
	}
}

keyboardButtons.forEach(button => {
	button.addEventListener('click', () => handleKey(button.textContent.trim()))
})

document.addEventListener('keydown', event => {
	if (event.key === 'Enter' || event.key === 'Backspace' || /^[a-zčćđšž]$/i.test(event.key)) {
		event.preventDefault()
		handleKey(event.key)
	}
})

renderBoard()
updateKeyboard()

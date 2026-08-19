const GAME_STATE_KEY = 'wordle-ba-game-state'

const getStorage = (storage) => {
  if (storage) {
    return storage
  }

  if (typeof localStorage !== 'undefined') {
    return localStorage
  }

  return null
}

export function evaluateGuess(guess, targetWord) {
  const normalizedGuess = [...String(guess).toUpperCase()]
  const normalizedTarget = [...String(targetWord).toUpperCase()]

  if (normalizedGuess.length !== 5 || normalizedTarget.length !== 5) {
    throw new RangeError('Guess and target word must contain exactly 5 letters.')
  }

  const result = Array(5).fill('absent')
  const remainingLetters = new Map()

  for (let index = 0; index < 5; index += 1) {
    if (normalizedGuess[index] === normalizedTarget[index]) {
      result[index] = 'correct'
    } else {
      const count = remainingLetters.get(normalizedTarget[index]) ?? 0
      remainingLetters.set(normalizedTarget[index], count + 1)
    }
  }

  for (let index = 0; index < 5; index += 1) {
    if (result[index] === 'correct') {
      continue
    }

    const count = remainingLetters.get(normalizedGuess[index]) ?? 0
    if (count > 0) {
      result[index] = 'present'
      remainingLetters.set(normalizedGuess[index], count - 1)
    }
  }

  return result
}

export function saveGameState(state, storage) {
  const activeStorage = getStorage(storage)
  if (!activeStorage) {
    return false
  }

  try {
    activeStorage.setItem(GAME_STATE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function loadGameState(storage) {
  const activeStorage = getStorage(storage)
  if (!activeStorage) {
    return null
  }

  try {
    const serializedState = activeStorage.getItem(GAME_STATE_KEY)
    return serializedState ? JSON.parse(serializedState) : null
  } catch {
    return null
  }
}

export function clearGameState(storage) {
  const activeStorage = getStorage(storage)
  if (!activeStorage) {
    return false
  }

  try {
    activeStorage.removeItem(GAME_STATE_KEY)
    return true
  } catch {
    return false
  }
}

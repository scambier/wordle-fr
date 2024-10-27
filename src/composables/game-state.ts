import {
  addHours,
  differenceInHours,
  differenceInMinutes,
  endOfDay,
  subHours,
} from 'date-fns'
import { computed, reactive, watch } from 'vue'

import { K_WORDS, KeyColor } from '@/constants'
import acceptedGuesses from '@/guesses-list'
import * as storage from '@/storage'
import { WordInput } from '@/types'
import {
  getCurrentDate,
  normalizeWord,
  numberOfGamesSinceStart,
  shuffle,
} from '@/utils'
import words from '@/words-list'

import { isVisibleModalStats } from './modal-manager'
import { showToast } from './toast-manager'

export const shuffled: Readonly<string[]> = shuffle(words)
export const wordToFindAccented = getWordForToday()
export const wordToFind = normalizeWord(wordToFindAccented)

export const isWinner = computed(() =>
  guesses.some(o => o.confirmed && o.word === wordToFind),
)
export const isGameover = computed(
  () => isWinner.value || guesses.every(o => o.confirmed),
)

export const guesses = reactive<WordInput[]>([
  { word: '', confirmed: false },
  { word: '', confirmed: false },
  { word: '', confirmed: false },
  { word: '', confirmed: false },
  { word: '', confirmed: false },
  { word: '', confirmed: false },
])
watch(
  () => guesses.filter(o => o.confirmed).map(o => o.word),
  words => {
    if (words.filter(w => !!w).length === 1) {
      // Register a "start_game" event once the first word is input
      umami.track('start_game')
    }
    // Save confirmed words in storage to re-add them after a refresh
    storage.setItem(K_WORDS, JSON.stringify(words))
  },
)

/**
 * Number of tries it took to find the answer
 */
export const countTotalGuesses = computed<number>(() => {
  return guesses.filter(o => !!o.word && o.confirmed).length
})

watch(isGameover, val => {
  // Gameover switches to true
  if (val) {
    setTimeout(() => {
      isVisibleModalStats.value = true
    }, 200 * 7 + 1000)
  }
})

export function initSessionForToday(): void {
  // Clean the stored state if a new word is available
  const newSession = storage.cleanState()

  if (newSession) {
    showToast('Un nouveau mot à deviner a été choisi.', 5000)
  }
}

export function getWordForToday(): string {
  if (import.meta.env.DEV) {
    console.log(shuffled)
    console.log(numberOfGamesSinceStart())
    console.log(shuffled[numberOfGamesSinceStart()])
  }
  return shuffled[numberOfGamesSinceStart() % words.length]
}

export function doesWordExist(word: string): boolean {
  return (
    words.map(normalizeWord).includes(word) ||
    acceptedGuesses.map(normalizeWord).includes(word)
  )
}

export function getLettersColors(guess: string, word = wordToFind): KeyColor[] {
  const wordLetters = word.split('')
  const guessLetters = guess.split('')
  const colors: KeyColor[] = [0, 0, 0, 0, 0]

  // First, check green letters
  for (let i = 0; i < guessLetters.length; ++i) {
    const letter = guessLetters[i]

    if (letter === wordLetters[i]) {
      colors[i] = KeyColor.Green
      // Remove checked letters to avoid showing 2 yellows for a single letter
      wordLetters[i] = '_'
      guessLetters[i] = ''
    }
  }
  for (let i = 0; i < guessLetters.length; ++i) {
    const letter = guessLetters[i]
    if (wordLetters.includes(letter)) {
      colors[i] = KeyColor.Yellow
      // Remove checked letters to avoid showing 2 yellows for a single letter
      wordLetters[wordLetters.findIndex(o => o === letter)] = '_'
      guessLetters[guessLetters.findIndex(o => o === letter)] = ''
    }
  }
  return colors
}

export function getTimeBeforeNextWord(): string {
  const now = getCurrentDate()
  const tomorrow = endOfDay(now)
  const midDay = subHours(tomorrow, 12)

  const next = midDay > now ? midDay : tomorrow
  const h = differenceInHours(next, now)
  const m = differenceInMinutes(next, addHours(now, h))
  return h === 0 ? `${m} minutes` : `${h}h&nbsp;${m}m`
}

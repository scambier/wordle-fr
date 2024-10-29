<template>
  <div class="mx-auto flex size-full max-w-lg flex-col items-center">
    <!-- Header -->
    <SiteHeader />

    <!-- Grid container -->
    <div class="flex w-full flex-1 justify-center">
      <!-- Grid -->
      <div
        ref="grid"
        class="m-4 grid aspect-[5/6] max-w-full grid-cols-5 grid-rows-6 gap-1 md:max-h-[50vh]">
        <template v-for="y in [0, 1, 2, 3, 4, 5]">
          <LetterBox
            v-for="x in [0, 1, 2, 3, 4]"
            class="h-full border text-3xl font-bold uppercase md:text-4xl"
            :class="{
              'bg-green-dimmed border-green-dimmed':
                guesses[y].confirmed &&
                getLettersColors(guesses[y].word)[x] === KeyColor.Green,
              'bg-yellow-dimmed border-yellow-dimmed':
                guesses[y].confirmed &&
                getLettersColors(guesses[y].word)[x] === KeyColor.Yellow,
              'border-slate-700 bg-slate-700':
                guesses[y].confirmed &&
                getLettersColors(guesses[y].word)[x] === KeyColor.Black,
              'border-slate-600': !guesses[y].confirmed,
            }"
            :style="{ transitionDelay: `${(x + 1) * ANIM_SPEED}ms` }">
            <span
              v-html="getLetter(y, x)"
              :class="{
                'font-thin text-slate-500': getLetter(y, x) === '?',
              }" />
          </LetterBox>
        </template>
      </div>
    </div>

    <!-- Keyboard -->
    <VisualKeyboard
      class="mb-4 h-48 w-full shrink-0 grow-0 px-1 md:mb-16"
      @input="letter => pressLetter(letter)"
      @enter="pressEnter"
      @backspace="pressBackspace"
      :colors="coloredLetters" />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
  watchEffect,
} from 'vue'

import { initialScoreSync, needToReloadWords, synchronizeScores } from '@/api'
import LetterBox from '@/components/common/LetterBox.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import VisualKeyboard from '@/components/VisualKeyboard.vue'
import {
  doesWordExist,
  getLettersColors,
  guesses,
  isGameover,
} from '@/composables/game-state'
import { saveScore } from '@/composables/statistics'
import { showToast } from '@/composables/toast-manager'
import { ANIM_SPEED, KeyColor } from '@/constants'
import { useGridStore } from '@/stores/grid'

const grid = ref<HTMLDivElement | null>(null)
watchEffect(() => onSizeChange)

watch(needToReloadWords, () => {
  loadSavedWordsIntoGuesses()
})

/**
 * Animating the letters color changes
 */
const animating = ref(false)
const isCaretVisible = ref(true)

const gridStore = useGridStore()

gridStore.$subscribe((mutation, state) => {
  loadSavedWordsIntoGuesses()
})

const currentGuess = computed(() => guesses.find(o => !o.confirmed))
const currentRowIndex = computed(() =>
  currentGuess.value ? guesses.indexOf(currentGuess.value) : -1,
)
const currentColumnIndex = computed(() => currentGuess.value?.word.length ?? -1)

/**
 * List of letters not in the word
 */
const coloredLetters = reactive<{ [key: string]: KeyColor }>({})

/**
 * Firefox shows issues with aspect-ratio.
 * This is a hack to make sure that the grid always looks good.
 */
function onSizeChange(): void {
  if (grid.value) {
    grid.value.style.height = window.innerWidth * 0.8 + 'px'
  }
}

function onKeyPress(e: KeyboardEvent): void {
  const k = e.key.toLowerCase()

  if (k === '?') {
    pressLetter('?')
  }

  if (e.shiftKey || e.ctrlKey) return
  const keyCode = k.charCodeAt(0)

  // Key between "a" and "z"
  if (k.length === 1 && keyCode >= 97 && keyCode <= 122) {
    pressLetter(k)
  }

  // Enter
  if (k === 'enter') {
    pressEnter()
  }

  // Backspace
  if (k === 'backspace') {
    pressBackspace()
  }
}

function isKeyboardActive(): boolean {
  return !isGameover.value && !animating.value
}

function pressLetter(letter: string): void {
  startBlinkingCaret()
  if (!currentGuess.value || !isKeyboardActive()) return
  if (currentGuess.value.word.length === 5) {
    return
  }
  currentGuess.value.word += letter
}

function pressBackspace(): void {
  startBlinkingCaret()
  if (!currentGuess.value || !isKeyboardActive()) return
  currentGuess.value.word = currentGuess.value.word.substring(
    0,
    currentGuess.value.word.length - 1,
  )
}

function pressEnter(): void {
  inputWord()

  animating.value = true
  setTimeout(() => {
    animating.value = false
  }, ANIM_SPEED * 6)
}

function inputWord(): void {
  if (!currentGuess.value || !isKeyboardActive()) return
  const word = currentGuess.value.word
  if (word.length < 5) return

  // Check if the word exists
  if (word && !doesWordExist(word)) {
    showToast(
      "Ce mot n'existe pas dans notre liste.<br>Veuillez essayer un autre mot.",
      5000,
    )
    return
  }

  currentGuess.value.confirmed = true

  // Add Green/Yellow/Black colors to keyboard
  colorizeKeyboard(word)

  if (isGameover.value) {
    saveScore()
  }
}

/**
 * Colorize letters one by one,
 * according to the guesses hints
 */
function colorizeKeyboard(word: string): void {
  if (!currentGuess.value) return

  // Compute the colors
  const colors: { [key: string]: KeyColor } = {}
  for (let l = 0; l < word.length; ++l) {
    const letter = word[l]
    const color = getLettersColors(word)[l]
    colors[letter] =
      !colors[letter] || color > colors[letter] ? color : colors[letter]
  }

  // Animate the changes
  nextTick(() => {
    // This won't animate the color changes after a reload,
    // if the game is already over
    if (isGameover.value && !animating.value) return
    let count = 0
    for (const k in colors) {
      setTimeout(() => {
        coloredLetters[k] = colors[k]
      }, ++count * ANIM_SPEED)
    }
  })
}

function getLetter(wordIndex: number, letterIndex: number): string {
  const letter = guesses[wordIndex]?.word[letterIndex]
  if (letter) return letter
  if (
    wordIndex === currentRowIndex.value &&
    letterIndex === currentColumnIndex.value
  ) {
    return !animating.value && !isGameover.value && isCaretVisible.value
      ? '_'
      : ''
  }
  return '&nbsp;'
}

let timerCaret: NodeJS.Timer
function startBlinkingCaret(): void {
  stopBlinkingCaret()
  isCaretVisible.value = true
  timerCaret = setInterval(() => {
    isCaretVisible.value = !isCaretVisible.value
  }, 750)
}

function stopBlinkingCaret(): void {
  if (timerCaret) {
    clearInterval(timerCaret)
  }
}

/**
 * Load saved words at startup
 */
function loadSavedWordsIntoGuesses(): void {
  const savedWords = gridStore.savedWords
  for (let i = 0; i < savedWords.length; ++i) {
    guesses[i].word = savedWords[i]
    inputWord()
  }
}

onMounted(async () => {
  await initialScoreSync()
  await synchronizeScores()
  window.addEventListener('resize', onSizeChange)
  document.addEventListener('keydown', onKeyPress) // Note: 'keypress' doesn't work for backspace
  startBlinkingCaret()
  loadSavedWordsIntoGuesses()
})

onUnmounted(() => {
  window.removeEventListener('resize', onSizeChange)
  document.removeEventListener('keydown', onKeyPress)
  stopBlinkingCaret()
})
</script>

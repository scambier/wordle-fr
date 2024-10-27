import { differenceInDays } from 'date-fns'
import { ref, watch, watchEffect } from 'vue'

import { K_WELCOME } from '@/constants'
import { getCurrentDate } from '@/utils'

import { getItem, setItem } from '../storage'
import { isGameover, isWinner } from './game-state'

export const isVisibleModalLoser = ref(false)
export const isVisibleModalWinner = ref(false)
export const isVisibleModalStats = ref(false)

// Automatically toggle winner/loser modals when game is over
watchEffect(() => {
  isVisibleModalWinner.value = isGameover.value && isWinner.value
  isVisibleModalLoser.value = isGameover.value && !isWinner.value
})

const now = getCurrentDate()

const lastWelcomeDate = ref(new Date(getItem(K_WELCOME, '1970-01-01')))
watch(lastWelcomeDate, v => {
  setItem(K_WELCOME, v.toISOString())
})

/**
 * Defaults to true if the welcome screen was not shown for at least 2 days
 */
export const isVisibleModalWelcome = ref(
  differenceInDays(now, lastWelcomeDate.value) >= 7,
)

if (isVisibleModalWelcome.value) {
  lastWelcomeDate.value = getCurrentDate()
}

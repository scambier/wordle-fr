import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { UnsubscribeFunc } from 'pocketbase'
import { computed } from 'vue'

import { fetchWordsGrid, pb, postWordsGrid } from '@/api'
import { guesses } from '@/composables/game-state'
import { showToast } from '@/composables/toast-manager'
import { getSeed } from '@/utils'

const STORE_NAME = 'mts_grid'

let initialSync = false
let stateSubscription: UnsubscribeFunc | null = null

export const useSessionStore = defineStore(STORE_NAME, () => {
  const state = useStorage(STORE_NAME, {
    words: [] as string[],
    updated: new Date(0).toISOString(),
    gameId: getSeed(),
  })

  const words = computed(() => state.value.words)

  async function subscribeToState(): Promise<UnsubscribeFunc> {
    return await pb
      .collection('motus_state')
      // FIXME: with correct id once pocketbase is correctly updated
      .subscribe('*', data => {
        const sessionStore = useSessionStore()
        if (data.record.gameId !== sessionStore.state.gameId) {
          return
        }
        sessionStore.setWords(data.record.words, false)
      })
  }

  async function setWords(words: string[], sync = true): Promise<void> {
    state.value.words = words
    state.value.updated = new Date().toISOString()
    state.value.gameId = getSeed()
    // Sync with backend
    if (sync) await postWordsGrid(words, state.value.gameId)
  }

  async function fetchFromBackend(): Promise<void> {
    if (resetIfSeedChanged()) return
    try {
      const data = await fetchWordsGrid()
      if (data) {
        if (data.gameId === getSeed() && data.updated > state.value.updated) {
          state.value.words = data.words
          state.value.updated = data.updated
          state.value.gameId = getSeed()
        }
      }
    }
    catch (e) {
      console.warn('Failed to fetch words grid from backend')
    }
  }

  /**
   *
   * @returns true if the session was reset
   */
  function resetIfSeedChanged(): boolean {
    const gameId = getSeed()
    if (state.value.gameId !== gameId) {
      guesses.forEach(o => {
        o.word = ''
        o.confirmed = false
      })
      $reset()
      showToast('Un nouveau mot à deviner a été choisi.', 5000)
      return true
    }
    return false
  }

  function $reset(): void {
    state.value = {
      words: [],
      updated: new Date(0).toISOString(),
      gameId: getSeed(),
    }
  }

  if (!initialSync) {
    fetchFromBackend()
    initialSync = true
  }

  if (!stateSubscription) {
    subscribeToState()
      .then(sub => {
        stateSubscription = sub
        console.log('Subscribed for SSEs.')
      })
      .catch(() => {
        console.warn('Failed to subscribe to SSEs')
      })
  }

  return {
    setWords,
    words,
    $reset,
    state,
    resetIfSeedChanged,
    fetchFromBackend,
  }
})

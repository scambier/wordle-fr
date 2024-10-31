import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { UnsubscribeFunc } from 'pocketbase'
import { computed } from 'vue'

import { fetchWordsGrid, pb, postWordsGrid } from '@/api'
import { showToast } from '@/composables/toast-manager'
import { getSeed } from '@/utils'

const STORE_NAME = 'mts_state'

let initialSync = false
let stateSubscription: UnsubscribeFunc | null = null

export const useSessionStore = defineStore(STORE_NAME, () => {
  const state = useStorage(STORE_NAME, {
    words: [] as string[],
    updated: new Date(0).toISOString(),
    game_id: getSeed(),
  })

  const words = computed(() => state.value.words)

  async function setWords(words: string[], sync = true): Promise<void> {
    state.value.words = words
    state.value.updated = new Date().toISOString()
    state.value.game_id = getSeed()
    // Sync with backend
    if (sync) await postWordsGrid(words, state.value.game_id)
  }

  async function fetchFromBackend(): Promise<void> {
    if (resetIfSeedChanged()) return
    const data = await fetchWordsGrid()
    if (data) {
      if (
        data.game_id === getSeed() &&
        data.updated > state.value.updated
      ) {
        state.value.words = data.words
        state.value.updated = data.updated
        state.value.game_id = getSeed()
      }
    }
  }

  /**
   *
   * @returns true if the session was reset
   */
  function resetIfSeedChanged(): boolean {
    const gameId = getSeed()
    if (state.value.game_id !== gameId) {
      $reset()
      showToast('Un nouveau mot à deviner a été choisi.', 5000)
      return true
    }
    return false
  }

  function $reset(): void {
    state.value = null
  }

  if (!initialSync) {
    fetchFromBackend()
    initialSync = true
  }

  if (!stateSubscription) {
    subscribeToState().then(sub => {
      stateSubscription = sub
      console.log('Subscribed for SSEs.')
    })

    // setTimeout(subscribeToState, 0)
  }

  return { setWords, words, $reset, state, resetIfSessionChanged: resetIfSeedChanged }
})

async function subscribeToState(): Promise<UnsubscribeFunc> {
  return await pb
    .collection('motus_state')
    // FIXME: with correct id once pocketbase is correctly updated
    .subscribe('*', data => {
      const gridStore = useSessionStore()
      if (data.record.game_id !== gridStore.state.game_id) {
        return
      }
      gridStore.setWords(data.record.words, false)
    })
}

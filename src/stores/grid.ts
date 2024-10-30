import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { UnsubscribeFunc } from 'pocketbase'
import { computed } from 'vue'

import { fetchWordsGrid, pb, postWordsGrid } from '@/api'
import { getSessionId } from '@/utils'

const GRID_STORE_NAME = 'mts_grid'

let initialSync = false

export const useGridStore = defineStore(GRID_STORE_NAME, () => {
  const state = useStorage(GRID_STORE_NAME, {
    words: [] as string[],
    lastSync: null as string | null,
    gameId: null as string | null,
  })

  const words = computed(() => state.value.words)

  async function setWords(words: string[], sync = true): Promise<void> {
    state.value.words = words
    state.value.lastSync = new Date().toISOString()
    state.value.gameId = getSessionId()
    // Sync with backend
    if (sync) postWordsGrid(words, state.value.gameId)
  }

  async function fetchFromBackend(): Promise<void> {
    const data = await fetchWordsGrid()
    if (data?.game_id === getSessionId()) {
      state.value.words = data.words
      state.value.lastSync = new Date().toISOString()
      state.value.gameId = getSessionId()
    }
    else {
      $reset()
    }
  }

  function $reset(): void {
    state.value = null
  }

  if (!initialSync) {
    fetchFromBackend()
    initialSync = true
  }

  return { setWords, words, $reset, fetchFromBackend }
})

let stateSubscription: UnsubscribeFunc | null = null
if (!stateSubscription) {
  subscribeToState()
}

async function subscribeToState(): Promise<void> {
  stateSubscription = await pb
    .collection('motus_state')
    // FIXME: with correct id once pocketbase is correctly updated
    .subscribe('*', data => {
      const gridStore = useGridStore()
      gridStore.setWords(data.record.words, false)
    })
}

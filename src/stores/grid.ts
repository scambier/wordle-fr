import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { UnsubscribeFunc } from 'pocketbase'
import { computed } from 'vue'

import { fetchWordsGrid, pb, postWordsGrid } from '@/api'
import { getSessionId } from '@/utils'
import { sub } from 'date-fns'

const GRID_STORE_NAME = 'mts_grid'

let initialSync = false
let stateSubscription: UnsubscribeFunc | null = null

export const useGridStore = defineStore(GRID_STORE_NAME, () => {
  const state = useStorage(GRID_STORE_NAME, {
    words: [] as string[],
    updated: new Date(0).toISOString(),
    game_id: null as string | null,
  })

  const words = computed(() => state.value.words)

  async function setWords(words: string[], sync = true): Promise<void> {
    state.value.words = words
    state.value.updated = new Date().toISOString()
    state.value.game_id = getSessionId()
    // Sync with backend
    if (sync) postWordsGrid(words, state.value.game_id)
  }

  async function fetchFromBackend(): Promise<void> {
    const data = await fetchWordsGrid()
    if (data) {
      if (
        data.game_id === getSessionId() &&
        data.updated > state.value.updated
      ) {
        state.value.words = data.words
        state.value.updated = data.updated
        state.value.game_id = getSessionId()
      }
    }
  }

  function $reset(): void {
    state.value = null
  }

  if (!initialSync) {
    fetchFromBackend()
    initialSync = true
  }

  if (!stateSubscription) {
    subscribeToState()
    // setTimeout(subscribeToState, 0)
  }

  return { setWords, words, $reset, fetchFromBackend, state }
})

async function subscribeToState(): Promise<void> {
  stateSubscription = await pb
    .collection('motus_state')
    // FIXME: with correct id once pocketbase is correctly updated
    .subscribe('*', data => {
      const gridStore = useGridStore()
      if (data.record.game_id !== gridStore.state.game_id) {
        return
      }
      gridStore.setWords(data.record.words, false)
    })
    console.log('Subscribed for SSEs.')
}

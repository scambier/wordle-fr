import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { UnsubscribeFunc } from 'pocketbase'

import { fetchWordsGrid, pb, postWordsGrid } from '@/api'
import { setItem } from '@/storage'
import { getSessionId } from '@/utils'

const STORE_NAME = 'mts_grid'

let initialSync = false

export const useGridStore = () => {
  const gridStore = defineStore(STORE_NAME, {
    state: () => {
      return useStorage(STORE_NAME, {
        words: [] as string[],
        lastSync: null as string | null,
        gameId: null as string | null,
      })
    },
    getters: {
      savedWords(state): string[] {
        return state.words
      },
    },
    actions: {
      async setWords(words: string[], sync = true): Promise<void> {
        this.words = words
        this.lastSync = new Date().toISOString()
        this.gameId = getSessionId()
        // Sync with backend
        if (sync) await postWordsGrid(words, this.gameId)
        // Save in localStorage
        setItem(STORE_NAME, JSON.stringify(this.$state))
      },

      async fetchFromBackend(): Promise<void> {
        const data = await fetchWordsGrid()
        if (data?.game_id === getSessionId()) {
          this.words = data.words
          this.lastSync = new Date().toISOString()
          this.gameId = getSessionId()
        }
      },
    },
  })
  const s = gridStore()
  if (!initialSync) {
    s.fetchFromBackend()
    initialSync = true
  }

  return s
}

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

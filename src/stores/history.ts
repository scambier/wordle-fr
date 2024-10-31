import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { watch } from 'vue'

import { getGamesHistory, postGame, postGamesHistory } from '@/api'
import { countTotalGuesses, isWinner } from '@/composables/game-state'
import { getItem, setItem } from '@/storage'
import { getSeed } from '@/utils'
import { K_LASTSYNC } from '@/constants'

const STORE_NAME = 'mts_stats'

export const useHistoryStore = defineStore(STORE_NAME, () => {
  const state = useStorage(STORE_NAME, {
    bestStreak: 0,
    currentStreak: 0,
    nbGames: 0,
    games: {} as Record<string, { score: number; won: boolean }>,
  })

  watch(state.value.games, games => {
    const keys = Object.keys(games).sort()
    state.value.bestStreak = 0
    state.value.currentStreak = 0
    state.value.nbGames = keys.length
    for (const key of keys) {
      if (games[key].won) {
        if (++state.value.currentStreak > state.value.bestStreak) {
          state.value.bestStreak = state.value.currentStreak
        }
      }
      else {
        state.value.currentStreak = 0
      }
    }
  })

  async function synchronizeWithBackend(): Promise<void> {
    const lastSyncDate = new Date(
      getItem(K_LASTSYNC, new Date(0).toISOString()),
    )
    console.log('syncing with backend', lastSyncDate)

    // Post
    await postGamesHistory(lastSyncDate)

    // Fetch
    const fromBackend = await getGamesHistory(lastSyncDate)
    for (const game of fromBackend) {
      state.value.games[game.date] = { score: game.score, won: game.won }
    }

    // Update last sync date
    setItem(K_LASTSYNC, new Date().toISOString())
  }

  function setScore(seed: string, won: boolean, score: number): void {
    const stats = state.value
    // Don't overwrite an existing score
    if (!stats.games[seed]) {
      stats.games[seed] = { score, won }
      postGame({ date: seed, score, won })
      umami.track(won ? 'win_game' : 'lose_game')
      umami.track('end_game')
    }
  }

  //   ;(async () => {
  //     await synchronizeWithBackend()
  //   })()

  return {
    state,
    setScore,
    synchronizeWithBackend,
  }
})

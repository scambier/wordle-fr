import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { watch } from 'vue'

import { getGamesHistory, isLoggedIn, postGamesHistory } from '@/api'
import { K_LASTSYNC } from '@/constants'
import { getItem, setItem } from '@/storage'

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

  async function forceSync(): Promise<void> {
    setItem(K_LASTSYNC, new Date(0).toISOString())
    await synchronizeWithBackend()
  }

  async function synchronizeWithBackend(): Promise<void> {
    if (!isLoggedIn()) {
      return
    }
    const lastSyncDate = new Date(
      getItem(K_LASTSYNC, new Date(0).toISOString()),
    )
    let updated = true

    // Post
    try {
      const posted = await postGamesHistory(lastSyncDate)
      if (!posted) {
        updated = false
      }
    }
    catch (e) {
      console.warn('Failed to post games history')
      updated = false
    }

    // Fetch
    try {
      const fromBackend = await getGamesHistory(lastSyncDate)
      for (const game of fromBackend) {
        state.value.games[game.gameId] = { score: game.score, won: game.won }
      }
    }
    catch (e) {
      console.warn('Failed to fetch games history')
      updated = false
    }

    // Update last sync date
    if (updated) {
      console.log('Synchronized with backend')
      setItem(K_LASTSYNC, new Date().toISOString())
    }
    else {
      console.warn('Failed to synchronize with backend')
    }
  }

  /**
   * Saves the score of a game and synchronizes it with the backend
   * @param seed
   * @param won
   * @param score
   */
  function setScore(seed: string, won: boolean, score: number): void {
    const stats = state.value
    // Don't overwrite an existing score
    if (!stats.games[seed]) {
      console.log('Setting score for', seed, won, score)
      stats.games[seed] = { score, won }
      synchronizeWithBackend().catch(e => {
        console.error('Error synchronizing history with backend:', e)
      })
      umami.track(won ? 'win_game' : 'lose_game')
      umami.track('end_game')
    }
  }

  return {
    state,
    setScore,
    synchronizeWithBackend,
    forceSync,
  }
})

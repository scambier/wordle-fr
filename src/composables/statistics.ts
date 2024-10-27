import { merge } from 'lodash-es'
import { reactive, watch } from 'vue'

import { K_STATS } from '@/constants'
import * as storage from '@/storage'
import { GameStats } from '@/types'
import { getSessionId } from '@/utils'

import { countTotalGuesses, isWinner } from './game-state'

export const gameStats = reactive<GameStats>(loadStats())

// Triggered when the list of played games has changed
watch(
  () => gameStats.games,
  games => {
    const keys = Object.keys(games).sort()

    // Recompute games count
    gameStats.bestStreak = 0
    gameStats.currentStreak = 0
    gameStats.nbGames = keys.length
    for (const key of keys) {
      if (gameStats.games[key].won) {
        if (++gameStats.currentStreak > gameStats.bestStreak) {
          gameStats.bestStreak = gameStats.currentStreak
        }
      }
      else {
        gameStats.currentStreak = 0
      }
    }

    // Automatically save stats in storage when updated
    storage.setItem(K_STATS, JSON.stringify(gameStats))
  },
  { deep: true, immediate: true },
)

function loadStats(): GameStats {
  const stats: GameStats = {
    bestStreak: 0,
    currentStreak: 0,
    nbGames: 0,
    games: {},
  }
  const loaded = (() => {
    try {
      return JSON.parse(storage.getItem(K_STATS)!)
    }
    catch (e) {
      return {}
    }
  })()
  merge(stats, loaded)

  return stats
}

function setScore(seed: string, won: boolean, score: number): void {
  const stats = gameStats

  // Don't overwrite an existing score
  if (!stats.games[seed]) {
    stats.games[seed] = { score, won }
    umami.track(won ? 'win_game' : 'lose_game')
    umami.track('end_game')
  }
}

export function saveScore(): void {
  setScore(getSessionId(), isWinner.value, countTotalGuesses.value)
}

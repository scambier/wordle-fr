import PocketBase, { RecordService } from 'pocketbase'
import { ref } from 'vue'

import { loadStats } from './composables/statistics'
import { K_LASTSYNC } from './constants'
import { getItem } from './storage'

type SyncedGame = {
  won: boolean
  score: number
  date: string
  user: string
}

type SyncedState = {
  id: string
  user: string
  words: string[]
  game_id: string
  updated: string
}

interface TypedPocketBase extends PocketBase {
  collection(idOrName: string): RecordService // default fallback for any other collection
  collection(idOrName: 'motus_games'): RecordService<SyncedGame>
  collection(idOrName: 'motus_state'): RecordService<SyncedState>
}

export const pb = new PocketBase(import.meta.env.VITE_PB_URL) as TypedPocketBase

export const needToReloadWords = ref('')

export function isLoggedIn(): boolean {
  return !!pb.authStore.record
}

/**
 * Sends all the games to the backend in a single query
 */
export async function synchronizeScores(): Promise<void> {
  try {
    if (!isLoggedIn()) return
    const stats = loadStats()
    const lastSync = getItem(K_LASTSYNC, new Date(0).toISOString())
    console.log('Syncing scores since', lastSync)

    const games = Object.entries(stats.games)
      .filter(([date]) => date.slice(0, 10) >= lastSync.slice(0, 10))
      .map(([date, { score, won }]) => ({
        date,
        score,
        won,
        user: pb.authStore.record?.id ?? '',
      }))
    if (games.length) {
      await pb.send('/motus/games/batch', {
        method: 'POST',
        body: JSON.stringify({ games }),
      })
    }
    localStorage.setItem(K_LASTSYNC, new Date().toISOString())
  }
  catch (e) {
    console.error('Error syncing scores:', e)
  }
}

// /**
//  * Synchronizes the score history with the backend
//  * @returns
//  */
// export async function synchronizeScores(): Promise<void> {
//   try {
//     if (!isLoggedIn()) {
//       return
//     }
//     console.log('Syncing scores')

//     // Send to backend

//     let lastSync: Date
//     try {
//       lastSync = new Date(
//         localStorage.getItem(K_LASTSYNC) ?? '1970-01-01T00:00:00.000Z',
//       )
//     }
//     catch (e) {
//       lastSync = new Date('1970-01-01T00:00:00.000Z')
//     }

//     const stats = loadStats()
//     for (const key of Object.keys(stats.games)) {
//       // Make sure the key is in the form of 'YYYY-MM-DD-0' or 'YYYY-MM-DD-1'
//       if (!/^\d{4}-\d{2}-\d{2}-[01]$/.test(key)) {
//         continue
//       }
//       if (key.slice(0, 10) >= lastSync.toISOString().slice(0, 10)) {
//         const game = stats.games[key]
//         try {
//           await pb.collection('motus_games').create({
//             date: key,
//             score: game.score,
//             won: game.won,
//             user: pb.authStore.record?.id,
//           })
//         }
//         catch (e) {
//           // console.warn('Could not synchronize game', e)
//         }
//       }
//     }

//     // Get from backend

//     const dateOnly = lastSync.toISOString().slice(0, 10)
//     const fromServer = await pb.collection('motus_games').getFullList({
//       filter: pb.filter('date >= {:date} || created >= {:date}', {
//         date: dateOnly,
//       }),
//     })

//     // Save to local storage
//     for (const game of fromServer) {
//       gameStats.games[game.date] = { score: game.score, won: game.won }
//     }

//     localStorage.setItem('mts_lastsync', new Date().toISOString())
//   }
//   catch (e) {
//     console.error('Error syncing scores:', e)
//   }
// }

// #region Words grid

export async function fetchWordsGrid(): Promise<SyncedState | null> {
  if (!isLoggedIn()) {
    return null
  }
  const existing = (
    await pb.collection('motus_state').getList(1, 1, {
      requestKey: null, // Disable auto cancellation
      filter: pb.filter('user = {:user}', { user: pb.authStore.record?.id }),
    })
  ).items
  return existing?.[0] ?? null
}

export async function postWordsGrid(
  words: string[],
  gameId: string,
): Promise<void> {
  if (!isLoggedIn()) {
    return
  }
  let existingId: string
  const existing = (
    await pb.collection('motus_state').getList(1, 1, {
      filter: pb.filter('user = {:user}', { user: pb.authStore.record?.id }),
    })
  ).items

  if (existing.length) {
    existingId = existing[0].id
    await pb
      .collection('motus_state')
      .update(existingId, { words, game_id: gameId })
  }
  else {
    existingId = (
      await pb
        .collection('motus_state')
        .create({ user: pb.authStore.record?.id, words, game_id: gameId })
    ).id
  }
}

// #endregion

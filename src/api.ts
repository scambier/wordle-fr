import PocketBase, { RecordService, UnsubscribeFunc } from 'pocketbase'
import { ref } from 'vue'

import { gameStats, loadStats } from './composables/statistics'
import { K_WORDS } from './constants'

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
}

interface TypedPocketBase extends PocketBase {
  collection(idOrName: string): RecordService // default fallback for any other collection
  collection(idOrName: 'motus_games'): RecordService<SyncedGame>
  collection(idOrName: 'motus_state'): RecordService<SyncedState>
}

export const pb = new PocketBase(import.meta.env.VITE_PB_URL) as TypedPocketBase

export const needToReloadWords = ref('')

let stateSubscription: UnsubscribeFunc | null = null

export function isLoggedIn(): boolean {
  return !!pb.authStore.record
}

/**
 * Sends all the games to the backend in a single query
 */
export async function initialScoreSync(): Promise<void> {
  if (!isLoggedIn()) return

  const stats = loadStats()
  const games = Object.entries(stats.games).map(([date, { score, won }]) => ({
    date,
    score,
    won,
    user: pb.authStore.record?.id ?? '',
  }))
  await pb.send('/motus/games/batch', {
    method: 'POST',
    body: games,
  })
}

/**
 * Synchronizes the score history with the backend
 * @returns
 */
export async function synchronizeScores(): Promise<void> {
  try {
    if (!isLoggedIn()) {
      return
    }
    console.log('Syncing scores')

    // Send to backend

    let lastSync: Date
    try {
      lastSync = new Date(
        localStorage.getItem('mts_lastsync') ?? '1970-01-01T00:00:00.000Z',
      )
    }
    catch (e) {
      lastSync = new Date('1970-01-01T00:00:00.000Z')
    }

    const stats = loadStats()
    for (const key of Object.keys(stats.games)) {
      // Make sure the key is in the form of 'YYYY-MM-DD-0' or 'YYYY-MM-DD-1'
      if (!/^\d{4}-\d{2}-\d{2}-[01]$/.test(key)) {
        continue
      }
      if (key.slice(0, 10) >= lastSync.toISOString().slice(0, 10)) {
        const game = stats.games[key]
        try {
          await pb.collection('motus_games').create({
            date: key,
            score: game.score,
            won: game.won,
            user: pb.authStore.record?.id,
          })
        }
        catch (e) {
          // console.warn('Could not synchronize game', e)
        }
      }
    }

    // Get from backend

    const dateOnly = lastSync.toISOString().slice(0, 10)
    const fromServer = await pb.collection('motus_games').getFullList({
      filter: pb.filter('date >= {:date} || created >= {:date}', {
        date: dateOnly,
      }),
    })

    // Save to local storage
    for (const game of fromServer) {
      gameStats.games[game.date] = { score: game.score, won: game.won }
    }

    localStorage.setItem('mts_lastsync', new Date().toISOString())
  }
  catch (e) {
    console.error('Error syncing scores:', e)
  }
}

// export async function fetchState(): Promise<void> {
//   try {
//     if (!isLoggedIn()) {
//       return
//     }

//     let existingId: string
//     const existing = (
//       await pb.collection('motus_state').getList(1, 1, {
//         filter: pb.filter('user = {:user}', { user: pb.authStore.record?.id }),
//       })
//     ).items
//     if (existing.length) {
//       existingId = existing[0].id
//       await pb.collection('motus_state').update(existingId, { words })
//     }
//     else {
//       existingId = (
//         await pb
//           .collection('motus_state')
//           .create({ user: pb.authStore.record?.id, words })
//       ).id
//     }

//   }
//   catch (e) {
//     console.error(e)
//   }
// }

export async function synchronizeState(): Promise<void> {
  try {
    if (!isLoggedIn()) {
      return
    }

    let words = []
    try {
      words = JSON.parse(localStorage.getItem(K_WORDS) ?? '[]')
    }
    catch (e) {
      words = []
    }
    let existingId: string
    const existing = (
      await pb.collection('motus_state').getList(1, 1, {
        filter: pb.filter('user = {:user}', { user: pb.authStore.record?.id }),
      })
    ).items
    if (existing.length) {
      existingId = existing[0].id
      await pb.collection('motus_state').update(existingId, { words })
    }
    else {
      existingId = (
        await pb
          .collection('motus_state')
          .create({ user: pb.authStore.record?.id, words })
      ).id
    }

    if (!stateSubscription) {
      stateSubscription = await pb
        .collection('motus_state')
        // FIXME: with correct id once pocketbase is correctly updated
        .subscribe('*', data => {
          localStorage.setItem(K_WORDS, JSON.stringify(data.record.words))
          needToReloadWords.value = new Date().toISOString()
        })
      console.log('subscribed')
    }
  }
  catch (e) {
    console.error(e)
  }
}

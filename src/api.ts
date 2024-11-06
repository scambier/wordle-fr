import PocketBase, { RecordService } from 'pocketbase'
import { ref } from 'vue'

import { useHistoryStore } from './stores/history'

type SyncedGame = {
  won: boolean
  score: number
  gameId: string
  user: string
}

type SyncedState = {
  id: string
  user: string
  words: string[]
  gameId: string
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
  return !!pb.authStore.isValid
}

export function logout(): void {
  const confirmed = confirm('Vous déconnecter ? Vos scores ne seront plus synchrnoisés.')
  if (confirmed) {
    pb.authStore.clear()
    window.location.reload()
  }
}

// #region Games History

export async function getGamesHistory(since: Date): Promise<SyncedGame[]> {
  if (!isLoggedIn()) {
    return []
  }
  console.log('Fetching games history since', since)
  return pb.collection('motus_games').getFullList({
    filter: pb.filter('gameId >= {:gameId}', {
      gameId: since.toISOString().slice(0, 10),
    }),
  })
}

export async function postGamesHistory(since: Date): Promise<boolean> {
  if (!isLoggedIn()) {
    return false
  }
  console.log('Posting games history since', since)

  const minDate = since.toISOString().slice(0, 10)

  const games = Object.entries(useHistoryStore().state.games)
    .filter(([gameId]) => gameId.slice(0, 10) >= minDate)
    .map(([gameId, { score, won }]) => ({
      gameId,
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
  return true
}

export async function postGame(game: {
  gameId: string
  score: number
  won: boolean
}): Promise<void> {
  if (!isLoggedIn()) {
    return
  }
  await pb.collection('motus_games').create(game)
}

// #endregion

// #region Words grid

export async function fetchWordsGrid(): Promise<SyncedState | null> {
  if (!isLoggedIn()) {
    return null
  }
  const existing = (
    await pb.collection('motus_state').getList(1, 1, {
      // requestKey: null, // Disable auto cancellation
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
      .update(existingId, { words, gameId })
  }
  else {
    existingId = (
      await pb
        .collection('motus_state')
        .create({ user: pb.authStore.record?.id, words, gameId })
    ).id
  }
}

// #endregion

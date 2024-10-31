import PocketBase, { RecordService } from 'pocketbase'
import { ref } from 'vue'

import { useHistoryStore } from './stores/history'

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
  return !!pb.authStore.isValid
}

// #region Games History

export async function getGamesHistory(since: Date): Promise<SyncedGame[]> {
  if (!isLoggedIn()) {
    return []
  }
  return pb.collection('motus_games').getFullList({
    filter: pb.filter('date >= {:date}', {
      date: since.toISOString().slice(0, 10),
    }),
  })
}

export async function postGamesHistory(since: Date): Promise<void> {
  if (!isLoggedIn()) {
    return
  }
  const minDate = since.toISOString().slice(0, 10)

  const games = Object.entries(useHistoryStore().state.games)
    .filter(([date]) => date.slice(0, 10) >= minDate)
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
}

export async function postGame(game: {
  date: string
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

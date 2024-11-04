<template>
  <ModalBase @close="isVisibleModalStats = false">
    <div class="mb-2 border-b border-slate-400 text-2xl">
      Statistiques
    </div>
    <div class="flex justify-between">
      <div
        class="flex flex-col"
        :key="item.label"
        v-for="item in statsTexts">
        <span class="text-2xl font-bold md:text-3xl">{{ item.value }}</span>
        <span
          class="text-xs md:text-sm"
          v-html="item.label" />
      </div>
    </div>
    <div class="my-4 w-full text-left text-xs">
      <div
        class="mb-1 flex h-4 w-full"
        v-for="i in [1, 2, 3, 4, 5, 6, 0]"
        :key="`bar-${i}`">
        <span class="mr-1 w-6 text-center">{{ i ? i : '❌' }}</span>
        <div class="w-full">
          <div
            class="min-w-fit max-w-full text-right font-bold"
            :class="{
              'bg-green-dimmed': gamesOfScore(i) > 0,
              'bg-gray-600': gamesOfScore(i) === 0 || i === 0,
            }"
            :style="{ width: winPercentage(i) + '%' }">
            <span class="mx-1">{{ gamesOfScore(i) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="isGameover"
      class="mb-2 text-xs md:text-base">
      Le mot à trouver était
      <b><a
        :href="`https://fr.wiktionary.org/wiki/${wordToFindAccented}`"
        class="border-green-dimmed border-b"
        target="_blank">{{ wordToFind.toUpperCase() }}</a></b>.<br>
      Le prochain mot arrive dans <span v-html="getTimeBeforeNextWord()" />
    </div>

    <SharingPanel v-if="isGameover" />

    <div
      v-if="getItem(K_AUTH_ACTIVE) === '1'"
      class="text-xs">
      <div v-if="isLoggedIn()">
        Connecté en tant que {{ pb.authStore.record?.email }}.
        <button
          @click.prevent="logout"
          class="underline">
          Déconnexion
        </button>
        <div class="mt-2">
          <button
            class="rounded border p-1"
            @click.prevent="historyStore.forceSync">
            Forcer la synchronisation
          </button>
        </div>
      </div>
      <div
        class="text-red-600"
        v-else>
        Déconnecté - La sauvegarde des scores est désactivée<br>
        <button
          @click.prevent="() => router.push('/auth')"
          class="mt-2 border p-2">
          Connexion
        </button>
      </div>
    </div>
  </ModalBase>
</template>

<script setup lang="ts">
import { groupBy } from 'lodash-es'
import { ref } from 'vue'

import { isLoggedIn, logout, pb } from '@/api'
import SharingPanel from '@/components/common/SharingPanel.vue'
import {
  getTimeBeforeNextWord,
  isGameover,
  wordToFind,
  wordToFindAccented,
} from '@/composables/game-state'
import { isVisibleModalStats } from '@/composables/modal-manager'
import { K_AUTH_ACTIVE } from '@/constants'
import router from '@/router'
import { getItem } from '@/storage'
import { useHistoryStore } from '@/stores/history'

import ModalBase from './ModalBase.vue'

const historyStore = useHistoryStore()
const gameStats = historyStore.state

const games = Object.keys(gameStats.games)
  .sort()
  .map(k => ({
    date: k,
    score: gameStats.games[k].score,
    won: gameStats.games[k].won,
  }))

const statsTexts = ref([
  {
    label: 'Parties',
    value: gameStats.nbGames,
  },
  {
    label: 'Victoires',
    value:
      Math.round((games.filter(g => g.won).length / games.length || 0) * 100) +
      '%',
  },
  {
    label: `Victoire${gameStats.currentStreak > 1 ? 's' : ''}<br>en série`,
    value: gameStats.currentStreak,
  },
  {
    label: 'Meilleure<br>série',
    value: gameStats.bestStreak,
  },
])

function mostCommonScore(): number {
  const grouped = groupBy(games, 'score')
  return Object.keys(grouped).reduce(
    (prev, k) => (grouped[k].length > prev ? grouped[k].length : prev),
    0,
  )
}

function gamesOfScore(score: number): number {
  if (score === 0) {
    return games.filter(g => !g.won).length
  }
  return games.filter(g => g.won && g.score === score).length
}

function winPercentage(score: number): number {
  return (gamesOfScore(score) / mostCommonScore() || 0) * 100
}
</script>

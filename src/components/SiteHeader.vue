<template>
  <div
    class="mb-2 flex w-full flex-row items-end justify-between border-b border-slate-400 py-2">
    <div class="w-8 pl-2 text-xl">
      <button
        aria-label="Instructions"
        @click="isVisibleModalWelcome = true"
        class="h-fit">
        <IconQuestion />
      </button>
    </div>
    <h1 class="flex-1 text-center text-3xl font-bold">
      MO-MO-MOTUS
    </h1>
    <div class="w-8 pr-2 text-xl">
      <button
        aria-label="Statistiques et partage"
        @click="isVisibleModalStats = true"
        class="h-fit">
        <IconChart />
      </button>
    </div>
  </div>
  <div>
    <span>Puzzle n°{{ numberOfGamesSinceStart() + OLD_COUNT }}</span>
  </div>
</template>

<script setup lang="ts">
import {
  isVisibleModalStats,
  isVisibleModalWelcome,
} from '@/composables/modal-manager'
import { OLD_COUNT } from '@/constants'
import { numberOfGamesSinceStart } from '@/utils'
import IconChart from '~icons/ph/chart-bar'
import IconQuestion from '~icons/ph/question'
</script>

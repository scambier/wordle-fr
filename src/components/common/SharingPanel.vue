<template>
  <div class="flex flex-col items-center">
    <ButtonGreen @click="toClipboard">
      <IconShare class="mr-2" /> Partager votre score
    </ButtonGreen>
    <div class="p-2">
      <div
        class="rounded border-2 border-white/20 p-2 text-left text-xs"
        v-html="getSharingText().replace(/(?:\r\n|\r|\n)/g, '<br>')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  countTotalGuesses,
  getLettersColors,
  guesses,
  isWinner,
  wordToFind,
} from '@/composables/game-state'
import { gameStats } from '@/composables/statistics'
import { showToast } from '@/composables/toast-manager'
import { KeyColor, OLD_COUNT } from '@/constants'
import { numberOfGamesSinceStart } from '@/utils'
import IconShare from '~icons/ph/share-network'

import ButtonGreen from './ButtonGreen.vue'

function keyColorToEmoji(pos: KeyColor): string {
  switch (pos) {
    case KeyColor.Black:
      return '⬛'
    case KeyColor.Yellow:
      return '🟨'
    case KeyColor.Green:
      return '🟩'
  }
}

function getSharingText(): string {
  const emojis: string[] = []
  for (let i = 0; i < guesses.length; ++i) {
    const guess = guesses[i].word
    const colors = getLettersColors(guess, wordToFind)
    emojis.push(
      guess
        .split('')
        .map((l, j) => keyColorToEmoji(colors[j]))
        .join(''),
    )
  }
  const tries = `✔️ ${countTotalGuesses.value}/6`
  return `Mo-mo-motus n°${numberOfGamesSinceStart() + OLD_COUNT}\nSérie: ${
    gameStats.currentStreak
  }\n${emojis.filter(o => !!o).join('\n')}${
    isWinner.value ? tries : '❌'
  }\nhttps://scambier.xyz/momomotus/`
}

function toClipboard(): void {
  navigator.clipboard.writeText(getSharingText())
  showToast('Copié dans le presse-papier', 3000)
}
</script>

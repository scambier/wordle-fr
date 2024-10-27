<template>
  <div class="flex flex-col">
    <!-- Row -->
    <div
      v-for="(line, i) in keyboard"
      :key="`line-${i}`"
      class="flex gap-1 justify-center mb-1 w-full h-1/3">
      <!-- Keys -->
      <template
        v-for="(letter, j) in line"
        :key="`key-${i}`">
        <!-- Enter -->
        <LetterBox
          v-if="i === 2 && j === 0"
          is="button"
          @click="emit('enter')"
          title="Entrée"
          class="flex basis-[calc(15%+5px)] flex-col bg-slate-700 active:bg-slate-600">
          <IconReturn class="w-8 h-8" />
        </LetterBox>

        <!-- Letter -->
        <LetterBox
          is="button"
          @click="emit('input', letter)"
          class="basis-[10%] uppercase active:bg-slate-600"
          :class="colorToClass(colors[letter])">
          {{ letter }}
        </LetterBox>

        <!-- Backspace -->
        <LetterBox
          v-if="i === 2 && j === line.length - 1"
          is="button"
          @click="emit('backspace')"
          title="Effacer"
          class="basis-[calc(15%+5px)] bg-slate-700 active:bg-slate-600">
          <IconBackspace class="w-8 h-8" />
        </LetterBox>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KeyColor } from '@/constants'
import IconBackspace from '~icons/ph/backspace'
import IconReturn from '~icons/ph/key-return'

import LetterBox from './common/LetterBox.vue'

const emit = defineEmits<{
  (e: 'enter'): void
  (e: 'backspace'): void
  (e: 'input', letter: string): void
}>()

const props = defineProps<{ colors?: { [key: string]: KeyColor } }>()

const colors = props.colors ?? {}

const keyboard = [
  'azertyuiop'.split(''),
  'qsdfghjklm'.split(''),
  'wxcvbn?'.split(''),
]

function colorToClass(color: KeyColor): string {
  switch (color) {
    case KeyColor.Black:
      return 'text-slate-400 bg-black'
    case KeyColor.Green:
      return 'bg-green-dimmed'
    case KeyColor.Yellow:
      return 'bg-yellow-dimmed'
    default:
      return 'bg-slate-700'
  }
}
</script>

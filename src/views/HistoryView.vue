<template>
  <!-- mono font -->
  <!-- <span style="font-family: monospace; font-size: 1rem">{{ history }}</span> -->
  🤓
</template>

<script setup lang="ts">
import { shuffled } from '@/composables/game-state'
import { numberOfGamesSinceStart } from '@/utils'

const history = shuffled.slice(0, numberOfGamesSinceStart())
</script>

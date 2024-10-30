<template>
  <Component
    :is="is"
    class="flex flex-1 select-none items-center justify-center rounded p-1 text-xl transition duration-200">
    <slot />
  </Component>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ is?: string }>()
const is = ref(props.is ?? 'div')
</script>

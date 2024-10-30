<template>
  <button
    @click.prevent="emit('click')"
    class="inline-flex shrink-0 grow items-center rounded bg-green-dimmed p-2 text-sm text-white hover:bg-green-800 md:text-lg">
    <slot />
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'click'): void }>()
</script>

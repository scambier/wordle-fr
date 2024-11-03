<template>
  <div
    class="absolute left-0 top-0 flex size-full max-h-max justify-center overflow-y-scroll bg-black/40">
    <!-- Content -->
    <div
      class="relative m-4 mt-16 h-fit w-[32rem] max-w-full rounded-lg border-2 border-slate-600 bg-slate-900 p-4 pt-8 text-center text-lg">
      <button
        aria-label="Fermer"
        class="absolute right-2 top-2 text-xl"
        @click="emit('close', false)">
        <IconClose />
      </button>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
import IconClose from '~icons/ph/x'

const emit = defineEmits<{ (e: 'close', v: boolean): void }>()
</script>

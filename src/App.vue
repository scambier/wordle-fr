<template>
  <div
    v-if="showMaintenance"
    class="container m-4 text-center">
    Maintenance en cours, désolé :(<br>
    Revenez pour le prochain mot
  </div>
  <div
    v-else
    class="h-full">
    <router-view />
    <Transition>
      <ModalWelcome v-if="isVisibleModalWelcome" />
    </Transition>
    <Transition>
      <ModalStats v-if="isVisibleModalStats" />
    </Transition>

    <ToastMessage />
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
import { utcToZonedTime } from 'date-fns-tz'
import { onMounted, onUnmounted, ref } from 'vue'

import ModalWelcome from '@/components/modals/ModalWelcome.vue'
import ToastMessage from '@/components/ToastMessage.vue'

import ModalStats from './components/modals/ModalStats.vue'
import {
  isVisibleModalStats,
  isVisibleModalWelcome,
} from './composables/modal-manager'
import { BXL_TZ } from './constants'
import { useSessionStore } from './stores/session'

const sessionStore = useSessionStore()

onMounted(() => {
  sessionStore.resetIfSeedChanged()
  window.addEventListener('focus', sessionStore.fetchFromBackend)
})

onUnmounted(() => {
  window.removeEventListener('focus', sessionStore.fetchFromBackend)
})

function isInMaintenance(): boolean {
  const end = utcToZonedTime(new Date(2022, 0, 29, 12, 0, 0), BXL_TZ)
  return utcToZonedTime(new Date(), BXL_TZ) < end
}
const showMaintenance = ref(isInMaintenance())
setInterval(() => {
  showMaintenance.value = isInMaintenance()
}, 1000 * 60)
</script>

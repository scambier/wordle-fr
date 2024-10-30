<script setup lang="ts">
import { ref } from 'vue'

import { pb, synchronizeScores } from '@/api'
import ButtonGreen from '@/components/common/ButtonGreen.vue'
import router from '@/router'

const email = ref('')
const otpId = ref<string | null>(null)
const otpCode = ref('')

async function requestOTP(): Promise<void> {
  try {
    await pb.send(`/users/auth?email=${email.value}`, {
      method: 'POST',
    })
    const result = await pb.collection('users').requestOTP(email.value)
    otpId.value = result.otpId
  }
  catch (error) {
    console.error('Error requesting OTP:', error)
  }
}

async function validateCode(): Promise<void> {
  try {
    if (otpId.value === null || otpCode.value === '') {
      return
    }
    await pb.collection('users').authWithOTP(otpId.value, otpCode.value)
    await synchronizeScores()
    router.push('/')
  }
  catch (error) {
    console.error(error)
  }
}

function logout(): void {
  pb.authStore.clear()
  window.location.reload()
}
</script>

<template>
  <div class="mx-auto max-w-lg items-center pt-4">
    <!-- Logged in-->
    <div v-if="pb.authStore.record">
      <div>Vous êtes connecté en tant que {{ pb.authStore.record.email }}</div>
      <div>
        <button
          @click.prevent="logout"
          class="m-2 border p-2">
          Cliquez ici pour vous déconnecter
        </button>
      </div>
    </div>

    <div v-else>
      <!-- Email -->
      <div v-if="!otpId">
        <form>
          <p>Connectez-vous pour sauvegarder vos scores</p>
          <div>
            <input
              v-model="email"
              type="email"
              placeholder="Email"
              class="my-2 rounded text-black">
          </div>
          <div>
            <ButtonGreen
              type="submit"
              @click="requestOTP">
              Envoyer le code
            </ButtonGreen>
          </div>
        </form>
      </div>

      <!-- Code -->

      <div v-if="otpId">
        <div>
          Un code unique a été envoyé à {{ email }}. Quand vous aurez reçu ce
          code, entrez-le ici :
        </div>
        <div>
          <input
            v-model="otpCode"
            type="text"
            placeholder="Code"
            class="my-2 rounded text-black">
        </div>
        <div>
          <ButtonGreen @click="validateCode">
            Valider
          </ButtonGreen>
        </div>
      </div>
    </div>
  </div>
</template>

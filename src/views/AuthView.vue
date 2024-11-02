<script setup lang="ts">
import { ref } from 'vue'

import { pb } from '@/api'
import ButtonGreen from '@/components/common/ButtonGreen.vue'
import router from '@/router'
import { useHistoryStore } from '@/stores/history'
import { setItem } from '@/storage'
import { K_AUTH_ACTIVE } from '@/constants'

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
    await useHistoryStore().synchronizeWithBackend()
    setItem(K_AUTH_ACTIVE, '1')
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
  <div class="mx-auto max-w-lg items-center p-4">
    <!-- Logged in-->
    <div v-if="pb.authStore.record">
      <div>Vous êtes connecté en tant que {{ pb.authStore.record.email }}</div>
      <div>
        <button
          @click.prevent="logout"
          class="mt-2 border p-2">
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
        <form>
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
            <ButtonGreen
              @click="validateCode"
              type="submit">
              Valider
            </ButtonGreen>
          </div>
        </form>
      </div>
    </div>

    <div class="mt-4 text-xs">
      <p>
        Afin de synchroniser vos scores entre vos appareils, vous pouvez vous
        connecter avec votre adresse email.
      </p>
      <p>
        Vous recevrez un code unique par email afin de vous authentifier, et
        devrez répéter cette opération à chaque nouvel appareil.
      </p>
      <p class="mt-2 font-bold">
        Cette fonctionnalité est expérimentale et peut être supprimée à tout
        moment.
      </p>
      <p class="mt-2">
        Politique de confidentialité : aucune donnée personnelle n'est stockée.
        Votre adresse email ne sera utilisée que pour vous authentifier, et ne
        sera jamais partagée avec des tiers.<br>
        Nous stockons uniquement votre historique de parties.
      </p>
    </div>
  </div>
</template>

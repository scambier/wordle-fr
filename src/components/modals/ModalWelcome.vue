<template>
  <ModalBase @close="isVisibleModalWelcome = false">
    <p class="mb-4 text-sm">
      Chaque jour, à midi et minuit (CET), un nouveau mot de 5 lettres est
      choisi au hasard.
    </p>
    <p class="mb-4">
      <strong>Il s'agit du même mot, pour tous les joueurs.</strong>
    </p>
    <p class="mb-4">
      Vous avez 6 essais pour trouver le mot en question.<br>
      Une lettre bien placée est 🟩.<br>
      Une lettre mal placée est 🟨.<br>
      Une lettre qui n'est pas dans le mot reste ⬛.
    </p>
    <div>
      <ButtonGreen @click="isVisibleModalWelcome = false">
        C'est parti !
      </ButtonGreen>
    </div>

    <div class="flex place-content-between mt-4 text-xs">
      <a
        class="text-slate-300 underline"
        href="https://github.com/scambier/wordle-fr"
        target="_blank">Code source <IconGithub class="inline" /></a>
      <br>
      <div class="text-slate-600">
        Build {{ buildDate }}
      </div>
    </div>
  </ModalBase>
</template>

<script setup lang="ts">
import ButtonGreen from '@/components/common/ButtonGreen.vue'
import { isVisibleModalWelcome } from '@/composables/modal-manager'
import IconGithub from '~icons/ph/github-logo'

import ModalBase from './ModalBase.vue'

const buildDate = import.meta.env.VITE_BUILD_DATE
</script>

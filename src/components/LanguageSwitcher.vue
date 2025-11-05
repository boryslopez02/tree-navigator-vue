<template>
  <div class="btn-group d-inline-flex flex-wrap mb-3" role="group" aria-label="Language switcher">
    <template v-for="locale in locales">
      <button
        type="button"
        class="btn"
        :class="currentLang === locale.locale ? 'btn-outline-success active' : 'btn-outline-dark'"
        @click="setLang(locale.locale)"
      >
        {{ locale.label }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTreeStore } from '@/stores/treeStore'

const store = useTreeStore()
const locales = computed(() => store.locales)
const currentLang = computed(() => store.currentLanguage)

function setLang(lang) {
  store.setLanguage(lang)
}
</script>

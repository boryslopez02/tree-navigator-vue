<template>
  <div class="container py-4">
    <h1 class="mb-4 text-primary-emphasis">🌳 Tree Navigator</h1>

    <LanguageSwitcher class="mb-4" />

    <div
      v-if="store.notification"
      class="fixed-top mt-2"
      style="z-index: 1050; right: 1rem; left: auto"
    >
      <div
        class="alert alert-dismissible fade show mb-0"
        :class="{
          'alert-info': store.notification.type === 'info',
          'alert-danger': store.notification.type === 'danger',
          'alert-warning': store.notification.type === 'warning',
        }"
        role="alert"
      >
        {{ store.notification.message }}
        <button type="button" class="btn-close" @click="store.notification = null"></button>
      </div>
    </div>

    <!-- Botón para añadir nodo raíz -->
    <div class="mb-3">
      <button @click="showRootForm = !showRootForm" class="btn btn-outline-success">
        {{ showRootForm ? 'Cancel' : '➕ Add Root Node' }}
      </button>
    </div>

    <!-- Formulario raíz -->
    <div v-if="showRootForm" class="my-3 p-3 border rounded bg-light">
      <form @submit.prevent="createRoot">
        <div class="mb-2">
          <input
            v-model="rootTitle"
            type="text"
            class="form-control"
            placeholder="Root node title"
            required
          />
        </div>
        <div class="mb-2">
          <select v-model="rootLang" class="form-select">
            <option v-for="locale in rootLocales" :value="locale.locale">{{ locale.label }}</option>
          </select>
        </div>
        <button type="submit" class="btn btn-success">Create Root</button>
      </form>
    </div>

    <div v-if="store.loading" class="alert alert-info">Loading root nodes...</div>
    <div
      v-else-if="store.error"
      class="alert alert-danger alert-dismissible fade show"
      role="alert"
    >
      {{ store.error }}
      <button type="button" class="btn-close" @click="store.error = null"></button>
    </div>
    <div v-else>
      <TreeNode
        v-for="node in rootNodes"
        :key="node.id"
        :node="node"
        @node-created="store.fetchRootNodes()"
        @node-deleted="store.fetchRootNodes()"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useTreeStore } from '@/stores/treeStore'
import TreeNode from '@/components/TreeNode.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const store = useTreeStore()
const showRootForm = ref(false)
const rootTitle = ref('')
const rootLang = ref(store.currentLanguage)

const rootNodes = computed(() => store.nodes)
const rootLocales = computed(() => store.locales)

onMounted(async () => {
  await store.fetchLocales()
  await store.fetchRootNodes()
  await store.fetchTranslations()
})

async function createRoot() {
  const success = await store.createNode({
    parent: null,
    title: rootTitle.value,
    lang: rootLang.value,
  })

  if (success) {
    store.showNotification(store.getNotificationText('nodeCreatedSuccess'), 'success')
    rootTitle.value = ''
    showRootForm.value = false
    await store.fetchRootNodes()
    emit('node-created')
  }
}
</script>

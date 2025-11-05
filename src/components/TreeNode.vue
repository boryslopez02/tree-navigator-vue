<template>
  <div class="mb-2">
    <!-- Encabezado del nodo -->
    <div class="d-flex align-items-center p-2 border rounded bg-body-tertiary">
      <span
        @click="toggleChildren"
        class="flex-grow-1 fw-bold text-body-emphasis"
        style="cursor: pointer"
      >
        {{ title }}
      </span>
      <div class="btn-group btn-group-sm" role="group">
        <button @click="addChild" class="btn btn-outline-primary" title="Add child">➕</button>
        <button
          v-if="props.node.parent !== null"
          @click="remove"
          class="btn btn-outline-danger"
          :title="hasChildren ? 'Cannot delete: has children' : 'Delete'"
        >
          🗑️
        </button>
      </div>
    </div>

    <!-- Formulario para crear hijo -->
    <div v-if="showAddForm" class="mt-2 ms-4 p-3 border rounded bg-light">
      <form @submit.prevent="submitAdd">
        <div class="mb-2">
          <input
            v-model="newNodeTitle"
            type="text"
            class="form-control form-control-sm"
            placeholder="Node title"
            required
          />
        </div>
        <div class="mb-2">
          <select v-model="newNodeLang" class="form-select form-select-sm">
            <option v-for="locale in locales" :key="locale.locale" :value="locale.locale">
              {{ locale.label }}
            </option>
          </select>
        </div>
        <div class="d-flex gap-2">
          <button type="submit" class="btn btn-sm btn-success">Create</button>
          <button type="button" class="btn btn-sm btn-secondary" @click="showAddForm = false">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Renderizado de hijos -->
    <div v-if="isExpanded" class="ms-4 mt-2">
      <TreeNode
        v-for="child in childrenList"
        :key="child.id"
        :node="child"
        @node-created="$emit('node-created')"
        @node-deleted="$emit('node-deleted')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTreeStore } from '@/stores/treeStore'

const props = defineProps({
  node: { type: Object, required: true },
})

const emit = defineEmits(['node-created', 'node-deleted'])

const store = useTreeStore()
const showAddForm = ref(false)
const newNodeTitle = ref('')
const newNodeLang = ref(store.currentLanguage)

const isExpanded = computed(() => store.isNodeExpanded(props.node.id))
const childrenList = computed(() => store.getNodeChildren(props.node.id))
const hasChildren = computed(() => store.hasChildren(props.node.id))

const title = computed(() => store.getNodeTitle(props.node))
console.log('title: ', title)
const locales = computed(() => store.locales)

function toggleChildren() {
  store.toggleNode(props.node.id)
}

async function remove() {
  if (confirm('⚠️ Are you sure you want to delete this node?')) {
    const parentId = props.node.parent
    const success = await store.deleteNode(props.node.id, parentId)
    if (success) {
      emit('node-deleted')
    }
  }
}

function addChild() {
  showAddForm.value = true
}

async function submitAdd() {
  const success = await store.createNode({
    parent: props.node.id,
    title: newNodeTitle.value,
    lang: newNodeLang.value,
  })
  if (success) {
    store.showNotification(store.getNotificationText('nodeCreatedSuccess'), 'success')
    newNodeTitle.value = ''
    showAddForm.value = false

    await store.loadChildren(props.node.id)

    emit('node-created')
  }
}
</script>

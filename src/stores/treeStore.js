import { defineStore } from 'pinia';
import api from '@/composables/useApi';

const NOTIFICATION_MESSAGES = {
  nodeDeletedSuccess: {
    en_US: 'Node deleted successfully.',
    es_ES: 'Nodo eliminado correctamente.',
    fr_FR: 'Nœud supprimé avec succès.',
    de_DE: 'Knoten erfolgreich gelöscht.',
    it_IT: 'Nodo eliminato correttamente.'
  },
  cannotDeleteParent: {
    en_US: "Can't delete a parent node.",
    es_ES: "No se puede eliminar un nodo padre.",
    fr_FR: "Impossible de supprimer un nœud parent.",
    de_DE: "Elternknoten kann nicht gelöscht werden.",
    it_IT: "Impossibile eliminare un nodo padre."
  },
  failedToCreateNode: {
    en_US: 'Failed to create node.',
    es_ES: 'Error al crear el nodo.',
    fr_FR: 'Échec de la création du nœud.',
    de_DE: 'Fehler beim Erstellen des Knotens.',
    it_IT: 'Errore durante la creazione del nodo.'
  },
  failedToDeleteNode: {
    en_US: 'Failed to delete node.',
    es_ES: 'Error al eliminar el nodo.',
    fr_FR: 'Échec de la suppression du nœud.',
    de_DE: 'Fehler beim Löschen des Knotens.',
    it_IT: 'Errore durante l’eliminazione del nodo.'
  },
  noChildren: {
    en_US: 'This node has no children.',
    es_ES: 'Este nodo no tiene hijos.',
    fr_FR: 'Ce nœud n’a pas d’enfants.',
    de_DE: 'Dieser Knoten hat keine Kinder.',
    it_IT: 'Questo nodo non ha figli.'
  },
  failedToLoadChildren: {
    en_US: 'Failed to load children.',
    es_ES: 'Error al cargar los hijos.',
    fr_FR: 'Échec du chargement des enfants.',
    de_DE: 'Fehler beim Laden der Kinder.',
    it_IT: 'Errore durante il caricamento dei figli.'
  },
  nodeCreatedSuccess: {
    en_US: 'Node created successfully!',
    es_ES: '¡Nodo creado correctamente!',
    fr_FR: 'Nœud créé avec succès !',
    de_DE: 'Knoten erfolgreich erstellt!',
    it_IT: 'Nodo creato correttamente!'
  }
};

export const useTreeStore = defineStore('tree', {
  state: () => ({
    nodes: [],
    translations: {},
    currentLanguage: 'es_ES',
    locales: [],
    expandedNodes: {},
    nodeChildren: {},
    loading: false,
    error: null,
    notification: null,
  }),

  actions: {
    async fetchLocales() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/locales');
        console.log('response locales: ', response);
        this.locales = response.data;
      } catch (err) {
        this.error = err.message || 'Failed to load root nodes';
      } finally {
        this.loading = false;
      }
    },

    async fetchRootNodes() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/nodes');
        console.log('response fetchRootNodes: ', response);
        this.nodes = response.data;
      } catch (err) {
        this.error = err.message || 'Failed to load root nodes';
      } finally {
        this.loading = false;
      }
    },

    async fetchChildren(parentId) {
      this.loading = true;
      try {
        const response = await api.get(`/nodes?parent=${parentId}`);
        return response.data;
      } catch (err) {
        this.error = err.message || 'Failed to load children';
        return [];
      } finally {
        this.loading = false;
      }
    },

    async refreshNode(parentId) {
      if (parentId === null) {
        await this.fetchRootNodes();
      } else {
        await this.loadChildren(parentId);
      }
    },

    async createNode(nodeData) {
      try {
        const response = await api.post('/node', nodeData);
        this.showNotification(this.getNotificationText('nodeCreatedSuccess'), 'success');
        return true;
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to create node';
        this.showNotification(this.getNotificationText('failedToCreateNode'), 'danger');
        return false;
      }
    },

    async deleteNode(id, parentId) {
      try {
        await api.delete(`/node/${id}`);

        if (parentId === null) {
          this.nodes = this.nodes.filter(node => node.id !== id);
        } else {
          if (this.nodeChildren[parentId]) {
            this.nodeChildren[parentId] = this.nodeChildren[parentId].filter(child => child.id !== id);
          }
        }

        delete this.expandedNodes[id];
        delete this.nodeChildren[id];

        this.showNotification(this.getNotificationText('nodeDeletedSuccess'), 'success');

        return true;
      } catch (err) {
        let message = 'Failed to delete node.';
        if (err.response?.status === 400) {
          message = "Can't delete a parent node.";
        } else if (err.response?.data?.message) {
          message = err.response.data.message;
        }
        this.showNotification(this.getNotificationText('cannotDeleteParent'), 'danger');
        return false;
      }
    },

    setLanguage(lang) {
      const exists = this.locales.some(l => l.locale === lang);
      if (!exists) {
        console.warn(`Locale ${lang} not available`);
        return;
      }
      this.currentLanguage = lang;
    },

    getNodeTitle(node) {
      const trans = this.translations[node.id] || {};
      if (trans[this.currentLanguage] != null) {
        return trans[this.currentLanguage];
      }
      return trans.en_US || node.title || 'Untitled';
    },

    async fetchTranslations() {
      try {
        const response = await api.get('/locales');
        this.translations = response.data;
      } catch (err) {
        console.warn('Could not load translations');
      }
    },

    toggleNode(nodeId) {
      if (this.expandedNodes[nodeId]) {
        this.expandedNodes[nodeId] = false;
      } else {
        this.expandedNodes[nodeId] = true;
        if (!this.nodeChildren[nodeId]) {
          this.loadChildren(nodeId);
        }
      }
    },

    async loadChildren(nodeId) {
      try {
        const response = await api.get(`/nodes?parent=${nodeId}`);
        const children = Array.isArray(response.data) ? response.data : [];
        this.nodeChildren[nodeId] = children;
      } catch (err) {
        // 404 "no hay hijos"
        if (err.response?.status === 404) {
          this.nodeChildren[nodeId] = [];
          this.showNotification(this.getNotificationText('noChildren'), 'info');
        } else {
          console.error('Failed to load children for', nodeId, err);
          this.nodeChildren[nodeId] = [];
          this.showNotification(this.getNotificationText('failedToLoadChildren'), 'danger');
        }
      }
    },

    getNodeChildren(nodeId) {
      return this.nodeChildren[nodeId] || [];
    },

    isNodeExpanded(nodeId) {
      return !!this.expandedNodes[nodeId];
    },

    hasChildren(nodeId) {
      const children = this.nodeChildren[nodeId];
      return children ? children.length > 0 : false;
    },

    getNotificationText(key) {
      const lang = this.currentLanguage;
      const fallbackLang = 'en_US';

      if (NOTIFICATION_MESSAGES[key] && NOTIFICATION_MESSAGES[key][lang]) {
        return NOTIFICATION_MESSAGES[key][lang];
      }

      // Fallback a inglés
      return NOTIFICATION_MESSAGES[key]?.[fallbackLang] || `Missing translation for ${key}`;
    },

    showNotification(message, type = 'info') {
      this.notification = { message, type };
    }
  },
});
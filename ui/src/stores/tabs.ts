import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ApiRequest, ApiResponse } from './types'

export interface Tab {
  id: string
  collectionId?: string
  itemId?: string
  name: string
  request: ApiRequest
  response: ApiResponse | null
  isLoading: boolean
  error: string | null
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<Tab[]>([
    {
      id: 'default',
      name: 'New Request',
      request: {
        method: 'GET',
        url: '',
        headers: {},
        query: {},
        body: '',
        bodyType: 'json',
        files: [],
        auth: { type: 'none' }
      },
      response: null,
      isLoading: false,
      error: null
    }
  ])
  
  const activeTabId = ref('default')
  
  const activeTab = computed(() => {
    return tabs.value.find(t => t.id === activeTabId.value) || tabs.value[0]
  })

  const addTab = (name = 'New Request', request?: ApiRequest, itemId?: string, collectionId?: string) => {
    // If opening a request that is already open in a tab, switch to it
    if (itemId) {
      const existingTab = tabs.value.find(t => t.itemId === itemId)
      if (existingTab) {
        activeTabId.value = existingTab.id
        return
      }
    }

    const id = Math.random().toString(36).substring(7)
    tabs.value.push({
      id,
      itemId,
      collectionId,
      name,
      request: request ? JSON.parse(JSON.stringify(request)) : {
        method: 'GET',
        url: '',
        headers: {},
        query: {},
        body: '',
        bodyType: 'json',
        files: [],
        auth: { type: 'none' }
      },
      response: null,
      isLoading: false,
      error: null
    })
    activeTabId.value = id
  }

  const removeTab = (id: string) => {
    const index = tabs.value.findIndex(t => t.id === id)
    if (tabs.value.length > 1) {
      tabs.value.splice(index, 1)
      if (activeTabId.value === id) {
        activeTabId.value = tabs.value[Math.max(0, index - 1)].id
      }
    } else {
      // Last tab: just reset it
      tabs.value[0] = {
        ...tabs.value[0],
        name: 'New Request',
        itemId: undefined,
        collectionId: undefined,
        request: {
          method: 'GET',
          url: '',
          headers: {},
          query: {},
          body: '',
          bodyType: 'json',
          files: [],
          auth: { type: 'none' }
        },
        response: null,
        error: null
      }
    }
  }

  const closeAllTabs = () => {
    const defaultTab = {
      id: 'default-' + Date.now(),
      name: 'New Request',
      request: {
        method: 'GET',
        url: '',
        headers: {},
        query: {},
        body: '',
        bodyType: 'json',
        files: [],
        auth: { type: 'none' }
      },
      response: null,
      isLoading: false,
      error: null
    }
    tabs.value = [defaultTab]
    activeTabId.value = defaultTab.id
  }

  const closeOtherTabs = (id: string) => {
    const target = tabs.value.find(t => t.id === id)
    if (target) {
      tabs.value = [target]
      activeTabId.value = id
    }
  }

  const closeTabsToLeft = (id: string) => {
    const index = tabs.value.findIndex(t => t.id === id)
    if (index > 0) {
      tabs.value.splice(0, index)
      activeTabId.value = id
    }
  }

  const closeTabsToRight = (id: string) => {
    const index = tabs.value.findIndex(t => t.id === id)
    if (index !== -1 && index < tabs.value.length - 1) {
      tabs.value.splice(index + 1)
      activeTabId.value = id
    }
  }

  const updateActiveRequest = (data: Partial<ApiRequest>) => {
    if (activeTab.value) {
      activeTab.value.request = { ...activeTab.value.request, ...data }
      
      if (data.url && !data.url.includes('://')) {
        const url = data.url.trim()
        if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
          activeTab.value.request.url = `http://${url}`
        } else if (url.includes('.')) {
          activeTab.value.request.url = `https://${url}`
        }
      }
    }
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    addTab,
    removeTab,
    closeAllTabs,
    closeOtherTabs,
    closeTabsToLeft,
    closeTabsToRight,
    updateActiveRequest
  }
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ApiRequest {
  method: string
  url: string
  headers: Record<string, string>
  query: Record<string, string>
  body: string
  bodyType: 'json' | 'multipart' | 'raw'
  files: { key: string; name: string; content: string; type: string }[]
  auth: {
    type: 'none' | 'bearer' | 'basic'
    token?: string
    username?: string
    password?: string
  }
}

export interface ApiResponse {
  status: number
  headers: Record<string, string>
  body: string
  time_ms: number
}

export interface Tab {
  id: string
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

  const addTab = (name = 'New Request', request?: ApiRequest) => {
    const id = Math.random().toString(36).substring(7)
    tabs.value.push({
      id,
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
    }
  }

  const updateActiveRequest = (data: Partial<ApiRequest>) => {
    if (activeTab.value) {
      activeTab.value.request = { ...activeTab.value.request, ...data }
      
      // Auto-prefix URL if protocol missing and user finished typing
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
    updateActiveRequest
  }
})

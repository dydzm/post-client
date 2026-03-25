import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { ApiRequest } from './tabs'

export interface CollectionItem {
  id: string
  name: string
  request: ApiRequest
  createdAt: number
}

export const useCollectionsStore = defineStore('collections', () => {
  const savedItems = ref<CollectionItem[]>(
    JSON.parse(localStorage.getItem('post-client-collections') || '[]')
  )

  const saveRequest = (name: string, request: ApiRequest) => {
    const id = Math.random().toString(36).substring(7)
    savedItems.value.push({
      id,
      name,
      request: JSON.parse(JSON.stringify(request)), // Deep copy
      createdAt: Date.now()
    })
  }

  const removeRequest = (id: string) => {
    savedItems.value = savedItems.value.filter(item => item.id !== id)
  }

  const updateRequest = (id: string, request: ApiRequest) => {
    const index = savedItems.value.findIndex(item => item.id === id)
    if (index !== -1) {
      savedItems.value[index].request = JSON.parse(JSON.stringify(request))
    }
  }

  // Persist to localStorage
  watch(savedItems, (newItems) => {
    localStorage.setItem('post-client-collections', JSON.stringify(newItems))
  }, { deep: true })

  return {
    savedItems,
    saveRequest,
    removeRequest,
    updateRequest
  }
})

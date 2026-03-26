import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ApiRequest } from './types'

export interface CollectionItem {
  id: string
  collectionId: string
  name: string
  request: ApiRequest
  createdAt: number
}

export interface Collection {
  id: string
  name: string
  createdAt: number
}

export const useCollectionsStore = defineStore('collections', () => {
  const collections = ref<Collection[]>(
    JSON.parse(localStorage.getItem('post-client-collection-groups') || '[{"id": "default", "name": "Default Collection", "createdAt": 1711370000000}]')
  )
  
  const savedItems = ref<CollectionItem[]>(
    JSON.parse(localStorage.getItem('post-client-collections') || '[]')
  )

  const addCollection = (name: string) => {
    const id = Math.random().toString(36).substring(7)
    collections.value.push({
      id,
      name,
      createdAt: Date.now()
    })
    return id
  }

  const renameCollection = (id: string, newName: string) => {
    const collection = collections.value.find(c => c.id === id)
    if (collection) {
      collection.name = newName
    }
  }

  const deleteCollection = (id: string) => {
    collections.value = collections.value.filter(c => c.id !== id)
    // Also delete items in this collection
    savedItems.value = savedItems.value.filter(item => item.collectionId !== id)
  }

  const saveRequest = (name: string, request: ApiRequest, collectionId = 'default', forceNew = false) => {
    const id = Math.random().toString(36).substring(7)
    // Deep copy request
    const clonedRequest = JSON.parse(JSON.stringify(request))
    
    // Check if item with same name exists in this collection, if so update it (unless forceNew is true)
    const existingIndex = forceNew ? -1 : savedItems.value.findIndex(item => item.name === name && item.collectionId === collectionId)
    
    if (existingIndex !== -1) {
      savedItems.value[existingIndex].request = clonedRequest
      return savedItems.value[existingIndex].id
    } else {
      savedItems.value.push({
        id,
        collectionId,
        name,
        request: clonedRequest,
        createdAt: Date.now()
      })
      return id
    }
  }

  const duplicateRequest = (id: string) => {
    const original = savedItems.value.find(item => item.id === id)
    if (original) {
      const newId = Math.random().toString(36).substring(7)
      savedItems.value.push({
        ...JSON.parse(JSON.stringify(original)),
        id: newId,
        name: `${original.name} (Copy)`,
        createdAt: Date.now()
      })
      return newId
    }
  }

  const updateItemOrder = (collectionId: string, itemIds: string[]) => {
    // Create a map of items to reorder
    const itemsMap = new Map(savedItems.value.map(item => [item.id, item]))
    
    // Get items NOT in this collection
    const otherItems = savedItems.value.filter(item => item.collectionId !== collectionId)
    
    // Reorder items in this collection
    const reorderedItems = itemIds.map(id => {
      const item = itemsMap.get(id)
      if (item) {
        return { ...item, collectionId } // Ensure it's in the target collection
      }
      return null
    }).filter(item => item !== null) as CollectionItem[]
    
    // Combine back
    savedItems.value = [...otherItems, ...reorderedItems]
  }

  const removeRequest = (id: string) => {
    savedItems.value = savedItems.value.filter(item => item.id !== id)
  }

  const updateRequest = (id: string, request: ApiRequest, name?: string) => {
    const index = savedItems.value.findIndex(item => item.id === id)
    if (index !== -1) {
      savedItems.value[index].request = JSON.parse(JSON.stringify(request))
      if (name) {
        savedItems.value[index].name = name
      }
    }
  }

  const exportCollections = (collectionIds?: string[]) => {
    const targetCollections = collectionIds 
      ? collections.value.filter(c => collectionIds.includes(c.id))
      : collections.value
    
    const exportData = targetCollections.map(c => ({
      ...c,
      items: savedItems.value.filter(item => item.collectionId === c.id)
    }))
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `collections-${Date.now()}.json`
    a.click()
  }

  // Persist to localStorage
  watch(collections, (newVal) => {
    localStorage.setItem('post-client-collection-groups', JSON.stringify(newVal))
  }, { deep: true })

  watch(savedItems, (newItems) => {
    localStorage.setItem('post-client-collections', JSON.stringify(newItems))
  }, { deep: true })

  return {
    collections,
    savedItems,
    addCollection,
    renameCollection,
    deleteCollection,
    saveRequest,
    duplicateRequest,
    updateItemOrder,
    removeRequest,
    updateRequest,
    exportCollections
  }
})

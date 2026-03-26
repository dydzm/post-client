import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ApiRequest } from './types'

export const useRequestStore = defineStore('request', () => {
  const req = ref<ApiRequest>({
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    headers: {},
    query: {},
    body: '',
    bodyType: 'json',
    files: [],
    auth: { type: 'none' }
  })
  
  // Track sync source to prevent infinite loops
  const syncSource = ref<'gui' | 'cli' | null>(null)
  
  const updateFromGui = (newReq: Partial<ApiRequest>) => {
    syncSource.value = 'gui'
    req.value = { ...req.value, ...newReq }
  }
  
  const updateFromCli = (newReq: Partial<ApiRequest>) => {
    syncSource.value = 'cli'
    req.value = { ...req.value, ...newReq }
  }
  
  return {
    req,
    syncSource,
    updateFromGui,
    updateFromCli
  }
})

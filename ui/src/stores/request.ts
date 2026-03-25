import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ApiRequest {
  method: string
  url: string
  headers: Record<string, string>
  query: Record<string, string>
  body: string // Storing as string for Monaco editor, parse to JSON before sending if needed
}

export const useRequestStore = defineStore('request', () => {
  const req = ref<ApiRequest>({
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    headers: {},
    query: {},
    body: ''
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

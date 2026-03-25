import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ApiResponse {
  status: number
  headers: Record<string, string>
  body: string
  time_ms: number
}

export const useResponseStore = defineStore('response', () => {
  const response = ref<ApiResponse | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  return {
    response,
    isLoading,
    error
  }
})

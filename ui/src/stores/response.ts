import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ApiResponse } from './types'

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

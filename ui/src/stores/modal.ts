import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ModalType = 'save' | 'collection' | 'confirm' | 'duplicate' | 'import-type' | 'import-openapi' | 'collection-config' | 'openapi-url' | null

interface ModalOptions {
  title?: string
  message?: string
  data?: any
  confirmLabel?: string
  cancelLabel?: string
  resolve?: (value: any) => void
  reject?: (reason?: any) => void
}

export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false)
  const activeType = ref<ModalType>(null)
  const options = ref<ModalOptions>({})

  const open = (type: ModalType, opt: ModalOptions = {}) => {
    activeType.value = type
    options.value = {
      title: opt.title || '',
      message: opt.message || '',
      data: opt.data || {},
      confirmLabel: opt.confirmLabel || 'Confirm',
      cancelLabel: opt.cancelLabel || 'Cancel',
      resolve: opt.resolve,
      reject: opt.reject
    }
    isOpen.value = true
    
    // Return a promise that resolves when the modal is confirmed
    return new Promise((resolve, reject) => {
      options.value.resolve = resolve
      options.value.reject = reject
    })
  }

  const close = () => {
    isOpen.value = false
    activeType.value = null
    options.value = {}
  }

  const confirm = (payload: any = true) => {
    if (options.value.resolve) {
      options.value.resolve(payload)
    }
    close()
  }

  const cancel = () => {
    if (options.value.reject) {
      options.value.reject()
    }
    close()
  }

  return {
    isOpen,
    activeType,
    options,
    open,
    close,
    confirm,
    cancel
  }
})

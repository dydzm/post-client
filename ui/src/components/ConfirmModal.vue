<script setup lang="ts">
import { useModalStore } from '../stores/modal'
import BaseModal from './BaseModal.vue'
import { AlertCircle } from 'lucide-vue-next'

const modalStore = useModalStore()
</script>

<template>
  <BaseModal :title="modalStore.options.title || 'Confirm Action'">
    <div class="flex items-start gap-4">
      <div class="bg-red-500/10 p-3 rounded-full shrink-0">
        <AlertCircle class="w-6 h-6 text-red-500" />
      </div>
      <div class="space-y-2">
        <p class="text-sm text-slate-300 leading-relaxed">
          {{ modalStore.options.message }}
        </p>
      </div>
    </div>

    <template #footer>
      <button @click="modalStore.cancel" class="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">
        {{ modalStore.options.cancelLabel || 'Cancel' }}
      </button>
      <button 
        @click="modalStore.confirm(true)" 
        class="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-red-900/20 uppercase tracking-widest"
      >
        {{ modalStore.options.confirmLabel || 'Confirm' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { useModalStore } from '../stores/modal'

defineProps<{
  title: string
  showClose?: boolean
}>()

const modalStore = useModalStore()
</script>

<template>
  <div v-if="modalStore.isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="modalStore.cancel"></div>
    
    <!-- Modal Container -->
    <div class="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
        <h3 class="text-sm font-bold text-slate-200 uppercase tracking-widest">{{ title }}</h3>
        <button v-if="showClose !== false" @click="modalStore.cancel" class="text-slate-500 hover:text-slate-300 transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <slot></slot>
      </div>

      <!-- Footer (Optional) -->
      <div v-if="$slots.footer" class="px-6 py-4 border-t border-slate-700 bg-slate-900/30 flex justify-end gap-3">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

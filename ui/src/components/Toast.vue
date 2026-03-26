<script setup lang="ts">
import { useToastStore } from '../stores/toast'
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-vue-next'

const toastStore = useToastStore()
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
    <transition-group name="toast-list">
      <div v-for="toast in toastStore.toasts" :key="toast.id"
           :class="['flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border border-white/5 min-w-[300px] pointer-events-auto backdrop-blur-xl', 
                    toast.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                    toast.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    'bg-blue-500/10 text-blue-400 border-blue-500/20']">
        
        <component :is="toast.type === 'success' ? CheckCircle2 : 
                         toast.type === 'error' ? XCircle : 
                         toast.type === 'info' ? Info : AlertCircle" 
                   class="w-5 h-5 shrink-0" />
        
        <p class="text-sm font-medium flex-1">{{ toast.message }}</p>
        
        <button @click="toastStore.removeToast(toast.id)" class="p-1 hover:bg-white/10 rounded transition-colors text-slate-500 hover:text-white">
          <X class="w-4 h-4" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-list-enter-active, .toast-list-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-list-enter-from { transform: translateX(100%) scale(0.9); opacity: 0; }
.toast-list-leave-to { transform: translateX(100%) scale(0.9); opacity: 0; }
.toast-list-move { transition: transform 0.4s ease; }
</style>

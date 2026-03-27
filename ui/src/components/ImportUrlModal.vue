<script setup lang="ts">
import { ref } from 'vue'
import { useModalStore } from '../stores/modal'
import BaseModal from './BaseModal.vue'
import { Globe, ArrowRight } from 'lucide-vue-next'

const modalStore = useModalStore()
const url = ref('')

const handleConfirm = () => {
  if (url.value.trim()) {
    modalStore.confirm(url.value.trim())
  }
}
</script>

<template>
  <BaseModal title="Import from URL">
    <div class="space-y-4">
      <div class="p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg flex gap-3">
        <Globe class="w-5 h-5 text-blue-500 shrink-0" />
        <p class="text-[11px] text-slate-400 leading-relaxed">
          Enter the URL of an <span class="text-blue-400 font-bold">openapi.json</span> or <span class="text-blue-400 font-bold">swagger.json</span> file. 
          The backend will fetch the content to bypass CORS restrictions.
        </p>
      </div>

      <div class="space-y-2">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OpenAPI URL</label>
        <div class="relative">
          <input 
            v-model="url"
            @keyup.enter="handleConfirm"
            placeholder="https://myapp.fastapicloud.dev/openapi.json"
            class="w-full bg-slate-950 border border-slate-700 rounded-lg pl-4 pr-12 py-2.5 text-xs text-slate-200 outline-none focus:border-accent transition-all"
            autofocus
          />
          <button 
            @click="handleConfirm"
            :disabled="!url.trim()"
            class="absolute right-1.5 top-1.5 p-1.5 bg-accent hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-accent text-white rounded-md transition-all"
          >
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <button @click="modalStore.cancel" class="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">
        Cancel
      </button>
      <button 
        @click="handleConfirm" 
        :disabled="!url.trim()"
        class="bg-accent hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-accent/20 uppercase tracking-widest"
      >
        Fetch
      </button>
    </template>
  </BaseModal>
</template>

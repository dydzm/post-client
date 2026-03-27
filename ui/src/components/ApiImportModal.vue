<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useModalStore } from '../stores/modal'
import BaseModal from './BaseModal.vue'
import { Globe, ShieldCheck, ChevronRight } from 'lucide-vue-next'
import type { OpenApiMetadata } from '../lib/openapi-parser'

const modalStore = useModalStore()
const metadata = ref<OpenApiMetadata>(modalStore.options.data?.metadata)
const selectedServer = ref(metadata.value.servers[0] || 'http://localhost:8000')
const customServer = ref('')
const useCustomServer = ref(false)

const handleConfirm = () => {
  const finalServer = useCustomServer.value ? customServer.value : selectedServer.value
  modalStore.confirm({
    server: finalServer,
    metadata: metadata.value
  })
}
</script>

<template>
  <BaseModal title="Configure OpenAPI Import">
    <div class="space-y-6">
      <!-- Info -->
      <div class="bg-slate-950 rounded-lg p-4 border border-slate-800">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">API Document</div>
        <div class="text-sm font-bold text-slate-200">{{ metadata.title }}</div>
        <div class="text-[10px] text-slate-500">Version: {{ metadata.version }} • {{ metadata.endpoints.length }} endpoints found</div>
      </div>

      <!-- Server Selection -->
      <div class="space-y-3">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Base Server</label>
        
        <div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
          <button 
            v-for="server in metadata.servers" 
            :key="server"
            @click="selectedServer = server; useCustomServer = false"
            :class="['w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all', 
                     !useCustomServer && selectedServer === server ? 'bg-accent/10 border-accent text-accent' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700']"
          >
            <Globe class="w-4 h-4 shrink-0" />
            <span class="text-xs font-mono truncate">{{ server }}</span>
          </button>

          <button 
            @click="useCustomServer = true"
            :class="['w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all', 
                     useCustomServer ? 'bg-accent/10 border-accent text-accent' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700']"
          >
            <ShieldCheck class="w-4 h-4 shrink-0" />
            <span class="text-xs font-medium">Custom Server URL</span>
          </button>
        </div>

        <div v-if="useCustomServer" class="animate-in fade-in slide-in-from-top-2 duration-200">
          <input 
            v-model="customServer"
            placeholder="https://api.example.com"
            class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-xs text-slate-200 outline-none focus:border-accent"
          />
        </div>
      </div>

      <!-- Preview -->
      <div class="space-y-2">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Endpoints Preview</label>
        <div class="bg-slate-950 rounded-lg border border-slate-800 divide-y divide-slate-900 max-h-32 overflow-y-auto custom-scrollbar">
          <div v-for="(ep, idx) in metadata.endpoints.slice(0, 10)" :key="idx" class="px-3 py-2 flex items-center gap-3">
            <span :class="['text-[9px] font-bold w-10', 
              ep.method === 'GET' ? 'text-green-500' : 
              ep.method === 'POST' ? 'text-blue-500' : 'text-yellow-500']">{{ ep.method }}</span>
            <span class="text-[10px] text-slate-400 truncate">{{ ep.path }}</span>
          </div>
          <div v-if="metadata.endpoints.length > 10" class="px-3 py-2 text-center text-[9px] text-slate-600 italic">
            ... and {{ metadata.endpoints.length - 10 }} more
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button @click="modalStore.cancel" class="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">
        Cancel
      </button>
      <button 
        @click="handleConfirm" 
        class="bg-accent hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-accent/20 uppercase tracking-widest"
      >
        Import
      </button>
    </template>
  </BaseModal>
</template>

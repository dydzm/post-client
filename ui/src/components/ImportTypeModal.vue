<script setup lang="ts">
import { useModalStore } from '../stores/modal'
import BaseModal from './BaseModal.vue'
import { FileJson, Zap, Globe } from 'lucide-vue-next'

const modalStore = useModalStore()

const selectType = (type: 'native' | 'openapi' | 'openapi-url') => {
  modalStore.confirm(type)
}
</script>

<template>
  <BaseModal title="Import Collection">
    <div class="grid grid-cols-1 gap-3">
      <button 
        @click="selectType('native')"
        class="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 transition-all text-left group"
      >
        <div class="bg-blue-500/10 p-3 rounded-lg group-hover:bg-blue-500/20 transition-colors">
          <FileJson class="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <div class="text-sm font-bold text-slate-200">Post Client JSON</div>
          <div class="text-[10px] text-slate-500">Native collection format (.json)</div>
        </div>
      </button>

      <button 
        @click="selectType('openapi')"
        class="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 transition-all text-left group"
      >
        <div class="bg-purple-500/10 p-3 rounded-lg group-hover:bg-purple-500/20 transition-colors">
          <Zap class="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <div class="text-sm font-bold text-slate-200">OpenAPI File</div>
          <div class="text-[10px] text-slate-500">Import from local .json or .yaml files</div>
        </div>
      </button>

      <button 
        @click="selectType('openapi-url')"
        class="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 transition-all text-left group"
      >
        <div class="bg-emerald-500/10 p-3 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
          <Globe class="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <div class="text-sm font-bold text-slate-200">OpenAPI URL</div>
          <div class="text-[10px] text-slate-500">Import from live openapi.json URL</div>
        </div>
      </button>
    </div>
  </BaseModal>
</template>

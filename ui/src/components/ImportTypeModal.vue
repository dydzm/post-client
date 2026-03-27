<script setup lang="ts">
import { useModalStore } from '../stores/modal'
import BaseModal from './BaseModal.vue'
import { FileJson, Zap } from 'lucide-vue-next'

const modalStore = useModalStore()

const selectType = (type: 'native' | 'openapi') => {
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
          <div class="text-sm font-bold text-slate-200">OpenAPI 2.0, 3.0, 3.1</div>
          <div class="text-[10px] text-slate-500">Import from Swagger or OpenAPI files</div>
        </div>
      </button>
    </div>
  </BaseModal>
</template>

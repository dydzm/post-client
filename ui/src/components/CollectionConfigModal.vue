<script setup lang="ts">
import { ref } from 'vue'
import { useModalStore } from '../stores/modal'
import { useCollectionsStore } from '../stores/collections'
import BaseModal from './BaseModal.vue'
import { Plus, Trash2, Key, Type } from 'lucide-vue-next'

const modalStore = useModalStore()
const collectionsStore = useCollectionsStore()

const collectionId = modalStore.options.data?.collectionId
const collection = collectionsStore.collections.find(c => c.id === collectionId)

const variables = ref<{ key: string; value: string }[]>(
  Object.entries(collection?.variables || {}).map(([key, value]) => ({ key, value }))
)

if (variables.value.length === 0) {
  variables.value.push({ key: '', value: '' })
}

const addVariable = () => variables.value.push({ key: '', value: '' })
const removeVariable = (idx: number) => {
  variables.value.splice(idx, 1)
  if (variables.value.length === 0) addVariable()
}

const handleConfirm = () => {
  const vars: Record<string, string> = {}
  variables.value.forEach(v => {
    if (v.key.trim()) vars[v.key.trim()] = v.value
  })
  
  collectionsStore.updateCollectionVariables(collectionId, vars)
  modalStore.confirm(true)
}
</script>

<template>
  <BaseModal :title="`Variables: ${collection?.name}`">
    <div class="space-y-4">
      <p class="text-[10px] text-slate-500 italic">
        Variables can be used in URLs, Headers, or Body using <span class="text-accent font-mono">{VariableName}</span>.
      </p>

      <div class="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
        <div v-for="(v, idx) in variables" :key="idx" class="flex gap-2 items-center group">
          <div class="flex-1 flex gap-px rounded-lg overflow-hidden border border-slate-800 focus-within:border-accent transition-colors">
            <input 
              v-model="v.key" 
              placeholder="Variable Name"
              class="w-1/3 bg-slate-900 px-3 py-2 text-xs text-slate-300 outline-none border-r border-slate-800 focus:bg-slate-800"
            />
            <input 
              v-model="v.value" 
              placeholder="Value"
              class="flex-1 bg-slate-900 px-3 py-2 text-xs text-slate-300 outline-none focus:bg-slate-800"
            />
          </div>
          <button @click="removeVariable(idx)" class="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <button @click="addVariable" class="w-full py-2 border border-dashed border-slate-700 rounded-lg text-[10px] font-bold text-slate-500 hover:text-accent hover:border-accent transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
        <Plus class="w-3 h-3" /> Add Variable
      </button>
    </div>

    <template #footer>
      <button @click="modalStore.cancel" class="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">
        Cancel
      </button>
      <button 
        @click="handleConfirm" 
        class="bg-accent hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-accent/20 uppercase tracking-widest"
      >
        Save Changes
      </button>
    </template>
  </BaseModal>
</template>

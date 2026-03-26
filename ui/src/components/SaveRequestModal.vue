<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useModalStore } from '../stores/modal'
import { useCollectionsStore } from '../stores/collections'
import BaseModal from './BaseModal.vue'
import { Folder } from 'lucide-vue-next'

const modalStore = useModalStore()
const collectionsStore = useCollectionsStore()

const name = ref(modalStore.options.data?.name || '')
const collectionId = ref(modalStore.options.data?.collectionId || 'default')

const handleConfirm = () => {
  if (!name.value.trim()) return
  modalStore.confirm({ name: name.value, collectionId: collectionId.value })
}

const inputRef = ref<HTMLInputElement | null>(null)
onMounted(() => {
  inputRef.value?.focus()
  inputRef.value?.select()
})
</script>

<template>
  <BaseModal :title="modalStore.options.title || 'Save Request'">
    <div class="space-y-4">
      <div class="space-y-1.5">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Request Name</label>
        <input 
          ref="inputRef"
          v-model="name" 
          @keyup.enter="handleConfirm"
          placeholder="Enter request name"
          class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-accent transition-all"
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Collection</label>
        <div class="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          <button 
            v-for="col in collectionsStore.collections" 
            :key="col.id"
            @click="collectionId = col.id"
            :class="['flex items-center gap-3 p-3 rounded-lg border transition-all text-left', 
                     collectionId === col.id ? 'bg-accent/10 border-accent text-accent' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600']"
          >
            <Folder class="w-4 h-4" />
            <span class="text-sm font-medium">{{ col.name }}</span>
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
        :disabled="!name.trim()"
        class="bg-accent hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-accent/20 uppercase tracking-widest"
      >
        Save
      </button>
    </template>
  </BaseModal>
</template>

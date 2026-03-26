<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useModalStore } from '../stores/modal'
import BaseModal from './BaseModal.vue'

const modalStore = useModalStore()
const name = ref(modalStore.options.data?.name || '')

const handleConfirm = () => {
  if (!name.value.trim()) return
  modalStore.confirm(name.value)
}

const inputRef = ref<HTMLInputElement | null>(null)
onMounted(() => {
  inputRef.value?.focus()
  inputRef.value?.select()
})
</script>

<template>
  <BaseModal :title="modalStore.options.title || 'Collection'">
    <div class="space-y-4">
      <div class="space-y-1.5">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Collection Name</label>
        <input 
          ref="inputRef"
          v-model="name" 
          @keyup.enter="handleConfirm"
          placeholder="Enter collection name"
          class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-accent transition-all"
        />
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
        Confirm
      </button>
    </template>
  </BaseModal>
</template>

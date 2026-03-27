<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToastStore } from '../stores/toast'
import { FileUp, Copy, Check, Type, RefreshCw, X, Wrench, FileCode, Binary, List, ArrowLeftRight } from 'lucide-vue-next'

const toastStore = useToastStore()
const activeToolTab = ref('Converter') // Default to 'Converter'
const hasCopied = ref(false)

// --- String Converter Logic ---
const converterInput = ref('')
const converterOutput = ref('')
const converterMode = ref('listToString') // 'listToString', 'stringToList'
const quoteType = ref('none') // 'none', 'single', 'double'

const runConverter = () => {
  if (!converterInput.value.trim()) {
    converterOutput.value = ''
    return
  }

  if (converterMode.value === 'listToString') {
    // List to String: Split by newline, trim, filter empty
    const items = converterInput.value.split('\n')
      .map(i => i.trim())
      .filter(i => i.length > 0)
    
    let quote = ''
    if (quoteType.value === 'single') quote = "'"
    if (quoteType.value === 'double') quote = '"'
    
    converterOutput.value = items.map(i => `${quote}${i}${quote}`).join(', ')
  } else {
    // String to List: Split by comma, remove quotes, trim
    const items = converterInput.value.split(',')
      .map(i => {
        let trimmed = i.trim()
        // Remove leading/trailing quotes if they match
        if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || 
            (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
          return trimmed.slice(1, -1)
        }
        return trimmed
      })
      .filter(i => i.length > 0)
    
    converterOutput.value = items.join('\n')
  }
}

const copyConverterResult = () => {
  if (converterOutput.value) {
    navigator.clipboard.writeText(converterOutput.value)
    hasCopied.value = true
    toastStore.addToast('Result copied', 'success')
    setTimeout(() => { hasCopied.value = false }, 2000)
  }
}

// --- File to Base64 Logic ---
const base64Result = ref('')
const fileName = ref('')

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    fileName.value = file.name
    const reader = new FileReader()
    reader.onload = (e) => {
      base64Result.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const copyBase64 = () => {
  if (base64Result.value) {
    navigator.clipboard.writeText(base64Result.value)
    hasCopied.value = true
    toastStore.addToast('Base64 string copied', 'success')
    setTimeout(() => { hasCopied.value = false }, 2000)
  }
}

// --- Encoding/Decoding Logic ---
const codecInput = ref('')
const codecOutput = ref('')
const codecType = ref('base64') // 'base64', 'url'
const codecMode = ref('encode') // 'encode', 'decode'

const runCodec = () => {
  try {
    if (codecType.value === 'base64') {
      if (codecMode.value === 'encode') {
        codecOutput.value = btoa(codecInput.value)
      } else {
        codecOutput.value = atob(codecInput.value)
      }
    } else if (codecType.value === 'url') {
      if (codecMode.value === 'encode') {
        codecOutput.value = encodeURIComponent(codecInput.value)
      } else {
        codecOutput.value = decodeURIComponent(codecInput.value)
      }
    }
  } catch (e) {
    codecOutput.value = 'Error: Invalid input for ' + codecMode.value
  }
}

const copyCodecResult = () => {
  if (codecOutput.value) {
    navigator.clipboard.writeText(codecOutput.value)
    hasCopied.value = true
    toastStore.addToast('Result copied to clipboard', 'success')
    setTimeout(() => { hasCopied.value = false }, 2000)
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-sidebar border-l border-slate-700 w-80 shrink-0 shadow-2xl">
    <!-- Header -->
    <div class="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
      <div class="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
        <Wrench class="w-3.5 h-3.5" />
        Developer Tools
      </div>
      <slot name="close-button"></slot>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-slate-700 bg-slate-900/30">
      <button @click="activeToolTab = 'Converter'"
        :class="['flex-1 py-3 text-[10px] font-bold uppercase tracking-tighter transition-all relative', 
                 activeToolTab === 'Converter' ? 'text-accent' : 'text-slate-500 hover:text-slate-300']">
        Converter
        <div v-if="activeToolTab === 'Converter'" class="absolute bottom-0 left-0 w-full h-0.5 bg-accent"></div>
      </button>
      <button @click="activeToolTab = 'Base64'"
        :class="['flex-1 py-3 text-[10px] font-bold uppercase tracking-tighter transition-all relative', 
                 activeToolTab === 'Base64' ? 'text-accent' : 'text-slate-500 hover:text-slate-300']">
        File to B64
        <div v-if="activeToolTab === 'Base64'" class="absolute bottom-0 left-0 w-full h-0.5 bg-accent"></div>
      </button>
      <button @click="activeToolTab = 'Codec'"
        :class="['flex-1 py-3 text-[10px] font-bold uppercase tracking-tighter transition-all relative', 
                 activeToolTab === 'Codec' ? 'text-accent' : 'text-slate-500 hover:text-slate-300']">
        En/Decoder
        <div v-if="activeToolTab === 'Codec'" class="absolute bottom-0 left-0 w-full h-0.5 bg-accent"></div>
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Tab 0: String Converter -->
      <div v-if="activeToolTab === 'Converter'" class="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mode</label>
            <button @click="converterMode = converterMode === 'listToString' ? 'stringToList' : 'listToString'; runConverter()" 
                    class="flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold text-accent transition-colors">
              <ArrowLeftRight class="w-3 h-3" />
              SWAP MODE
            </button>
          </div>
          
          <div class="p-3 bg-slate-900/50 border border-slate-700 rounded-lg flex items-center justify-center gap-4">
             <div :class="['text-[11px] font-bold transition-colors', converterMode === 'listToString' ? 'text-accent' : 'text-slate-600']">LIST</div>
             <div class="w-4 h-[1px] bg-slate-700"></div>
             <div :class="['text-[11px] font-bold transition-colors', converterMode === 'stringToList' ? 'text-accent' : 'text-slate-600']">STRING</div>
          </div>
        </div>

        <div v-if="converterMode === 'listToString'" class="space-y-2">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quote Type</label>
          <div class="flex gap-1">
            <button v-for="q in ['none', 'single', 'double']" :key="q"
                    @click="quoteType = q; runConverter()"
                    :class="['flex-1 py-1.5 rounded border text-[10px] font-bold uppercase transition-all', 
                             quoteType === q ? 'bg-accent/10 border-accent text-accent' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700']">
              {{ q === 'none' ? 'None' : q === 'single' ? "Single '" : 'Double "' }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Input</label>
          <textarea v-model="converterInput" @input="runConverter"
                    :placeholder="converterMode === 'listToString' ? 'Item 1\nItem 2\nItem 3' : 'Item 1, Item 2, Item 3'"
                    class="w-full h-32 bg-slate-900 border border-slate-700 rounded p-3 text-[11px] font-mono text-slate-200 outline-none resize-none focus:border-accent transition-all"></textarea>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Output</label>
            <button @click="copyConverterResult" class="text-accent hover:text-blue-300 flex items-center gap-1 text-[10px] font-bold">
              <Check v-if="hasCopied" class="w-3 h-3 text-green-500" />
              <Copy v-else class="w-3 h-3" />
              COPY
            </button>
          </div>
          <div class="w-full min-h-[80px] bg-slate-800 border border-slate-700 rounded p-3 text-[11px] font-mono text-blue-300 break-all whitespace-pre-wrap">
            {{ converterOutput || 'Result will appear here...' }}
          </div>
        </div>
      </div>

      <!-- Tab 1: File to Base64 -->
      <div v-if="activeToolTab === 'Base64'" class="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
        <div class="space-y-2">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Input File</label>
          <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800/50 hover:border-accent transition-all group">
            <div class="flex flex-col items-center justify-center pt-5 pb-6">
              <FileUp class="w-8 h-8 text-slate-500 group-hover:text-accent mb-2" />
              <p class="text-[11px] text-slate-400 group-hover:text-slate-200 truncate px-4">
                {{ fileName || 'Select a file' }}
              </p>
            </div>
            <input type="file" class="hidden" @change="onFileChange" />
          </label>
        </div>

        <div v-if="base64Result" class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base64 String</label>
            <button @click="copyBase64" class="text-accent hover:text-blue-300 flex items-center gap-1 text-[10px] font-bold">
              <Check v-if="hasCopied" class="w-3 h-3 text-green-500" />
              <Copy v-else class="w-3 h-3" />
              COPY
            </button>
          </div>
          <textarea readonly v-model="base64Result" 
                    class="w-full h-48 bg-slate-900 border border-slate-700 rounded p-3 text-[10px] font-mono text-blue-300 outline-none resize-none"></textarea>
        </div>
      </div>

      <!-- Tab 2: En/Decoder -->
      <div v-if="activeToolTab === 'Codec'" class="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase">Type</label>
            <select v-model="codecType" @change="runCodec"
                    class="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-accent font-bold outline-none appearance-none cursor-pointer">
              <option value="base64">Base64</option>
              <option value="url">URL Encoding</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase">Mode</label>
            <select v-model="codecMode" @change="runCodec"
                    class="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 font-bold outline-none appearance-none cursor-pointer">
              <option value="encode">Encode</option>
              <option value="decode">Decode</option>
            </select>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Input Text</label>
          <textarea v-model="codecInput" @input="runCodec"
                    class="w-full h-32 bg-slate-900 border border-slate-700 rounded p-3 text-[11px] font-mono text-slate-200 outline-none resize-none focus:border-accent transition-all"
                    placeholder="Type or paste here..."></textarea>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Output</label>
            <button @click="copyCodecResult" class="text-accent hover:text-blue-300 flex items-center gap-1 text-[10px] font-bold">
              <Check v-if="hasCopied" class="w-3 h-3 text-green-500" />
              <Copy v-else class="w-3 h-3" />
              COPY
            </button>
          </div>
          <div class="w-full min-h-[100px] bg-slate-800 border border-slate-700 rounded p-3 text-[11px] font-mono text-blue-300 break-all whitespace-pre-wrap">
            {{ codecOutput || 'Result will appear here...' }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer Footer (Optional) -->
    <div class="p-4 text-[9px] text-slate-600 text-center italic border-t border-slate-800">
      Quick utilities for developers.
    </div>
  </div>
</template>

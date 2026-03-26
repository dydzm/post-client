<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTabsStore } from '../stores/tabs'
import * as monaco from 'monaco-editor'
import { FileJson, List, Eye, Clock, Hash, Copy, Check, X, Play } from 'lucide-vue-next'

const tabsStore = useTabsStore()
const activeTab = computed(() => tabsStore.activeTab)
const response = computed(() => activeTab.value?.response)
const activeResponseTab = ref('Body')
const hasCopied = ref(false)

const contentType = computed(() => {
  const ct = response.value?.headers?.['content-type'] || response.value?.headers?.['Content-Type'] || ''
  return ct.toLowerCase()
})

const isJson = computed(() => contentType.value.includes('json'))
const isHtml = computed(() => contentType.value.includes('html'))
const isImage = computed(() => contentType.value.startsWith('image/'))

// Auto-switch tab based on content type when response arrives
watch(response, (newRes) => {
  if (newRes) {
    if (isImage.value || isHtml.value) {
      activeResponseTab.value = 'Preview'
    } else {
      activeResponseTab.value = 'Body'
    }
  }
})

// Monaco Editor for Body
let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null
const editorContainer = ref<HTMLElement | null>(null)

const initEditor = () => {
  if (editorContainer.value) {
    editorInstance = monaco.editor.create(editorContainer.value, {
      value: typeof response.value?.body === 'string' ? response.value.body : JSON.stringify(response.value?.body, null, 2) || '',
      language: 'json',
      theme: 'vs-dark',
      readOnly: true,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 10, bottom: 10 }
    })
    updateEditorLanguage()
  }
}

const updateEditorLanguage = () => {
  if (!editorInstance || !editorInstance.getModel()) return
  
  if (isJson.value) {
    monaco.editor.setModelLanguage(editorInstance.getModel()!, 'json')
  } else if (isHtml.value) {
    monaco.editor.setModelLanguage(editorInstance.getModel()!, 'html')
  } else if (contentType.value.includes('xml')) {
    monaco.editor.setModelLanguage(editorInstance.getModel()!, 'xml')
  } else {
    monaco.editor.setModelLanguage(editorInstance.getModel()!, 'plaintext')
  }
}

watch([() => response.value?.body, activeResponseTab], ([newBody, newTab]) => {
  if (editorInstance) {
    if (newTab === 'Body') {
      const content = typeof newBody === 'string' ? newBody : JSON.stringify(newBody, null, 2)
      editorInstance.setValue(content || '')
      updateEditorLanguage()
      // Force layout update when switching to Body tab
      setTimeout(() => editorInstance?.layout(), 10)
    }
  }
}, { immediate: true })

onMounted(() => {
  initEditor()
})

onUnmounted(() => {
  editorInstance?.dispose()
})

const copyToClipboard = () => {
  if (response.value?.body) {
    navigator.clipboard.writeText(response.value.body)
    hasCopied.value = true
    setTimeout(() => { hasCopied.value = false }, 2000)
  }
}

const previewUrl = computed(() => {
  if (!response.value?.body) return ''
  
  if (isImage.value) {
    // If it's a URL or base64 already
    if (response.value.body.startsWith('http') || response.value.body.startsWith('data:')) {
      return response.value.body
    }
    // Otherwise treat as raw binary data (might need base64 encoding if not already)
    return `data:${contentType.value};base64,${response.value.body}`
  }
  
  if (isHtml.value) {
    const blob = new Blob([response.value.body], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }
  
  return ''
})

</script>

<template>
  <div class="h-full flex flex-col bg-slate-950 overflow-hidden">
    <!-- Response Info Bar -->
    <div class="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
      <div class="flex gap-4">
        <button v-for="tab in ['Body', 'Headers', 'Preview']" :key="tab"
          @click="activeResponseTab = tab"
          :class="['flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-all px-0 py-1 relative', 
                   activeResponseTab === tab ? 'text-accent' : 'text-slate-500 hover:text-slate-300']">
          {{ tab }}
          <div v-if="activeResponseTab === tab" class="absolute bottom-[-9px] left-0 w-full h-0.5 bg-accent"></div>
        </button>
      </div>

      <div v-if="response" class="flex items-center gap-4 text-[10px]">
        <div class="flex items-center gap-2">
          <span :class="['font-bold', response.status >= 200 && response.status < 300 ? 'text-green-500' : 'text-red-500']">
            {{ response.status }} {{ response.status >= 200 && response.status < 300 ? 'OK' : 'ERROR' }}
          </span>
          <span class="text-slate-500">•</span>
          <span class="font-bold text-slate-500 uppercase">{{ response.time_ms }}ms</span>
        </div>
        <button @click="copyToClipboard" class="text-slate-500 hover:text-white transition-colors">
          <Check v-if="hasCopied" class="w-3.5 h-3.5 text-green-500" />
          <Copy v-else class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-hidden relative">
      <!-- Loading State -->
      <div v-if="activeTab?.isLoading" class="absolute inset-0 z-10 bg-slate-950/80 flex flex-col items-center justify-center gap-4">
        <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Fetching Response...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="activeTab?.error" class="h-full p-8 flex flex-col items-center justify-center text-center">
        <div class="bg-red-500/10 p-4 rounded-full mb-4">
          <X class="w-8 h-8 text-red-500" />
        </div>
        <h3 class="text-red-500 font-bold mb-2">Request Failed</h3>
        <p class="text-slate-500 text-xs max-w-md font-mono">{{ activeTab.error }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!response" class="h-full flex flex-col items-center justify-center text-center opacity-30">
        <div class="border-2 border-dashed border-slate-800 p-12 rounded-2xl">
           <Play class="w-12 h-12 text-slate-700 mx-auto mb-4" />
           <p class="text-xs font-bold uppercase tracking-widest text-slate-600">Send a request to see the response</p>
        </div>
      </div>

      <!-- Content Views -->
      <div v-else class="h-full">
        <!-- Body View -->
        <div v-show="activeResponseTab === 'Body'" class="h-full flex flex-col">
          <div ref="editorContainer" class="flex-1"></div>
        </div>

        <!-- Headers View -->
        <div v-if="activeResponseTab === 'Headers'" class="h-full overflow-y-auto p-4">
          <table class="w-full text-xs text-left font-mono">
            <thead>
              <tr class="text-slate-500 border-b border-slate-800">
                <th class="pb-2 font-normal w-1/3">Header</th>
                <th class="pb-2 font-normal">Value</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-900">
              <tr v-for="(value, key) in response.headers" :key="key" class="group hover:bg-slate-900/50 transition-colors">
                <td class="py-2.5 text-slate-500">{{ key }}</td>
                <td class="py-2.5 text-blue-300 break-all">{{ value }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Preview View -->
        <div v-if="activeResponseTab === 'Preview'" class="h-full p-4">
          <div v-if="isImage" class="h-full flex items-center justify-center p-4 border border-slate-800 rounded-lg bg-slate-900">
             <img :src="previewUrl" class="max-w-full max-h-full object-contain" />
          </div>
          <div v-else-if="isHtml" class="h-full border border-slate-800 rounded-lg bg-white overflow-hidden">
             <iframe :src="previewUrl" class="w-full h-full border-none"></iframe>
          </div>
          <div v-else-if="isJson" class="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden p-4">
             <div class="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-widest">Formatted JSON Preview</div>
             <pre class="flex-1 text-xs text-blue-300 font-mono overflow-auto">{{ JSON.stringify(JSON.parse(response.body), null, 2) }}</pre>
          </div>
          <div v-else class="h-full p-4 border border-slate-800 rounded-lg bg-slate-900 overflow-auto">
             <pre class="text-xs text-slate-300 font-mono">{{ response.body }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monaco-editor {
  padding-top: 8px;
}
</style>

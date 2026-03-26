<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useTabsStore } from '../stores/tabs'
import { useCollectionsStore } from '../stores/collections'
import { useToastStore } from '../stores/toast'
import axios from 'axios'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import { Plus, Trash2, Play, Settings2, Code, FileJson, Save, FileUp, File, ShieldCheck, User, Lock, Key, ChevronDown } from 'lucide-vue-next'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker()
    return new editorWorker()
  }
}

const COMMON_HEADERS = [
  'Accept', 'Accept-Charset', 'Accept-Encoding', 'Accept-Language', 'Accept-Ranges',
  'Authorization', 'Cache-Control', 'Connection', 'Content-Encoding', 'Content-Length',
  'Content-Type', 'Cookie', 'Date', 'Expect', 'Forwarded', 'From', 'Host',
  'If-Match', 'If-Modified-Since', 'If-None-Match', 'If-Range', 'If-Unmodified-Since',
  'Max-Forwards', 'Origin', 'Pragma', 'Proxy-Authorization', 'Range', 'Referer', 'TE',
  'User-Agent', 'Upgrade', 'Via', 'Warning'
]

const tabsStore = useTabsStore()
const collectionsStore = useCollectionsStore()
const toastStore = useToastStore()
const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const activeTabSection = ref('Headers')

const activeTab = computed(() => tabsStore.activeTab)

const localUrl = ref(activeTab.value?.request.url || '')
const localMethod = ref(activeTab.value?.request.method || 'GET')
const localName = ref(activeTab.value?.name || 'New Request')

watch(() => tabsStore.activeTabId, () => {
  if (activeTab.value) {
    localUrl.value = activeTab.value.request.url
    localMethod.value = activeTab.value.request.method
    localName.value = activeTab.value.name
    
    // Sync headers from store to localRows
    syncHeadersToRows()
  }
})

watch([localUrl, localMethod], () => {
  tabsStore.updateActiveRequest({ url: localUrl.value, method: localMethod.value })
})

watch(localName, (newVal) => {
  if (activeTab.value) {
    activeTab.value.name = newVal
  }
})

// Header management
const headerRows = ref<{ key: string; value: string; enabled: boolean }[]>([])

const syncHeadersToRows = () => {
  const headers = activeTab.value?.request.headers || {}
  headerRows.value = Object.entries(headers).map(([key, value]) => ({
    key,
    value,
    enabled: true
  }))
  if (headerRows.value.length === 0) {
    addHeader()
  }
}

const addHeader = () => headerRows.value.push({ key: '', value: '', enabled: true })
const removeHeader = (index: number) => {
  headerRows.value.splice(index, 1)
  if (headerRows.value.length === 0) addHeader()
}

watch(headerRows, (newRows) => {
  const headers: Record<string, string> = {}
  newRows.forEach(row => {
    if (row.enabled && row.key) headers[row.key] = row.value
  })
  tabsStore.updateActiveRequest({ headers })
}, { deep: true })

// Monaco Editor setup
let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null
const editorContainer = ref<HTMLElement | null>(null)

const initEditor = () => {
  if (editorContainer.value) {
    editorInstance = monaco.editor.create(editorContainer.value, {
      value: activeTab.value?.request.body || '',
      language: 'json',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 10, bottom: 10 }
    })
    editorInstance.onDidChangeModelContent(() => {
      tabsStore.updateActiveRequest({ body: editorInstance?.getValue() || '' })
    })
  }
}

onMounted(() => {
  syncHeadersToRows()
  initEditor()
})
onUnmounted(() => editorInstance?.dispose())

watch(() => tabsStore.activeTabId, () => {
  if (editorInstance && activeTab.value) {
    editorInstance.setValue(activeTab.value.request.body)
  }
})

// File Upload Logic
const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && activeTab.value) {
    Array.from(target.files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const fileData = {
          key: 'file',
          name: file.name,
          content: content,
          type: file.type
        }
        activeTab.value!.request.files.push(fileData)
      }
      reader.readAsDataURL(file)
    })
  }
}

const removeFile = (index: number) => {
  activeTab.value?.request.files.splice(index, 1)
}

const sendRequest = async () => {
  if (!activeTab.value) return
  
  // Clone request to avoid mutating original for Auth headers
  const finalRequest = JSON.parse(JSON.stringify(activeTab.value.request))
  
  // Apply Auth headers
  if (finalRequest.auth.type === 'bearer' && finalRequest.auth.token) {
    finalRequest.headers['Authorization'] = `Bearer ${finalRequest.auth.token}`
  } else if (finalRequest.auth.type === 'basic' && finalRequest.auth.username) {
    const creds = btoa(`${finalRequest.auth.username}:${finalRequest.auth.password || ''}`)
    finalRequest.headers['Authorization'] = `Basic ${creds}`
  }

  activeTab.value.isLoading = true
  activeTab.value.error = null
  activeTab.value.response = null
  
  try {
    const res = await axios.post('http://localhost:8000/execute', finalRequest)
    activeTab.value.response = res.data
    toastStore.addToast(`Request sent: ${res.data.status} OK`, 'success')
  } catch (err: any) {
    activeTab.value.error = err.response?.data?.detail || err.message
    toastStore.addToast('Request failed', 'error')
  } finally {
    activeTab.value.isLoading = false
  }
}

const formatJson = () => {
  try {
    const currentVal = editorInstance?.getValue() || ''
    const formatted = JSON.stringify(JSON.parse(currentVal), null, 2)
    editorInstance?.setValue(formatted)
  } catch (e) { alert('Invalid JSON') }
}

const saveToCollection = () => {
  if (!activeTab.value) return
  
  // Find collection to save to
  const collectionId = activeTab.value.collectionId || 'default'
  const itemId = collectionsStore.saveRequest(localName.value, activeTab.value.request, collectionId)
  
  // Link tab to this item
  activeTab.value.itemId = itemId
  activeTab.value.collectionId = collectionId
  activeTab.value.name = localName.value
  
  toastStore.addToast('Request saved to collection', 'success')
}
</script>

<template>
  <div class="flex flex-col h-full bg-slate-950">
    <!-- Request Name & URL Bar -->
    <div class="p-4 flex flex-col gap-3 border-b border-slate-700 bg-slate-900/30 shrink-0">
      <!-- Name input -->
      <div class="flex items-center gap-2 px-1">
         <input v-model="localName" class="bg-transparent border-none text-[11px] font-bold text-slate-500 hover:text-slate-300 focus:text-blue-400 focus:ring-0 p-0 outline-none w-full uppercase tracking-tighter transition-colors" placeholder="Untitled Request" />
      </div>

      <div class="flex gap-2">
        <div class="relative w-28 group">
          <select v-model="localMethod" :class="['w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-accent outline-none appearance-none cursor-pointer transition-colors', 
            localMethod === 'GET' ? 'text-green-400' : 
            localMethod === 'POST' ? 'text-blue-400' : 
            localMethod === 'PUT' ? 'text-yellow-400' : 
            localMethod === 'PATCH' ? 'text-orange-400' : 
            localMethod === 'DELETE' ? 'text-red-400' : 'text-slate-300']">
            <option value="GET" class="bg-slate-900 text-green-400 font-bold">GET</option>
            <option value="POST" class="bg-slate-900 text-blue-400 font-bold">POST</option>
            <option value="PUT" class="bg-slate-900 text-yellow-400 font-bold">PUT</option>
            <option value="PATCH" class="bg-slate-900 text-orange-400 font-bold">PATCH</option>
            <option value="DELETE" class="bg-slate-900 text-red-400 font-bold">DELETE</option>
          </select>
          <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-500 group-hover:text-slate-300 transition-colors">
            <ChevronDown class="w-3.5 h-3.5" />
          </div>
        </div>
        <input type="text" v-model="localUrl" @keyup.enter="sendRequest" 
               class="flex-1 bg-slate-800 text-slate-100 border border-slate-700 rounded px-3 py-1.5 text-xs mono focus:ring-1 focus:ring-accent outline-none transition-all" 
               placeholder="https://api.example.com/v1/resource" />
        <div class="flex gap-1">
          <button @click="saveToCollection" class="p-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-slate-400 transition-colors" title="Save">
            <Save class="w-4 h-4" />
          </button>
          <button @click="sendRequest" :disabled="activeTab?.isLoading" 
                  class="bg-accent hover:bg-blue-500 disabled:bg-slate-800 text-white px-4 py-1.5 rounded text-xs font-bold transition-all">
            {{ activeTab?.isLoading ? 'SENDING...' : 'SEND' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Request Builder Tabs -->
    <div class="flex border-b border-slate-700 bg-slate-800/50 shrink-0">
      <button v-for="section in ['Headers', 'Body', 'Auth']" :key="section"
        @click="activeTabSection = section"
        :class="['px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all relative', 
                 activeTabSection === section ? 'text-accent' : 'text-slate-500 hover:text-slate-300']">
        {{ section }}
        <div v-if="activeTabSection === section" class="absolute bottom-0 left-0 w-full h-0.5 bg-accent"></div>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-hidden flex flex-col bg-slate-950">
      <!-- Headers Editor -->
      <div v-if="activeTabSection === 'Headers'" class="flex-1 overflow-y-auto p-4 space-y-2">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xs font-bold text-slate-500 uppercase">Request Headers</h3>
          <button @click="addHeader" class="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs font-bold">
            <Plus class="w-3 h-3" /> ADD HEADER
          </button>
        </div>
        
        <datalist id="common-headers">
           <option v-for="h in COMMON_HEADERS" :key="h" :value="h" />
        </datalist>

        <div v-for="(row, index) in headerRows" :key="index" class="flex gap-2 items-center group">
          <input type="checkbox" v-model="row.enabled" class="accent-blue-500" />
          <input type="text" v-model="row.key" list="common-headers" placeholder="Key" 
                 class="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 focus:border-blue-500 outline-none" />
          <input type="text" v-model="row.value" placeholder="Value" 
                 class="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 focus:border-blue-500 outline-none" />
          <button @click="removeHeader(index)" class="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Body Editor -->
      <div v-show="activeTabSection === 'Body'" class="flex-1 flex flex-col relative">
        <div class="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
          <div class="flex gap-4">
             <button v-for="type in ['json', 'multipart', 'raw']" :key="type"
               @click="activeTab && (activeTab.request.bodyType = type as any)"
               :class="['text-[10px] font-bold uppercase transition-all', 
                        activeTab?.request.bodyType === type ? 'text-blue-400 border-b border-blue-400' : 'text-slate-600 hover:text-slate-400']">
               {{ type }}
             </button>
          </div>
          <button v-if="activeTab?.request.bodyType === 'json'" @click="formatJson" class="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1">
            <Code class="w-3 h-3" /> PRETTIFY
          </button>
        </div>
        
        <div v-show="activeTab?.request.bodyType !== 'multipart'" ref="editorContainer" class="flex-1 min-h-0"></div>
        
        <div v-if="activeTab?.request.bodyType === 'multipart'" class="flex-1 overflow-y-auto p-4 space-y-4">
          <div class="space-y-2">
            <h4 class="text-[10px] font-bold text-slate-500 uppercase">Text Data (JSON format)</h4>
            <div class="h-24 border border-slate-800 rounded overflow-hidden">
               <div ref="editorContainer" class="h-full"></div>
            </div>
          </div>
          
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <h4 class="text-[10px] font-bold text-slate-500 uppercase">Files</h4>
              <label class="cursor-pointer text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[10px] font-bold">
                <FileUp class="w-3 h-3" /> CHOOSE FILES
                <input type="file" multiple @change="onFileChange" class="hidden" />
              </label>
            </div>
            
            <div class="grid grid-cols-1 gap-2">
              <div v-for="(file, index) in activeTab?.request.files" :key="index" 
                   class="flex items-center gap-3 p-2 bg-slate-900 border border-slate-800 rounded group">
                <File class="w-4 h-4 text-blue-500" />
                <div class="flex-1 min-w-0">
                  <input v-model="file.key" class="bg-transparent border-none text-[10px] font-bold text-slate-300 w-16 focus:ring-0 p-0" placeholder="Key" />
                  <div class="text-[10px] text-slate-500 truncate">{{ file.name }}</div>
                </div>
                <button @click="removeFile(index)" class="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Auth Section -->
      <div v-if="activeTabSection === 'Auth'" class="flex-1 overflow-y-auto p-6 space-y-6">
        <div class="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
          <div class="bg-blue-500/10 p-3 rounded-full">
            <ShieldCheck class="w-6 h-6 text-blue-500" />
          </div>
          <div class="flex-1">
            <h3 class="text-xs font-bold text-slate-200 uppercase tracking-widest mb-1">Authorization</h3>
            <p class="text-[10px] text-slate-500">Configure authentication for this request.</p>
          </div>
          <select v-if="activeTab" v-model="activeTab.request.auth.type" 
                  class="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-blue-400 font-bold outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer pr-8">
            <option value="none">No Auth</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
          </select>
        </div>

        <!-- Bearer Token UI -->
        <div v-if="activeTab?.request.auth.type === 'bearer'" class="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Key class="w-3 h-3" /> Token
            </label>
            <textarea v-model="activeTab.request.auth.token" 
                      class="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-blue-300 h-32 outline-none focus:border-blue-500 transition-all" 
                      placeholder="Enter Bearer Token here..."></textarea>
          </div>
        </div>

        <!-- Basic Auth UI -->
        <div v-if="activeTab?.request.auth.type === 'basic'" class="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <User class="w-3 h-3" /> Username
            </label>
            <input type="text" v-model="activeTab.request.auth.username" 
                   class="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 transition-all" />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Lock class="w-3 h-3" /> Password
            </label>
            <input type="password" v-model="activeTab.request.auth.password" 
                   class="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 transition-all" />
          </div>
        </div>

        <div v-if="activeTab?.request.auth.type === 'none'" class="py-12 text-center">
           <p class="text-[10px] text-slate-600 italic">This request does not use any authentication.</p>
        </div>
      </div>
    </div>
  </div>
</template>

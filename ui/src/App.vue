<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { useTabsStore } from './stores/tabs'
import { useCollectionsStore } from './stores/collections'
import { useModalStore } from './stores/modal'
import { useSortable } from '@vueuse/integrations/useSortable'
import draggable from 'vuedraggable'
import GuiBuilder from './components/GuiBuilder.vue'
import CliTerminal from './components/CliTerminal.vue'
import ResponseViewer from './components/ResponseViewer.vue'
import ToolsSidebar from './components/ToolsSidebar.vue'
import Toast from './components/Toast.vue'

// Modal Components
import SaveRequestModal from './components/SaveRequestModal.vue'
import CollectionModal from './components/CollectionModal.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import ImportTypeModal from './components/ImportTypeModal.vue'
import ApiImportModal from './components/ApiImportModal.vue'
import ImportUrlModal from './components/ImportUrlModal.vue'
import CollectionConfigModal from './components/CollectionConfigModal.vue'

import { Menu, Plus, X, FolderTree, Download, Upload, GripVertical, ArrowLeftRight, LayoutGrid, Trash2, Edit3, ChevronRight, ChevronDown, Wrench, Copy, Settings } from 'lucide-vue-next'
import { parseOpenApi, convertToApiRequests } from './lib/openapi-parser'
import axios from 'axios'

const tabsStore = useTabsStore()
const collectionsStore = useCollectionsStore()
const modalStore = useModalStore()

const isSidebarOpen = ref(window.innerWidth > 1024)
const isToolsOpen = ref(true) // Default open
const isMobile = ref(window.innerWidth < 768)
const expandedCollections = ref<Record<string, boolean>>({ default: true })

// Tab Context Menu State
const showContextMenu = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
const contextMenuTabId = ref<string | null>(null)

const openContextMenu = (e: MouseEvent, tabId: string) => {
  e.preventDefault()
  contextMenuPos.value = { x: e.clientX, y: e.clientY }
  contextMenuTabId.value = tabId
  showContextMenu.value = true
  
  const closeMenu = () => {
    showContextMenu.value = false
    window.removeEventListener('click', closeMenu)
  }
  setTimeout(() => window.addEventListener('click', closeMenu), 10)
}

const handleContextMenuAction = (action: string) => {
  if (!contextMenuTabId.value) return
  
  switch (action) {
    case 'close': tabsStore.removeTab(contextMenuTabId.value); break
    case 'closeAll': tabsStore.closeAllTabs(); break
    case 'closeOthers': tabsStore.closeOtherTabs(contextMenuTabId.value); break
    case 'closeLeft': tabsStore.closeTabsToLeft(contextMenuTabId.value); break
    case 'closeRight': tabsStore.closeTabsToRight(contextMenuTabId.value); break
  }
  showContextMenu.value = false
}

// Panel configuration to allow reordering
const verticalPanels = ref(['GuiBuilder', 'TerminalResponse'])

const swapVerticalPanels = () => {
  verticalPanels.value = [...verticalPanels.value.reverse()]
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const toggleCollection = (id: string) => {
  expandedCollections.value[id] = !expandedCollections.value[id]
}

const addNewCollection = async () => {
  const name = await modalStore.open('collection', { title: 'New Collection' }) as string
  if (name) {
    collectionsStore.addCollection(name)
  }
}

const renameCollection = async (id: string, currentName: string) => {
  const newName = await modalStore.open('collection', { title: 'Rename Collection', data: { name: currentName } }) as string
  if (newName) {
    collectionsStore.renameCollection(id, newName)
  }
}

const openCollectionConfig = (id: string) => {
  modalStore.open('collection-config', { data: { collectionId: id } })
}

const deleteCollection = async (id: string, name: string) => {
  const confirmed = await modalStore.open('confirm', {
    title: 'Delete Collection',
    message: `Are you sure you want to delete "${name}"? All requests inside will be lost.`,
    confirmLabel: 'Delete'
  })
  if (confirmed) {
    collectionsStore.deleteCollection(id)
  }
}

const deleteRequest = async (id: string, name: string) => {
  const confirmed = await modalStore.open('confirm', {
    title: 'Delete Request',
    message: `Delete "${name}"?`,
    confirmLabel: 'Delete'
  })
  if (confirmed) {
    collectionsStore.removeRequest(id)
  }
}

const duplicateRequest = (id: string) => {
  collectionsStore.duplicateRequest(id)
}

const exportAll = () => {
  collectionsStore.exportCollections()
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
  if (window.innerWidth < 1024) {
    isSidebarOpen.value = false
  } else {
    isSidebarOpen.value = true
  }
}

const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingImportType = ref<'native' | 'openapi' | null>(null)

const handleImportClick = async () => {
  try {
    const type = await modalStore.open('import-type') as 'native' | 'openapi' | 'openapi-url'
    if (!type) return

    if (type === 'openapi-url') {
      await processUrlImport()
    } else {
      // 파일 선택이 필요한 경우
      pendingImportType.value = type
      fileInputRef.value?.click()
    }
  } catch (err) {
    // Cancelled
  }
}

const handleFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !pendingImportType.value) return

  const content = await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.readAsText(file)
  })

  await processImportContent(pendingImportType.value, content)
  
  // Reset
  if (fileInputRef.value) fileInputRef.value.value = ''
  pendingImportType.value = null
}

const processUrlImport = async () => {
  try {
    const url = await modalStore.open('openapi-url') as string
    if (!url) return
    
    const res = await axios.post('http://localhost:8000/execute', {
      method: 'GET',
      url: url,
      headers: {},
      query: {},
      body: '',
      bodyType: 'json'
    })
    
    if (res.data && res.data.body) {
      await processImportContent('openapi', res.data.body)
    }
  } catch (err: any) {
    if (err) { // Not a cancellation
      modalStore.open('confirm', { title: 'Fetch Failed', message: `URL에서 데이터를 가져오지 못했습니다: ${err.message}`, confirmLabel: 'OK' })
    }
  }
}

const processImportContent = async (type: 'native' | 'openapi', content: string) => {
  if (type === 'native') {
    try {
      const imported = JSON.parse(content)
      if (Array.isArray(imported)) {
        imported.forEach(c => {
          const newColId = collectionsStore.addCollection(c.name, c.variables || {})
          if (c.items && Array.isArray(c.items)) {
            c.items.forEach((item: any) => {
              collectionsStore.saveRequest(item.name, item.request, newColId)
            })
          }
        })
      }
    } catch (err) {
      modalStore.open('confirm', { title: 'Import Failed', message: '올바른 컬렉션 파일이 아닙니다.', confirmLabel: 'OK' })
    }
  } else {
    const metadata = parseOpenApi(content)
    if (metadata) {
      const result = await modalStore.open('import-openapi', { data: { metadata } }) as { server: string }
      if (result) {
        const newColId = collectionsStore.addCollection(metadata.title, { baseUrl: result.server })
        const requests = convertToApiRequests(metadata.rawContent, result.server)
        requests.forEach(req => {
          collectionsStore.saveRequest(req.name, req.request, newColId)
        })
        expandedCollections.value[newColId] = true
      }
    } else {
      modalStore.open('confirm', { title: 'Import Failed', message: 'OpenAPI 형식을 분석할 수 없습니다.', confirmLabel: 'OK' })
    }
  }
}

const openSavedRequest = (item: any) => {
  tabsStore.addTab(item.name, item.request, item.id, item.collectionId)
  if (isMobile.value) isSidebarOpen.value = false
}

// Sidebar Drag and Drop setup
const sidebarList = ref<HTMLElement | null>(null)
onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (sidebarList.value) {
    useSortable(sidebarList.value, collectionsStore.collections, {
      animation: 150,
      handle: '.drag-handle',
      onEnd: () => {
        // Persist order
        localStorage.setItem('post-client-collection-groups', JSON.stringify(collectionsStore.collections))
      }
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const getCollectionItems = (id: string) => {
  return collectionsStore.savedItems.filter(i => i.collectionId === id)
}

watch(() => collectionsStore.savedItems, () => {
  // Re-sync items to each collection when items change
}, { deep: true, immediate: true })
</script>

<template>
  <div class="h-screen w-screen bg-dark text-slate-200 flex flex-col overflow-hidden font-sans">
    <!-- Header / Navbar -->
    <header class="h-12 border-b border-slate-700 flex items-center px-4 bg-sidebar justify-between z-20">
      <div class="flex items-center gap-4">
        <button @click="toggleSidebar" class="p-1 hover:bg-slate-700 rounded transition-colors lg:hidden">
          <Menu class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-accent rounded-lg flex items-center justify-center">
            <LayoutGrid class="w-4 h-4 text-white" />
          </div>
          <h1 class="text-[10px] font-bold text-blue-500 hidden md:block tracking-widest uppercase">Post-Client</h1>
        </div>
      </div>
      
      <!-- Multi-tabs with Draggable & Scroll -->
      <div class="flex-1 flex h-full overflow-x-auto no-scrollbar relative min-w-0">
        <draggable 
          v-model="tabsStore.tabs" 
          item-key="id"
          class="flex h-full"
          ghost-class="opacity-50"
          @start="showContextMenu = false"
        >
          <template #item="{ element: tab }">
            <div
              @click="tabsStore.activeTabId = tab.id"
              @contextmenu="openContextMenu($event, tab.id)"
              :class="['group flex items-center px-4 h-full min-w-[140px] max-w-[200px] text-[11px] cursor-pointer border-r border-slate-700 transition-all shrink-0', 
                      tabsStore.activeTabId === tab.id ? 'bg-dark text-blue-400 border-t-2 border-t-accent' : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-slate-300']"
            >
              <span :class="['text-[9px] font-bold w-9 shrink-0', 
                tab.request.method === 'GET' ? 'text-green-500' : 
                tab.request.method === 'POST' ? 'text-blue-500' : 'text-yellow-500']">{{ tab.request.method }}</span>
              <span class="truncate flex-1">{{ tab.name || 'New Request' }}</span>
              <button @click.stop="tabsStore.removeTab(tab.id)" class="ml-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity">
                <X class="w-3 h-3" />
              </button>
            </div>
          </template>
        </draggable>
        
        <button @click="tabsStore.addTab()" class="px-4 h-full flex items-center text-slate-500 hover:text-blue-400 transition-colors sticky right-0 bg-slate-900 border-l border-slate-700">
          <Plus class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-3">
        <button @click="swapVerticalPanels" class="p-2 hover:bg-slate-700 rounded transition-colors text-slate-400" title="Swap Panels">
          <ArrowLeftRight class="w-4 h-4" />
        </button>
        <button @click="isToolsOpen = !isToolsOpen" :class="['p-2 rounded transition-colors', isToolsOpen ? 'bg-accent/20 text-accent' : 'text-slate-400 hover:bg-slate-700']">
          <Wrench class="w-4 h-4" />
        </button>
      </div>
    </header>

    <main class="flex-1 flex overflow-hidden relative">
      <!-- Collection Sidebar -->
      <aside v-if="isSidebarOpen" 
             :class="['bg-sidebar border-r border-slate-700 flex flex-col shrink-0 z-30 transition-all duration-300', 
                      isMobile ? 'absolute inset-y-0 left-0 w-72' : 'w-64']">
        <div class="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h2 class="font-bold text-[10px] uppercase tracking-widest text-slate-500">Collections</h2>
          <div class="flex gap-2 text-slate-400">
            <button @click="addNewCollection" class="hover:text-accent transition-colors" title="New Collection">
              <Plus class="w-4 h-4" />
            </button>
            <button @click="handleImportClick" class="hover:text-accent transition-colors" title="Import">
              <Upload class="w-4 h-4" />
            </button>
            <input type="file" ref="fileInputRef" @change="handleFileChange" class="hidden" />
            <button @click="exportAll" class="hover:text-accent transition-colors" title="Export All">
              <Download class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar" ref="sidebarList">
          <div v-for="col in collectionsStore.collections" :key="col.id" class="border-b border-slate-800/50">
            <div @click="toggleCollection(col.id)" 
                 class="group flex items-center px-4 py-3 hover:bg-slate-800/50 cursor-pointer select-none">
               <div class="drag-handle p-1 -ml-2 mr-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 transition-opacity">
                 <GripVertical class="w-3 h-3" />
               </div>
               <ChevronRight :class="['w-3 h-3 mr-2 transition-transform duration-200 text-slate-500', expandedCollections[col.id] ? 'rotate-90' : '']" />
               <FolderTree class="w-4 h-4 mr-2 text-blue-500/70" />
               <span class="text-sm text-slate-300 truncate flex-1">{{ col.name }}</span>

               <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click.stop="openCollectionConfig(col.id)" class="p-1 text-slate-500 hover:text-accent" title="Variables">
                    <Settings class="w-3 h-3" />
                  </button>
                  <button @click.stop="renameCollection(col.id, col.name)" class="p-1 text-slate-500 hover:text-accent">
                    <Edit3 class="w-3 h-3" />
                  </button>
                  <button @click.stop="deleteCollection(col.id, col.name)" class="p-1 text-slate-500 hover:text-red-400">
                    <Trash2 class="w-3 h-3" />
                  </button>
               </div>
            </div>

            <div v-if="expandedCollections[col.id]" class="bg-slate-900/30">
              <div v-for="item in getCollectionItems(col.id)" :key="item.id"
                   @click="openSavedRequest(item)"
                   :class="['flex items-center pl-10 pr-4 py-2 hover:bg-slate-800 group cursor-pointer transition-colors', 
                            tabsStore.activeTab?.itemId === item.id ? 'bg-accent/10 border-r-2 border-accent' : '']">
                <span :class="['text-[8px] font-bold w-8 shrink-0', 
                  item.request.method === 'GET' ? 'text-green-500' : 
                  item.request.method === 'POST' ? 'text-blue-500' : 'text-yellow-500']">{{ item.request.method }}</span>
                <span class="text-xs text-slate-400 group-hover:text-slate-200 truncate flex-1">{{ item.name }}</span>
                
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click.stop="duplicateRequest(item.id)" class="p-1 text-slate-600 hover:text-accent" title="Duplicate">
                    <Copy class="w-2.5 h-2.5" />
                  </button>
                  <button @click.stop="deleteRequest(item.id, item.name)" class="p-1 text-slate-600 hover:text-red-400">
                    <Trash2 class="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
              <div v-if="getCollectionItems(col.id).length === 0" class="pl-10 py-3 text-[10px] text-slate-600 italic">
                No requests saved
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Workspace Area -->
      <div class="flex-1 flex flex-col overflow-hidden bg-dark relative">
        <splitpanes class="default-theme" :horizontal="!isMobile">
          <!-- Top Panel: Request Builder -->
          <pane :size="50" class="flex flex-col min-h-0 overflow-hidden">
            <GuiBuilder />
          </pane>

          <!-- Bottom Panel: CLI & Response -->
          <pane :size="50" class="flex flex-col min-h-0 overflow-hidden">
            <div class="flex-1 flex flex-col overflow-hidden relative">
              <splitpanes horizontal class="default-theme h-full">
                <!-- Response Viewer -->
                <pane :size="verticalPanels[0] === 'TerminalResponse' ? 65 : 35" class="flex flex-col overflow-hidden">
                  <ResponseViewer />
                </pane>
                <!-- CLI Terminal -->
                <pane :size="verticalPanels[0] === 'TerminalResponse' ? 35 : 65" class="flex flex-col overflow-hidden border-t border-slate-700">
                  <CliTerminal />
                </pane>
              </splitpanes>
            </div>
          </pane>
        </splitpanes>
      </div>

      <!-- Developer Tools Sidebar -->
      <ToolsSidebar v-if="isToolsOpen" class="animate-in slide-in-from-right duration-300">
        <template #close-button>
          <button @click="isToolsOpen = false" class="p-1 hover:bg-slate-700 rounded transition-colors text-slate-500">
            <X class="w-4 h-4" />
          </button>
        </template>
      </ToolsSidebar>
    </main>

    <!-- Modals -->
    <SaveRequestModal v-if="modalStore.activeType === 'save'" />
    <CollectionModal v-if="modalStore.activeType === 'collection'" />
    <ConfirmModal v-if="modalStore.activeType === 'confirm'" />
    <ImportTypeModal v-if="modalStore.activeType === 'import-type'" />
    <ApiImportModal v-if="modalStore.activeType === 'import-openapi'" />
    <ImportUrlModal v-if="modalStore.activeType === 'openapi-url'" />
    <CollectionConfigModal v-if="modalStore.activeType === 'collection-config'" />

    <Toast />

    <!-- Tab Context Menu -->
    <div v-if="showContextMenu" 
         class="fixed z-[9999] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 w-48 text-[11px]"
         :style="{ top: contextMenuPos.y + 'px', left: contextMenuPos.x + 'px' }">
      <button @click="handleContextMenuAction('close')" class="w-full text-left px-4 py-2 hover:bg-slate-800 flex justify-between">
        <span>Close</span>
        <span class="text-slate-600">Ctrl+W</span>
      </button>
      <div class="h-px bg-slate-800 my-1"></div>
      <button @click="handleContextMenuAction('closeOthers')" class="w-full text-left px-4 py-2 hover:bg-slate-800">Close Others</button>
      <button @click="handleContextMenuAction('closeAll')" class="w-full text-left px-4 py-2 hover:bg-slate-800">Close All</button>
      <div class="h-px bg-slate-800 my-1"></div>
      <button @click="handleContextMenuAction('closeLeft')" class="w-full text-left px-4 py-2 hover:bg-slate-800">Close Tabs to the Left</button>
      <button @click="handleContextMenuAction('closeRight')" class="w-full text-left px-4 py-2 hover:bg-slate-800">Close Tabs to the Right</button>
    </div>
  </div>
</template>

<style scoped>
/* Custom Scrollbar for better aesthetics */
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.drag-handle { cursor: grab; }
.drag-handle:active { cursor: grabbing; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

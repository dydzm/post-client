<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { useTabsStore } from './stores/tabs'
import { useCollectionsStore } from './stores/collections'
import { useModalStore } from './stores/modal'
import { useSortable } from '@vueuse/integrations/useSortable'
import GuiBuilder from './components/GuiBuilder.vue'
import CliTerminal from './components/CliTerminal.vue'
import ResponseViewer from './components/ResponseViewer.vue'
import ToolsSidebar from './components/ToolsSidebar.vue'
import Toast from './components/Toast.vue'

// Modal Components
import SaveRequestModal from './components/SaveRequestModal.vue'
import CollectionModal from './components/CollectionModal.vue'
import ConfirmModal from './components/ConfirmModal.vue'

import { Menu, Plus, X, FolderTree, Download, Upload, GripVertical, ArrowLeftRight, LayoutGrid, Trash2, Edit3, ChevronRight, ChevronDown, Wrench, Copy } from 'lucide-vue-next'

const tabsStore = useTabsStore()
const collectionsStore = useCollectionsStore()
const modalStore = useModalStore()

const isSidebarOpen = ref(window.innerWidth > 1024)
const isToolsOpen = ref(true) // Default open
const isMobile = ref(window.innerWidth < 768)
const expandedCollections = ref<Record<string, boolean>>({ default: true })

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
  if (isMobile.value) isSidebarOpen.value = false
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// Watch for both collection expansion and items changes to setup/refresh sortable
const sortableInstances = new Map<string, any>()

watch([expandedCollections, () => collectionsStore.savedItems], () => {
  nextTick(() => {
    collectionsStore.collections.forEach(col => {
      const el = document.getElementById(`items-${col.id}`)
      if (el && expandedCollections.value[col.id]) {
        // Destroy existing instance if it exists to avoid stacking
        if (sortableInstances.has(col.id)) {
          // Sortable.js doesn't have a simple 'destroy' in the VueUse wrapper easily accessible 
          // but we can just let it be if it's the same element, or re-init if needed.
          // Actually useSortable returns the instance.
        }
        
        useSortable(el, collectionsStore.savedItems.filter(i => i.collectionId === col.id), {
          animation: 150,
          handle: '.drag-handle',
          group: 'requests',
          onEnd: (evt) => {
            const itemId = (evt.item as HTMLElement).dataset.id!
            const sourceEl = evt.from
            const targetEl = evt.to
            
            const sourceColId = sourceEl.id.replace('items-', '')
            const targetColId = targetEl.id.replace('items-', '')
            
            // If moved to a different collection, update the item's collectionId
            if (sourceColId !== targetColId) {
              const item = collectionsStore.savedItems.find(i => i.id === itemId)
              if (item) {
                item.collectionId = targetColId
              }
            }
            
            const sourceIds = Array.from(sourceEl.children).map(child => (child as HTMLElement).dataset.id!)
            const targetIds = Array.from(targetEl.children).map(child => (child as HTMLElement).dataset.id!)
            
            collectionsStore.updateItemOrder(sourceColId, sourceIds)
            if (sourceColId !== targetColId) {
              collectionsStore.updateItemOrder(targetColId, targetIds)
            }
          }
        })
      }
    })
  })
}, { deep: true, immediate: true })

const importCollection = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          // Handle complex export format
          imported.forEach(c => {
            const newColId = collectionsStore.addCollection(c.name)
            if (c.items && Array.isArray(c.items)) {
              c.items.forEach((item: any) => {
                collectionsStore.saveRequest(item.name, item.request, newColId)
              })
            }
          })
        }
      } catch (err) {
        modalStore.open('confirm', { title: 'Import Failed', message: 'Invalid collection file.', confirmLabel: 'OK' })
      }
    }
    reader.readAsText(file)
  }
}

const openSavedRequest = (item: any) => {
  tabsStore.addTab(item.name, item.request, item.id, item.collectionId)
  if (isMobile.value) isSidebarOpen.value = false
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-dark text-slate-200 overflow-hidden font-sans">
    <!-- Main Header / Tabs -->
    <header class="h-10 bg-slate-900 border-b border-slate-700 flex items-center px-4 shrink-0 gap-4">
      <button @click="toggleSidebar" class="p-1 hover:bg-slate-800 rounded lg:hidden">
        <Menu class="w-5 h-5" />
      </button>
      <h1 class="text-[10px] font-bold text-blue-500 hidden md:block tracking-widest uppercase">Post-Client</h1>
      
      <!-- Multi-tabs -->
      <div class="flex-1 flex h-full overflow-x-auto no-scrollbar gap-px">
        <div v-for="tab in tabsStore.tabs" :key="tab.id"
          @click="tabsStore.activeTabId = tab.id"
          :class="['group flex items-center px-4 h-full min-w-[140px] max-w-[200px] text-[11px] cursor-pointer border-r border-slate-700 transition-all', 
                  tabsStore.activeTabId === tab.id ? 'bg-dark text-blue-400 border-t-2 border-t-accent' : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-slate-300']">
          <span :class="['text-[9px] font-bold w-9 shrink-0', 
            tab.request.method === 'GET' ? 'text-green-500' : 
            tab.request.method === 'POST' ? 'text-blue-500' : 'text-yellow-500']">{{ tab.request.method }}</span>
          <span class="truncate flex-1">{{ tab.name || 'New Request' }}</span>
          <button @click.stop="tabsStore.removeTab(tab.id)" class="ml-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity">
            <X class="w-3 h-3" />
          </button>
        </div>
        <button @click="tabsStore.addTab()" class="px-4 h-full flex items-center text-slate-500 hover:text-blue-400 transition-colors">
          <Plus class="w-4 h-4" />
        </button>
      </div>

      <!-- Layout Controls -->
      <div class="flex gap-2">
        <button @click="isToolsOpen = !isToolsOpen" :class="['p-2 rounded transition-colors', isToolsOpen ? 'bg-accent text-white' : 'hover:bg-slate-800 text-slate-500']" title="Toggle Tools">
          <Wrench class="w-4 h-4" />
        </button>
        <button @click="swapVerticalPanels" class="p-2 hover:bg-slate-800 rounded text-slate-500 transition-colors" title="Swap Panels">
          <ArrowLeftRight class="w-4 h-4" />
        </button>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden relative">
      <!-- Collection Sidebar -->
      <transition name="slide">
        <aside v-if="isSidebarOpen" :class="['bg-sidebar border-r border-slate-700 flex flex-col shrink-0 transition-all duration-300 z-50', 
          isMobile ? 'absolute inset-0 w-full' : 'w-64']">
          <div class="p-4 border-b border-slate-700 flex justify-between items-center bg-sidebar">
            <div class="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              Collections
            </div>
            <div class="flex gap-2 text-slate-400">
              <button @click="addNewCollection" class="hover:text-accent transition-colors" title="New Collection">
                <Plus class="w-4 h-4" />
              </button>
              <label class="cursor-pointer hover:text-accent transition-colors" title="Import">
                <Upload class="w-4 h-4" />
                <input type="file" @change="importCollection" class="hidden" />
              </label>
              <button @click="exportAll" class="hover:text-accent transition-colors" title="Export All">
                <Download class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-2">
             <div v-for="col in collectionsStore.collections" :key="col.id" class="mb-2">
                <!-- Collection Header -->
                <div class="flex items-center group py-1.5 px-2 hover:bg-slate-700 rounded cursor-pointer" @click="toggleCollection(col.id)">
                   <component :is="expandedCollections[col.id] ? ChevronDown : ChevronRight" class="w-3 h-3 text-slate-500 mr-2" />
                   <span class="text-sm text-slate-300 truncate flex-1">{{ col.name }}</span>
                   
                   <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button @click.stop="renameCollection(col.id, col.name)" class="p-1 text-slate-500 hover:text-accent">
                        <Edit3 class="w-3 h-3" />
                      </button>
                      <button @click.stop="deleteCollection(col.id, col.name)" class="p-1 text-slate-500 hover:text-red-400">
                        <Trash2 class="w-3 h-3" />
                      </button>
                   </div>
                </div>

                <!-- Collection Items -->
                <div v-if="expandedCollections[col.id]" :id="'items-' + col.id" class="ml-5 mt-1 space-y-0.5 border-l border-slate-700 min-h-[10px]">
                   <div v-for="item in collectionsStore.savedItems.filter(i => i.collectionId === col.id)" :key="item.id" 
                        :data-id="item.id"
                        class="group flex items-center justify-between p-1.5 pl-3 hover:bg-slate-700 rounded-r cursor-pointer transition-colors"
                        @click="openSavedRequest(item)">
                      <div class="flex items-center gap-2 overflow-hidden flex-1 drag-handle">
                        <span :class="['text-[9px] font-bold w-9 shrink-0', 
                          item.request.method === 'GET' ? 'text-green-400' : 
                          item.request.method === 'POST' ? 'text-blue-400' : 'text-yellow-400']">
                          {{ item.request.method }}
                        </span>
                        <span class="text-[11px] text-slate-400 truncate">{{ item.name }}</span>
                      </div>
                      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                        <button @click.stop="duplicateRequest(item.id)" class="text-slate-500 hover:text-accent">
                          <Copy class="w-3 h-3" />
                        </button>
                        <button @click.stop="deleteRequest(item.id, item.name)" 
                                class="text-slate-500 hover:text-red-400">
                          <Trash2 class="w-3 h-3" />
                        </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
          <button v-if="isMobile" @click="toggleSidebar" class="m-4 py-2 bg-blue-600 rounded text-sm font-bold">Close Menu</button>
        </aside>
      </transition>

      <!-- Main Workspace (Split Panes) -->
      <main class="flex-1 flex flex-col overflow-hidden bg-dark">
        <Splitpanes class="default-theme h-full" :horizontal="isMobile">
          <template v-for="panel in verticalPanels" :key="panel">
            <Pane v-if="panel === 'GuiBuilder'" min-size="20" size="45">
              <div class="h-full flex flex-col border-r border-slate-700 overflow-y-auto relative">
                <GuiBuilder />
              </div>
            </Pane>

            <Pane v-if="panel === 'TerminalResponse'" size="55">
              <Splitpanes horizontal class="h-full">
                <Pane min-size="10" size="40">
                  <div class="h-full flex flex-col bg-black border-b border-slate-700 relative">
                    <CliTerminal />
                  </div>
                </Pane>
                <Pane min-size="10" size="60">
                  <div class="h-full flex flex-col bg-dark">
                    <ResponseViewer />
                  </div>
                </Pane>
              </Splitpanes>
            </Pane>
          </template>
        </Splitpanes>
      </main>

      <!-- Right Tools Sidebar -->
      <transition name="slide-right">
        <ToolsSidebar v-if="isToolsOpen">
          <template #close-button>
            <button @click="isToolsOpen = false" class="p-1 hover:bg-slate-800 rounded text-slate-500">
              <X class="w-4 h-4" />
            </button>
          </template>
        </ToolsSidebar>
      </transition>
    </div>

    <!-- Modals -->
    <SaveRequestModal v-if="modalStore.activeType === 'save'" />
    <CollectionModal v-if="modalStore.activeType === 'collection'" />
    <ConfirmModal v-if="modalStore.activeType === 'confirm'" />

    <Toast />
  </div>
</template>

<style>
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }

.slide-right-enter-active, .slide-right-leave-active { transition: all 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); opacity: 0; }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

.drag-handle { cursor: grab; }
.drag-handle:active { cursor: grabbing; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

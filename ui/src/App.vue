<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { useTabsStore } from './stores/tabs'
import { useCollectionsStore } from './stores/collections'
import GuiBuilder from './components/GuiBuilder.vue'
import CliTerminal from './components/CliTerminal.vue'
import ResponseViewer from './components/ResponseViewer.vue'
import { Menu, Plus, X, FolderTree, Download, Upload, GripVertical, ArrowLeftRight, LayoutGrid, Trash2 } from 'lucide-vue-next'

const tabsStore = useTabsStore()
const collectionsStore = useCollectionsStore()
const isSidebarOpen = ref(window.innerWidth > 1024)
const isMobile = ref(window.innerWidth < 768)

// Panel configuration to allow reordering
const verticalPanels = ref(['GuiBuilder', 'TerminalResponse'])

const swapVerticalPanels = () => {
  verticalPanels.value = [...verticalPanels.value.reverse()]
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) isSidebarOpen.value = false
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

const exportCollection = () => {
  const data = JSON.stringify(collectionsStore.savedItems, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'collection.json'
  a.click()
}

const importCollection = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          collectionsStore.savedItems = imported
        }
      } catch (err) {
        alert('Invalid collection file')
      }
    }
    reader.readAsText(file)
  }
}

const openSavedRequest = (item: any) => {
  tabsStore.addTab(item.name, item.request)
  if (isMobile.value) isSidebarOpen.value = false
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
    <!-- Main Header / Tabs -->
    <header class="h-12 border-b border-slate-800 flex items-center px-4 bg-slate-900 shrink-0 gap-4">
      <button @click="toggleSidebar" class="p-1 hover:bg-slate-800 rounded lg:hidden">
        <Menu class="w-5 h-5" />
      </button>
      <h1 class="text-sm font-bold text-blue-500 hidden md:block">POST-CLIENT</h1>
      
      <!-- Multi-tabs -->
      <div class="flex-1 flex h-full overflow-x-auto no-scrollbar gap-px pt-2">
        <div v-for="tab in tabsStore.tabs" :key="tab.id"
          @click="tabsStore.activeTabId = tab.id"
          :class="['group flex items-center px-4 h-full min-w-[120px] max-w-[200px] text-xs cursor-pointer rounded-t-lg transition-all', 
                  tabsStore.activeTabId === tab.id ? 'bg-slate-800 text-blue-400 border-t-2 border-blue-500' : 'bg-slate-900/50 text-slate-500 hover:bg-slate-800/50 hover:text-slate-300']">
          <span :class="['w-2 h-2 rounded-full mr-2 shrink-0', 
            tab.request.method === 'GET' ? 'bg-green-500' : 
            tab.request.method === 'POST' ? 'bg-blue-500' : 'bg-yellow-500']"></span>
          <span class="truncate flex-1">{{ tab.name || 'New Request' }}</span>
          <button @click.stop="tabsStore.removeTab(tab.id)" class="ml-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity">
            <X class="w-3 h-3" />
          </button>
        </div>
        <button @click="tabsStore.addTab()" class="px-3 hover:text-blue-400 transition-colors">
          <Plus class="w-4 h-4" />
        </button>
      </div>

      <!-- Layout Controls -->
      <div class="flex gap-2">
        <button @click="swapVerticalPanels" class="p-2 hover:bg-slate-800 rounded text-slate-400 transition-colors" title="Swap Panels">
          <ArrowLeftRight class="w-4 h-4" />
        </button>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden relative">
      <!-- Collection Sidebar -->
      <transition name="slide">
        <aside v-if="isSidebarOpen" :class="['bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 z-50', 
          isMobile ? 'absolute inset-0 w-full' : 'w-64']">
          <div class="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div class="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
              <FolderTree class="w-4 h-4" />
              Collections
            </div>
            <div class="flex gap-2">
              <label class="cursor-pointer hover:text-blue-400 transition-colors">
                <Upload class="w-4 h-4" />
                <input type="file" @change="importCollection" class="hidden" />
              </label>
              <button @click="exportCollection" class="hover:text-blue-400 transition-colors">
                <Download class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-2 space-y-1">
             <div v-for="item in collectionsStore.savedItems" :key="item.id" 
                  class="group flex items-center justify-between p-2 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                  @click="openSavedRequest(item)">
                <div class="flex items-center gap-2 overflow-hidden">
                  <span :class="['text-[10px] font-bold w-10 shrink-0', 
                    item.request.method === 'GET' ? 'text-green-400' : 
                    item.request.method === 'POST' ? 'text-blue-400' : 'text-yellow-400']">
                    {{ item.request.method }}
                  </span>
                  <span class="text-xs text-slate-300 truncate">{{ item.name }}</span>
                </div>
                <button @click.stop="collectionsStore.removeRequest(item.id)" 
                        class="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 class="w-3 h-3" />
                </button>
             </div>
             <div v-if="collectionsStore.savedItems.length === 0" class="text-slate-600 text-xs italic p-4 text-center">
                No saved requests. Use the 'Save' button in a tab to add one.
             </div>
          </div>
          <button v-if="isMobile" @click="toggleSidebar" class="m-4 py-2 bg-blue-600 rounded text-sm font-bold">Close Menu</button>
        </aside>
      </transition>

      <!-- Main Workspace (Split Panes) -->
      <main class="flex-1 flex flex-col overflow-hidden bg-slate-950">
        <splitpanes class="default-theme h-full" :horizontal="isMobile">
          <template v-for="panel in verticalPanels" :key="panel">
            <pane v-if="panel === 'GuiBuilder'" min-size="20" size="40">
              <div class="h-full flex flex-col border-r border-slate-800 overflow-y-auto relative">
                <div class="absolute top-2 right-2 z-10 opacity-30 hover:opacity-100 transition-opacity">
                   <GripVertical class="w-4 h-4 cursor-move text-slate-500" />
                </div>
                <GuiBuilder />
              </div>
            </pane>

            <pane v-if="panel === 'TerminalResponse'" size="60">
              <splitpanes horizontal class="h-full">
                <pane min-size="10" size="40">
                  <div class="h-full flex flex-col bg-black border-b border-slate-800 relative">
                    <div class="absolute top-2 right-2 z-10 opacity-30 hover:opacity-100 transition-opacity">
                      <LayoutGrid class="w-4 h-4 cursor-move text-slate-500" />
                    </div>
                    <CliTerminal />
                  </div>
                </pane>
                <pane min-size="10" size="60">
                  <div class="h-full flex flex-col bg-slate-950">
                    <ResponseViewer />
                  </div>
                </pane>
              </splitpanes>
            </pane>
          </template>
        </splitpanes>
      </main>
    </div>
  </div>
</template>

<style>
/* Custom splitpanes styling */
.splitpanes--vertical > .splitpanes__splitter {
  width: 4px;
  background-color: #0f172a;
  border-left: 1px solid #1e293b;
  transition: background-color 0.2s;
}
.splitpanes--vertical > .splitpanes__splitter:hover {
  background-color: #3b82f6;
}
.splitpanes--horizontal > .splitpanes__splitter {
  height: 4px;
  background-color: #0f172a;
  border-top: 1px solid #1e293b;
  transition: background-color 0.2s;
}
.splitpanes--horizontal > .splitpanes__splitter:hover {
  background-color: #3b82f6;
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); opacity: 0; }
</style>

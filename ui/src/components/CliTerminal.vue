<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useTabsStore } from '../stores/tabs'
import { useCollectionsStore } from '../stores/collections'
import axios from 'axios'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { useResizeObserver } from '@vueuse/core'
import '@xterm/xterm/css/xterm.css'

import { getAsciiLogo } from '../lib/logo'

const tabsStore = useTabsStore()
const collectionsStore = useCollectionsStore()
const terminalContainer = ref<HTMLElement | null>(null)

let term: Terminal
let fitAddon: FitAddon
let currentInput = ''

const initTerminal = async () => {
  if (!terminalContainer.value) return

  term = new Terminal({
    theme: { 
      background: '#000000', 
      foreground: '#cbd5e1',
      cursor: '#3b82f6',
      selectionBackground: '#1e293b'
    },
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 12,
    cursorBlink: true,
    allowTransparency: true,
    rows: 10,
    lineHeight: 1.2
  })

  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.open(terminalContainer.value)
  fitAddon.fit()

  // Display the local logo
  term.write(getAsciiLogo())

  term.writeln('\r\n\x1b[90mWelcome to the Hybrid CLI. Type a request or use the GUI.\x1b[0m')
  term.writeln('\x1b[90mExample: GET https://api.example.com/data\x1b[0m')
  term.write('\r\n\x1b[34m$\x1b[0m ')

  term.onData(e => {
    switch (e) {
      case '\r': // Enter
        term.writeln('')
        if (currentInput.trim() === '') {
          executeRequest()
        } else {
          parseInput(currentInput)
          currentInput = ''
        }
        term.write('\x1b[34m$\x1b[0m ')
        break
      case '\x7f': // Backspace
        if (currentInput.length > 0) {
          term.write('\b \b')
          currentInput = currentInput.slice(0, -1)
        }
        break
      default: // Normal char
        term.write(e)
        currentInput += e
    }
  })
}

const parseInput = (input: string) => {
  const parts = input.trim().split(/\s+/)
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  
  if (parts.length >= 2 && methods.includes(parts[0].toUpperCase())) {
    const method = parts[0].toUpperCase()
    const url = parts[1]
    
    tabsStore.updateActiveRequest({ method, url })
    
    // Show interpolated URL in feedback if variables are used
    const col = collectionsStore.collections.find(c => c.id === tabsStore.activeTab?.collectionId)
    const vars = col?.variables || {}
    const displayUrl = collectionsStore.interpolate(url, vars)
    
    if (displayUrl !== url) {
      term.writeln(`\x1b[32mSynced to GUI:\x1b[0m ${method} ${url} \x1b[90m(${displayUrl})\x1b[0m`)
    } else {
      term.writeln(`\x1b[32mSynced to GUI:\x1b[0m ${method} ${url}`)
    }
  } else {
    term.writeln('\x1b[31mError:\x1b[0m Invalid command. Use: <METHOD> <URL>')
  }
}

const executeRequest = async () => {
  const activeTab = tabsStore.activeTab
  if (!activeTab) return

  // Apply variable interpolation
  const finalRequest = collectionsStore.getInterpolatedRequest(activeTab.request, activeTab.collectionId)

  activeTab.isLoading = true
  activeTab.error = null
  activeTab.response = null
  
  try {
    const res = await axios.post('http://localhost:8000/execute', finalRequest)
    activeTab.response = res.data
  } catch (err: any) {
    activeTab.error = err.response?.data?.detail || err.message
  } finally {
    activeTab.isLoading = false
  }
}

// Watch for execution state changes (from GUI or CLI)
watch(() => tabsStore.activeTab?.isLoading, (loading) => {
  const activeTab = tabsStore.activeTab
  if (!activeTab || !term) return

  if (loading) {
    // Interpolate URL for display in terminal
    const col = collectionsStore.collections.find(c => c.id === activeTab.collectionId)
    const vars = col?.variables || {}
    const displayUrl = collectionsStore.interpolate(activeTab.request.url, vars)
    
    term.writeln(`\r\n\x1b[34mExecuting:\x1b[0m ${activeTab.request.method} ${displayUrl}...`)
  }
})

watch(() => tabsStore.activeTab?.response, (newResponse) => {
  if (newResponse && term) {
    term.writeln(`\x1b[32mSuccess:\x1b[0m ${newResponse.status} [${newResponse.time_ms}ms]`)
    term.write('\r\n\x1b[34m$\x1b[0m ')
  }
})

watch(() => tabsStore.activeTab?.error, (newError) => {
  if (newError && term) {
    term.writeln(`\x1b[31mFailed:\x1b[0m ${newError}`)
    term.write('\r\n\x1b[34m$\x1b[0m ')
  }
})

onMounted(() => {
  initTerminal()
})

useResizeObserver(terminalContainer, () => {
  if (fitAddon) {
    fitAddon.fit()
  }
})

onUnmounted(() => {
  term?.dispose()
})
</script>

<template>
  <div class="h-full w-full bg-black relative overflow-hidden flex flex-col">
    <div class="flex items-center px-4 py-1 bg-slate-900/50 border-b border-white/5 shrink-0">
      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interactive Terminal</span>
    </div>
    <div ref="terminalContainer" class="flex-1 min-h-0 p-2 overflow-hidden"></div>
  </div>
</template>

<style>
.xterm .xterm-viewport {
  background-color: transparent !important;
}
.xterm-screen {
  padding: 8px;
}
</style>

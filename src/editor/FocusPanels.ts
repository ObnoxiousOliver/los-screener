import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFocusPanels = defineStore('focusPanels', () => {
  const activePanel = ref<{
    id: string,
    sendKeydown: (e: KeyboardEvent) => void
  } | null>(null)

  function setActivePanel (panel: {
    id: string,
    sendKeydown: (e: KeyboardEvent) => void
  }) {
    activePanel.value = panel
  }

  window.addEventListener('keydown', e => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

    activePanel.value?.sendKeydown(e)
  })

  return {
    activePanel,
    setActivePanel
  }
})
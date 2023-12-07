import { defineStore } from 'pinia'
import { BridgeType } from '../BridgeType'
import { ref } from 'vue'

declare const bridge: BridgeType

export const useFonts = defineStore('fonts', () => {
  const fonts = ref<string[]>([])

  async function refreshFonts () {
    fonts.value = await bridge.getFonts()
  }
  refreshFonts()

  return {
    fonts,
    refreshFonts
  }
})
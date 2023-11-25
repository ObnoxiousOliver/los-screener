<template>
  <div
    ref="root"
    class="canvas-renderer"
  />
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { Canvas } from '../canvas/Canvas'

const root = ref<HTMLElement>()

const props = defineProps<{
  canvas: Canvas
}>()

const canvasEl = ref<HTMLElement>()

watchEffect(() => {
  if (root.value) {
    if (!canvasEl.value) {
      root.value.replaceChildren()
    } else {
      root.value.replaceChildren(canvasEl.value)
    }
  }
})

watchEffect(() => {
  props.canvas.onRender((el) => {
    canvasEl.value = el
  })
})
props.canvas.render()
</script>

<style lang="scss" scoped>
.canvas-renderer {
  width: fit-content;
  height: fit-content;
}
</style>
<template>
  <div
    ref="root"
    class="canvas-renderer"
  />
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { Canvas } from '../canvas/Canvas'
import { Component } from '../canvas/Component'

const root = ref<HTMLElement>()

const props = defineProps<{
  canvas: Canvas
  components: Component[]
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
  if (props.canvas) {
    const canvas = props.canvas
    canvasEl.value = canvas.render(props.components)
  }
})
</script>

<style lang="scss" scoped>
.canvas-renderer {
  width: fit-content;
  height: fit-content;
}
</style>
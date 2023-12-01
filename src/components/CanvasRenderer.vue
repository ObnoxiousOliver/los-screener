<template>
  <div
    ref="root"
    class="canvas-renderer"
  />
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { Canvas } from '../canvas/Canvas'
import { Editor } from '../editor/Editor'

const root = ref<HTMLElement>()

const props = defineProps<{
  canvas: Canvas
  editor: Editor
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
    canvasEl.value = canvas.render(props.editor.components)
  }
})
</script>

<style lang="scss" scoped>
@use '../style/variables' as v;

.canvas-renderer {
  background: black;
  width: fit-content;
  height: fit-content;
  // outline: 1px solid v.$card-border-color;
}
</style>
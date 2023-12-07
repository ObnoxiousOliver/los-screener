<template>
  <div
    ref="root"
    class="scene-renderer"
  />
</template>

<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue'
import { Editor } from '../editor/Editor'
import { Scene } from '../screener/Scene'

const root = ref<HTMLDivElement>()

const props = defineProps<{
  scene: Scene
  editor: Editor
}>()

onMounted(() => {
  if (root.value) {
    root.value.attachShadow({ mode: 'open' })
  }
})

watchEffect(() => {
  if (!root.value) return
  if (props.scene) {
    const els = props.scene.render({
      isEditor: true,
      editor: props.editor,
      components: props.editor.components
    })
    root.value.shadowRoot?.replaceChildren(...els)
  }
})
</script>

<style scoped lang="scss">
.scene-renderer {
  position: relative;
  user-select: none;
  pointer-events: none;
}
</style>

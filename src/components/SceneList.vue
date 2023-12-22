<template>
  <div class="pa-2 d-flex flex-column h-100">
    <h2 class="mb-2 mx-1 text-h6 d-flex">
      Scenes
      <VSpacer />
      <VBtn
        class="text-body-1"
        icon="mdi-plus"
        color="transparent"
        elevation="0"
        size="2rem"
        @click="editor.createScene()"
      />
    </h2>
    <VList
      nav
      class="bg-grey-darken-5 font-size-1 flex-grow-1"
      density="compact"
      rounded="lg"
    >
      <VListItem
        v-for="scene in editor.scenes"
        :key="scene.id"
        :active="scene.id === editor.activeScene?.id"
        @click="editor.setActiveScene(scene.id)"
        @contextmenu="onContextmenu(scene)"
      >
        {{ scene.name }}
      </VListItem>
    </VList>
  </div>
</template>

<script lang="ts" setup>
import { Editor } from '../editor/Editor'
import { ContextMenu } from '../helpers/ContextMenu'
import { Scene } from '../screener/Scene'

const props = defineProps<{
  editor: Editor
}>()

function onContextmenu (scene: Scene) {
  ContextMenu.open([
    {
      label: 'Delete',
      click: () => {
        props.editor.sendSceneUpdate(scene.id, null)
      }
    }
  ])
}
</script>
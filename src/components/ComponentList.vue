<template>
  <div class="pa-2 d-flex flex-column h-100">
    <h2 class="mb-2 mx-1 text-h6">
      Components
    </h2>
    <VList
      nav
      density="compact"
      class="bg-grey-darken-5 flex-grow-1"
      rounded="lg"
    >
      <ComponentListItem
        v-for="element in elements"
        :key="element.id"
        :element="element"
        :editor="editor"
      />
    </VList>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Editor } from '../editor/Editor'
import ComponentListItem from './ComponentListItem.vue'
import { Slot } from '../screener/Slot'
import { Component } from '../screener/Component'

const props = defineProps<{
  editor: Editor
}>()

const elements = computed(() => {
  const elements: {
    id: string
    selected: boolean
    slot: Slot
    component: Component
  }[] = []

  elements.push(...props.editor.activeScene?.slots.map((slot) => ({
    id: slot.id,
    name: props.editor.getComponent(slot.componentId)?.name ?? 'Slot without component',
    selected: props.editor.isSelected(slot.id),
    slot,
    component: props.editor.getComponent(slot.componentId)!
  })) ?? [])

  return elements
})
</script>
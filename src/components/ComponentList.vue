<template>
  <div class="component-list">
    <VList>
      <ComponentListItem
        v-for="element in elements"
        :key="element.id"
        :element="element"
        :editor="props.editor"
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

<style scoped lang="scss">
.component-list {
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
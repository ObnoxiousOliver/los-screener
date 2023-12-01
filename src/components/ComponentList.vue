<template>
  <div class="component-list">
    <VList>
      <VListItem
        v-for="element in elements"
        :key="element.id"
        :active="element.selected"
        :class="{
          'component-list__item': true,
          'component-list__item--slot': element.slot,
          'component-list__item--selected': element.selected
        }"
        :title="element.name"
        @click="(e: MouseEvent | KeyboardEvent) => select(e, element)"
      />
    </VList>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Editor } from '../editor/Editor'
import { Slot } from '../canvas/Slot'
import { Canvas } from '../canvas/Canvas'

const props = defineProps<{
  editor: Editor
}>()

interface Element {
  id: string
  name: string
  selected: boolean
  slot?: Slot
  canvas?: Canvas
}
const elements = computed(() => {
  const elements: Element[] = []

  for (const canvas of props.editor.canvases) {
    elements.push({
      id: canvas.id,
      name: canvas.name,
      selected: props.editor.isSelected(canvas.id),
      canvas
    })

    for (const slot of canvas.children) {
      const componentName = props.editor.getComponent(slot.componentId)?.name
      elements.push({
        id: slot.id,
        name: componentName ?? 'Slot without component',
        selected: props.editor.isSelected(slot.id),
        slot: slot
      })
    }
  }

  return elements
})

// const lastSelectedElement = ref<Element | null>(null) as Ref<Element | null>
function select (e: MouseEvent | KeyboardEvent, element: Element) {
  // lastSelectedElement.value = element
  // if (e.shiftKey && lastSelectedElement.value) {
  //   const range = elements.value.slice(
  //     Math.min(elements.value.indexOf(element), elements.value.indexOf(lastSelectedElement.value)),
  //     Math.max(elements.value.indexOf(element), elements.value.indexOf(lastSelectedElement.value)) + 1
  //   )

  //   console.log(range, lastSelectedElement)
  //   for (const element of range) {
  //     props.editor.selectElement(element.id)
  //   }
  // } else {
  // props.editor.selectElement(element.id)
  // }

  if (element.selected) {
    props.editor.deselectElement(element.id)
  } else {
    props.editor.selectElement(element.id, e.shiftKey)
  }
}
</script>

<style scoped lang="scss">
.component-list {
  overflow-y: auto;
  overflow-x: hidden;

  & &__item {
    &--slot {
      padding-left: 2rem !important;
    }
  }
}
</style>
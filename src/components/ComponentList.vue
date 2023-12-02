<template>
  <div class="component-list">
    <VList>
      <VListItem
        v-for="element in elements"
        :key="element.id"
        :active="element.selected"
        :class="{
          'component-list__item': true,
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
import { Slot } from '../screener/Slot'
import { Canvas } from '../screener/Canvas'

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

  elements.push(...props.editor.activeScene?.slots.map((slot) => ({
    id: slot.id,
    name: props.editor.getComponent(slot.componentId)?.name ?? 'Slot without component',
    selected: props.editor.isSelected(slot.id),
    slot
  })) ?? [])

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
}
</style>
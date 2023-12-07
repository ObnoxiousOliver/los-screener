<template>
  <VListItem
    :active="props.element.selected"
    class="component-list-item"
    @click="onClick"
    @contextmenu="onContextmenu"
    @keydown.f2="rename()"
  >
    <input
      v-if="renaming"
      ref="input"
      v-model="componentName"
      type="text"
      @blur="applyName()"
      @keydown.enter="applyName()"
      @keydown.esc="cancelRename()"
    >
    <template v-else>
      {{ element.component.name }}
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import { ref , nextTick } from 'vue'
import { Component } from '../screener/Component'
import { Slot } from '../screener/Slot'
import { ContextMenu } from '../helpers/ContextMenu'

import { Editor } from '../editor/Editor'

const props = defineProps<{
  editor: Editor
  element: {
    id: string
    selected: boolean
    slot: Slot
    component: Component
  }
}>()

const renaming = ref(false)
const input = ref<HTMLInputElement | null>(null)
const componentName = ref(props.element.component.name)

function rename () {
  componentName.value = props.element.component.name
  renaming.value = true
  nextTick(() => {
    input.value?.focus()
    input.value?.select()
  })
}
function applyName () {
  renaming.value = false

  if (componentName.value === props.element.component.name) return

  props.editor.sendComponentUpdate(props.element.component.id, {
    name: componentName.value
  })
}
function cancelRename () {
  componentName.value = props.element.component.name
  renaming.value = false
}

function onClick (e: MouseEvent | KeyboardEvent) {
  if (props.element.selected) {
    props.editor.deselectElement(props.element.id)
  } else {
    props.editor.selectSlot(props.element.id, e.shiftKey)
  }
}

function onContextmenu (e: MouseEvent) {
  e.preventDefault()

  ContextMenu.open([
    {
      label: 'Rename',
      accelerator: 'F2',
      click: () => rename()
    },
    {
      label: 'Delete',
      click: () => {
        props.editor.sendSlotUpdate(props.editor.activeScene!.id, props.element.id, null)
      }
    }
  ])
}
</script>

<style scoped lang="scss">
@use '../style/variables' as v;

.component-list-item {
  cursor: pointer;
  padding: .5rem 1rem;
  border-bottom: 1px solid rgba(v.$primary, .1);

  &:last-child {
    border-bottom: none;
  }

  &[aria-selected="true"] {
    background: rgba(v.$primary, .1);
  }

  input {
    width: 100%;
    border: none;
    background: white;
    color: black;
    border-radius: .1rem;
    outline: 1px solid rgba(v.$primary, .1);
  }
}
</style>
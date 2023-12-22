<template>
  <VListItem
    :active="props.element.selected"
    class="component-list-item pa-0"
    :class="{
      'component-list-item--renaming': renaming,
      'component-list-item--hover': hover,
      'component-list-item--selected': props.element.selected,
      'component-list-item--visible': props.element.slot.visible ?? true
    }"
    value
    @contextmenu="onContextmenu"
    @keydown.f2="rename()"
    @pointerenter="hover = true"
    @pointerleave="hover = false"
  >
    <div
      class="component-list-item__text h-100 align-stretch py-2 px-3"
      @click="onClick"
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
    </div>
    <template #append>
      <template v-if="!renaming">
        <VBtn
          v-if="hover || element.selected || element.slot.visible === false"
          elevation="0"
          :icon="element.slot.visible === false ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          class="text-caption mr-2 text-grey"
          color="transparent"
          size="1.5rem"
          @click="toggleVisibility"
        />
      </template>
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

const hover = ref(false)

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

function toggleVisibility () {
  props.editor.sendSlotUpdate(props.editor.activeScene!.id, props.element.id, {
    visible: !props.element.slot.visible ?? false
  })
}
</script>

<style scoped lang="scss">
@use '../style/variables' as v;

.component-list-item {
  cursor: pointer;

  &:not(&--visible) {
    .component-list-item__text {
      color: map-get(v.$grey, 'base');
    }
  }

  &:last-child {
    border-bottom: none;
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
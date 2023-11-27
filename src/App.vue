<template>
  <VApp>
    <VNavigationDrawer
      permanent
    >
      <VList>
        <VListItem
          v-for="canvas in (canvases as Canvas[])"
          :key="canvas.id"
          @click="removeCanvas(canvas)"
        >
          <VListItemTitle>{{ canvas.name }}</VListItemTitle>
        </VListItem>
        <VDivider class="my-2" />
        <VListItem @click="addCanvas">
          <VListItemTitle>New Canvas</VListItemTitle>
        </VListItem>
        <VListItem @click="showWindows">
          <VListItemTitle>Windows</VListItemTitle>
        </VListItem>
      </VList>
    </VNavigationDrawer>
    <VMain>
      <EditorCanvas
        v-model:selection="selection"
        :canvases="(canvases as Canvas[])"
        :components="components"
      />
    </VMain>
    <VNavigationDrawer
      location="right"
      permanent
    >
      <VList>
        <VListItem>
          <VListItemTitle>Right Drawer</VListItemTitle>
        </VListItem>

        <VListItem
          v-for="(selectedPropertiesValue, i) in selectedProperties"
          :key="(i)"
        >
          <VListItemTitle>
            {{ selectedPropertiesValue.label }}
          </VListItemTitle>

          <VSwitch
            v-if="selectedPropertiesValue.options.type === 'boolean'"
            v-model="selectedPropertiesValue.value"
          />
          <TextInput
            v-else-if="selectedPropertiesValue.options.type === 'text'"
            v-model="selectedPropertiesValue.value"
            :update-on-blur="selectedPropertiesValue.options.updateOnBlur"
          />
          <VTextarea
            v-else-if="selectedPropertiesValue.options.type === 'textbox'"
            v-model="selectedPropertiesValue.value"
          />
          <VTextField
            v-else-if="selectedPropertiesValue.options.type === 'number'"
            v-model.number="selectedPropertiesValue.value"
            :type="'number'"
          />
          <Vec2Input
            v-else-if="selectedPropertiesValue.options.type === 'vec2'"
            :model-value="(selectedPropertiesValue.value as Vec2)"
            @update:model-value="(v) => {
              selectedPropertiesValue.value = v as Vec2
            }"
          />
          <Vec4Input
            v-else-if="selectedPropertiesValue.options.type === 'rect'"
            :label-x="selectedPropertiesValue.options.labels?.[0] ?? 'X'"
            :label-y="selectedPropertiesValue.options.labels?.[1] ?? 'Y'"
            :label-z="selectedPropertiesValue.options.labels?.[2] ?? 'Width'"
            :label-w="selectedPropertiesValue.options.labels?.[3] ?? 'Height'"
            :model-value="{
              x: selectedPropertiesValue.value.x,
              y: selectedPropertiesValue.value.y,
              z: selectedPropertiesValue.value.width,
              w: selectedPropertiesValue.value.height
            }"
            @update:model-value="(v) => {
              selectedPropertiesValue.value = new Rect(v.x, v.y, v.z, v.w)
            }"
          />
          <Vec4Input
            v-else-if="selectedPropertiesValue.options.type === 'margin'"
            :label-x="selectedPropertiesValue.options.labels?.[0] ?? 'Top'"
            :label-y="selectedPropertiesValue.options.labels?.[1] ?? 'Right'"
            :label-z="selectedPropertiesValue.options.labels?.[2] ?? 'Bottom'"
            :label-w="selectedPropertiesValue.options.labels?.[3] ?? 'Left'"
            :model-value="{
              x: selectedPropertiesValue.value.top,
              y: selectedPropertiesValue.value.right,
              z: selectedPropertiesValue.value.bottom,
              w: selectedPropertiesValue.value.left
            }"
            @update:model-value="(v) => {
              selectedPropertiesValue.value = new Margin(
                Math.max(0, v.x),
                Math.max(0, v.y),
                Math.max(0, v.z),
                Math.max(0, v.w)
              )
            }"
          />
          <VSelect
            v-else-if="selectedPropertiesValue.options.type === 'select'"
            v-model="selectedPropertiesValue.value"
            :items="selectedPropertiesValue.options.options.map((o) => ({
              title: o.label,
              value: o.value
            }))"
          />
          <!-- {{ selectedPropertiesValue.value }} -->
        </VListItem>
      </VList>
    </VNavigationDrawer>
  </VApp>
</template>

<script setup lang="ts">
import { reactive, ref, computed , Ref } from 'vue'
import { Canvas, CanvasJSON } from './canvas/Canvas'
import EditorCanvas from './components/EditorCanvas.vue'
import Vec2Input from './components/Vec2Input.vue'
import Vec4Input from './components/Vec4Input.vue'
import { BridgeType } from './BridgeType'
import { Component, ComponentFactory, ComponentJSON } from './canvas/Component'
import { Property } from './canvas/Property'
import { Slot } from './canvas/Slot'
import { sendCanvasUpdate, sendComponentUpdate } from './main'
import { Rect } from './helpers/Rect'
import { Margin } from './helpers/Margin'
import { Vec2 } from './helpers/Vec2'
import { DefaultPlugin } from './canvas/default/defaultPlugin'
import { VTextarea } from 'vuetify/lib/components/index.mjs'
import { Window } from './canvas/Window'
import TextInput from './components/TextInput.vue'

declare const bridge: BridgeType

const selection = ref<Slot[]>([]) as Ref<Slot[]>

const selectedProperties = computed(() => {
  if (selection.value.length !== 1) return []

  const slot = selection.value[0] as Slot
  const component = components.find((c) => c.id === slot.componentId)
  const canvas = (canvases as Canvas[]).find((c) => c.children.includes(slot))

  if (!canvas || !component) return []

  return [
    new Property(
      { type: 'rect' },
      'Rect',
      () => Rect.clone(slot.rect),
      (v) => {
        slot.rect = Rect.clone(v)
        sendCanvasUpdate(canvas.id, canvas.toJSON())
      }
    ),
    new Property(
      { type: 'margin' },
      'Crop',
      () => Margin.clone(slot.crop),
      (v) => {
        slot.crop = Margin.clone(v)
        sendCanvasUpdate(canvas.id, canvas.toJSON())
      }
    ),
    ...component.getProperties((json) => {
      sendComponentUpdate(json)
    })
  ].sort((a, b) => {
    if (a.order === b.order) return 0
    if (a.order === undefined) return 1
    if (b.order === undefined) return -1
    return a.order > b.order ? 1 : -1
  })
})

ComponentFactory.registerPlugin(DefaultPlugin)
const canvases = reactive<Canvas[]>([])
const components = reactive<Component[]>([])

bridge.onCanvasUpdated(updateCanvas)
bridge.getCanvases().then(updateAllCanvases)

bridge.onComponentUpdated(updateComponent)
bridge.getComponents().then(updateAllComponents)

function updateCanvas (id: string, c: CanvasJSON | null) {
  if (c === null) {
    const index = canvases.findIndex((c) => c.id === id)
    if (index !== -1) {
      canvases.splice(index, 1)
    }
  } else {
    const canvas = canvases.find((c) => c.id === id)
    if (canvas) {
      canvas.fromJSON(c)
    } else {
      canvases.push(Canvas.fromJSON(c))
    }
  }
}

function updateAllCanvases (c: CanvasJSON[]) {
  console.log(c)
  c.forEach((canvasJSON) => {
    const canvas = canvases.find((c) => c.id === canvasJSON.id)
    if (canvas) {
      canvas.fromJSON(canvasJSON)
    } else {
      canvases.push(Canvas.fromJSON(canvasJSON))
    }
  })
}

function updateComponent (id: string, c: ComponentJSON | null) {
  if (c === null) {
    const index = components.findIndex((c) => c.id === id)
    if (index !== -1) {
      delete components[index]
    }
  } else {
    const component = components.find((c) => c.id === id)
    if (component) {
      component.fromJSON(c)
    } else {
      components.push(Component.fromJSON(c))
    }
  }
}

function updateAllComponents (c: ComponentJSON[]) {
  c.forEach((component) => {
    const index = components.findIndex((c) => c.id === component.id)
    if (index !== -1) {
      components[index].fromJSON(component)
    } else {
      components.push(Component.fromJSON(component))
    }
  })
}

function removeCanvas (canvas: Canvas) {
  bridge.removeCanvas(canvas.id)
}

function addCanvas () {
  const canvas = new Canvas()
  bridge.setCanvas(canvas.toJSON())
}

function showWindows () {
  bridge.showWindows()
  const window = new Window(new Rect(0, 0, 1920, 1080), canvases[0].id)
  bridge.setWindow(window.toJSON())
}
</script>
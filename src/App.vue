<template>
  <VApp>
    <VNavigationDrawer
      app
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
      </VList>
    </VNavigationDrawer>
    <VMain>
      <EditorCanvas
        v-model:selection="selection"
        :canvases="(canvases as Canvas[])"
        :components="components"
      />
    </VMain>
    <VNavigationDrawer location="right">
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
          <VTextField
            v-else-if="selectedPropertiesValue.options.type === 'text'"
            v-model="selectedPropertiesValue.value"
          />
          <VTextField
            v-else-if="selectedPropertiesValue.options.type === 'number'"
            v-model.number="selectedPropertiesValue.value"
            :type="'number'"
          />
          <template v-else-if="selectedPropertiesValue.options.type === 'vec2'">
            <VTextField
              v-model.number="selectedPropertiesValue.value.x"
              :type="'number'"
              label="X"
            />
            <VTextField
              v-model.number="selectedPropertiesValue.value.y"
              label="Y"
              :type="'number'"
            />
          </template>
          <template v-else-if="selectedPropertiesValue.options.type === 'rect'">
            <VTextField
              v-model.number="selectedPropertiesValue.value.x"
              label="X"
              :type="'number'"
            />
            <VTextField
              v-model.number="selectedPropertiesValue.value.y"
              label="Y"
              :type="'number'"
            />
            <VTextField
              v-model.number="selectedPropertiesValue.value.width"
              label="W"
              :type="'number'"
            />
            <VTextField
              v-model.number="selectedPropertiesValue.value.height"
              label="H"
              :type="'number'"
            />
          </template>
          <template v-else-if="selectedPropertiesValue.options.type === 'margin'">
            <VTextField
              v-model.number="selectedPropertiesValue.value.top"
              label="Top"
              :type="'number'"
            />
            <VTextField
              v-model.number="selectedPropertiesValue.value.right"
              label="Right"
              :type="'number'"
            />
            <VTextField
              v-model.number="selectedPropertiesValue.value.bottom"
              label="Bottom"
              :type="'number'"
            />
            <VTextField
              v-model.number="selectedPropertiesValue.value.left"
              label="Left"
              :type="'number'"
            />
          </template>
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
import { reactive, ref, computed } from 'vue'
import { Canvas, CanvasJSON } from './canvas/Canvas'
import EditorCanvas from './components/EditorCanvas.vue'
import { BridgeType } from './BridgeType'
import { Component, ComponentJSON } from './canvas/Component'
import { Property } from './canvas/Property'
import './canvas/Video'
import { Slot } from './canvas/Slot'
import { sendCanvasUpdate } from './main'

declare const bridge: BridgeType

const selection = ref<Slot[]>([])

const selectedProperties = computed(() => {
  if (selection.value.length !== 1) return []

  const slot = selection.value[0]
  const component = components.find((c) => c.id === slot.componentId)
  const canvas = (canvases as Canvas[]).find((c) => c.children.includes(slot))

  if (!canvas || !component) return []

  return [
    new Property(
      { type: 'rect' },
      'Rect',
      () => slot.rect,
      (v) => {
        slot.rect = v
        sendCanvasUpdate(canvas.id, canvas)
      }
    ),
    new Property(
      { type: 'margin' },
      'Crop',
      () => slot.crop,
      (v) => {
        slot.crop = v
        sendCanvasUpdate(canvas.id, canvas)
      }
    ),
    ...component.getProperties(() => {
      sendCanvasUpdate(canvas.id, canvas)
    })
  ]
})

const canvases = reactive<Canvas[]>([])
const components = reactive<Component[]>([])

bridge.onCanvasUpdate(updateCanvas)
bridge.getCanvases().then(updateAllCanvases)

bridge.onComponentUpdate(updateComponent)
bridge.getComponents().then(updateAllComponents)

function updateCanvas (id: string, c: CanvasJSON | null) {
  if (c === null) {
    const index = canvases.findIndex((c) => c.id === id)
    if (index !== -1) {
      delete canvases[index]
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
</script>
<template>
  <VApp>
    <VNavigationDrawer
      location="bottom"
      permanent
      :width="300"
    >
      <VLayout full-height>
        <VNavigationDrawer
          location="left"
          permanent
        >
          <VContainer>
            Scenes
          </VContainer>
          <VList>
            <VListItem
              v-for="scene in editor.scenes"
              :key="scene.id"
              :title="scene.name"
              @click="editor.setActiveScene(scene.id)"
            />
            <VListItem
              title="Create new scene"
              @click="editor.createScene()"
            />
            <VListItem
              title="Windows"
              @click="setWindows()"
            />
          </VList>
        </VNavigationDrawer>
      </VLayout>
    </VNavigationDrawer>
    <VNavigationDrawer
      location="left"
      permanent
    >
      <VContainer>
        Components
      </VContainer>
      <VDivider />
      <ComponentList :editor="editor" />
    </VNavigationDrawer>
    <VMain>
      <EditorCanvas :editor="editor" />
    </VMain>
    <VNavigationDrawer
      location="right"
      permanent
    >
      <VContainer>
        Properties
      </VContainer>
      <VContainer>
        <template
          v-for="(selectedPropertiesValue, i) in selectedProperties"
          :key="(i)"
        >
          <VSwitch
            v-if="selectedPropertiesValue.options.type === 'boolean'"
            v-model="selectedPropertiesValue.value"
            :color="'primary'"
            :label="selectedPropertiesValue.label"
          />
          <TextInput
            v-else-if="selectedPropertiesValue.options.type === 'text'"
            v-model="selectedPropertiesValue.value"
            :update-on-blur="selectedPropertiesValue.options.updateOnBlur"
            variant="outlined"
            :label="selectedPropertiesValue.label"
          />
          <VTextarea
            v-else-if="selectedPropertiesValue.options.type === 'textbox'"
            v-model="selectedPropertiesValue.value"
            :label="selectedPropertiesValue.label"
            variant="outlined"
          />
          <VTextField
            v-else-if="selectedPropertiesValue.options.type === 'number'"
            v-model.number="selectedPropertiesValue.value"
            :type="'number'"
            :label="selectedPropertiesValue.label"
            variant="outlined"
          />
          <Vec2Input
            v-else-if="selectedPropertiesValue.options.type === 'vec2'"
            :label-x="selectedPropertiesValue.options.labels?.[0]"
            :label-y="selectedPropertiesValue.options.labels?.[1]"
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
            :label="selectedPropertiesValue.label"
            variant="outlined"
          />
          <VBtn
            v-else-if="selectedPropertiesValue.options.type === 'action'"
            variant="outlined"
            @click="selectedPropertiesValue.options.call()"
          >
            {{ selectedPropertiesValue.label }}
          </VBtn>
        </template>
      </VContainer>
    </VNavigationDrawer>
  </VApp>
</template>

<script setup lang="ts">
import ComponentList from './components/ComponentList.vue'
import { computed , Ref , ref } from 'vue'
import EditorCanvas from './components/EditorCanvas.vue'
import { Margin } from './helpers/Margin'
import { Rect } from './helpers/Rect'
import { Vec2 } from './helpers/Vec2'
import { Property } from './screener/Property'
import Vec4Input from './components/Vec4Input.vue'
import Vec2Input from './components/Vec2Input.vue'
import TextInput from './components/TextInput.vue'
import { ComponentFactory } from './screener/Component'
import { DefaultPlugin } from './screener/default/defaultPlugin'
import { Editor } from './editor/Editor'
import { Window } from './screener/Window'

const selectedProperties = computed(() => {
  if (editor.value.selectedElements.length !== 1) return []

  const slot = editor.value.getSelected()[0]
  if (!slot) return []

  const component = editor.value.getComponent(slot.componentId)

  return [
    new Property(
      { type: 'rect' },
      'Rect',
      () => Rect.clone(slot.rect),
      (v) => {
        editor.value.sendSlotUpdate(editor.value.activeScene!.id, slot.id, {
          rect: v.toJSON()
        })
      }
    ),
    new Property(
      { type: 'margin' },
      'Crop',
      () => Margin.clone(slot.crop),
      (v) => {
        editor.value.sendSlotUpdate(editor.value.activeScene!.id, slot.id, {
          crop: v.toJSON()
        })
      }
    ),
    ...(component?.getProperties({
      callAction: (action, args) => {
        editor.value.sendComponentAction(slot.componentId, action, args)
      },
      update: (json) => {
        editor.value.sendComponentUpdate(slot.componentId, json)
      }
    }) ?? [])
  ].sort((a, b) => {
    if (a.order === b.order) return 0
    if (a.order === undefined) return 1
    if (b.order === undefined) return -1
    return a.order > b.order ? 1 : -1
  })
})

ComponentFactory.registerPlugin(DefaultPlugin)
const editor = ref(new Editor(true)) as Ref<Editor>

function setWindows () {
  editor.value.setWindow(new Window(
    new Rect(0, 0, 1920, 1080),
    editor.value.slices[0].id
  ))
  editor.value.setWindow(new Window(
    new Rect(0, 0, 1920, 1080),
    editor.value.slices[1].id
  ))
  editor.value.showWindows()
}
</script>

<style lang="scss">
html, body, #app {
  overflow: hidden;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}
</style>

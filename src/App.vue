<template>
  <VApp>
    <PanelLayout>
      <template #left>
        <FocusPanel>
          <ComponentList :editor="editor" />
        </FocusPanel>
      </template>
      <template #right>
        <FocusPanel>
          <PropertyList :editor="editor" />
        </FocusPanel>
      </template>
      <template #bottom-left>
        <FocusPanel>
          <SceneList :editor="editor" />
        </FocusPanel>
      </template>
      <template #bottom-right>
        <FocusPanel>
          <PlaybackPanel :editor="editor" />
        </FocusPanel>
      </template>

      <EditorCanvas :editor="editor" />
    </PanelLayout>
  </VApp>
  <!-- <VNavigationDrawer
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
        <VCheckbox
          v-if="selectedPropertiesValue.options.type === 'checkbox'"
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
        <VSelect
          v-else-if="selectedPropertiesValue.options.type === 'font'"
          v-model="selectedPropertiesValue.value"
          :items="useFonts().fonts.map((o) => ({
            title: o,
            value: o
          }))"
          :label="selectedPropertiesValue.label"
          variant="outlined"
        />
      </template>
    </VContainer>
  </VNavigationDrawer> -->
</template>

<script setup lang="ts">
import { Ref, ref } from 'vue'
// import { Property } from './screener/Property'
import { ComponentFactory } from './screener/Component'
import { DefaultPlugin } from './screener/default/defaultPlugin'
import { Editor } from './editor/Editor'
import PanelLayout from './components/PanelLayout.vue'
import EditorCanvas from './components/EditorCanvas.vue'
import FocusPanel from './components/FocusPanel.vue'
import ComponentList from './components/ComponentList.vue'
import SceneList from './components/SceneList.vue'
import PropertyList from './components/PropertyList.vue'
import PlaybackPanel from './components/PlaybackPanel.vue'
// import { Rect } from './helpers/Rect'
// import { Margin } from './helpers/Margin'
// import Vec4Input from './components/Vec4Input.vue'
// import { Vec2 } from './helpers/Vec2'
// import Vec2Input from './components/Vec2Input.vue'
// import TextInput from './components/TextInput.vue'
// import { useFonts } from './editor/Fonts'

// const selectedProperties = computed(() => {
//   if (editor.value.selectedElements.length !== 1) return []

//   const slice = editor.value.getSelectedSlice()
//   if (slice) {
//     return [
//       new Property(
//         'name',
//         { type: 'text' },
//         'Name',
//         () => slice.name,
//         (v) => {
//           editor.value.sendSliceUpdate(slice.id, {
//             name: v
//           })
//         }
//       ),
//       new Property(
//         'rect',
//         { type: 'rect' },
//         'Rect',
//         () => Rect.clone(slice.rect),
//         (v) => {
//           editor.value.sendSliceUpdate(slice.id, {
//             rect: v.toJSON()
//           })
//         }
//       )
//     ]
//   }

//   const slot = editor.value.getSelected()[0]
//   if (!slot) return []

//   const component = editor.value.getComponent(slot.componentId)

//   return [
//     new Property(
//       'visible',
//       { type: 'checkbox' },
//       'Visible',
//       () => slot.visible,
//       (v) => {
//         editor.value.sendSlotUpdate(editor.value.activeScene!.id, slot.id, {
//           visible: v
//         })
//       }
//     ),
//     new Property(
//       'rect',
//       { type: 'rect' },
//       'Rect',
//       () => Rect.clone(slot.rect),
//       (v) => {
//         editor.value.sendSlotUpdate(editor.value.activeScene!.id, slot.id, {
//           rect: v.toJSON()
//         })
//       }
//     ),
//     new Property(
//       'crop',
//       { type: 'margin' },
//       'Crop',
//       () => Margin.clone(slot.crop),
//       (v) => {
//         editor.value.sendSlotUpdate(editor.value.activeScene!.id, slot.id, {
//           crop: v.toJSON()
//         })
//       }
//     ),
//     ...(component?.getProperties({
//       callAction: (action, args) => {
//         editor.value.sendComponentAction(slot.componentId, action, args)
//       },
//       update: (json) => {
//         editor.value.sendComponentUpdate(slot.componentId, json)
//       }
//     }) ?? [])
//   ].sort((a, b) => {
//     if (a.order === b.order) return 0
//     if (a.order === undefined) return 1
//     if (b.order === undefined) return -1
//     return a.order > b.order ? 1 : -1
//   })
// })

ComponentFactory.registerPlugin(DefaultPlugin)
// @ts-expect-error Type instantiation is excessively deep and possibly infinite. ts(2589)
const editor = ref(new Editor(true)) as Ref<Editor>
</script>

<style lang="scss">
html, body, #app {
  overflow: hidden;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}

.v-overlay__scrim {
  background: rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(5px);
  opacity: 1 !important;
}
</style>

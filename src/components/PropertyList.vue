<template>
  <div class="d-flex flex-column h-100">
    <h2 class="mb-2 mx-1 text-h6 d-flex pa-2 pb-0">
      Properties
    </h2>

    <div class="flex-grow-1 overflow-y-auto pa-4 pb-10">
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
        <template v-else-if="selectedPropertiesValue.options.type === 'vec2'">
          <h3 class="text-body-1 mb-2">
            {{ selectedPropertiesValue.label }}
          </h3>
          <Vec2Input
            :label-x="selectedPropertiesValue.options.labels?.[0]"
            :label-y="selectedPropertiesValue.options.labels?.[1]"
            :model-value="(selectedPropertiesValue.value as Vec2)"
            @update:model-value="(v) => {
              selectedPropertiesValue.value = new Vec2(v.x, v.y)
            }"
          />
        </template>
        <template v-else-if="selectedPropertiesValue.options.type === 'rect'">
          <h3 class="text-body-1 mb-2">
            {{ selectedPropertiesValue.label }}
          </h3>
          <Vec4Input
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
        </template>
        <template v-else-if="selectedPropertiesValue.options.type === 'margin'">
          <h3 class="text-body-1 mb-2">
            {{ selectedPropertiesValue.label }}
          </h3>
          <Vec4Input
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
        </template>
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
        <VColorPicker
          v-else-if="selectedPropertiesValue.options.type === 'color'"
          v-model="selectedPropertiesValue.value"
          mode="hexa"
          :label="selectedPropertiesValue.label"
          variant="outlined"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Editor } from '../editor/Editor'
import { useFonts } from '../editor/Fonts'
import { Margin } from '../helpers/Margin'
import { Rect } from '../helpers/Rect'
import { Vec2 } from '../helpers/Vec2'
import TextInput from './TextInput.vue'
import Vec2Input from './Vec2Input.vue'
import Vec4Input from './Vec4Input.vue'
import { Property } from '../screener/Property'

const props = defineProps<{
  editor: Editor
}>()

const selectedProperties = computed(() => {
  if (props.editor.selectedElements.length !== 1) return []

  const slice = props.editor.getSelectedSlice()
  if (slice) {
    return [
      new Property(
        'name',
        { type: 'text' },
        'Name',
        () => slice.name,
        (v) => {
          props.editor.sendSliceUpdate(slice.id, {
            name: v
          })
        }
      ),
      new Property(
        'rect',
        { type: 'rect' },
        'Rect',
        () => Rect.clone(slice.rect),
        (v) => {
          props.editor.sendSliceUpdate(slice.id, {
            rect: v.toJSON()
          })
        }
      )
    ]
  }

  const slot = props.editor.getSelected()[0]
  if (!slot) return []

  const component = props.editor.getComponent(slot.componentId)

  return [
    new Property(
      'visible',
      { type: 'checkbox' },
      'Visible',
      () => slot.visible,
      (v) => {
        props.editor.sendSlotUpdate(props.editor.activeScene!.id, slot.id, {
          visible: v
        })
      }
    ),
    new Property(
      'rect',
      { type: 'rect' },
      'Rect',
      () => Rect.clone(slot.rect),
      (v) => {
        props.editor.sendSlotUpdate(props.editor.activeScene!.id, slot.id, {
          rect: v.toJSON()
        })
      }
    ),
    new Property(
      'crop',
      { type: 'margin' },
      'Crop',
      () => Margin.clone(slot.crop),
      (v) => {
        props.editor.sendSlotUpdate(props.editor.activeScene!.id, slot.id, {
          crop: v.toJSON()
        })
      }
    ),
    ...(component?.getProperties({
      callAction: (action, args) => {
        props.editor.sendComponentAction(slot.componentId, action, args)
      },
      update: (json) => {
        console.log(json)
        props.editor.sendComponentUpdate(slot.componentId, json)
      }
    }) ?? [])
  ].sort((a, b) => {
    if (a.order === b.order) return 0
    if (a.order === undefined) return 1
    if (b.order === undefined) return -1
    return a.order > b.order ? 1 : -1
  })
})

</script>
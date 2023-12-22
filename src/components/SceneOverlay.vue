<template>
  <div
    class="scene-overlay"
  >
    <template
      v-for="slot in scene.slots.filter((slot) => slot.visible !== false)"
      :key="slot.id"
    >
      <div
        :class="['scene-overlay__slot', {
          'scene-overlay__slot--selected': editor.isSelected(slot.id) && editor.getSelected().length > 1,
          'scene-overlay__slot--hovering': activeHoveringSlot === slot.id
        }]"
        :style="{
          position: 'absolute',
          left: `${(slot.rect.x + slot.crop.left) * scale}px`,
          top: `${(slot.rect.y + slot.crop.top) * scale}px`,
          width: `${(slot.rect.width - slot.crop.right - slot.crop.left) * scale}px`,
          height: `${(slot.rect.height - slot.crop.bottom - slot.crop.top) * scale}px`
        }"
      >
        <div
          class="scene-overlay__slot__hitbox"
          @pointerenter="(e) => onPointerenter(e, slot)"
          @pointerleave="(e) => onPointerleave(e, slot)"
          @pointerdown="select"
        />
        <div class="scene-overlay__slot__outline" />
      </div>
    </template>

    <RectHandles
      v-if="handles"
      :rect="handles.rect"
      :crop="handles.crop"
      :transform-matrix="handles.transformMatrix"
      :scale="scale"
      @update="rectHandlesUpdate"
      @start="rectHandlesStart"
      @end="rectHandlesEnd"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref , computed } from 'vue'
import { Editor } from '../editor/Editor'
import { Scene } from '../screener/Scene'
import { Slot } from '../screener/Slot'
import RectHandles from './RectHandles.vue'
import { Rect } from '../helpers/Rect'
import { Margin } from '../helpers/Margin'
import { TransformMatrix } from '../helpers/TransformMatrix'

const props = defineProps<{
  editor: Editor
  scene: Scene
  scale: number
}>()

const handles = computed(() => {
  const slots = props.editor.getSelected()

  if (slots.length === 0) return null

  const isSingleSlot = slots.length === 1

  if (isSingleSlot) {
    return {
      rect: Rect.clone(slots[0].rect),
      crop: Margin.clone(slots[0].crop),
      transformMatrix: slots[0].transformMatrix
    }
  }

  const rect = Rect.union(...slots.map((slot) => slot.rect))

  return { rect }
})

let startRects: Map<string, Rect> | null = null
function rectHandlesStart () {
  const slots = props.editor.getSelected()

  const isSingleSlot = slots.length === 1

  if (!isSingleSlot) {
    startRects = new Map<string, Rect>()

    for (const slot of slots) {
      startRects.set(slot.id, Rect.clone(slot.rect))
    }
  }
}
function rectHandlesEnd () {
  startRects = null
  props.editor.pushHistory()
}

function rectHandlesUpdate (value: {
  rect: Rect,
  crop?: Margin,
  transformMatrix?: TransformMatrix
}, old: {
  rect: Rect,
  crop?: Margin,
  transformMatrix?: TransformMatrix
}) {
  const slots = props.editor.getSelected()

  const isSingleSlot = slots.length === 1

  if (isSingleSlot) {
    // console.log(value.transformMatrix)
    props.editor.sendSlotUpdate(props.scene.id, slots[0].id, {
      rect: value.rect.toJSON(),
      crop: value.crop?.toJSON(),
      transformMatrix: value.transformMatrix?.toJSON()
    })
  } else {
    if (!startRects) throw new Error('startRects is null')

    const rect = value.rect
    const oldRect = old.rect

    for (const slot of slots) {
      const startRect = startRects.get(slot.id)

      if (!startRect) throw new Error('startRect is null')

      const left = (startRect.left - oldRect.left) / oldRect.width * rect.width + rect.left
      const top = (startRect.top - oldRect.top) / oldRect.height * rect.height + rect.top
      const right = (startRect.right - oldRect.right) / oldRect.width * rect.width + rect.right
      const bottom = (startRect.bottom - oldRect.bottom) / oldRect.height * rect.height + rect.bottom

      const newRect = new Rect(
        left,
        top,
        right - left,
        bottom - top
      )

      props.editor.sendSlotUpdate(props.scene.id, slot.id, {
        rect: newRect.toJSON()
      })
    }
  }
}

const hoveringSlots = ref<Set<string>>(new Set<string>())
const activeHoveringSlot = computed(() => {
  if (hoveringSlots.value.size === 0) return null
  if (hoveringSlots.value.size === 1) return hoveringSlots.value.values().next().value
  return Array.from(hoveringSlots.value).sort((a, b) => props.scene.slots.findIndex((slot) => slot.id === a) - props.scene.slots.findIndex((slot) => slot.id === b))[0]
})

function onPointerenter (e: PointerEvent, slot: Slot) {
  hoveringSlots.value.add(slot.id)
}

function onPointerleave (e: PointerEvent, slot: Slot) {
  hoveringSlots.value.delete(slot.id)
}

function select (e: PointerEvent) {
  if (activeHoveringSlot.value) {
    props.editor.selectSlot(activeHoveringSlot.value, e.shiftKey)
  }
}
</script>

<style scoped lang="scss">
@use '../style/variables' as v;

.scene-overlay {
  pointer-events: none;

  &__slot {
    &--hovering {
      .scene-overlay__slot__outline {
        outline: 2px solid rgba(v.$primary, 0.5);
      }
    }

    &--selected {
      .scene-overlay__slot__outline {
        outline: 2px solid v.$primary;
      }
    }

    &__hitbox {
      pointer-events: all;
      position: absolute;
      inset: -.5rem;
    }

    &__outline {
      position: absolute;
      inset: 0;
    }
  }
}
</style>
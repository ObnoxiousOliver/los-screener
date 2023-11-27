<template>
  <div
    ref="root"
    class="canvas-overlay"
  >
    <div
      v-for="(slot, i) in slots"
      :key="i"
      :class="['canvas-overlay__element-wrapper', {
        'canvas-overlay__element-wrapper--selected': selection.includes(slot),
        'canvas-overlay__element-wrapper--positionable': (selectedComponents[slot.componentId] as Component)?.positionable
      }]"
      :style="{
        transform: `scale(${1 / scale})`,
        transformOrigin: 'top left',
        position: 'absolute',
        top: -elementPadding / scale + (slot.rect.y + slot.crop.top) + 'px',
        left: -elementPadding / scale + (slot.rect.x + slot.crop.left) + 'px',
        width: elementPadding * 2 + (slot.rect.width - slot.crop.right - slot.crop.left) * scale + 'px',
        height: elementPadding * 2 + (slot.rect.height - slot.crop.bottom - slot.crop.top) * scale + 'px'
      }"
    >
      <div
        class="canvas-overlay__element-bg"
        @click="(e) => select(slot, e)"
      />
      <div
        class="canvas-overlay__element"
        :style="{
          position: 'absolute',
          left: elementPadding + 'px',
          top: elementPadding + 'px',
          width: (slot.rect.width - slot.crop.right - slot.crop.left) * scale + 'px',
          height: (slot.rect.height - slot.crop.bottom - slot.crop.top) * scale + 'px'
        }"
      >
        <template v-if="selection.includes(slot) && (selectedComponents[slot.componentId] as Component)?.positionable">
          <div
            class="canvas-overlay__element__move"
            @pointerdown="(e) => onPointerdown(e, 'move')"
          />
          <div
            :class="['canvas-overlay__element__resize-handles', {
              'canvas-overlay__element__resize-handles--crop-t': slot.crop.top > 0,
              'canvas-overlay__element__resize-handles--crop-r': slot.crop.right > 0,
              'canvas-overlay__element__resize-handles--crop-b': slot.crop.bottom > 0,
              'canvas-overlay__element__resize-handles--crop-l': slot.crop.left > 0
            }]"
          >
            <div
              class="canvas-overlay__element__resize-handle canvas-overlay__element__resize-handle--tl"
              @pointerdown="(e) => onPointerdown(e, 'tl')"
            />
            <div
              class="canvas-overlay__element__resize-handle canvas-overlay__element__resize-handle--tr"
              @pointerdown="(e) => onPointerdown(e, 'tr')"
            />
            <div
              class="canvas-overlay__element__resize-handle canvas-overlay__element__resize-handle--br"
              @pointerdown="(e) => onPointerdown(e, 'br')"
            />
            <div
              class="canvas-overlay__element__resize-handle canvas-overlay__element__resize-handle--bl"
              @pointerdown="(e) => onPointerdown(e, 'bl')"
            />
            <div
              class="canvas-overlay__element__resize-edge canvas-overlay__element__resize-edge--t"
              @pointerdown="(e) => onPointerdown(e, 't')"
            >
              <div class="canvas-overlay__element__resize-handle" />
            </div>
            <div
              class="canvas-overlay__element__resize-edge canvas-overlay__element__resize-edge--r"
              @pointerdown="(e) => onPointerdown(e, 'r')"
            >
              <div class="canvas-overlay__element__resize-handle" />
            </div>
            <div
              class="canvas-overlay__element__resize-edge canvas-overlay__element__resize-edge--l"
              @pointerdown="(e) => onPointerdown(e, 'l')"
            >
              <div class="canvas-overlay__element__resize-handle" />
            </div>
            <div
              class="canvas-overlay__element__resize-edge canvas-overlay__element__resize-edge--b"
              @pointerdown="(e) => onPointerdown(e, 'b')"
            >
              <div class="canvas-overlay__element__resize-handle" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Canvas } from '../canvas/Canvas'
import { Rect } from '../helpers/Rect'
import { Vec2 } from '../helpers/Vec2'
import { Component } from '../canvas/Component'
import { Slot } from '../canvas/Slot'
import { TransformMatrix } from '../helpers/TransformMatrix'
import { Margin } from '../helpers/Margin'
import { sendCanvasUpdate } from '../main'

const props = defineProps<{
  canvas: Canvas,
  components: Component[],
  selection: Slot[],
  scale: number
}>()
const emit = defineEmits(['select'])

const elementPadding = 10
const slots = computed(() => [
  new Slot(
    new Rect(0, 0, props.canvas.size.x, props.canvas.size.y),
    props.canvas.id
  ),
  ...props.canvas.children
])

function select (slot: Slot, e: MouseEvent) {
  if (!props.selection.includes(slot)) {
    if (e.shiftKey) {
      emit('select', slot, 'multi')
    } else {
      emit('select', slot, 'single')
    }
  } else {
    emit('select', slot, 'remove')
  }
}

const selectedComponents = computed(() => Object.fromEntries(props.selection.map(slot => [
  slot.componentId,
  slot.componentId === props.canvas.id
    ? props.canvas
    : props.components.find(c => c.id === slot.componentId) ?? null
  ])))

function onPointerdown (e: PointerEvent, handle: 'tl' | 'tr' | 'br' | 'bl' | 't' | 'r' | 'b' | 'l' | 'move') {
  if (Object.keys(selectedComponents.value).length !== 1) return
  if (e.button !== 0) return

  e.preventDefault()
  e.stopPropagation()

  const element = props.selection[0]
  if (!element) {
    console.warn('No element selected')
    return
  }

  let cropping = e.ctrlKey
  const rect = Rect.clone(element.rect)
  const crop = Margin.clone(element.crop)
  const start = new Vec2(e.clientX, e.clientY)
  const startMatrix = TransformMatrix.clone(element.transformMatrix)

  let newRect = Rect.clone(rect)
  let flipX = false
  let flipY = false

  const resize = (e: PointerEvent) => {
    cropping = e.ctrlKey

    const delta = new Vec2(e.clientX, e.clientY).sub(start).mul(1 / props.scale)
    newRect = Rect.clone(rect)

    if (handle === 'move') {
      newRect.x += delta.x
      newRect.y += delta.y
    }

    const preserveAspect = e.shiftKey
    const center = e.altKey

    if (handle === 'tl') {
      newRect.x += delta.x * (center ? 2 : 1)
      newRect.y += delta.y * (center ? 2 : 1)
      newRect.width -= delta.x * (center ? 2 : 1)
      newRect.height -= delta.y * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.height = newRect.width / rect.width * rect.height
        newRect.y = rect.y + rect.height - newRect.height
      }
    }

    if (handle === 'tr') {
      newRect.y += delta.y * (center ? 2 : 1)
      newRect.width += delta.x * (center ? 2 : 1)
      newRect.height -= delta.y * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.height = newRect.width / rect.width * rect.height
        newRect.y = rect.y + rect.height - newRect.height
      }
    }

    if (handle === 'br') {
      newRect.width += delta.x * (center ? 2 : 1)
      newRect.height += delta.y * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.height = newRect.width / rect.width * rect.height
      }
    }

    if (handle === 'bl') {
      newRect.x += delta.x * (center ? 2 : 1)
      newRect.width -= delta.x * (center ? 2 : 1)
      newRect.height += delta.y * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.height = newRect.width / rect.width * rect.height
      }
    }

    if (handle === 't') {
      newRect.y += delta.y * (center ? 2 : 1)
      newRect.height -= delta.y * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.width = newRect.height / rect.height * rect.width
        newRect.y = rect.y + rect.height - newRect.height
        newRect.x = rect.x + (rect.width - newRect.width) / 2
      }
    }

    if (handle === 'r') {
      newRect.width += delta.x * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.height = newRect.width / rect.width * rect.height
        newRect.y = rect.y + (rect.height - newRect.height) / 2
      }
    }

    if (handle === 'b') {
      newRect.height += delta.y * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.width = newRect.height / rect.height * rect.width
        newRect.x = rect.x + (rect.width - newRect.width) / 2
      }
    }

    if (handle === 'l') {
      newRect.x += delta.x * (center ? 2 : 1)
      newRect.width -= delta.x * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.height = newRect.width / rect.width * rect.height
        newRect.x = rect.x + rect.width - newRect.width
        newRect.y = rect.y + (rect.height - newRect.height) / 2
      }
    }
    if (center) {
      newRect.x = rect.x + (rect.width - newRect.width) / 2
      newRect.y = rect.y + (rect.height - newRect.height) / 2
    }

    if (!cropping) {
      flipX = newRect.width < 0
      flipY = newRect.height < 0
    } else {
      newRect.width = Math.max(0, newRect.width)
      newRect.height = Math.max(0, newRect.height)
    }

    if (flipX) {
      newRect.x += newRect.width
      newRect.width *= -1
    }

    if (flipY) {
      newRect.y += newRect.height
      newRect.height *= -1
    }
    apply()
  }

  const apply = () => {
    if (cropping) {
      const newCrop = Margin.clone(crop)
      newCrop.top += newRect.y - rect.y
      newCrop.right += rect.x + rect.width - newRect.x - newRect.width
      newCrop.bottom += rect.y + rect.height - newRect.y - newRect.height
      newCrop.left += newRect.x - rect.x

      newCrop.top = Math.round(Math.max(0, newCrop.top))
      newCrop.right = Math.round(Math.max(0, newCrop.right))
      newCrop.bottom = Math.round(Math.max(0, newCrop.bottom))
      newCrop.left = Math.round(Math.max(0, newCrop.left))

      element.crop = newCrop
      element.rect = rect
    } else {
      element.crop = crop

      newRect.x = Math.round(newRect.x)
      newRect.y = Math.round(newRect.y)
      newRect.width = Math.round(newRect.width)
      newRect.height = Math.round(newRect.height)

      element.rect = newRect

      if (flipX && flipY) {
        element.transformMatrix = startMatrix.scale(-1, -1)
      } else if (flipX) {
        element.transformMatrix = startMatrix.scale(-1, 1)
      } else if (flipY) {
        element.transformMatrix = startMatrix.scale(1, -1)
      }
    }

    sendCanvasUpdate(props.canvas.id, props.canvas)
  }

  const stop = () => {
    window.removeEventListener('pointermove', resize)
    window.removeEventListener('pointerup', stop)
    apply()
  }

  window.addEventListener('pointermove', resize)
  window.addEventListener('pointerup', stop)

}
</script>

<style lang="scss" scoped>
.canvas-overlay {
  width: fit-content;
  height: fit-content;
  pointer-events: none;

  &__element-wrapper {
    pointer-events: auto;

    &:hover:not(&--selected) {
      .canvas-overlay__element {
        outline: 1px solid rgb(255, 0, 183, 0.5);
      }
    }

    &--selected:not(&--positionable) {
      z-index: 1;
      .canvas-overlay__element {
        outline: 2px solid rgb(255, 0, 183, 0.5) !important;
      }
    }
  }

  &__element-bg {
    position: absolute;
    inset: 0;
  }

  &__element {
    pointer-events: none;
    $handle-size: 1rem;
    touch-action: none;

    &__move {
      pointer-events: auto;
      position: absolute;
      inset: 0;
      cursor: move;
    }

    &__resize-handles {
      position: absolute;
      inset: 0;
      z-index: 1;
      border: rgb(255, 0, 183) solid 2px;

      $crop-color: rgb(16, 159, 113);

      &--crop-t {
        border-top-color: $crop-color;
        .canvas-overlay__element__resize-edge--b .canvas-overlay__element__resize-handle {
          border-color: $crop-color;
        }
      }

      &--crop-r {
        border-right-color: $crop-color;
        .canvas-overlay__element__resize-edge--r .canvas-overlay__element__resize-handle {
          border-color: $crop-color;
        }
      }

      &--crop-b {
        border-bottom-color: $crop-color;
        .canvas-overlay__element__resize-edge--b .canvas-overlay__element__resize-handle {
          border-color: $crop-color !important;
        }
      }

      &--crop-l {
        border-left-color: $crop-color;
        .canvas-overlay__element__resize-edge--l .canvas-overlay__element__resize-handle {
          border-color: $crop-color;
        }
      }
    }

    &__resize-handle {
      pointer-events: auto;
      position: absolute;
      width: $handle-size;
      height: $handle-size;
      border: rgb(255, 0, 183) solid 1px;
      background: white;
      border-radius: $handle-size / 2;
      z-index: 1;

      &::before {
        content: '';
        position: absolute;
        inset: -$handle-size / 2;
        z-index: 2;
      }

      &--tl {
        top: -$handle-size / 2;
        left: -$handle-size / 2;
        cursor: nwse-resize;
      }

      &--tr {
        top: -$handle-size / 2;
        right: -$handle-size / 2;
        cursor: nesw-resize;
      }

      &--br {
        bottom: -$handle-size / 2;
        right: -$handle-size / 2;
        cursor: nwse-resize;
      }

      &--bl {
        bottom: -$handle-size / 2;
        left: -$handle-size / 2;
        cursor: nesw-resize;
      }
    }

    &__resize-edge {
      pointer-events: auto;
      position: absolute;
      z-index: 1;

      &--t {
        top: -$handle-size / 2;
        left: $handle-size;
        right: $handle-size;
        height: $handle-size;
        cursor: ns-resize;

        .canvas-overlay__element__resize-handle {
          left: 50%;
          height: $handle-size / 2;
          top: $handle-size / 4;
          transform: translateX(-50%);
        }
      }

      &--r {
        top: $handle-size;
        right: -$handle-size / 2;
        bottom: $handle-size;
        width: $handle-size;
        cursor: ew-resize;

        .canvas-overlay__element__resize-handle {
          top: 50%;
          width: $handle-size / 2;
          right: $handle-size / 4;
          transform: translateY(-50%);
        }
      }

      &--l {
        top: $handle-size;
        left: -$handle-size / 2;
        bottom: $handle-size;
        width: $handle-size;
        cursor: ew-resize;

        .canvas-overlay__element__resize-handle {
          top: 50%;
          width: $handle-size / 2;
          left: $handle-size / 4;
          transform: translateY(-50%);
        }
      }

      &--b {
        bottom: -$handle-size / 2;
        left: $handle-size;
        right: $handle-size;
        height: $handle-size;
        cursor: ns-resize;

        .canvas-overlay__element__resize-handle {
          left: 50%;
          height: $handle-size / 2;
          bottom: $handle-size / 4;
          transform: translateX(-50%);
        }
      }

    }
  }
}
</style>
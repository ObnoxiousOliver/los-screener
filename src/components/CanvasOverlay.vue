<template>
  <div
    ref="root"
    class="canvas-overlay"
  >
    <div
      v-for="(element, i) in flatElements"
      :key="i"
      :class="['canvas-overlay__element-wrapper', {
        'canvas-overlay__element-wrapper--selected': selected(element.element)
      }]"
      :style="{
        transform: `scale(${1 / scale})`,
        transformOrigin: 'top left',
        position: 'absolute',
        left: element.rect.x + 'px',
        top: element.rect.y + 'px',
        width: element.rect.width * scale + 'px',
        height: element.rect.height * scale + 'px'
      }"
    >
      <div
        class="canvas-overlay__element-bg"
        @click="(e) => select(element.element, e)"
      />
      <div
        class="canvas-overlay__element"
        :style="{
          position: 'absolute',
          left: (((selected(element.element) ? newRect : null) ?? element.element.rect).x - element.rect.x) * scale + 'px',
          top: (((selected(element.element) ? newRect : null) ?? element.element.rect).y - element.rect.y) * scale + 'px',
          width: ((selected(element.element) ? newRect : null) ?? element.element.rect).width * scale + 'px',
          height: ((selected(element.element) ? newRect : null) ?? element.element.rect).height* scale + 'px'
        }"
      >
        <div
          v-if="selected(element.element) && element.element.moveable"
          class="canvas-overlay__element__move"
          @pointerdown="(e) => onPointerdown(e, 'move')"
        />
        <div
          v-if="selected(element.element) && element.element.resizeable"
          class="canvas-overlay__element__resize-handles"
        >
          <div
            v-if="element.element.resizeable === 'xy'"
            class="canvas-overlay__element__resize-handle canvas-overlay__element__resize-handle--tl"
            @pointerdown="(e) => onPointerdown(e, 'tl')"
          />
          <div
            v-if="element.element.resizeable === 'xy'"
            class="canvas-overlay__element__resize-handle canvas-overlay__element__resize-handle--tr"
            @pointerdown="(e) => onPointerdown(e, 'tr')"
          />
          <div
            v-if="element.element.resizeable === 'xy'"
            class="canvas-overlay__element__resize-handle canvas-overlay__element__resize-handle--br"
            @pointerdown="(e) => onPointerdown(e, 'br')"
          />
          <div
            v-if="element.element.resizeable === 'xy'"
            class="canvas-overlay__element__resize-handle canvas-overlay__element__resize-handle--bl"
            @pointerdown="(e) => onPointerdown(e, 'bl')"
          />
          <div
            v-if="(['x', 'y', 'xy'] as Resizeable[]).includes(element.element.resizeable)"
            class="canvas-overlay__element__resize-edge canvas-overlay__element__resize-edge--t"
            @pointerdown="(e) => onPointerdown(e, 't')"
          >
            <div class="canvas-overlay__element__resize-handle" />
          </div>
          <div
            v-if="(['x', 'y', 'xy'] as Resizeable[]).includes(element.element.resizeable)"
            class="canvas-overlay__element__resize-edge canvas-overlay__element__resize-edge--r"
            @pointerdown="(e) => onPointerdown(e, 'r')"
          >
            <div class="canvas-overlay__element__resize-handle" />
          </div>
          <div
            v-if="(['x', 'y', 'xy'] as Resizeable[]).includes(element.element.resizeable)"
            class="canvas-overlay__element__resize-edge canvas-overlay__element__resize-edge--l"
            @pointerdown="(e) => onPointerdown(e, 'l')"
          >
            <div class="canvas-overlay__element__resize-handle" />
          </div>
          <div
            v-if="(['x', 'y', 'xy'] as Resizeable[]).includes(element.element.resizeable)"
            class="canvas-overlay__element__resize-edge canvas-overlay__element__resize-edge--b"
            @pointerdown="(e) => onPointerdown(e, 'b')"
          >
            <div class="canvas-overlay__element__resize-handle" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed , ref } from 'vue'
import { Canvas, CanvasStatic } from '../canvas/Canvas'
import { ComponentStatic, Resizeable } from '../canvas/Component'
import { Rect } from '../helpers/Rect'
import { Vec2 } from '../helpers/Vec2'

const props = defineProps<{
  canvas: CanvasStatic,
  selectedElements: ComponentStatic[],
  scale: number
}>()
const emit = defineEmits(['select'])

function select (element: ComponentStatic, e: MouseEvent) {
  if (!props.selectedElements.includes(element)) {
    if (e.shiftKey) {
      emit('select', element, 'multi')
    } else {
      emit('select', element, 'single')
    }
  } else {
    emit('select', element, 'remove')
  }
}

const flatElements= computed(() => {
  const rects: {
    rect: Rect
    element: ComponentStatic
  }[] = []

  function traverse (child: ComponentStatic) {
    let padding = 10
    if (child instanceof Canvas) {
      padding = 20
      rects.push({
        rect: new Rect(-padding, -padding, child.rect.width + padding * 2, child.rect.height + padding * 2),
        element: child
      })
    } else {
      rects.push({
        rect: new Rect(child.rect.x - padding, child.rect.y - padding, child.rect.width + padding * 2, child.rect.height + padding * 2),
        element: child
      })
    }

    if ('children' in child) {
      (child.children as ComponentStatic[]).forEach(traverse)
    }
  }

  traverse(props.canvas)
  return rects
})

function selected (element: ComponentStatic) {
  return props.selectedElements.includes(element)
}

const newRect = ref<Rect>()
function onPointerdown (e: PointerEvent, handle: 'tl' | 'tr' | 'br' | 'bl' | 't' | 'r' | 'b' | 'l' | 'move') {
  if (e.button !== 0) return
  e.preventDefault()
  e.stopPropagation()

  const element = props.selectedElements[0]
  if (!element) {
    console.warn('No element selected')
    return
  }

  const rect = Rect.clone(element.rect)
  const start = new Vec2(e.clientX, e.clientY)
  const startFlipX = element.flipX
  const startFlipY = element.flipY

  newRect.value = Rect.clone(rect)
  const resize = (e: PointerEvent) => {
    const delta = new Vec2(e.clientX, e.clientY).sub(start).mul(1 / props.scale)
    newRect.value = Rect.clone(rect)

    console.log(rect)

    if (handle === 'move') {
      newRect.value.x += delta.x
      newRect.value.y += delta.y
    }

    const preserveAspect = e.shiftKey
    const center = e.altKey
    let flipX = false
    let flipY = false

    if (handle === 'tl') {
      newRect.value.x += delta.x * (center ? 2 : 1)
      newRect.value.y += delta.y * (center ? 2 : 1)
      newRect.value.width -= delta.x * (center ? 2 : 1)
      newRect.value.height -= delta.y * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.value.height = newRect.value.width / rect.width * rect.height
        newRect.value.y = rect.y + rect.height - newRect.value.height
      }
    }

    if (handle === 'tr') {
      newRect.value.y += delta.y * (center ? 2 : 1)
      newRect.value.width += delta.x * (center ? 2 : 1)
      newRect.value.height -= delta.y * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.value.height = newRect.value.width / rect.width * rect.height
        newRect.value.y = rect.y + rect.height - newRect.value.height
      }
    }

    if (handle === 'br') {
      newRect.value.width += delta.x * (center ? 2 : 1)
      newRect.value.height += delta.y * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.value.height = newRect.value.width / rect.width * rect.height
      }
    }

    if (handle === 'bl') {
      newRect.value.x += delta.x * (center ? 2 : 1)
      newRect.value.width -= delta.x * (center ? 2 : 1)
      newRect.value.height += delta.y * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.value.height = newRect.value.width / rect.width * rect.height
      }
    }

    if (handle === 't') {
      newRect.value.y += delta.y * (center ? 2 : 1)
      newRect.value.height -= delta.y * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.value.width = newRect.value.height / rect.height * rect.width
        newRect.value.y = rect.y + rect.height - newRect.value.height
        newRect.value.x = rect.x + (rect.width - newRect.value.width) / 2
      }
    }

    if (handle === 'r') {
      newRect.value.width += delta.x * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.value.height = newRect.value.width / rect.width * rect.height
        newRect.value.y = rect.y + (rect.height - newRect.value.height) / 2
      }
    }

    if (handle === 'b') {
      newRect.value.height += delta.y * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.value.width = newRect.value.height / rect.height * rect.width
        newRect.value.x = rect.x + (rect.width - newRect.value.width) / 2
      }
    }

    if (handle === 'l') {
      newRect.value.x += delta.x * (center ? 2 : 1)
      newRect.value.width -= delta.x * (center ? 2 : 1)
      if (preserveAspect) {
        newRect.value.height = newRect.value.width / rect.width * rect.height
        newRect.value.x = rect.x + rect.width - newRect.value.width
        newRect.value.y = rect.y + (rect.height - newRect.value.height) / 2
      }
    }
    if (center) {
      newRect.value.x = rect.x + (rect.width - newRect.value.width) / 2
      newRect.value.y = rect.y + (rect.height - newRect.value.height) / 2
    }

    flipX = newRect.value.width < 0
    flipY = newRect.value.height < 0

    if (flipX) {
      newRect.value.x += newRect.value.width
      newRect.value.width *= -1
    }

    if (flipY) {
      newRect.value.y += newRect.value.height
      newRect.value.height *= -1
    }

    element.rect = newRect.value
    element.flipX = flipX ? !startFlipX : startFlipX
    element.flipY = flipY ? !startFlipY : startFlipY
  }

  const stop = () => {
    window.removeEventListener('pointermove', resize)
    window.removeEventListener('pointerup', stop)
    element.rect = newRect.value ?? element.rect
    newRect.value = undefined
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
        outline: 2px solid rgb(255, 0, 183, 0.5);
      }
    }

    &--selected {
      z-index: 1;
      .canvas-overlay__element {
        outline: 1px solid rgb(255, 0, 183, 0.5) !important;
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
      border: rgb(255, 0, 183) solid 1px;
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
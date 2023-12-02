<template>
  <div
    class="rect-handles"
    :style="{
      position: 'absolute',
      left: `${computedRect.x * props.scale}px`,
      top: `${computedRect.y * props.scale}px`,
      width: `${computedRect.width * props.scale}px`,
      height: `${computedRect.height * props.scale}px`,
    }"
  >
    <div
      class="rect-handles__move"
      @pointerdown="(e) => onPointerdown(e, 'move')"
    />
    <div
      :class="['rect-handles__resize-handles', {
        'rect-handles__resize-handles--crop-t': crop?.top > 0,
        'rect-handles__resize-handles--crop-r': crop?.right > 0,
        'rect-handles__resize-handles--crop-b': crop?.bottom > 0,
        'rect-handles__resize-handles--crop-l': crop?.left > 0
      }]"
    >
      <div
        class="rect-handles__resize-edge rect-handles__resize-edge--t"
        @pointerdown="(e) => onPointerdown(e, 't')"
      >
        <div class="rect-handles__resize-handle" />
      </div>
      <div
        class="rect-handles__resize-edge rect-handles__resize-edge--r"
        @pointerdown="(e) => onPointerdown(e, 'r')"
      >
        <div class="rect-handles__resize-handle" />
      </div>
      <div
        class="rect-handles__resize-edge rect-handles__resize-edge--l"
        @pointerdown="(e) => onPointerdown(e, 'l')"
      >
        <div class="rect-handles__resize-handle" />
      </div>
      <div
        class="rect-handles__resize-edge rect-handles__resize-edge--b"
        @pointerdown="(e) => onPointerdown(e, 'b')"
      >
        <div class="rect-handles__resize-handle" />
      </div>
      <div
        class="rect-handles__resize-handle rect-handles__resize-handle--tl"
        @pointerdown="(e) => onPointerdown(e, 'tl')"
      />
      <div
        class="rect-handles__resize-handle rect-handles__resize-handle--tr"
        @pointerdown="(e) => onPointerdown(e, 'tr')"
      />
      <div
        class="rect-handles__resize-handle rect-handles__resize-handle--br"
        @pointerdown="(e) => onPointerdown(e, 'br')"
      />
      <div
        class="rect-handles__resize-handle rect-handles__resize-handle--bl"
        @pointerdown="(e) => onPointerdown(e, 'bl')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Margin } from '../helpers/Margin'
import { Rect } from '../helpers/Rect'
import { Vec2 } from '../helpers/Vec2'
import { TransformMatrix } from '../helpers/TransformMatrix'
import { ref, Ref , watch , computed } from 'vue'

const props = defineProps<{
  rect: Rect,
  crop?: Margin,
  transformMatrix?: TransformMatrix,
  scale: number
}>()

const emit = defineEmits<{
  (e: 'update', value: {
    rect: Rect,
    crop?: Margin,
    transformMatrix?: TransformMatrix
  }, old: {
    rect: Rect,
    crop?: Margin,
    transformMatrix?: TransformMatrix
  }): void
  (e: 'start', value: {
    rect: Rect,
    crop?: Margin,
    transformMatrix?: TransformMatrix
  }): void
  (e: 'end', value: {
    rect: Rect,
    crop?: Margin,
    transformMatrix?: TransformMatrix
  }): void
}>()

const rect = ref(props.rect) as Ref<Rect>
const crop = ref(props.crop) as Ref<Margin | null>
const transformMatrix = ref(props.transformMatrix) as Ref<TransformMatrix | null>

watch(() => [props.rect, props.crop, props.transformMatrix], () => {
  rect.value = props.rect
  crop.value = props.crop ?? null
  transformMatrix.value = props.transformMatrix ?? null
})

const displayRect = ref(null) as Ref<Rect | null>
const displayCrop = ref(null) as Ref<Margin | null>
const displayTransformMatrix = ref(null) as Ref<TransformMatrix | null>

const computedRect = computed(() => {
  const rect = displayRect.value ?? props.rect
  const crop = displayCrop.value ?? props.crop ?? new Margin()

  return new Rect(
    rect.x + crop.left,
    rect.y + crop.top,
    rect.width - crop.left - crop.right,
    rect.height - crop.top - crop.bottom
  )
})

function onPointerdown (e: PointerEvent, handle: 'tl' | 'tr' | 'br' | 'bl' | 't' | 'r' | 'b' | 'l' | 'move') {
  if (e.button !== 0) return

  e.preventDefault()
  e.stopPropagation()

  const start = new Vec2(e.clientX, e.clientY)
  const startRectRaw = Rect.clone(rect.value)
  const startRect = Rect.clone(rect.value)

  const startCrop = crop.value ? Margin.clone(crop.value) : null

  if (startCrop) {
    startRect.x += startCrop.left
    startRect.y += startCrop.top
    startRect.width -= startCrop.left + startCrop.right
    startRect.height -= startCrop.top + startCrop.bottom
  }

  const startMatrix = transformMatrix.value ? TransformMatrix.clone(transformMatrix.value) : null

  let cropping = startCrop && e.ctrlKey && handle !== 'move'
  let preserveAspect = e.shiftKey
  let center = e.altKey

  let newRect = Rect.clone(startRect)
  let newCrop = startCrop ? Margin.clone(startCrop) : null
  let flipX = false
  let flipY = false

  emit('start', {
    rect: startRectRaw,
    crop: startCrop ?? undefined,
    transformMatrix: startMatrix ?? undefined
  })

  const resize = (e: PointerEvent) => {
    newRect = Rect.clone(startRect)
    newCrop = startCrop ? Margin.clone(startCrop) : null

    const delta = new Vec2(e.clientX, e.clientY).sub(start).mul(1 / props.scale)

    preserveAspect = e.shiftKey
    center = e.altKey
    cropping = startCrop && e.ctrlKey && handle !== 'move'

    switch (handle) {
      case 'move':
        newRect.x += delta.x
        newRect.y += delta.y
        break
      case 'tl':
        newRect.x += delta.x * (center ? 2 : 1)
        newRect.y += delta.y * (center ? 2 : 1)
        newRect.width -= delta.x * (center ? 2 : 1)
        newRect.height -= delta.y * (center ? 2 : 1)
        if (preserveAspect) {
          newRect.height = newRect.width / startRect.width * startRect.height
          newRect.y = startRect.y + startRect.height - newRect.height
        }
        break
      case 'tr':
        newRect.y += delta.y * (center ? 2 : 1)
        newRect.width += delta.x * (center ? 2 : 1)
        newRect.height -= delta.y * (center ? 2 : 1)
        if (preserveAspect) {
          newRect.height = newRect.width / startRect.width * startRect.height
          newRect.y = startRect.y + startRect.height - newRect.height
        }
        break
      case 'br':
        newRect.width += delta.x * (center ? 2 : 1)
        newRect.height += delta.y * (center ? 2 : 1)
        if (preserveAspect) {
          newRect.height = newRect.width / startRect.width * startRect.height
        }
        break
      case 'bl':
        newRect.x += delta.x * (center ? 2 : 1)
        newRect.width -= delta.x * (center ? 2 : 1)
        newRect.height += delta.y * (center ? 2 : 1)
        if (preserveAspect) {
          newRect.height = newRect.width / startRect.width * startRect.height
        }
        break
      case 't':
        newRect.y += delta.y * (center ? 2 : 1)
        newRect.height -= delta.y * (center ? 2 : 1)
        if (preserveAspect) {
          newRect.width = newRect.height / startRect.height * startRect.width
          newRect.y = startRect.y + startRect.height - newRect.height
          newRect.x = startRect.x + (startRect.width - newRect.width) / 2
        }
        break
      case 'r':
        newRect.width += delta.x * (center ? 2 : 1)
        if (preserveAspect) {
          newRect.height = newRect.width / startRect.width * startRect.height
          newRect.y = startRect.y + (startRect.height - newRect.height) / 2
        }
        break
      case 'b':
        newRect.height += delta.y * (center ? 2 : 1)
        if (preserveAspect) {
          newRect.width = newRect.height / startRect.height * startRect.width
          newRect.x = startRect.x + (startRect.width - newRect.width) / 2
        }
        break
      case 'l':
        newRect.x += delta.x * (center ? 2 : 1)
        newRect.width -= delta.x * (center ? 2 : 1)
        if (preserveAspect) {
          newRect.height = newRect.width / startRect.width * startRect.height
          newRect.x = startRect.x + startRect.width - newRect.width
          newRect.y = startRect.y + (startRect.height - newRect.height) / 2
        }
        break
    }

    if (center) {
      newRect.x = startRect.x + (startRect.width - newRect.width) / 2
      newRect.y = startRect.y + (startRect.height - newRect.height) / 2
    }

    if (!cropping) {
      flipX = newRect.width < 0
      flipY = newRect.height < 0
    }

    if (flipX) {
      if (startCrop && startMatrix) {
        newRect.x += newRect.width
        newRect.width *= -1
      }
    }

    if (flipY) {
      if (startCrop && startMatrix) {
        newRect.y += newRect.height
        newRect.height *= -1
      }
    }

    // Clamp rect
    if (handle.includes('l') && !startCrop) {
      newRect.x = Math.min(newRect.x, startRect.x + startRect.width)
    }
    if (handle.includes('t') && !startCrop) {
      newRect.y = Math.min(newRect.y, startRect.y + startRect.height)
    }
    newRect.width = Math.max(0, newRect.width)
    newRect.height = Math.max(0, newRect.height)

    if (startCrop) {
      newRect.x -= startCrop.left
      newRect.y -= startCrop.top
      newRect.width += startCrop.left + startCrop.right
      newRect.height += startCrop.top + startCrop.bottom
    }

    if (newCrop && startCrop) {
      if (cropping) {
        newCrop.top += newRect.y - startRectRaw.y
        newCrop.right += startRectRaw.width - newRect.width - newRect.x + startRectRaw.x
        newCrop.bottom += startRectRaw.height - newRect.height - newRect.y + startRectRaw.y
        newCrop.left += newRect.x - startRectRaw.x
      }
      if (flipX) {
        newCrop.right = startCrop.left
        newCrop.left = startCrop.right
        newRect.x += newCrop.right - newCrop.left
      }
      if (flipY) {
        newCrop.top = startCrop.bottom
        newCrop.bottom = startCrop.top
        newRect.y += newCrop.bottom - newCrop.top
      }
    }

    apply()
  }

  const apply = () => {
    if (cropping && startCrop) {
      rect.value = Rect.clone(startRectRaw)
      crop.value = newCrop

      if (startCrop) {
        crop.value!.top = Math.round(crop.value!.top)
        crop.value!.right = Math.round(crop.value!.right)
        crop.value!.bottom = Math.round(crop.value!.bottom)
        crop.value!.left = Math.round(crop.value!.left)
      }

    } else {
      if (startMatrix) {
        let newMatrix = TransformMatrix.clone(startMatrix)
        if (flipX) {
          newMatrix = newMatrix.scale(-1, 1)
        }
        if (flipY) {
          newMatrix = newMatrix.scale(1, -1)
        }
        transformMatrix.value = newMatrix
      }

      crop.value = newCrop

      rect.value.x = Math.round(newRect.x)
      rect.value.y = Math.round(newRect.y)
      rect.value.width = Math.round(newRect.width)
      rect.value.height = Math.round(newRect.height)
    }

    if (startCrop) {
      crop.value!.top = Math.max(0, crop.value!.top)
      crop.value!.right = Math.max(0, crop.value!.right)
      crop.value!.bottom = Math.max(0, crop.value!.bottom)
      crop.value!.left = Math.max(0, crop.value!.left)
    }

    displayRect.value = rect.value
    displayCrop.value = crop.value
    displayTransformMatrix.value = transformMatrix.value

    emit('update', {
      rect: rect.value,
      crop: crop.value ?? undefined,
      transformMatrix: transformMatrix.value ?? undefined
    }, {
      rect: startRectRaw,
      crop: startCrop ?? undefined,
      transformMatrix: startMatrix ?? undefined
    })
  }

  const stop = () => {
    window.removeEventListener('pointermove', resize)
    window.removeEventListener('pointerup', stop)
    apply()

    displayRect.value = null
    displayCrop.value = null
    displayTransformMatrix.value = null

    emit('end', {
      rect: rect.value,
      crop: crop.value ?? undefined,
      transformMatrix: transformMatrix.value ?? undefined
    })
  }

  window.addEventListener('pointermove', resize)
  window.addEventListener('pointerup', stop)

}
</script>

<style lang="scss" scoped>
@use '../style/variables' as v;

.rect-handles {
  pointer-events: none;
  $handle-size: 15px;
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

    &::before {
      content: '';
      position: absolute;
      inset: -1px;
      border: v.$primary solid 2px;
    }

    $crop-color: v.$secondary;

    &--crop-t {
      &::before {
        border-top-color: $crop-color;
      }
      .rect-handles__resize-edge--b .rect-handles__resize-handle {
        border-color: $crop-color;
      }
    }

    &--crop-r {
      &::before {
        border-right-color: $crop-color;
      }
      .rect-handles__resize-edge--r .rect-handles__resize-handle {
        border-color: $crop-color;
      }
    }

    &--crop-b {
      &::before {
        border-bottom-color: $crop-color;
      }
      .rect-handles__resize-edge--b .rect-handles__resize-handle {
        border-color: $crop-color;
      }
    }

    &--crop-l {
      &::before {
        border-left-color: $crop-color;
      }
      .rect-handles__resize-edge--l .rect-handles__resize-handle {
        border-color: $crop-color;
      }
    }
  }

  &__resize-handle {
    pointer-events: auto;
    position: absolute;
    width: $handle-size;
    height: $handle-size;
    border: v.$primary solid 1px;
    background: white;
    border-radius: $handle-size * 0.5;
    z-index: 1;

    &::before {
      content: '';
      position: absolute;
      inset: -$handle-size * 0.5;
      z-index: 2;
    }

    &--tl {
      top: -$handle-size * 0.5;
      left: -$handle-size * 0.5;
      cursor: nwse-resize;
    }

    &--tr {
      top: -$handle-size * 0.5;
      right: -$handle-size * 0.5;
      cursor: nesw-resize;
    }

    &--br {
      bottom: -$handle-size * 0.5;
      right: -$handle-size * 0.5;
      cursor: nwse-resize;
    }

    &--bl {
      bottom: -$handle-size * 0.5;
      left: -$handle-size * 0.5;
      cursor: nesw-resize;
    }
  }

  &__resize-edge {
    pointer-events: auto;
    position: absolute;
    z-index: 1;
    overflow: hidden;

    .rect-handles__resize-handle {
      max-height: calc(100% - #{$handle-size});
      min-height: $handle-size * 0.5;

      max-width: calc(100% - #{$handle-size});
      min-width: $handle-size * 0.5;
    }

    &--t {
      top: -$handle-size * 0.5;
      left: 0;
      right: 0;
      height: $handle-size;
      cursor: ns-resize;

      .rect-handles__resize-handle {
        left: 50%;
        height: $handle-size * 0.5;
        width: $handle-size * 2;
        top: $handle-size * 0.25;
        transform: translateX(-50%);
      }
    }

    &--r {
      top: 0;
      right: -$handle-size * 0.5;
      bottom: 0;
      width: $handle-size;
      cursor: ew-resize;

      .rect-handles__resize-handle {
        top: 50%;
        width: $handle-size * 0.5;
        height: $handle-size * 2;
        right: $handle-size * 0.25;
        transform: translateY(-50%);
      }
    }

    &--l {
      top: 0;
      left: -$handle-size * 0.5;
      bottom: 0;
      width: $handle-size;
      cursor: ew-resize;

      .rect-handles__resize-handle {
        top: 50%;
        width: $handle-size * 0.5;
        height: $handle-size * 2;
        left: $handle-size * 0.25;
        transform: translateY(-50%);
      }
    }

    &--b {
      bottom: -$handle-size * 0.5;
      left: 0;
      right: 0;
      height: $handle-size;
      cursor: ns-resize;

      .rect-handles__resize-handle {
        left: 50%;
        height: $handle-size * 0.5;
        width: $handle-size * 2;
        bottom: $handle-size * 0.25;
        transform: translateX(-50%);
      }
    }
  }
}
</style>
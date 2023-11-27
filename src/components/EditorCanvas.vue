<template>
  <div
    ref="root"
    class="editor-canvas"
    @wheel="onWheel"
    @pointerdown="onPointerdown"
  >
    <div
      class="editor-canvas__bg"
      :style="{
        '--grid-offset-x': `${translate.x % (gridSize * scale)}px`,
        '--grid-offset-y': `${translate.y % (gridSize * scale)}px`,
        '--grid-scale': `${scale}`,
        '--grid-size': `${gridSize}px`
      }"
      @click="select(null, 'remove')"
    />
    <div
      class="editor-canvas__grid"
      :style="{
        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`
      }"
    >
      <div class="editor-canvas__wrapper">
        <template
          v-for="canvas in canvases"
          :key="canvas.id"
        >
          <div class="editor-canvas__canvas">
            <CanvasRenderer
              :canvas="canvas"
              :components="components"
            />
            <!-- <div
              :style="{
                width: `${canvas.size.x}px`,
                height: `${canvas.size.y}px`
              }"
            /> -->
            <CanvasOverlay
              :canvas="canvas"
              :components="components"
              :selection="selection"
              :scale="scale"
              @select="select"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref , computed } from 'vue'
import { Vec2 } from '../helpers/Vec2'
import CanvasOverlay from './CanvasOverlay.vue'
import { useVModel } from '@vueuse/core'
import { Canvas } from '../canvas/Canvas'
import { Component } from '../canvas/Component'
import CanvasRenderer from './CanvasRenderer.vue'
import { Slot } from '../canvas/Slot'

const props = defineProps<{
  canvases: Canvas[]
  components: Component[]
  selection: Slot[]
}>()
const emit = defineEmits(['update:selection'])

const root = ref<HTMLElement>()

const translate = ref(new Vec2())
const scale = ref(1)

const selection = useVModel(props, 'selection', emit)

const gridSize = computed(() => {
  if (scale.value < 0.0625) return 800
  if (scale.value < 0.125) return 400
  if (scale.value < 0.25) return 200
  if (scale.value < 0.5) return 100
  return 50
})

function select (slot: Slot | null, action: 'multi' | 'single' | 'remove' = 'single') {
  if (slot === null) {
    selection.value = []
    return
  }

  if (action === 'single') {
    selection.value = [slot]
    return
  }
  if (action === 'remove') {
    selection.value = selection.value?.filter((el) => el !== slot) ?? null
    return
  }
  selection.value.push(slot)
}

function scaleFromPointOnScreen (point: Vec2, s: number) {
  if (!root.value) return

  s = Math.max(0.0625, Math.min(30, s))

  const pointOnCanvas = point
    .sub(new Vec2(root.value.clientWidth / 2, root.value.clientHeight / 2))
    .sub(new Vec2(root.value.offsetLeft, root.value.offsetTop))
    .sub(translate.value)
    .div(scale.value)
  translate.value = translate.value.sub(pointOnCanvas.mul(s - scale.value))
  scale.value = s
}

function onWheel (e: WheelEvent) {
  if (e.ctrlKey) {
    const newScale = scale.value * (1 - e.deltaY / 300)
    scaleFromPointOnScreen(new Vec2(e.clientX, e.clientY), newScale)
  } else {
    const delta = new Vec2(e.deltaX, e.deltaY)
    translate.value = translate.value.sub(delta)
  }
}

function onPointerdown (e: PointerEvent) {
  if (e.button !== 1) return

  const start = new Vec2(e.clientX, e.clientY)
  const startTranslate = translate.value

  function onPointermove (e: PointerEvent) {
    const current = new Vec2(e.clientX, e.clientY)
    translate.value = startTranslate.add(current.sub(start))
  }

  function onPointerup () {
    window.removeEventListener('pointermove', onPointermove)
    window.removeEventListener('pointerup', onPointerup)
  }

  window.addEventListener('pointermove', onPointermove)
  window.addEventListener('pointerup', onPointerup)
}
</script>

<style lang="scss" scoped>
@use '../settings.scss' as s;

.editor-canvas {
  position: relative;
  overflow: hidden;
  height: 100%;

  &__grid {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
  }

  &__bg {
    position: absolute;
    inset: 0;

    background:
      radial-gradient(
        s.$button-background 0%,
        s.$button-background 8%,
        transparent 8%,
        transparent 100%
      ),
      #111;
    background-size:
      calc(var(--grid-size) * var(--grid-scale))
      calc(var(--grid-size) * var(--grid-scale));
    background-position:
      calc(50% + var(--grid-offset-x) + var(--grid-size) / 2 * var(--grid-scale))
      calc(50% + var(--grid-offset-y) + var(--grid-size) / 2 * var(--grid-scale));
  }

  &__wrapper {
    transform: translate(-50%, -50%);
    width: fit-content;
    height: fit-content;
    display: flex;
    flex-direction: row;
    align-items: start;
    justify-content: left;
    gap: 3rem;
  }

  &__canvas {
    position: relative;
    background-color: #000;
  }
}
</style>
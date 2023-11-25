<template>
  <div
    ref="root"
    class="editor-canvas"
    @wheel="onWheel"
    @pointerdown="onPointerdown"
  >
    <div
      class="editor-canvas__bg"
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
          v-for="canvas in canvasArr"
          :key="canvas.id"
        >
          <div class="editor-canvas__canvas">
            <!-- <CanvasRenderer :canvas="canvas" /> -->
            <div
              :style="{
                width: `${canvas.rect.width}px`,
                height: `${canvas.rect.height}px`
              }"
            />
            <CanvasOverlay
              :canvas="canvas"
              :selected-elements="(selection as ComponentStatic[])"
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
import { ref } from 'vue'
import { CanvasStatic } from '../canvas/Canvas'
import { Vec2 } from '../helpers/Vec2'
// import CanvasRenderer from './CanvasRenderer.vue'
import CanvasOverlay from './CanvasOverlay.vue'
import { ComponentStatic } from '../canvas/Component'
import { useVModel } from '@vueuse/core'

const props = defineProps<{
  canvasArr: CanvasStatic[],
  selection: ComponentStatic[]
}>()
const emit = defineEmits(['update:selection'])

const root = ref<HTMLElement>()

const translate = ref(new Vec2())
const scale = ref(1)

const selection = useVModel(props, 'selection', emit)

function select (element: ComponentStatic | null, action: 'multi' | 'single' | 'remove' = 'single') {
  if (element === null) {
    selection.value = []
    return
  }

  if (action === 'single') {
    selection.value = [element]
    return
  }
  if (action === 'remove') {
    selection.value = selection.value?.filter((el) => el !== element) ?? null
    return
  }
  selection.value.push(element)
  console.log(selection.value)
}

function scaleFromPointOnScreen (point: Vec2, s: number) {
  if (!root.value) return
  const pointOnCanvas = point
    .sub(new Vec2(root.value.clientWidth / 2, root.value.clientHeight / 2))
    .sub(translate.value)
    .div(scale.value)
  translate.value = translate.value.sub(pointOnCanvas.mul(s - scale.value))
  scale.value = s
}

function onWheel (e: WheelEvent) {
  if (e.ctrlKey) {
    const newScale = scale.value * (1 - e.deltaY / 1000)
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
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
        '--grid-offset-x': `${translate.x % (gridSize * scale) + (gridSize * scale) / 2}px`,
        '--grid-offset-y': `${translate.y % (gridSize * scale) + (gridSize * scale) / 2}px`,
        '--grid-scale': `${scale}`,
        '--grid-size': `${gridSize}px`
      }"
      @click="editor.deselectAll()"
    />
    <div
      class="editor-canvas__grid"
      :style="{
        transform: `translate(${translate.x}px, ${translate.y}px)`
      }"
    >
      <div class="editor-canvas__scene">
        <div
          v-for="slice in slices"
          :key="slice.id"
          class="editor-canvas__scene__slice-background"
          :style="{
            position: 'absolute',
            left: `${slice.rect.x * scale}px`,
            top: `${slice.rect.y * scale}px`,
            width: `${slice.rect.width * scale}px`,
            height: `${slice.rect.height * scale}px`
          }"
        />
        <SceneRenderer
          v-if="editor.activeScene"
          :editor="editor"
          :scene="editor.activeScene"
          :style="{
            transform: `scale(${scale})`
          }"
        />
        <template
          v-for="slice in slices"
          :key="slice.id"
        >
          <div
            class="editor-canvas__slice"
            :style="{
              position: 'absolute',
              left: `${slice.rect.x * scale}px`,
              top: `${slice.rect.y * scale}px`,
              width: `${slice.rect.width * scale}px`,
              height: `${slice.rect.height * scale}px`
            }"
          >
            <div class="editor-canvas__slice__controls">
              <EditorSliceNameInput
                :slice="slice"
                :editor="editor"
              />
            </div>
          </div>
        </template>
        <SceneOverlay
          v-if="editor.activeScene"
          :editor="editor"
          :scene="editor.activeScene"
          :scale="scale"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Vec2 } from '../helpers/Vec2'
import { Editor } from '../editor/Editor'
import EditorSliceNameInput from './EditorSliceNameInput.vue'
import SceneRenderer from './SceneRenderer.vue'
import SceneOverlay from './SceneOverlay.vue'

const props = defineProps<{
  editor: Editor
}>()

const slices = computed(() => props.editor.slices)
const root = ref<HTMLElement>()

const translate = ref(new Vec2())
// const translate = computed({
//   get: () => _translate.value,
//   set: (v) => {
//     const padding = 100
//     const xView = root.value!.clientWidth
//     const yView = root.value!.clientHeight
//     const xCanvas = canvases.value.reduce((acc, cur) => acc + cur.size.x * scale.value, 0) + (canvases.value.length - 1) * 20 * scale.value
//     const yCanvas = canvases.value.reduce((acc, cur) => Math.max(acc, cur.size.y), 0) * scale.value
//     const maxX = xCanvas + xView / 2 - padding
//     const maxY = yCanvas + yView / 2 - padding

//     _translate.value = new Vec2(
//       Math.min(xView / 2 - padding, Math.max(-maxX, v.x)),
//       Math.min(yView / 2 - padding, Math.max(-maxY, v.y))
//     )
//   }
// })

const scale = ref(1)

const gridSize = computed(() => {
  if (scale.value < 0.0625) return 800
  if (scale.value < 0.125) return 400
  if (scale.value < 0.25) return 200
  if (scale.value < 0.5) return 100
  return 50
})

function scaleFromPointOnScreen (point: Vec2, s: number) {
  if (!root.value) return

  s = Math.max(0.0625, Math.min(30, s))

  const pointOnCanvas = point
    .sub(new Vec2(root.value.clientWidth / 2, root.value.clientHeight / 2))
    .sub(new Vec2(root.value.offsetLeft, root.value.offsetTop))
    .sub(translate.value)
    .div(scale.value)

  const oldScale = scale.value
  scale.value = s

  translate.value = translate.value.sub(pointOnCanvas.mul(s - oldScale))
}

function onWheel (e: WheelEvent) {
  console.log(e)
  if (!root.value) return
  if (grabbing.value) return

  if (e.ctrlKey) {
    const newScale = scale.value * (1 - Math.min(500, e.deltaY / 200))
    scaleFromPointOnScreen(new Vec2(e.clientX, e.clientY), newScale)
  } else {
    const delta = new Vec2(e.deltaX, e.deltaY)
    translate.value = translate.value.sub(delta)
  }
}

const grabbing = ref(false)
function onPointerdown (e: PointerEvent) {
  if (e.button !== 1) return

  grabbing.value = true
  const start = new Vec2(e.clientX, e.clientY)
  const startTranslate = translate.value

  function onPointermove (e: PointerEvent) {
    const current = new Vec2(e.clientX, e.clientY)
    translate.value = startTranslate.add(current.sub(start))
  }

  function onPointerup () {
    window.removeEventListener('pointermove', onPointermove)
    window.removeEventListener('pointerup', onPointerup)

    grabbing.value = false
  }

  window.addEventListener('pointermove', onPointermove)
  window.addEventListener('pointerup', onPointerup)
}
</script>

<style lang="scss" scoped>
@use '../style/variables' as v;

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
        map-get(v.$grey, 'darken-4') 0%,
        map-get(v.$grey, 'darken-4') 8%,
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

  &__slice {
    position: relative;
    outline: 2px dashed map-get(v.$grey, 'darken-3');

    &__controls {
      pointer-events: all;
      z-index: 1;
      position: absolute;
      bottom: calc(100% + .2rem);
      left: 0;
    }
  }

  &__scene {
    pointer-events: none;

    &__slice-background {
      background: #000;
    }
  }
}
</style>
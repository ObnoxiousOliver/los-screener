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
        transform: `translate(${translate.x}px, ${translate.y}px)`
      }"
    >
      <template
        v-for="(canvas, i) in canvases"
        :key="canvas.id"
      >
        <div
          class="editor-canvas__canvas"
          :style="{
            position: 'absolute',
            left: `${canvases.slice(0, i).reduce((acc, cur) => acc + (cur.size.x + 20) * scale, 0)}px`,
            width: `${canvas.size.x * scale}px`,
            height: `${canvas.size.y * scale}px`,
          }"
        >
          <CanvasRenderer
            :canvas="canvas"
            :editor="editor"
            :style="{
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }"
          />
          <CanvasOverlay
            :canvas="canvas"
            :editor="editor"
            :scale="scale"
            @select="select"
          />
          <div
            class="editor-canvas__canvas__name"
            :data-canvas-name="canvas.name.length === 0 ? '.' : canvas.name"
          >
            <input
              :value="canvas.name"
              type="text"
              @input="(e) => {
                const v = (e.target as HTMLInputElement).value
                canvas.name = v
                sendCanvasUpdate(canvas.id, canvas.toJSON())
              }"
            >
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Vec2 } from '../helpers/Vec2'
import CanvasOverlay from './CanvasOverlay.vue'
import CanvasRenderer from './CanvasRenderer.vue'
import { Slot } from '../canvas/Slot'
import { sendCanvasUpdate } from '../main'
import { Editor } from '../editor/Editor'

const props = defineProps<{
  editor: Editor
}>()

const canvases = computed(() => props.editor.canvases)
const root = ref<HTMLElement>()

const _translate = ref(new Vec2())
const translate = computed({
  get: () => _translate.value,
  set: (v) => {
    const padding = 100
    const xView = root.value!.clientWidth
    const yView = root.value!.clientHeight
    const xCanvas = canvases.value.reduce((acc, cur) => acc + cur.size.x * scale.value, 0) + (canvases.value.length - 1) * 20 * scale.value
    const yCanvas = canvases.value.reduce((acc, cur) => Math.max(acc, cur.size.y), 0) * scale.value
    const maxX = xCanvas + xView / 2 - padding
    const maxY = yCanvas + yView / 2 - padding

    _translate.value = new Vec2(
      Math.min(xView / 2 - padding, Math.max(-maxX, v.x)),
      Math.min(yView / 2 - padding, Math.max(-maxY, v.y))
    )
  }
})

const scale = ref(1)

const gridSize = computed(() => {
  if (scale.value < 0.0625) return 800
  if (scale.value < 0.125) return 400
  if (scale.value < 0.25) return 200
  if (scale.value < 0.5) return 100
  return 50
})

function select (slot: Slot | null, action: 'multi' | 'single' | 'remove' = 'single') {
  if (slot === null) {
    props.editor.deselectAll()
    return
  }

  if (action === 'single') {
    props.editor.selectElement(slot.id)
    return
  }
  if (action === 'remove') {
    props.editor.deselectElement(slot.id)
    return
  }
  props.editor.selectElement(slot.id, true)
}

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
  if (!root.value) return
  if (grabbing.value) return

  if (e.ctrlKey) {
    const newScale = scale.value * (1 - e.deltaY / 300)
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
        #1a1a1a 0%,
        #1a1a1a 8%,
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

  // &__wrapper {
  //   transform: translate(-50%, -50%);
  //   width: fit-content;
  //   height: fit-content;
  //   display: flex;
  //   flex-direction: row;
  //   align-items: start;
  //   justify-content: left;
  //   gap: 3rem;
  // }

  &__canvas {
    position: relative;
    outline: 1px solid v.$card-border-color;

    &__name {
      position: absolute;
      top: -1.6rem;
      left: 0;
      min-width: 2rem;
      height: fit-content;
      padding: .2rem 1rem .2rem .2rem;
      line-height: 1rem;
      font-size: .8rem;

      &::before {
        opacity: 0;
        white-space: pre;
        content: attr(data-canvas-name);
      }

      input {
        padding: .2rem 1rem .2rem .2rem;
        position: absolute;
        inset: 0;
        width: 100%;
        color: map-get(v.$grey, 'darken-1');

        &:focus {
          outline: 1px solid v.$primary;
          color: black;
          background: white;
        }
      }
    }
  }
}
</style>
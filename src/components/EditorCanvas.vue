<template>
  <FocusPanel @panelkeydown="onKeydown">
    <div
      ref="root"
      class="editor-canvas"
      @wheel="onWheel"
      @pointerdown="onPointerdown"
      @scroll="onScroll"
      @focusin="onFocusin"
    >
      <div
        class="editor-canvas__bg"
        :style="{
          '--grid-offset-x': `${translate.x % (gridSize * scale) + (gridSize * scale) / 2}px`,
          '--grid-offset-y': `${translate.y % (gridSize * scale) + (gridSize * scale) / 2}px`,
          '--grid-scale': `${scale}`,
          '--grid-size': `${gridSize}px`
        }"
        @click="backgroundClick"
        @contextmenu="ctxMenu"
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
              <div class="editor-canvas__slice__controls d-flex">
                <EditorSliceNameInput
                  :slice="slice"
                  :editor="editor"
                />
                <VSpacer />
                <button
                  @click="editor.removeSlice(slice.id)"
                >
                  <VIcon>mdi-delete</VIcon>
                </button>
                <button
                  v-if="!editingSlice"
                  @click="editor.selectSlice(slice.id)"
                >
                  <VIcon>mdi-pencil</VIcon>
                </button>
              </div>
            </div>
          </template>
          <SceneOverlay
            v-if="editor.activeScene && !editingSlice"
            :editor="editor"
            :scene="editor.activeScene"
            :scale="scale"
          />
          <RectHandles
            v-if="editingSlice && editingSliceHandleRect"
            :rect="editingSliceHandleRect"
            :scale="scale"
            @update="rectHandlesUpdate"
            @end="editor.pushHistory()"
          />
        </div>
      </div>
    </div>
  </FocusPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Vec2 } from '../helpers/Vec2'
import { Editor } from '../editor/Editor'
import EditorSliceNameInput from './EditorSliceNameInput.vue'
import SceneRenderer from './SceneRenderer.vue'
import SceneOverlay from './SceneOverlay.vue'
import RectHandles from './RectHandles.vue'
import { Rect } from '../helpers/Rect'
import FocusPanel from './FocusPanel.vue'
import { ContextMenu } from '../helpers/ContextMenu'
import { ComponentFactory } from '../screener/Component'

const props = defineProps<{
  editor: Editor
}>()

watch(() => props.editor.isLoading, (v) => {
  if (!v) centerSlides()
})

const editingSlice = computed(() => props.editor.getSelectedSlice())
const editingSliceHandleRect = computed(() => {
  if (!editingSlice.value) return null

  return Rect.clone(editingSlice.value.rect)
})

function rectHandlesUpdate (value: { rect: Rect }) {
  if (!editingSlice.value) return

  const rect = value.rect.toJSON()
  props.editor.sendSliceUpdate(editingSlice.value.id, { rect })
}

function backgroundClick () {
  props.editor.deselectAll()
}

const slices = computed(() => props.editor.slices)

const translate = ref(new Vec2())

const scale = ref(1)
watch(() => scale.value, (newScale) => {
  scale.value = Math.max(0.0625, Math.min(30, newScale))
})

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

  const pointOnCanvas = pointOnScreenToCanvas(point)

  const oldScale = scale.value
  scale.value = s

  translate.value = translate.value.sub(pointOnCanvas.mul(s - oldScale))
}

function pointOnScreenToCanvas (point: Vec2) {
  if (!root.value) return new Vec2()

  const bgRect = root.value.getBoundingClientRect()

  return point
    .sub(new Vec2(bgRect.width / 2, bgRect.height / 2))
    .sub(new Vec2(bgRect.x, bgRect.y))
    .sub(translate.value)
    .div(scale.value)
}

function centerSlides () {
  if (!root.value) return

  const bgRect = root.value.getBoundingClientRect()

  const slicesRect = Rect.union(...slices.value.map((slice) => slice.rect))

  scale.value = Math.min((bgRect.width - 50) / slicesRect.width, (bgRect.height - 50) / slicesRect.height, 1)

  const slicesCenter = new Vec2(
    -(slicesRect.x + slicesRect.width / 2),
    -(slicesRect.y + slicesRect.height / 2)
  ).mul(scale.value)
  translate.value = slicesCenter

  console.log(slicesRect)
}

function onWheel (e: WheelEvent) {
  if (!root.value) return
  if (grabbing.value) return

  if (e.ctrlKey) {
    const newScale = scale.value * Math.exp(Math.min(.5, Math.max(-.5, -e.deltaY / 200)))
    console.log(Math.exp(e.deltaY / 1000))
    scaleFromPointOnScreen(new Vec2(e.clientX, e.clientY), newScale)
  } else {
    const delta = new Vec2(e.deltaX, e.deltaY).mul(0.5)
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

function onKeydown (e: KeyboardEvent) {
  if (e.key === 'Delete') {
    props.editor.removeSelectedSlots()
  }
}

const root = ref<HTMLElement>()
function onScroll () {
  if (!root.value) return

  translate.value = translate.value.sub(new Vec2(root.value.scrollLeft, root.value.scrollTop))
  root.value.scrollLeft = 0
  root.value.scrollTop = 0
}

function onFocusin (e: FocusEvent) {
  if (!root.value) return

  const rootRect = root.value.getBoundingClientRect()
  const rect = (e.target as HTMLElement).getBoundingClientRect?.()
  if (!rect) return

  if (rect.top > rootRect.top
    && rect.bottom < rootRect.bottom
    && rect.left > rootRect.left
    && rect.right < rootRect.right) return

  const center = new Vec2(
    (rootRect.left + rootRect.right) / 2,
    (rootRect.top + rootRect.bottom) / 2
  )

  const targetCenter = new Vec2(
    (rect.left + rect.right) / 2,
    (rect.top + rect.bottom) / 2
  )

  const delta = targetCenter.sub(center)

  translate.value = translate.value.sub(delta)
}

function ctxMenu (e: MouseEvent) {
  const pos = pointOnScreenToCanvas(new Vec2(e.clientX, e.clientY))
  ContextMenu.open([
    {
      label: 'Center view',
      click: centerSlides
    },
    {
      label: 'New...',
      type: 'submenu',
      submenu: [
        ...ComponentFactory.getComponents().map((component) => ({
          label: component.name,
          click: () => {
            const c = props.editor.createComponent(component.type)
            const s = props.editor.addSlotToScene(props.editor.activeScene!.id, {
              component: c.id,
              rect: new Rect(pos.x, pos.y, 100, 100).toJSON()
            })
            props.editor.selectSlot(s.id)
          }
        }))
      ]
    },
    {
      label: 'New slice',
      click: () => {
        const slice = props.editor.createSlice({
          rect: new Rect(pos.x, pos.y, 100, 100).toJSON()
        })
        props.editor.selectSlice(slice.id)
      }
    }
  ])
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
      v.$bg-dark;

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
      z-index: 1;
      position: absolute;
      bottom: calc(100% + .2rem);
      left: 0;
      right: 0;
      padding-right: .2rem;
      font-size: .8rem;

      & > * {
        pointer-events: all;
        transition: opacity .2;
      }

      & > :not(:first-child) {
        opacity: 0.4;
      }
      &:hover > :not(:first-child) {
        opacity: 1;
      }

      & > button {
        color: map-get(v.$grey, 'darken-1');
        border-radius: .2rem;
        padding: 0 .1rem;
        transition: .3s cubic-bezier(0.19, 1, 0.22, 1);

        &:hover {
          background: map-get(v.$grey, 'darken-4');
        }

        &:active {
          background: map-get(v.$grey, 'darken-3');
        }
      }
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
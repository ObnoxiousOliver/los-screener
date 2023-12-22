<template>
  <div
    ref="root"
    class="panel-split"
    :class="[
      'panel-split--' + props.direction
    ]"
  >
    <template
      v-for="(panel, i) in panels"
      :key="i"
    >
      <div
        class="panel-split__panel"
        :class="{
          'panel-split__panel--fill': computedPanelSizes[i] === null
        }"
        :style="{
          flexBasis: computedPanelSizes[i] + 'px'
        }"
      >
        <component :is="panel" />
      </div>
      <div
        v-if="i < panels.length - 1"
        class="panel-split__divider"
        @pointerdown="(e) => onDividerMouseDown(e, i)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted , watchEffect , ref , VueElement , computed } from 'vue'

const slots = defineSlots<{
  default: () => (VueElement | Element)[]
}>()
const panels = computed(() => {
  return slots.default().filter((el) => {
    return el
  })
})

const props = withDefaults(defineProps<{
  direction?: 'horizontal' | 'vertical'
  fill?: number
  widths?: number[]
}>(), {
  direction: 'horizontal',
  fill: 0,
  widths: () => []
})

const emit = defineEmits<{
  'update:widths': [number[]]
}>()

const widths = ref(props.widths)
watchEffect(() => {
  const w = Array(panels.value.length).fill(300)
  for (let i = 0; i < widths.value.length; i++) {
    w[i] = widths.value[i]
  }
  widths.value = w
  emit('update:widths', widths.value)
})

const MIN_WIDTH = 150
const root = ref<HTMLElement>()
onMounted(() => {
  const observer = new ResizeObserver(() => {
    const computedWidths = widths.value.reduce((a, b) => a + b, 0)

    const scaleFactor = Math.min(1, (props.direction === 'horizontal'
      ? root.value!.clientWidth
      : root.value!.clientHeight) / computedWidths)

    widths.value = widths.value.map((w) => Math.max(MIN_WIDTH, w * scaleFactor))
  })
  observer.observe(root.value!)

  return () => {
    observer.disconnect()
  }
})

const computedPanelSizes = computed(() => {
  const sizes: (number | null)[] = widths.value.slice()
  sizes.splice(props.fill, 0, null)
  return sizes
})

function onDividerMouseDown (e: PointerEvent, index: number) {
  e.preventDefault()
  const startX = e.clientX
  const startY = e.clientY
  const startWidths = widths.value.slice()
  const isLeftFromFill = index < props.fill

  const onMove = (e: PointerEvent) => {
    const dx = e.clientX - startX
    const dy = e.clientY - startY

    if (props.direction === 'horizontal') {
      if (isLeftFromFill) {
        widths.value[index] = startWidths[index] + dx
      } else {
        widths.value[index] = startWidths[index] - dx
      }
    } else {
      if (isLeftFromFill) {
        widths.value[index] = startWidths[index] + dy
      } else {
        widths.value[index] = startWidths[index] - dy
      }
    }

    const computedWidths = (widths.value
      .filter((_, i) => i !== index) as number[])
      .reduce((a, b) => a + b, 0)

    const maxSize = (props.direction === 'horizontal' ? root.value!.clientWidth : root.value!.clientHeight) - computedWidths

    widths.value[index] = Math.max(MIN_WIDTH, Math.min(maxSize, widths.value[index]))
  }

  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}
</script>

<style scoped lang="scss">
@use '../style/variables' as v;

.panel-split {
  display: flex;
  flex-direction: row;
  flex: 1;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: map-get(v.$grey, 'darken-3');

  &--vertical {
    flex-direction: column;
  }

  &__panel {
    flex: 0 0 auto;
    overflow: hidden;
    background: map-get(v.$grey, 'darken-4');
    position: relative;

    &--fill {
      flex-grow: 1;
    }
  }

  &__divider {
    position: relative;
    touch-action: none;

    &::before {
      content: '';
      position: absolute;
      inset: -.2rem;
      z-index: 999;
    }

    .panel-split--horizontal > & {
      cursor: ew-resize;
      width: 2px;
    }

    .panel-split--vertical > & {
      cursor: ns-resize;
      height: 2px;
    }

    transition: .2s;
    &:hover {
      background: v.$primary;
      transition: .2s .3s;
    }
  }
}
</style>
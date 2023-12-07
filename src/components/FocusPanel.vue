<template>
  <div
    class="focus-panel"
    :class="{
      'focus-panel--active': active
    }"
    v-bind="$attrs"
    @pointerdown="focus"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFocusPanels } from '../editor/FocusPanels'
import { id } from '../helpers/Id'

const emit = defineEmits(['panelkeydown'])

const focusPanels = useFocusPanels()
const panelId = id()

const active = computed(() => focusPanels.activePanel?.id === panelId)
function focus (this: any) {
  focusPanels.setActivePanel({
    id: panelId,
    sendKeydown: (e: KeyboardEvent) => {
      // console.log('sendKeydown', e)
      emit('panelkeydown', e)
    }
  })
}
</script>

<style scoped lang="scss">
@use '../style/variables' as v;

.focus-panel {
  position: absolute;
  inset: 0;

  &--active {
    &::before {
      pointer-events: none;
      z-index: 999;
      content: '';
      position: absolute;
      inset: 0;
      outline: rgba(v.$primary, 0.2) solid .2rem;
      outline-offset: -.2rem;
    }
  }
}
</style>
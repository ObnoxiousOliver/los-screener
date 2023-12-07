<template>
  <div class="panel-layout">
    <PanelSplit direction="vertical">
      <PanelSplit :fill="1">
        <slot name="left" />
        <slot />
        <slot name="right" />
      </PanelSplit>
      <slot name="bottom" />
    </PanelSplit>
  </div>
</template>

<script setup lang="ts">
import PanelSplit from './PanelSplit.vue'

</script>

<style scoped lang="scss">
.panel-layout {
  position: fixed;
  inset: 0;
}
</style>
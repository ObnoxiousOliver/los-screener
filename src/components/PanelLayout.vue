<template>
  <div class="panel-layout">
    <PanelSplit
      direction="vertical"
      :widths="[400]"
    >
      <PanelSplit
        :fill="1"
      >
        <slot name="left" />
        <slot />
        <slot name="right" />
      </PanelSplit>
      <PanelSplit
        :fill="1"
      >
        <slot name="bottom-left" />
        <slot name="bottom-right" />
      </PanelSplit>
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
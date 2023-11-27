<template>
  <div
    class="d-flex"
    style="gap: .5rem;"
  >
    <VTextField
      v-model.number="modelValue.x"
      :label="labelX ?? 'X'"
      :type="'number'"
      @update:model-value="(v: string) => {
        emit('update:modelValue', {
          x: parseFloat(v) || 0,
          y: modelValue.y,
          z: modelValue.z,
          w: modelValue.w
        })
      }"
    />
    <VTextField
      v-model.number="modelValue.y"
      :label="labelY ?? 'Y'"
      :type="'number'"
      @update:model-value="(v: string) => {
        emit('update:modelValue', {
          x: modelValue.x,
          y: parseFloat(v) || 0,
          z: modelValue.z,
          w: modelValue.w
        })
      }"
    />
  </div>
  <div
    class="d-flex"
    style="gap: .5rem;"
  >
    <VTextField
      v-model.number="modelValue.z"
      :label="labelZ ?? 'Z'"
      :type="'number'"
      @update:model-value="(v: string) => {
        emit('update:modelValue', {
          x: modelValue.x,
          y: modelValue.y,
          z: parseFloat(v) || 0,
          w: modelValue.w
        })
      }"
    />
    <VTextField
      v-model.number="modelValue.w"
      :label="labelW ?? 'W'"
      :type="'number'"
      @update:model-value="(v: string) => {
        emit('update:modelValue', {
          x: modelValue.x,
          y: modelValue.y,
          z: modelValue.z,
          w: parseFloat(v) || 0
        })
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

const props = defineProps<{
  modelValue: {
    x: number
    y: number
    z: number
    w: number
  }
  labelX?: string
  labelY?: string
  labelZ?: string
  labelW?: string
}>()

const emit = defineEmits(['update:modelValue'])

const modelValue = useVModel(props, 'modelValue', emit)
</script>
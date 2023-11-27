<template>
  <VTextField
    v-model.number="modelValue.x"
    :type="'number'"
    :label="labelX ?? 'X'"
    @update:model-value="(v: string) => {
      emit('update:modelValue', new Vec2(parseFloat(v), modelValue.y))
    }"
  />
  <VTextField
    v-model.number="modelValue.y"
    :type="'number'"
    :label="labelY ?? 'Y'"
    @update:model-value="(v: string) => {
      emit('update:modelValue', new Vec2(modelValue.x, parseFloat(v)))
    }"
  />
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { Vec2 } from '../helpers/Vec2'

const props = defineProps<{
  modelValue: Vec2,
  labelX?: string,
  labelY?: string
}>()

const emit = defineEmits(['update:modelValue'])

const modelValue = useVModel(props, 'modelValue', emit)
</script>

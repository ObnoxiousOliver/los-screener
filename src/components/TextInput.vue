<template>
  <VTextField
    :model-value="modelValue"
    :label="label"
    @update:model-value="(v: string) => {
      modelValue = v
      if (!updateOnBlur) {
        emit('update:modelValue', v)
      }
    }"
    @update:focused="(v: boolean) => {
      if (updateOnBlur && !v) {
        emit('update:modelValue', modelValue)
      }
    }"
    @keydown.enter="() => {
      if (updateOnBlur) {
        emit('update:modelValue', modelValue)
      }
    }"
    @keydown.esc="() => {
      modelValue = props.modelValue
    }"
  />
</template>

<script setup lang="ts">
import { ref , watch } from 'vue'

const props = defineProps<{
  modelValue: string,
  updateOnBlur?: boolean,
  label?: string
}>()

const emit = defineEmits(['update:modelValue'])

console.log(props.modelValue)
const modelValue = ref(props.modelValue)
watch(() => props.modelValue, (v) => {
  modelValue.value = v
})
</script>

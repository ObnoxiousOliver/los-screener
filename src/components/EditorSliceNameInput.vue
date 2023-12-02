<template>
  <div
    class="editor-slice-name-input"
    :data-slice-name="slice.name.length === 0 ? '.' : slice.name"
  >
    <input
      v-model="name"
      type="text"
      @input="(e) => {
        const v = (e.target as HTMLInputElement).value
        editor.sendSliceUpdate(slice.id, {
          ...slice.toJSON(),
          name: v
        })
      }"
    >
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { Editor } from '../editor/Editor'
import { Slice } from '../screener/Slice'

const props = defineProps<{
  slice: Slice
  editor: Editor
}>()

const name = ref(props.slice.name)
watch(() => props.slice.name, (newName) => {
  if (name.value === newName) return
  name.value = newName
})
</script>

<style scoped lang="scss">
@use '../style//variables' as v;

.editor-slice-name-input {
  min-width: 2rem;
  height: fit-content;
  line-height: 1rem;
  font-size: .8rem;
  padding: .2rem 1rem .2rem .2rem;

  &::before {
    opacity: 0;
    white-space: pre;
    content: attr(data-slice-name);
  }

  input {
    position: absolute;
    inset: 0;
    width: 100%;
    color: map-get(v.$grey, 'darken-1');
    transition: .3s cubic-bezier(0.19, 1, 0.22, 1);
    border-radius: .2rem;

    &:focus {
      outline: 1px solid v.$primary;
      color: black;
      background: white;
      padding: .3rem;
    }
  }
}
</style>
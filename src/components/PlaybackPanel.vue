<template>
  <div class="pa-2 d-flex flex-column h-100">
    <h2 class="mb-2 mx-1 text-h6 d-flex d-flex">
      Playbacks
      <VSpacer />
      <VBtn
        class="text-body-1"
        color="transparent"
        elevation="0"
        size="2rem"
        icon
      >
        <VIcon>mdi-plus</VIcon>
        <VDialog
          v-model="newPlaybackDialog"
          scrollable
          activator="parent"
          width="70%"
          height="70%"
        >
          <VCard
            class="h-100"
            rounded="lg"
          >
            <VToolbar
              height="48"
              color="grey-darken-4"
              :border="'b'"
            >
              <VToolbarTitle>New Playback</VToolbarTitle>

              <VBtn
                icon
                size="2rem"
                @click="newPlaybackDialog = false"
              >
                <VIcon>mdi-close</VIcon>
              </VBtn>
            </VToolbar>
            <VSpacer />

            <VCardText>
              <VSelect
                v-model="vid1"
                :items="[
                  ...editor.components.filter(c => c.type === 'video').map(c =>( {
                    title: c.name,
                    value: c.id
                  })),
                  {
                    title: 'None',
                    value: null
                  }
                ]"
              />
              <VSelect
                v-model="vid2"
                :items="[
                  ...editor.components.filter(c => c.type === 'video').map(c =>( {
                    title: c.name,
                    value: c.id
                  })),
                  {
                    title: 'None',
                    value: null
                  }
                ]"
              />
            </VCardText>

            <VCardActions>
              <VSpacer />
              <VBtn
                color="red"
                @click="newPlaybackDialog = false"
              >
                Cancel
              </VBtn>
              <VBtn
                @click="createPlayback(); newPlaybackDialog = false"
              >
                Create
              </VBtn>
            </VCardActions>
          </VCard>
        </VDialog>
      </VBtn>
    </h2>
    <VList
      class="bg-grey-darken-5 font-size-1 flex-grow-1"
      rounded="lg"
    >
      <VListItem
        v-for="pb in editor.playbacks"
        :key="pb.id"
        :class="{
          'bg-grey-darken-1': pb.id === editor.activePlayback?.id
        }"
        :title="pb.id"
        @click="editor.setActivePlayback(pb.id); editor.startPlayback()"
      />
    </VList>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Editor } from '../editor/Editor'

const props = defineProps<{
  editor: Editor
}>()

const newPlaybackDialog = ref(false)

const vid1 = ref<string | null>()
const vid2 = ref<string | null>()

function createPlayback () {
  if (!vid1.value || !vid2.value) return

  const pb = props.editor.createPlayback({
    timeline: {
      tracks: [
        {
          component: vid1.value,
          range: {
            start: 4,
            offset: 4,
            duration: null
          }
        },
        {
          component: vid2.value,
          range: {
            start: 0,
            offset: 0,
            duration: null
          }
        }
      ]
    }
  })
  console.log(pb)
}
</script>

<style scoped lang="scss">
@use '../style/variables' as v;

.playback-panel {
  &__container {
    display: flex;
    gap: 1rem;

    & > * {
      flex: 1;
    }
  }
}
</style>
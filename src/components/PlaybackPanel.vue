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
          max-width="400px"
        >
          <VCard rounded="lg">
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
              <VTextField
                v-model="newPlaybackName"
                label="Playback Name"
                variant="outlined"
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
                :disabled="newPlaybackName.trim().length === 0"
                @click="createPlayback(); newPlaybackDialog = false"
              >
                Create
              </VBtn>
            </VCardActions>
          </VCard>
        </VDialog>
      </VBtn>
    </h2>
    <VCard
      class="bg-grey-darken-5 font-size-1 flex-grow-1"
      rounded="lg"
    >
      <VToolbar
        height="48"
        color="transparent"
        border="b"
      >
        <VToolbarTitle>
          {{ editor.activePlayback?.name ?? 'No Active Playback' }}
        </VToolbarTitle>
        <template v-if="editor.activePlayback">
          <div>
            {{ toTimeString(progress) }} / {{ toTimeString(getPbDuration(editor.activePlayback)) }}
          </div>
          <VSlider
            v-model="progress"
            hide-details
            color="primary"
            thumb-size="10"
            track-color="grey"
            thumb-color="white"
            :min="0"
            :max="getPbDuration(editor.activePlayback)"
            :step="0.01"
            @start="seekStart"
            @update:model-value="seek"
            @end="seekEnd"
          />
        </template>
        <VBtn
          v-if="editor.activePlayback?.startTime !== null"
          icon
          size="2rem"
          @click="pause"
        >
          <VIcon>mdi-pause</VIcon>
        </VBtn>
        <VBtn
          v-else
          icon
          size="2rem"
          @click="play"
        >
          <VIcon>mdi-play</VIcon>
        </VBtn>
      </VToolbar>
      <PanelSplit :fill="1">
        <VList
          nav
          density="compact"
          class="bg-transparent"
        >
          <VListItem
            v-for="pb in editor.playbacks"
            :key="pb.id"
            :active="pb.id === selectedPlaybackId"
            :class="{
              'bg-primary': pb.id === editor.activePlayback?.id,
            }"
            @click="selectedPlaybackId = pb.id"
          >
            {{ pb.name }}
            <template #append>
              <VBtn
                v-if="pb.id === editor.activePlayback?.id"
                icon
                size="2rem"
                color="transparent"
                elevation="0"
                @click.stop="props.editor.setActivePlayback(null)"
              >
                <VIcon>mdi-close</VIcon>
              </VBtn>
              <VBtn
                v-else
                icon
                size="2rem"
                color="transparent"
                elevation="0"
                @click.stop="props.editor.setActivePlayback(pb.id)"
              >
                <VIcon>mdi-play-box</VIcon>
              </VBtn>
            </template>
          </VListItem>
        </VList>
        <div>
          <VList
            nav
            class="bg-transparent"
          >
            <VListItem
              v-for="track in selectedPlayback?.timeline.tracks ?? []"
              :key="track.component"
            >
              {{ track.component }} {{ track.range.start }} {{ track.range.offset }} {{ track.range.duration ?? 'Auto' }}
            </VListItem>
          </VList>

          <div class="ma-4">
            <VSelect
              v-model="videoComp"
              variant="outlined"
              :items="editor.components.filter(c => c.type === 'video').map(c => ({
                title: c.name,
                value: c.id
              }))"
            />
            <VBtn
              @click="addTrack"
            >
              Add
            </VBtn>
            <pre>
              {{ props.editor.activePlayback }}
            </pre>
          </div>
        </div>
      </PanelSplit>
    </VCard>
  </div>
</template>

<script setup lang="ts">
import { ref , watch , computed } from 'vue'
import { Editor } from '../editor/Editor'
import PanelSplit from './PanelSplit.vue'
import { Video } from '../screener/default/Video'
import { Playback } from '../screener/Playback'

const props = defineProps<{
  editor: Editor
}>()

const selectedPlaybackId = ref<string | null>(null)
const selectedPlayback = computed<Playback | null>(() => {
  return props.editor.playbacks.find(pb => pb.id === selectedPlaybackId.value) ?? null
})

const newPlaybackDialog = ref(false)
watch(newPlaybackDialog, (val) => {
  if (val) {
    newPlaybackName.value = ''
  }
})

const newPlaybackName = ref('')

function createPlayback () {
  if (newPlaybackName.value.trim().length === 0) return

  const pb = props.editor.createPlayback({
    name: newPlaybackName.value
  })
  console.log(pb)
}

const progress = ref(0)
const progressInterval = ref<number | null>(null)
function getPbDuration (pb: Playback) {
  let duration = 0

  for (const track of pb.timeline.tracks) {
    let dur = track.range.duration

    if (!dur) {
      let c = props.editor.getComponent(track.component)
      if (c?.type !== 'video') continue
      dur = (c as Video).duration
    }

    duration = Math.max(duration, dur + track.range.start)
  }

  return duration
}

function startProgressUpdate () {
  progressInterval.value = setInterval(() => {
    const pb = props.editor.activePlayback
    if (!pb) return

    const duration = getPbDuration(pb)

    if (duration === 0 || pb.startTime === null) {
      progress.value = 0
      return
    }

    const time = (Date.now() / 1000) - pb.startTime

    progress.value = Math.min(duration, time)
  }, 1000 / 5) as unknown as number
}

watch(() => props.editor.activePlayback, (val) => {
  if (val && progressInterval.value === null) {
    startProgressUpdate()
  } else if (!val) {
    progressInterval.value && clearInterval(progressInterval.value)
    progressInterval.value = null
  }
}, {
  immediate: true,
  deep: true
})

const videoComp = ref<string | null>(null)

function addTrack () {
  if (!videoComp.value) return
  if (!selectedPlayback.value) return

  const pb = selectedPlayback.value

  console.log(videoComp.value, pb.timeline.tracks.map(t => t.toJSON()))

  props.editor.sendPlaybackUpdate(pb.id, {
    timeline: {
      ...pb.timeline.toJSON(),
      tracks: [
        ...pb.timeline.tracks.map(t => t.toJSON()),
        {
          component: videoComp.value,
          range: {
            start: 0,
            offset: 0,
            duration: null
          }
        }
      ]
    }
  })
}

function seekStart () {
  console.log('seek start')
  progressInterval.value && clearInterval(progressInterval.value)
}

function seek (p: number) {
  props.editor.seekPlayback(p)
}

function seekEnd (p: number) {
  if (props.editor.activePlayback === null) return

  const isPlaying = props.editor.activePlayback.startTime !== null

  props.editor.seekPlayback(p)
  startProgressUpdate()

  if (isPlaying) {
    props.editor.startPlayback()
  }
}

function play () {
  props.editor.startPlayback()
  progressInterval.value && clearInterval(progressInterval.value)
  startProgressUpdate()
}

function pause () {
  props.editor.pausePlayback()
  progressInterval.value && clearInterval(progressInterval.value)
}

function toTimeString (seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds - (hours * 3600)) / 60)
  const secs = Math.floor(seconds - (hours * 3600) - (minutes * 60))

  if (hours === 0) {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
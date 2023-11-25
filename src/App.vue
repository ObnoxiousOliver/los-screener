<template>
  <VApp>
    <VNavigationDrawer app>
      <VList>
        <VListItem
          v-for="canvas in canvasArr"
          :key="canvas.id"
          @click="removeCanvas(canvas as CanvasStatic)"
        >
          <VListItemTitle>{{ canvas.name }}</VListItemTitle>
        </VListItem>
        <VDivider class="my-2" />
        <VListItem @click="newCanvas">
          <VListItemTitle>New Canvas</VListItemTitle>
        </VListItem>
        <VListItem @click="createBrowserWindows">
          <VListItemTitle>Create Views</VListItemTitle>
        </VListItem>
        <VListItem @click="createPlayback">
          <VListItemTitle>Create Playback</VListItemTitle>
        </VListItem>
        <VListItem
          v-for="playback in playbacks"
          :key="playback.id"
          @click="startPlayback(playback.id)"
        >
          <VListItemTitle>{{ playback.id }}</VListItemTitle>
        </VListItem>
      </VList>
    </VNavigationDrawer>
    <VMain>
      <EditorCanvas
        v-model:selection="selection"
        :canvas-arr="(canvasArr as CanvasStatic[])"
      />
    </VMain>
    <VNavigationDrawer location="right">
      <VList>
        <VListItem>
          <VListItemTitle>Right Drawer</VListItemTitle>
        </VListItem>

        <VListItem
          v-for="(selectedPropertiesValue, i) in selectedProperties"
          :key="(i)"
        >
          <VListItemTitle v-if="selectedPropertiesValue.type !== 'action'">
            {{ selectedPropertiesValue.name }}
          </VListItemTitle>

          <VSwitch
            v-if="selectedPropertiesValue.type === 'boolean'"
            v-model="selectedPropertiesValue.value"
          />
          <VTextField
            v-else-if="selectedPropertiesValue.type === 'string'"
            v-model="selectedPropertiesValue.value"
          />
          <VTextField
            v-else-if="selectedPropertiesValue.type === 'number'"
            v-model.number="selectedPropertiesValue.value"
            :type="'number'"
          />
          <template v-else-if="selectedPropertiesValue.type === 'xy'">
            <VTextField
              v-model.number="selectedPropertiesValue.value.x"
              label="X"
              :type="'number'"
            />
            <VTextField
              v-model.number="selectedPropertiesValue.value.y"
              label="Y"
              :type="'number'"
            />
          </template>
          <template v-else-if="selectedPropertiesValue.type === 'rect'">
            <VTextField
              v-model.number="selectedPropertiesValue.value.x"
              label="X"
              :type="'number'"
            />
            <VTextField
              v-model.number="selectedPropertiesValue.value.y"
              label="Y"
              :type="'number'"
            />
            <VTextField
              v-model.number="selectedPropertiesValue.value.width"
              label="W"
              :type="'number'"
            />
            <VTextField
              v-model.number="selectedPropertiesValue.value.height"
              label="H"
              :type="'number'"
            />
          </template>
          <VSelect
            v-else-if="selectedPropertiesValue.type === 'select'"
            v-model="selectedPropertiesValue.value"
            :items="selectedPropertiesValue.meta.options"
          />
          <VBtn
            v-else-if="selectedPropertiesValue.type === 'action'"
            @click="selectedPropertiesValue.value()"
          >
            {{ selectedPropertiesValue.name }}
          </VBtn>
        </VListItem>
      </VList>
    </VNavigationDrawer>
  </VApp>
</template>

<script setup lang="ts">
import { watch , reactive , computed , Ref , ref , toRaw } from 'vue'
import { Canvas, CanvasStatic, ComponentTypes } from './canvas/Canvas'
import EditorCanvas from './components/EditorCanvas.vue'
import { BridgeType } from './BridgeType'
import { ComponentStatic, getById } from './canvas/Component'
import { Video, VideoStatic } from './canvas/Video'
import { Playback,PlaybackEntry } from './canvas/Playback'
import { Rect } from './helpers/Rect'

declare const bridge: BridgeType

const selection = ref<ComponentStatic[]>([]) as Ref<ComponentStatic[]>
const selectedProperties = computed(() => {
  if (selection.value.length === 0) {
    return {}
  } else if (selection.value.length === 1) {
    const type = ComponentTypes[selection.value[0].type]
    return type.getProperties(selection.value[0] as any)
  } else {
    return {}
  }
})

const canvasArr = reactive<CanvasStatic[]>([])
watch(canvasArr, () => {
  // console.log('canvasArr updated', canvasArr)
  canvasArr.forEach((canvas) => {
    bridge.setCanvas(toRaw(canvas))
  })
})

bridge.onCanvasUpdate(update)
bridge.getCanvases().then(update)

function update (canvases: CanvasStatic[]) {
  // Add new canvases
  for (const newCanvas of canvases) {
    let canvas = canvasArr.find((canvas) => canvas.id === newCanvas.id)
    if (!canvas) {
      canvasArr.push(newCanvas)
    }
  }

  // Remove canvases that are no longer in the list
  const canvasIds = canvases.map((canvas) => canvas.id)
  canvasArr.forEach((canvas) => {
    if (!canvasIds.includes(canvas.id)) {
      canvasArr.splice(canvasArr.indexOf(canvas), 1)
    }
  })
}

function removeCanvas (canvas: CanvasStatic) {
  canvasArr.splice(canvasArr.indexOf(canvas), 1)
  bridge.removeCanvas(canvas.id)
}

const playbacks = reactive<Playback[]>([])
bridge.getPlaybacks().then((pbks) => {
  console.log('playbacks', playbacks)
  pbks.forEach((playback) => {
    playbacks.push(new Playback(playback.id, playback.entries.map(entry => new PlaybackEntry(getById(entry.id, canvasArr) as VideoStatic, entry.time))))
  })
})

function newCanvas () {
  const canvas = new Canvas().getStatic()

  const video = new Video({
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    rect: new Rect(0, 0, 1920, 1080)
  }).getStatic()

  Canvas.appendChild(canvas, video)

  console.log('canvas', canvas)
  canvasArr.push(canvas)
}

function createBrowserWindows () {
  bridge.createBrowserWindows(true)
}

function createPlayback () {
  const playback = new Playback()
  canvasArr.flatMap(x => [x, ...x.children]).filter(x => x.type === 'video')
  .forEach((video) => {
    playback.addEntry(new PlaybackEntry(video as VideoStatic, 0))
  })
  playbacks.push(playback)
  bridge.setPlayback(playback.id, playback.getStaticEntries())
}

function startPlayback (id: string) {
  bridge.startPlayback(id)
}
</script>
import { Plugin } from '../Component'
import { Image, ImageJSON } from './Image'
import { Text, TextJSON } from './Text'
import { Video, VideoJSON } from './Video'

export const DefaultPlugin: Plugin = {
  name: 'Default',
  components: [
    {
      type: 'video',
      fromJSON: (json) => Video.fromJSON(json as VideoJSON)
    },
    {
      type: 'image',
      fromJSON: (json) => Image.fromJSON(json as ImageJSON)
    },
    {
      type: 'text',
      fromJSON: (json) => Text.fromJSON(json as TextJSON)
    }
  ]
}
import { Plugin } from '../Component'
import { Browser, BrowserJSON } from './Browser'
import { Image, ImageJSON } from './Image'
import { Text, TextJSON } from './Text'
import { Video, VideoJSON } from './Video'

export const DefaultPlugin: Plugin = {
  name: 'Default',
  components: [
    {
      type: 'video',
      name: 'Video',
      fromJSON: (json) => Video.fromJSON(json as VideoJSON)
    },
    {
      type: 'image',
      name: 'Image',
      fromJSON: (json) => Image.fromJSON(json as ImageJSON)
    },
    {
      type: 'text',
      name: 'Text',
      fromJSON: (json) => Text.fromJSON(json as TextJSON)
    },
    {
      type: 'browser',
      name: 'Browser',
      fromJSON: (json) => Browser.fromJSON(json as BrowserJSON)
    }
  ]
}
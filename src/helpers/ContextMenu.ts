import { BridgeType } from '../BridgeType'
import { id } from './Id'

declare const bridge: BridgeType

export interface ContextMenuTemplate {
  label?: string
  id?: string
  sublabel?: string
  toolTip?: string
  accelerator?: string
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio'
  checked?: boolean
  submenu?: ContextMenuTemplate[]
  click?: () => void
}

export class ContextMenu {
  static open (template: ContextMenuTemplate[]) {
    this.giveId(template)
    const clickListeners = this.removeClickListeners(template)
    bridge.openContextMenu(template)

    console.log(clickListeners)

    const unsub = bridge.onContextMenuClicked((id) => {
      console.log(id)
      clickListeners[id]?.()
    })

    bridge.onceContextMenuClosed(() => {
      console.log('closed')
      unsub()
    })
  }

  private static removeClickListeners (template: ContextMenuTemplate[]) {
    const clickListeners: Record<string, () => void> = {}
    for (const item of template) {
      if (item.click) {
        if (item.id) clickListeners[item.id] = item.click
        item.click = undefined
      }

      if (item.submenu) {
        Object.assign(clickListeners, this.removeClickListeners(item.submenu))
      }
    }

    return clickListeners
  }

  private static giveId (template: ContextMenuTemplate[]) {
    for (const item of template) {
      if (!item.id) item.id = id()

      if (item.submenu) {
        this.giveId(item.submenu)
      }
    }
  }
}
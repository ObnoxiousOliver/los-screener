export type PropertyOptions = {
  type: 'select'
  options: { label: string, value: string }[]
} | {
  type: 'text',
  updateOnBlur?: boolean
} | {
  type: 'textbox'
} | {
  type: 'number'
} | {
  type: 'boolean'
} | {
  type: 'vec2'
  labels?: [string, string]
} | {
  type: 'rect'
  labels?: [string, string, string, string]
} | {
  type: 'margin'
  labels?: [string, string, string, string]
}

export class Property <T> {
  options: PropertyOptions
  label: string
  order?: number
  private _value?: T
  private getValue?: () => T
  private setValue?: (value: T) => void

  get value (): T | undefined {
    if (this.getValue) return this.getValue()
    return this._value
  }

  set value (value: T | undefined) {
    if (this.setValue && value !== undefined) {
      this.setValue(value)
    } else {
      this._value = value
    }
  }

  constructor (
    options: PropertyOptions,
    label?: string,
    getValue?: () => T,
    setValue?: (value: T) => void,
    order?: number) {
      this.options = options
      this.label = label ?? ''
      this.order = order
      this.getValue = getValue
      this.setValue = setValue
  }
}
import { CellDisplay } from './cell-display.js'

export const ICON_STORED = Symbol('IconStored')

export class CellDisplayRowHeader extends CellDisplay {
  init () {
    if (this.create) return
    this.create = true
    this.icons = new Set()
    this.domComponent = document.createElement('div')
    this.owner.domComponent.append(this.domComponent)
    this.initValue()
  }

  get value () {
    return this._value
  }

  set value (value) {
    this._value = value
    if (this.create) {
      if (value) {
        this.domComponent.className = 'stored'
      } else {
        this.domComponent.className = 'no-stored'
      }
    }
  }
}

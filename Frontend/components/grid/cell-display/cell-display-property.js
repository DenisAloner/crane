import { CellDisplay } from './cell-display.js'

export class CellDisplayProperty extends CellDisplay {
  init () {
    if (this.create) return
    this.create = true
    this.domComponent = document.createElement('span')
    this.domComponent.className = 'cellEditor_Span'
    this.owner.domComponent.append(this.domComponent)
    this.initValue()
  }

  initValue () {
    const binder = this.owner.getBinder()
    if (binder) this.value = binder.getProperty(this.owner.row.tag)
  }

  getHandler () {
    return message => {
      if (!this.create) return
      const binder = this.owner.getBinder()
      if (binder && binder.comparePropertyPath(message.path)) {
        this.value = binder.getProperty(this.owner.row.tag)
        clearTimeout(this.timerId)
        this.owner.block = false
      }
    }
  }
}

export function defaultCellDisplayProperty (owner) { return new CellDisplayProperty(owner) }

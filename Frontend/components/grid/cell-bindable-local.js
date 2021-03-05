import { GridCellBindable } from './cell-bindable.js'
import { IconBar } from './iconbar.js'

export class GridCellBindableLocal extends GridCellBindable {
  getBinder () {
    return this.binder ? this.binder : this.column.localBinder
  }

  init () {
    if (this.create) return
    this.create = true
    this.domComponent = document.createElement('div')
    this.domComponent.className = `dataGrid_Cell ${this.row.owner.name}_column${this.column.index}`
    this.onMouseDown = this.onMouseDown.bind(this)
    this.domComponent.addEventListener('mousedown', this.onMouseDown, true)
    this.iconBar = new IconBar()
    if (this.editor === undefined) this.iconBar.showIcon(this.iconBar.noEditIcon)
    this.domComponent.append(this.iconBar.domComponent)
    this.readOnly = this.column.readOnly
    this.cellDisplay = this.displayConstructor ? this.displayConstructor(this) : this.column.localDisplayConstructor(this)
    this.cellDisplay.init()
    if (this.row.tag !== undefined) this.unsubscribe = this.row.tag.subscribe(this.cellDisplay.getHandler())
  }
}

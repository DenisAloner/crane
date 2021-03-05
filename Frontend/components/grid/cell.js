import { IconBar } from './iconbar.js'

export class GridCell {
  constructor (row, column, value) {
    this.row = row
    this.column = column
    this._value = value
  }

  init () {
    if (this.create) return
    this.create = true
    this.domComponent = document.createElement('div')
    this.domComponent.className = `dataGrid_Cell ${this.row.owner.name}_column${this.column.index}`
    this.onMouseDown = this.onMouseDown.bind(this)
    this.domComponent.addEventListener('mousedown', this.onMouseDown, true)
    this.iconBar = new IconBar()
    this.domComponent.append(this.iconBar.domComponent)
    this.readOnly = this.column.readOnly
    this.cellDisplay = this.displayConstructor ? this.displayConstructor(this) : this.column.displayConstructor(this)
    this.cellDisplay.init()
  }

  get value () {
    return this._value
  }

  set value (value) {
    if (this._value !== value) {
      if (this.create) this.cellDisplay.value = value
      this._value = value
    }
  }

  onMouseDown (event) {
    this.onFocus(event)
  }

  onFocus (event) {
    if (!this.readOnly && !this.block && this.row.access(this)) {
      event.preventDefault()
      if (this.editor) {
        this.domComponent.classList.add('dataGrid_CellEdit')
        if (this.row.editedCell && this.row.editedCell.editor && this.row.editedCell.editor.domEditor) {
          this.row.editedCell.editor.domEditor.blur()
        }
        this.row.editedCell = this
        this.domComponent.removeEventListener('mousedown', this.onMouseDown, true)
        this.cellDisplay.domComponent.style.display = 'none'
        this.editor.beginEdit()
      }
      return
    }
    event.stopPropagation()
  }

  offFocus (value) {
    this.cellDisplay.domComponent.style.display = ''
    this.row.editedCell = undefined
    this.domComponent.classList.remove('dataGrid_CellEdit')
    if (!this.validate || (this.validate && this.validate(value))) {
      this.value = value
    }
    this.domComponent.addEventListener('mousedown', this.onMouseDown, true)
  }

  changeTag () {
    this.cellDisplay.initValue()
  }
}

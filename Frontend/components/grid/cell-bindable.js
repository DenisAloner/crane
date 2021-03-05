import { IconBar } from './iconbar.js'

export class GridCellBindable {
  constructor (row, column, editor) {
    this.row = row
    this.column = column
    this.editor = editor
    this._block = false
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
    this.cellDisplay = this.displayConstructor ? this.displayConstructor(this) : this.column.displayConstructor(this)
    this.cellDisplay.init()
    if (this.row.tag !== undefined) this.unsubscribe = this.row.tag.subscribe(this.cellDisplay.getHandler())
  }

  getBinder () {
    return this.binder ? this.binder : this.column.binder
  }

  get value () {
    return this.getBinder().getValue(this.row.tag)
  }

  set value (value) {
    if (this.value !== value) {
      this.getBinder().setValue(this.row.tag, value)
    }
  }

  // set value (value) {
  //   if (this.accessor.value !== value) {
  //     this.block = true
  //     // this.input.value = 'Синхронизация'
  //     this.row.onChangeCellValue(this, value)
  //     this.timerId = setTimeout(() => {
  //       this.input.value = this.accessor.value
  //       this.block = false
  //     }, 5000)
  //   }
  // }

  get readOnly () {
    return this._readOnly
  }

  set readOnly (value) {
    this._readOnly = value
    if (value) {
      if (this.create) this.iconBar.showIcon(this.iconBar.blockIcon)
    } else {
      if (this.create) this.iconBar.hideIcon(this.iconBar.blockIcon)
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
    if (this.editor) this.editor.block = true
    this.domComponent.classList.remove('dataGrid_CellEdit')
    if (!this.validate || (this.validate && this.validate(value))) {
      this.value = value
    }
    this.domComponent.addEventListener('mousedown', this.onMouseDown, true)
  }

  get block () {
    return this._block
  }

  set block (value) {
    if (this._block !== value) {
      if (value) {
        this._block = true
        this.iconBar.showIcon(this.iconBar.blockIcon)
        this.iconBar.showIcon(this.iconBar.updateIcon)
      } else {
        this.iconBar.hideIcon(this.iconBar.updateIcon)
        this.iconBar.hideIcon(this.iconBar.blockIcon)
        this._block = false
      }
    }
  }

  changeTag () {
    this.cellDisplay.initValue()
    if (this.unsubscribe) this.unsubscribe()
    if (this.row.tag !== undefined) { this.unsubscribe = this.row.tag.subscribe(this.cellDisplay.getHandler()) } else { this.unsubscribe = undefined }
  }
}

export class GridRow {
  constructor (owner, tag) {
    this.owner = owner
    this.tag = tag
    this.cell = []
    if (owner) this.createCells()
  }

  createCells () {
    for (let index = 0; index < this.owner.columns.length; index++) {
      const column = this.owner.columns[index]
      this.cell.push(column.newCell(this))
    }
  }

  initCells () {
    const fragment = document.createDocumentFragment()
    for (let index = 0; index < this.cell.length; index++) {
      const cell = this.cell[index]
      if (!cell.create) cell.init()
      fragment.append(cell.domComponent)
    }
    this.domComponent.append(fragment)
  }

  init () {
    this.create = true
    this._selected = false
    this.domComponent = document.createElement('div')
    this.domComponent.className = `dataGrid_Row ${this.owner.name}_dataGrid_Row`
    this.domComponent.style.height = `${this._height}px`
    this.setterDisabled()
    this.initCells()
    this.domComponent.addEventListener('mousedown', this.onMouseDown.bind(this), true)
  }

  get height () {
    return this._height
  }

  set height (value) {
    this._height = value
    this.domComponent.style.height = `${value}px`
  }

  setterDisabled () {
    this.domComponent.classList[(this._disabled ? 'add' : 'remove')]('disabled-row')
  }

  get disabled () {
    return this._disabled
  }

  set disabled (value) {
    if (this._disabled !== value) {
      this._disabled = value === true
      if (this.create) {
        this.setterDisabled()
      }
    }
  }

  onMouseDown (event) {
    this.onFocus(event)
  }

  onFocus (event) {
    if (!this._selected) {
      event.stopPropagation()
      this.selected = true
    } else if (this._disabled) {
      event.stopPropagation()
    }
  }

  access (cell) {
    return !cell.column.readOnly
  }

  get selected () {
    return this._selected
  }

  set selected (value) {
    value = value === true
    if (this._selected !== value) {
      this._selected = value
      this.domComponent.classList[value ? 'add' : 'remove']('dataGrid_RowFocus')
      this.owner.onRowSelectChange(this)
    }
  }

  onChangeCellValue (cell, value) {
    return this.owner.onChangeCellValue(this, cell, value)
  }

  offChangeCellValue (cell) {
    this.owner.offChangeCellValue(this, cell)
  }

  changeTag (tag) {
    this.tag = tag
    this.cell.forEach(cell => {
      cell.changeTag()
    })
  }
}

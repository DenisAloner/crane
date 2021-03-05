export class GridColumn {
  constructor (owner, name, label, sortPattern, Type, displayConstructor, editorConstructor, binder) {
    this.owner = owner
    this.binder = binder
    this.name = name
    this.label = label
    if (sortPattern) this.sortPattern = sortPattern
    this.dom = document.createElement('div')
    this.readOnly = false
    this.newEditable = true
    this.displayConstructor = displayConstructor
    this.editorConstructor = editorConstructor
    this.Type = Type
    this.domLabel = document.createElement('span')
    this.domLabel.className = 'dataGrid_HeaderSpan'
    this.domLabel.textContent = label
    this.dom.append(this.domLabel)
    if (this.sortPattern) {
      this.domSortIconContainer = document.createElement('div')
      this.domSortIconContainer.className = 'dataGrid_HeaderIconContainer buttonComponent firstColor item'
      this.domSortIconContainer.innerHTML = '<div></div>'
      this.domSortIcon = this.domSortIconContainer.children[0]
      this.domLabel.append(this.domSortIconContainer)
      this.domSortIconContainer.addEventListener('click', () => {
        this.owner.onColumnSortButtonClick(this)
      })
    }
    this.owner.tableHeadersRow.append(this.dom)
    this.index = this.owner.columns.length
    this.dom.className = `dataGrid_Header ${this.owner.name}_column${this.index}`
    const sheet = document.styleSheets[1]
    sheet.insertRule(`.${this.owner.name}_column${this.index}{width:0;left:0}`, sheet.cssRules.length)
    this.cssRule = sheet.cssRules[sheet.cssRules.length - 1]
    this.position = 0
    this.width = 0
  }

  newCell (row) {
    const cell = new this.Type(row, this, undefined)
    if (this.editorConstructor) {
      cell.editor = this.editorConstructor(cell)
    }
    return cell
  }
}

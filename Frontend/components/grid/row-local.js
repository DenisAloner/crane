import { GridRow } from './row.js'
import { GridColumnLocalable } from './column-localable.js'

export class GridRowLocal extends GridRow {
  createCells () {
    for (let index = 0; index < this.owner.columns.length; index++) {
      const column = this.owner.columns[index]
      this.cell.push(column instanceof GridColumnLocalable ? column.newCellLocal(this) : undefined)
    }
  }

  initCells () {
    const fragment = document.createDocumentFragment()
    for (let index = 0; index < this.cell.length; index++) {
      const cell = this.cell[index]
      if (cell === undefined) {
        const cellStub = document.createElement('div')
        cellStub.className = `dataGrid_Cell ${this.owner.name}_column${index}`
        const icon = document.createElement('div')
        icon.className = 'no-edit'
        cellStub.append(icon)
        fragment.append(cellStub)
      } else {
        if (!cell.create) cell.init()
        fragment.append(cell.domComponent)
      }
    }
    this.domComponent.append(fragment)
  }
}

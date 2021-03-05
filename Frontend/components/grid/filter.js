import { Grid, GridRow } from './grid.js'
import { GridCell } from './cell.js'
import { GridCellBindable } from './cell-bindable.js'
import { ObservableObject } from '../../observable.js'
import { Binder } from '../../binders/binder.js'
import { defaultCellDisplay } from './cell-display/cell-display.js'

export function defaultFilter (cellValue, filterValue) { return cellValue === filterValue }

export function filterText (cellValue, filterValue) {
  if (cellValue) { return cellValue.toLowerCase().includes(filterValue) }
}

export class FilterGrid extends Grid {
  constructor (name) {
    super(name)
    super.AddColumn(
      'field',
      'Поле',
      GridCell,
      defaultCellDisplay
    )
    super.AddColumn(
      'value',
      'Значение',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new Binder('value')
    )
    this.filters = {}
  }

  addFilter (name, label, fn, editorConstructor, displayConstructor, binder) {
    const filter = { filter: fn }
    this.filters[name] = filter
    filter.pattern = new ObservableObject()
    filter.pattern.field = label
    const row = new GridRow(null, filter.pattern)
    row.owner = this
    let cell = new GridCell(row, this.columns[0], label)
    cell.displayConstructor = defaultCellDisplay
    cell.value = label
    row.cell.push(cell)
    cell = new GridCellBindable(row, this.columns[1], undefined)
    if (displayConstructor) cell.displayConstructor = displayConstructor
    cell.editor = editorConstructor(cell)
    cell.binder = binder || new Binder('value')
    row.cell.push(cell)
    this.addRow(this.rows.size, row)
  }

  getWith (index) {
    return this.rows.get(index).cell[1].binder.getProperty(this.rows.get(index).tag)
  }
}

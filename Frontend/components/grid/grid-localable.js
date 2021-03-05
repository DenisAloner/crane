import { Grid, sortingByValueString } from './grid.js'
import { GridColumnLocalable } from './column-localable.js'
import { GridRowLocal } from './row-local.js'
import { GridRow } from './row.js'
import { STORED } from '../../graph-ql/gql-constants.js'
import { GridCellBindable } from './cell-bindable.js'
import { CellDisplayRowHeader } from './cell-display/cell-display-row-header.js'
import { Binder } from '../../binders/binder.js'

export class GridLocalable extends Grid {
  constructor (name) {
    super(name)
    this.AddColumnLocalable(
      STORED,
      '',
      GridCellBindable,
      function (owner) { return new CellDisplayRowHeader(owner) },
      undefined,
      new Binder(STORED),
      sortingByValueString,
      function (owner) { return new CellDisplayRowHeader(owner) },
      undefined,
      new Binder(STORED)
    )
  }

  AddColumnLocalable (name, label, type, displayConstructor, editorConstructor, binder, sortPattern, localDisplayConstructor, localEditorConstructor, localBinder) {
    const column = new GridColumnLocalable(this, name, label, sortPattern, type, displayConstructor, editorConstructor, binder, localDisplayConstructor, localEditorConstructor, localBinder)
    this.columns.push(column)
    this.addingColumn(column)
    return column
  }

  newRow (tag) {
    const row = new (tag[STORED] ? GridRow : GridRowLocal)(this, tag)
    super.addRow(tag.id, row)
    return row
  }
}

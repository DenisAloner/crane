import { GridColumn } from './column.js'
import { GridCellBindableLocal } from './cell-bindable-local.js'

export class GridColumnLocalable extends GridColumn {
  constructor (owner, name, label, sortPattern, Type, displayConstructor, editorConstructor, binder, localDisplayConstructor, localEditorConstructor, localBinder) {
    super(owner, name, label, sortPattern, Type, displayConstructor, editorConstructor, binder)
    this.localDisplayConstructor = localDisplayConstructor
    this.localEditorConstructor = localEditorConstructor
    this.localBinder = localBinder
  }

  newCellLocal (row) {
    const cell = new GridCellBindableLocal(row, this, undefined)
    if (this.localEditorConstructor) {
      cell.editor = this.localEditorConstructor(cell)
    }
    return cell
  }
}

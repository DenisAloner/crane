import { CellEditor } from './cell-editor.js'

export class CellEditorNumber extends CellEditor {
  createDomEditor () {
    const domEditor = document.createElement('input')
    domEditor.className = 'dataGrid_CellInput'
    domEditor.type = 'number'
    domEditor.value = this.owner.value
    return domEditor
  }

  getValue () {
    return (this.domEditor.value !== '') ? Number.parseFloat(this.domEditor.value) : undefined
  }
}

export function defaultCellEditorNumber (owner) { return new CellEditorNumber(owner) }

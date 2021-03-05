import { CellEditor } from './cell-editor.js'

export class CellEditorString extends CellEditor {
  createDomEditor () {
    const domEditor = document.createElement('input')
    domEditor.className = 'dataGrid_CellInput'
    domEditor.type = 'text'
    domEditor.value = this.owner.value || ''
    return domEditor
  }
}

export function defaultCellEditorString (owner) { return new CellEditorString(owner) }

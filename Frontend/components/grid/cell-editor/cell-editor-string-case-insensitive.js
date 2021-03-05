import { CellEditorString } from './cell-editor-string.js'

export class CellEditorStringCaseInsensitive extends CellEditorString {
  getValue () {
    return (this.domEditor.value !== '') ? this.domEditor.value.toLowerCase() : undefined
  }
}

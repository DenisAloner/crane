import { CellEditor } from './cell-editor.js'

export class CellEditorDatatimeRange extends CellEditor {
  createDomEditor () {
    const domEditor = document.createElement('div')
    domEditor.tabIndex = '0'
    domEditor.className = 'dataGrid_CellInput'
    let input = document.createElement('input')
    input.className = 'cellEditor_DatetimeRange'
    input.type = 'datetime-local'
    if (this._value !== undefined) { input.value = this._value.start.toISOString().slice(0, 19) }
    domEditor.append(input)
    input = document.createElement('input')
    input.className = 'cellEditor_DatetimeRange'
    input.type = 'datetime-local'
    if (this._value !== undefined) { input.value = this._value.end.toISOString().slice(0, 19) }
    domEditor.append(input)
    return domEditor
  }

  onFocusOut (event) {
    if (this.domEditor.contains(event.relatedTarget)) return
    this.endEdit()
  }

  getValue () {
    let result
    const start = this.domEditor.children[0].value
    const end = this.domEditor.children[1].value
    if (start !== '') {
      result = { start: new Date(new Date(this.domEditor.children[0].value).getTime() - new Date().getTimezoneOffset() * 60 * 1000) }
      if (end === '') {
        result.end = new Date(Date.now() - new Date().getTimezoneOffset() * 60 * 1000)
      } else {
        result.end = new Date(new Date(this.domEditor.children[1].value).getTime() - new Date().getTimezoneOffset() * 60 * 1000)
      }
    }
    return result
  }
}

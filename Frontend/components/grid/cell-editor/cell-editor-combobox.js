import { CellEditor } from './cell-editor.js'

export class CellEditorComboBox extends CellEditor {
  constructor (owner, map, propertyName, nullable) {
    super(owner)
    this.map = map
    this.propertyName = propertyName
    this.nullable = nullable
  }

  createDomEditor () {
    const domEditor = document.createElement('select')
    domEditor.className = 'dataGrid_CellInput'
    if (this.nullable) {
      const option = document.createElement('option')
      option.value = undefined
      option.textContent = ''
      domEditor.append(option)
    }
    this.map.forEach(element => {
      const option = document.createElement('option')
      option.value = element.id
      option.textContent = element[this.propertyName]
      domEditor.append(option)
    })
    const value = this.owner.value
    if (value) { domEditor.value = value.id } else domEditor.value = undefined
    return domEditor
  }

  getValue () {
    return this.map.get(this.domEditor.value)
  }
}

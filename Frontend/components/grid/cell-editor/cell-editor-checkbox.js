import { CellEditor } from './cell-editor.js'

export class CellEditorCheckBox extends CellEditor {
  createDomEditor () {
    const domEditor = document.createElement('div')
    domEditor.className = 'checkBox_Component buttonComponent firstColor'
    domEditor.tabIndex = 0
    this.domIcon = document.createElement('div')
    this.value = this.owner.value
    domEditor.append(this.domIcon)
    return domEditor
  }

  onMouseDown () {
    this.value = !this.value
  }

  beginEdit () {
    this.domEditor = this.createDomEditor()
    this.domEditor.addEventListener('keydown', this.onKeyDown.bind(this), true)
    this.domEditor.addEventListener('focusout', this.onFocusOut.bind(this), true)
    this.domEditor.addEventListener('mousedown', this.onMouseDown.bind(this), true)
    this.owner.domComponent.append(this.domEditor)
    this.domEditor.focus()
  }

  getValue () {
    return this.value
  }

  get value () {
    return this._value
  }

  set value (value) {
    this._value = value
    if (value) {
      this.domIcon.className = 'check'
    } else {
      this.domIcon.removeAttribute('class')
    }
  }
}

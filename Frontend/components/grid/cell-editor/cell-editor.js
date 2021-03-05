export class CellEditor {
  constructor (owner) {
    this.owner = owner
  }

  onKeyDown (event) {
    if (event.key === 'Enter') {
      this.domEditor.blur()
    }
  }

  onFocusOut (event) {
    this.endEdit()
  }

  createDomEditor () {}

  beginEdit () {
    this.domEditor = this.createDomEditor()
    this.domEditor.addEventListener('keydown', this.onKeyDown.bind(this), true)
    this.domEditor.addEventListener('focusout', this.onFocusOut.bind(this), true)
    this.owner.domComponent.append(this.domEditor)
    this.domEditor.focus()
  }

  getValue () {
    return this.domEditor.value !== '' ? this.domEditor.value : undefined
  }

  endEdit () {
    const value = this.getValue()
    this.domEditor.remove()
    this.domEditor = undefined
    this.owner.offFocus(value)
  }
}

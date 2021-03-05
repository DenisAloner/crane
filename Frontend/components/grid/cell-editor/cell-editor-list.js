import { CellEditor } from './cell-editor.js'
import { ObservableObject } from '../../../observable.js'
import { isDeferred } from '../../../api.js'

export function filterAlwaysTrue (item) {
  return true
}

export function filterAlwaysFalse (item) {
  return false
}

export function includes (text) {
  text = text.toLowerCase()
  return function (item) {
    const value = item.value
    return isDeferred(value) ? false : value.toLowerCase().includes(text)
  }
}

export function createFilter (...fns) {
  const nonNull = fns.filter(function (x) { return x !== undefined })
  switch (nonNull.length) {
    case 1: return nonNull[0]
    case 2: return function (item) { return nonNull[0](item) && nonNull[1](item) }
    default:
  }
}

export class CellEditorList extends CellEditor {
  constructor (owner, list) {
    super(owner)
    this.list = list
    this.props = new ObservableObject()
    this.props.subscribe(this.handler.bind(this))
    this.value = undefined
    this.delegateClick = this.onClick.bind(this)
  }

  createDomEditor () {
    this.rectOwner = this.owner.domComponent.getBoundingClientRect()
    this.props.list = this.list.map
    this.list.props.filter = filterAlwaysTrue
    if (this.owner && this.owner.row && this.owner.row.tag) {
      this.props.value = this.owner.row.tag
    }
    const domEditor = document.createElement('input')
    domEditor.className = 'dataGrid_CellInput'
    domEditor.type = 'text'
    domEditor.value = ''
    document.body.append(this.list.domComponent)
    const rectOwner = this.owner.domComponent.getBoundingClientRect()
    this.list.domComponent.style.top = `${rectOwner.top + rectOwner.height}px`
    this.list.domComponent.style.left = `${rectOwner.left}px`
    this.list.domComponent.style.width = `${rectOwner.width}px`
    this.list.invalidate()
    return domEditor
  }

  beginEdit () {
    this.list.currentOwner = this
    this.domEditor = this.createDomEditor()
    this.domEditor.addEventListener('keydown', this.onKeyDown.bind(this), true)
    this.domEditor.addEventListener('keyup', this.onKeyUp.bind(this), true)
    this.domEditor.addEventListener('focusout', this.onFocusOut.bind(this), true)
    this.list.domComponent.addEventListener('mousedown', this.delegateClick, true)
    this.owner.domComponent.append(this.domEditor)
    this.domEditor.focus()
  }

  onKeyDown (event) {
    if (event.key === 'Enter') {
      this.domEditor.blur()
    } else if (event.key === 'Backspace') {
      this.value = undefined
      this.domEditor.blur()
    }
  }

  onClick (event) {
    const id = event.target.dataset.id
    if (id !== undefined) {
      this.value = this.list.getValue(id)
    }
  }

  onKeyUp (event) {
    this.list.props.filter = includes(this.domEditor.value)
  }

  endEdit () {
    this.props.list = undefined
    this.list.currentOwner = undefined
    const value = this.getValue()
    this.props.value = undefined
    this.list.domComponent.removeEventListener('mousedown', this.delegateClick, true)
    this.domEditor.remove()
    this.list.domComponent.remove()
    this.domEditor = undefined
    this.owner.offFocus(value)
  }

  getValue () {
    return this.value
  }

  handler (message) {}
}

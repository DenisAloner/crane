import { smartGet, isDeferred } from '../../api.js'
import {
  TABLE_UNCOMMITTED_CHANGES,
  TABLE_REASONS,
  Directions,
} from '../../api-settings.js'
import { OBSERVABLE_SET_PROPERTY } from '../../observable.js'
import {
  CellEditorList,
  createFilter,
  includes,
  filterAlwaysFalse,
} from '../../components/grid/cell-editor/cell-editor-list.js'

function incrementFilter(increment) {
  return function (option) {
    if (increment === undefined) return false
    const direction = smartGet(option.item, TABLE_REASONS, ['direction'])
    if (isDeferred(direction)) {
      return false
    }
    switch (direction) {
      case Directions.ARRIVAL:
        if (increment <= 0) {
          return false
        }
        break
      case Directions.ISSUE:
        if (increment >= 0) {
          return false
        }
        break
    }
    return true
  }
}

export class CellEditorListReasons extends CellEditorList {
  constructor(owner, list) {
    super(owner, list)
    this.filters = [filterAlwaysFalse, undefined]
  }

  createDomEditor() {
    this.rectOwner = this.owner.domComponent.getBoundingClientRect()
    this.props.list = this.list.map
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

  handler(message) {
    console.log(message)
    if (message.type === OBSERVABLE_SET_PROPERTY) {
      if (message.path.length === 1 && message.path[0] === 'value') {
        const increment = smartGet(message.value, TABLE_UNCOMMITTED_CHANGES, [
          'increment',
        ])
        if (isDeferred(increment)) {
          this.list.props.filter = filterAlwaysFalse
        } else {
          this.filters[0] = incrementFilter(increment)
          this.list.props.filter = createFilter(...this.filters)
        }
      } else if (
        message.path.length === 2 &&
        message.path[0] === 'value' &&
        message.path[1] === 'increment'
      ) {
        this.filters[0] = incrementFilter(message.value)
        this.list.props.filter = createFilter(...this.filters)
      } else if (
        message.path.length === 3 &&
        message.path[0] === 'list' &&
        (message.path[2] === 'direction' || message.path[2] === 'name')
      ) {
        const option = this.list.options.get(message.path[1])
        if (option !== undefined) {
          option.visible = this.list.props.filter(option)
        }
      }
    }
  }

  onKeyUp(event) {
    this.filters[1] = includes(this.domEditor.value)
    this.list.props.filter = createFilter(...this.filters)
  }
}

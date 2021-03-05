import { generate } from './page-editor-generator.js'
import { GridCellBindable, sortingByValueString, sortingByOptionString } from '../components/grid/grid.js'
import { defaultCellDisplay } from '../components/grid/cell-display/cell-display.js'
import { defaultCellEditorString } from '../components/grid/cell-editor/cell-editor-string.js'
import { BinderStore } from '../binders/binder-store.js'
import { Binder } from '../binders/binder.js'
import { Core } from '../api.js'
import { TABLE_REASONS, Directions, TABLE_OWNERS } from '../api-settings.js'
import { ObservableObject, OBSERVABLE_SET_PROPERTY, ObservableMap } from '../observable.js'
import { Scheme } from '../graph-ql/gql.js'
import { defaultCellDisplayOption, defaultCellDisplayListItem } from '../components/grid/cell-display/cell-display-option.js'
import { BinderOption } from '../binders/binder-option.js'
import { ListView, ListViewItem } from '../list-view.js'
import { BinderStoreOptionObject, BinderStoreOption } from '../binders/binder-store-option.js'
import { ListViewItemOwner } from './list-view-item.js'
import { CellEditorList } from '../components/grid/cell-editor/cell-editor-list.js'

// const map = new Map()
// map.set(Directions.ARRIVAL, 'Приход')
// map.set(Directions.ISSUE, 'Выдача')
// map.set(Directions.ANY, 'Любое')

const list = new ObservableMap()
let object
object = new ObservableObject()
object.id = Directions.ARRIVAL
object.name = 'Приход'
list.set(object.id, object)
object = new ObservableObject()
object.id = Directions.ISSUE
object.name = 'Выдача'
list.set(object.id, object)
object = new ObservableObject()
object.id = Directions.ANY
object.name = 'Любое'
list.set(object.id, object)
object = undefined

export class ListViewItemDirection extends ListViewItem {
  static getIdByDataset (dataset) {
    return Directions[dataset]
  }

  getDatasetId () {
    return this.item.id.description
  }

  getValue () {
    return this.item.id
  }

  update (message) {
    if (message.type === OBSERVABLE_SET_PROPERTY && message.path[0] === 'name') {
      if (this.domComponent !== undefined) { this.domComponent.textContent = this.value }
      this.visible = this.owner.props.filter(this)
    }
  }

  get value () {
    return this.item.name
  }
}

const sortingDirection = function (left, right) {
  return `${list.get(left.value)}`.localeCompare(list.get(right.value))
}

const listOwners = new ListView(Core.workspace, Core.getTable(TABLE_OWNERS), ListViewItemOwner)
const cellEditorListOwners = function (owner) { return new CellEditorList(owner, listOwners) }

const listDirections = new ListView(Core.workspace, list, ListViewItemDirection)
const cellEditorListDirections = function (owner) { return new CellEditorList(owner, listDirections) }

export const PageEditorReason = generate(
  TABLE_REASONS,
  [
    ['name',
      'Значение',
      GridCellBindable,
      defaultCellDisplay,
      defaultCellEditorString,
      new BinderStore(TABLE_REASONS, 'reason_update_name', 'name'),
      sortingByValueString,
      defaultCellDisplay,
      defaultCellEditorString,
      new Binder('name')],
    ['direction',
      'Направление',
      GridCellBindable,
      defaultCellDisplayListItem,
      cellEditorListDirections,
      new BinderStoreOption(TABLE_REASONS, 'reason_update_direction', ['direction'], [], listDirections),
      sortingDirection,
      defaultCellDisplayListItem,
      cellEditorListDirections,
      new BinderOption(['direction'], [], listDirections)],
    ['owner',
      'Принадлежность',
      GridCellBindable,
      defaultCellDisplayOption,
      cellEditorListOwners,
      new BinderStoreOptionObject(TABLE_REASONS, 'reason_update_owner', ['owner'], ['name'], listOwners),
      sortingByOptionString,
      defaultCellDisplayOption,
      cellEditorListOwners,
      new BinderOption(['owner'], ['name'], listOwners)]
  ],
  [TABLE_OWNERS, TABLE_REASONS],
  function () { return Core.getShared(TABLE_REASONS, Core.getTable(TABLE_REASONS), ObservableObject, Scheme.queries.get('reason_insert'), Scheme.queries.get('reason_delete')) }
)

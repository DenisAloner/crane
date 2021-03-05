import { generate } from './page-editor-generator.js'
import { GridCellBindable, sortingByValueString } from '../components/grid/grid.js'
import { defaultCellDisplay } from '../components/grid/cell-display/cell-display.js'
import { defaultCellEditorString } from '../components/grid/cell-editor/cell-editor-string.js'
import { BinderStore } from '../binders/binder-store.js'
import { Binder } from '../binders/binder.js'
import { Core } from '../api.js'
import { TABLE_OWNERS } from '../api-settings.js'
import { ObservableObject } from '../observable.js'
import { Scheme } from '../graph-ql/gql.js'

export const PageEditorOwner = generate(
  TABLE_OWNERS,
  [
    ['name',
      'Значение',
      GridCellBindable,
      defaultCellDisplay,
      defaultCellEditorString,
      new BinderStore(TABLE_OWNERS, 'owner_update_name', 'name'),
      sortingByValueString,
      defaultCellDisplay,
      defaultCellEditorString,
      new Binder('name')]
  ],
  [TABLE_OWNERS],
  function () { return Core.getShared(TABLE_OWNERS, Core.getTable(TABLE_OWNERS), ObservableObject, Scheme.queries.get('owner_insert'), Scheme.queries.get('owner_delete')) }
)

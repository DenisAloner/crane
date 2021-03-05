import { generate } from './page-editor-generator.js'
import { GridCellBindable, sortingByValueString } from '../components/grid/grid.js'
import { defaultCellDisplay } from '../components/grid/cell-display/cell-display.js'
import { defaultCellEditorString } from '../components/grid/cell-editor/cell-editor-string.js'
import { BinderStore } from '../binders/binder-store.js'
import { Binder } from '../binders/binder.js'
import { Core } from '../api.js'
import { TABLE_UNITS } from '../api-settings.js'
import { ObservableObject } from '../observable.js'
import { Scheme } from '../graph-ql/gql.js'

export const PageEditorUnit = generate(
  TABLE_UNITS,
  [
    ['name',
      'Значение',
      GridCellBindable,
      defaultCellDisplay,
      defaultCellEditorString,
      new BinderStore(TABLE_UNITS, 'unit_update_name', 'name'),
      sortingByValueString,
      defaultCellDisplay,
      defaultCellEditorString,
      new Binder('name')]
  ],
  [TABLE_UNITS],
  function () { return Core.getShared(TABLE_UNITS, Core.getTable(TABLE_UNITS), ObservableObject, Scheme.queries.get('unit_insert'), Scheme.queries.get('unit_delete')) }
)

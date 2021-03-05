import { generate } from './page-editor-generator.js'
import { GridCellBindable, sortingByValueString } from '../components/grid/grid.js'
import { defaultCellDisplay } from '../components/grid/cell-display/cell-display.js'
import { defaultCellEditorString } from '../components/grid/cell-editor/cell-editor-string.js'
import { BinderStore } from '../binders/binder-store.js'
import { Binder } from '../binders/binder.js'
import { Core } from '../api.js'
import { TABLE_PRODUCT_TYPES } from '../api-settings.js'
import { ObservableObject } from '../observable.js'
import { Scheme } from '../graph-ql/gql.js'

export const PageEditorProductType = generate(
  TABLE_PRODUCT_TYPES,
  [
    ['name',
      'Вид',
      GridCellBindable,
      defaultCellDisplay,
      defaultCellEditorString,
      new BinderStore(TABLE_PRODUCT_TYPES, 'product_type_update_name', 'name'),
      sortingByValueString,
      defaultCellDisplay,
      defaultCellEditorString,
      new Binder('name')]
  ],
  [TABLE_PRODUCT_TYPES],
  function () { return Core.getShared(TABLE_PRODUCT_TYPES, Core.getTable(TABLE_PRODUCT_TYPES), ObservableObject, Scheme.queries.get('product_type_insert'), Scheme.queries.get('product_type_delete')) }
)

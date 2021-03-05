import { generate } from './page-editor-generator.js'
import { GridCellBindable, sortingByValueString, sortingByOptionString } from '../components/grid/grid.js'
import { defaultCellDisplay } from '../components/grid/cell-display/cell-display.js'
import { defaultCellEditorString } from '../components/grid/cell-editor/cell-editor-string.js'
import { BinderStore } from '../binders/binder-store.js'
import { Binder } from '../binders/binder.js'
import { Core, lazyLoadModule, XLSX } from '../api.js'
import { TABLE_UNITS, TABLE_PRODUCT_TYPES, TABLE_NOMENCLATURES } from '../api-settings.js'
import { ObservableObject } from '../observable.js'
import { Scheme } from '../graph-ql/gql.js'
import { defaultCellDisplayOption } from '../components/grid/cell-display/cell-display-option.js'
import { BinderStoreOptionObject } from '../binders/binder-store-option.js'
import { BinderOption } from '../binders/binder-option.js'
import { ListView } from '../list-view.js'
import { CellEditorList } from '../components/grid/cell-editor/cell-editor-list.js'
import { ListViewItemUnit, ListViewItemProductType } from './list-view-item.js'

const listUnits = new ListView(Core.workspace, Core.getTable(TABLE_UNITS), ListViewItemUnit)
const cellEditorListUnits = function (owner) { return new CellEditorList(owner, listUnits) }

const listProductType = new ListView(Core.workspace, Core.getTable(TABLE_PRODUCT_TYPES), ListViewItemProductType)
const cellEditorListProductTypes = function (owner) { return new CellEditorList(owner, listProductType) }

export const PageEditorNomenclature = generate(
  TABLE_NOMENCLATURES,
  [
    ['designation',
      'Обозначение',
      GridCellBindable,
      defaultCellDisplay,
      defaultCellEditorString,
      new BinderStore(TABLE_NOMENCLATURES, 'nomenclature_update_designation', 'designation'),
      sortingByValueString,
      defaultCellDisplay,
      defaultCellEditorString,
      new Binder('designation')],
    ['name',
      'Наименование',
      GridCellBindable,
      defaultCellDisplay,
      defaultCellEditorString,
      new BinderStore(TABLE_NOMENCLATURES, 'nomenclature_update_name', 'name'),
      sortingByValueString,
      defaultCellDisplay,
      defaultCellEditorString,
      new Binder('name')],
    ['unit',
      'Единицы измерения',
      GridCellBindable,
      defaultCellDisplayOption,
      cellEditorListUnits,
      new BinderStoreOptionObject(TABLE_NOMENCLATURES, 'nomenclature_update_unit', ['unit'], ['name'], listUnits),
      sortingByOptionString,
      defaultCellDisplayOption,
      cellEditorListUnits,
      new BinderOption(['unit'], ['name'], listUnits)],
    ['product_type',
      'Вид детали',
      GridCellBindable,
      defaultCellDisplayOption,
      cellEditorListProductTypes,
      new BinderStoreOptionObject(TABLE_NOMENCLATURES, 'nomenclature_update_product_type', ['product_type'], ['name'], listProductType),
      sortingByOptionString,
      defaultCellDisplayOption,
      cellEditorListProductTypes,
      new BinderOption(['product_type'], ['name'], listProductType)]
  ],
  [TABLE_UNITS, TABLE_PRODUCT_TYPES, TABLE_NOMENCLATURES],
  function () { return Core.getShared(TABLE_NOMENCLATURES, Core.getTable(TABLE_NOMENCLATURES), ObservableObject, Scheme.queries.get('nomenclature_insert'), Scheme.queries.get('nomenclature_delete')) },
  async function (event) {
    await lazyLoadModule()
    const files = event.target.files
    if (!files || files.length === 0) return
    const file = files[0]
    const fileReader = new FileReader()
    fileReader.addEventListener('load', event => {
      let binary = ''
      const bytes = new Uint8Array(event.target.result)
      const length = bytes.byteLength
      for (var i = 0; i < length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const workbook = XLSX.read(binary, { type: 'binary', cellDates: true, cellStyles: true })
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
      rows.forEach(row => {
        if (row['Обозначение'] !== undefined && row['Наименование'] !== undefined) {
          const object = this.map.newValue()
          object.designation = row['Обозначение']
          object.name = row['Наименование']
        }
      })
    })
    fileReader.readAsArrayBuffer(file)
  }
)

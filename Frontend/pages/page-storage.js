import { Core, lazyLoadModule, exportXlsx } from '../api.js'
import { TABLE_CHANGES, TABLE_WAREHOUSE, TABLE_ADDRESSES, TABLE_OWNERS } from '../api-settings.js'
import { FilterGrid, defaultFilter, filterText } from '../components/grid/filter.js'
import { Page } from '../page.js'
import { Button } from '../button.js'
import { GridRow, Grid, GridCellBindable, sortingByPropertyString, sortingByValueString, sortingByValueNumber } from '../components/grid/grid.js'
import { SplittedArea, SplittedPanel } from '../splitted-area.js'
import { PanelGrid } from '../panel-grid.js'
import { OBSERVABLE_ADD_PROPERTY, OBSERVABLE_REMOVE_PROPERTY } from '../observable.js'
import { _ } from '../graph-ql/gql-constants.js'
import { defaultCellDisplay } from '../components/grid/cell-display/cell-display.js'
import { BinderStore } from '../binders/binder-store.js'
import { defaultCellDisplayProperty } from '../components/grid/cell-display/cell-display-property.js'
import { CellEditorStringCaseInsensitive } from '../components/grid/cell-editor/cell-editor-string-case-insensitive.js'
import { BinderStoreObject } from '../binders/binder-store-object.js'
import { BinderStoreProperty } from '../binders/binder-store-property.js'
import { defaultCellDisplayOption } from '../components/grid/cell-display/cell-display-option.js'
import { BinderOption } from '../binders/binder-option.js'
import { defaultCellEditorNumber } from '../components/grid/cell-editor/cell-editor-number.js'
import { ListView } from '../list-view.js'
import { ListViewItemAddress } from './list-view-item.js'
import { CellEditorList } from '../components/grid/cell-editor/cell-editor-list.js'

const listAddresses = new ListView(Core.workspace, Core.getTable(TABLE_ADDRESSES), ListViewItemAddress)
const cellEditorListAddresses = function (owner) { return new CellEditorList(owner, listAddresses) }
const listOwners = new ListView(Core.workspace, Core.getTable(TABLE_OWNERS), ListViewItemAddress)
const cellEditorListOwners = function (owner) { return new CellEditorList(owner, listOwners) }

export class PageStorage extends Page {
  constructor (owner, name) {
    super(owner, name)
    lazyLoadModule()
    this.area = new SplittedArea()
    this.addComponent(this.area)
    this.grid = new Grid(`storage${Date.now()}`)
    this.buttonExport = new Button('Выгрузить')
    this.buttonExport.domComponent.addEventListener('click', () => { exportXlsx(this.grid, 'Склад') })
    this.panelGrid = new PanelGrid()
    this.panelGrid.grid = this.grid
    this.panelGrid.addButton(this.buttonExport)
    this.area.addPanel(new SplittedPanel(this.panelGrid))

    this.gridFilters = new FilterGrid(`filters_storage${Date.now()}`)

    this.ButtonApplyFilters = new Button('Применить')
    this.ButtonApplyFilters.domComponent.addEventListener('click', this.clickButtonApplyFilters.bind(this))
    this.panelGrid2 = new PanelGrid()
    this.panelGrid2.grid = this.gridFilters
    this.panelGrid2.addButton(this.ButtonApplyFilters)
    this.area.addPanel(new SplittedPanel(this.panelGrid2))
    this.area.size = { width: '100%', height: '100%' }
    this.storageCells = new Set()

    let column = this.grid.AddColumn(
      'destination',
      'Адрес',
      GridCellBindable,
      defaultCellDisplayProperty,
      undefined,
      new BinderStoreObject(TABLE_CHANGES, '', ['operation', 'destination'], ['name']),
      sortingByPropertyString
    )
    column = this.grid.AddColumn(
      'designation',
      'Обозначение',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_WAREHOUSE, '', 'nomenclature', 'designation'),
      sortingByValueString
    )
    column = this.grid.AddColumn(
      'name',
      'Наименование',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_WAREHOUSE, '', 'nomenclature', 'name'),
      sortingByValueString
    )
    column = this.grid.AddColumn(
      'product_type',
      'Вид детали',
      GridCellBindable,
      defaultCellDisplayProperty,
      undefined,
      new BinderStoreObject(TABLE_CHANGES, '', ['nomenclature', 'product_type'], ['name']),
      sortingByPropertyString
    )
    column = this.grid.AddColumn(
      'quantity',
      'Количество',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_WAREHOUSE, '', 'quantity'),
      sortingByValueNumber
    )
    column = this.grid.AddColumn(
      'weight',
      'Масса',
      GridCellBindable,
      defaultCellDisplay,
      defaultCellEditorNumber,
      new BinderStoreProperty(TABLE_WAREHOUSE, 'operation_update_weight', 'operation', 'weight'),
      sortingByValueNumber
    )
    column = this.grid.AddColumn(
      'owner',
      'Принадлежность',
      GridCellBindable,
      defaultCellDisplayProperty,
      undefined,
      new BinderStoreObject(TABLE_CHANGES, '', ['owner'], ['name']),
      sortingByPropertyString
    )
  }

  mockup () {
  }

  init () {
    this.gridFilters.available = true
    this.gridFilters.setFontSize(20)
    this.gridFilters.init()
    this.gridFilters.addFilter(
      'destination',
      'Адрес',
      defaultFilter,
      cellEditorListAddresses,
      defaultCellDisplayOption,
      new BinderOption(['value'], ['name'], listAddresses)
    )
    this.gridFilters.addFilter(
      'designation',
      'Обозначение',
      filterText,
      owner => { return new CellEditorStringCaseInsensitive(owner) }
    )
    this.gridFilters.addFilter(
      'name',
      'Наименование',
      filterText,
      owner => { return new CellEditorStringCaseInsensitive(owner) }
    )
    this.gridFilters.addFilter(
      'quantity',
      'Количество',
      defaultFilter,
      defaultCellEditorNumber
    )
    this.gridFilters.addFilter(
      'weight',
      'Масса',
      defaultFilter,
      defaultCellEditorNumber
    )
    this.gridFilters.addFilter(
      'owner',
      'Принадлежность',
      defaultFilter,
      cellEditorListOwners,
      defaultCellDisplayOption,
      new BinderOption(['value'], ['name'], listOwners)
    )
    this.grid.available = true
    this.grid.setFontSize(20)
    this.grid.exportable = true
    this.grid.init()

    const table = Core.getTable(TABLE_WAREHOUSE)
    table.forEach(item => {
      this.newRow(item)
    })
    table.subscribe(this.onTableUpdate.bind(this))
    Core.socket.execute({
      addresses: {
        name: _
      }
    })
    Core.socket.execute({
      [TABLE_OWNERS]: {
        name: _
      }
    })
    Core.socket.execute({
      units: {
        id: _
      }
    })
    Core.socket.execute({
      warehouse: {
        id: _
      }
    })
  }

  newRow (item) {
    const row = new GridRow(this.grid, item)
    this.grid.addRow(item.id, row)
  }

  onTableUpdate (value) {
    if (value.type === OBSERVABLE_ADD_PROPERTY) {
      if (value.path.length === 1) {
        this.newRow(value.value)
      }
    } else if (value.type === OBSERVABLE_REMOVE_PROPERTY) {
      this.grid.removeRow(`${value.path[0]}`)
    }
  }

  clickButtonApplyFilters (event) {
    this.grid.filterColumn(this.gridFilters.filters)
  }
}

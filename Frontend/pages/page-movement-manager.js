import { Core, smartGet, isDeferred, getValue } from '../api.js'
import { Directions, Orientations, TABLE_NOMENCLATURES, TABLE_ADDRESSES, TABLE_UNCOMMITTED_OPERATIONS, TABLE_ZONES, TABLE_DEVICES, TABLE_UNCOMMITTED_CHANGES, TABLE_WAREHOUSE, TABLE_REASONS, TABLE_OWNERS } from '../api-settings.js'
import { Page } from '../page.js'
import { Button } from '../button.js'
import { GridRow, Grid, GridCellBindable, sortingByValueString, sortingByValueNumber, sortingByOptionString } from '../components/grid/grid.js'
import { SplittedArea, SplittedPanel } from '../splitted-area.js'
import { PanelGrid } from '../panel-grid.js'
import { STATUS_FLAGS, CellDisplayStatus } from '../components/grid/cell-display/cell-display-status.js'
import { CellDisplayMode } from '../components/grid/cell-display/cell-display-mode.js'
import { ObservableObject, OBSERVABLE_SET_PROPERTY, OBSERVABLE_ADD_PROPERTY, OBSERVABLE_REMOVE_PROPERTY } from '../observable.js'
import { $ARGUMENTS, _, STORED } from '../graph-ql/gql-constants.js'
import { ListView } from '../list-view.js'
import { Binder } from '../binders/binder.js'
import { defaultCellDisplay } from '../components/grid/cell-display/cell-display.js'
import { defaultCellDisplayOption } from '../components/grid/cell-display/cell-display-option.js'
import { defaultCellDisplayCheckBox } from '../components/grid/cell-display/cell-display-checkbox.js'
import { defaultCellEditorString } from '../components/grid/cell-editor/cell-editor-string.js'
import { defaultCellEditorNumber } from '../components/grid/cell-editor/cell-editor-number.js'
import { BinderStore } from '../binders/binder-store.js'
import { BinderOption } from '../binders/binder-option.js'
import { GridLocalable } from '../components/grid/grid-localable.js'
import { BinderStoreOptionObject } from '../binders/binder-store-option.js'
import { defaultFilter } from '../components/grid/filter.js'
import { Scheme } from '../graph-ql/gql.js'
import { PropertyObservers } from '../mixin.js'
import { CellEditorListReasons } from './cell-editor/cell-editor-list-reasons.js'
import { CellEditorList } from '../components/grid/cell-editor/cell-editor-list.js'
import { ListViewItemNomenclature, ListViewItemReason, ListViewItemAddress, ListViewItemOwner } from './list-view-item.js'
import { Stepper } from '../components/stepper/stepper.js'
import { CellEditorCheckBox } from '../components/grid/cell-editor/cell-editor-checkbox.js'

const listReasons = new ListView(Core.workspace, Core.getTable(TABLE_REASONS), ListViewItemReason)
const cellEditorListReasons = function (owner) { return new CellEditorListReasons(owner, listReasons) }

const listAddresses = new ListView(Core.workspace, Core.getTable(TABLE_ADDRESSES), ListViewItemAddress)
const cellEditorListAddresses = function (owner) { return new CellEditorList(owner, listAddresses) }

const listNomenclatures = new ListView(Core.workspace, Core.getTable(TABLE_NOMENCLATURES), ListViewItemNomenclature)
const cellEditorListNomenclatures = function (owner) { return new CellEditorList(owner, listNomenclatures) }

const listOwners = new ListView(Core.workspace, Core.getTable(TABLE_OWNERS), ListViewItemOwner)
const cellEditorListOwners = function (owner) { return new CellEditorList(owner, listOwners) }

class UncommittedChange extends ObservableObject {
  constructor (id, uncommittedOperation, nomenclature, increment, reason, owner, basis) {
    super()
    this.subscribe(this.getHandler())
    this.id = id
    this.uncommitted_operation = uncommittedOperation
    this.nomenclature = nomenclature
    this.increment = increment
    this.reason = reason
    this.owner = owner
    this.basis = basis
  }

  getHandler () {
    return message => {
      if (message.type === OBSERVABLE_SET_PROPERTY) {
        switch (message.path[0]) {
          case 'increment':
            if (this.reason && this.reason.direction) {
              switch (this.reason.direction) {
                case Directions.ARRIVAL:
                  if (this.increment > 0) return
                  this.reason = undefined
                  break
                case Directions.ISSUE:
                  if (this.increment < 0) return
                  this.reason = undefined
                  break
                default:
                  break
              }
            }
            break
          case 'reason':
            if (message.value && message.value.owner) {
              const owner = message.value.owner
              if (owner) this.owner = owner
            }
            break
          case 'owner':
            if (this.reason && this.reason.owner) {
              const owner = this.reason.owner
              if (owner) this.owner = owner
            }
            break
        }
      }
    }
  }
}

class EditedOperation extends ObservableObject {
  constructor () {
    super()
    this.subscribe(this.getHandler(this.getAccessor('item', 'id'), this.getAccessor('item', 'source', 'name'), this.getAccessor('item', 'destination', 'name')))
    this.description = ''
  }

  getHandler (accessorId, accessorSource, accessorDestination) {
    return message => {
      if (message.type === OBSERVABLE_SET_PROPERTY) {
        this.description = `${accessorId.value || ''} (${accessorSource.value || ''} : ${accessorDestination.value || ''}) `
      } else if (message.type === OBSERVABLE_REMOVE_PROPERTY && message.path.length === 1 && message.path[0] === 'item') {
        this.description = ''
      }
    }
  }
}

class UncommittedOperation extends ObservableObject {
  constructor (id) {
    super(id)
    this.is_virtual = false
  }
};

export class PageMovementManager extends Page {
  constructor (owner, name) {
    super(owner, name)
    this.address = null
    this.area = new SplittedArea()
    this.addComponent(this.area)
    this.gridOperations = new GridLocalable(`uncommitted_operations${Date.now()}`)
    this.gridOperations.AddColumn(
      'id',
      'Операция',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_UNCOMMITTED_OPERATIONS, '', 'id'),
      sortingByValueString
    )
    this.gridOperations.AddColumn(
      'full_name',
      'ФИО',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_UNCOMMITTED_OPERATIONS, '', 'user', 'full_name'),
      sortingByValueString
    )
    this.gridOperations.AddColumnLocalable(
      'source',
      'Начальный адрес',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_UNCOMMITTED_OPERATIONS, '', 'source', 'name'),
      sortingByValueString,
      defaultCellDisplayOption,
      cellEditorListAddresses,
      new BinderOption(['source'], ['name'], listAddresses)
    )
    this.gridOperations.AddColumnLocalable(
      'destination',
      'Конечный адрес',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_UNCOMMITTED_OPERATIONS, '', 'destination', 'name'),
      sortingByValueString,
      defaultCellDisplayOption,
      cellEditorListAddresses,
      new BinderOption(['destination'], ['name'], listAddresses)
    )
    this.gridOperations.AddColumnLocalable(
      'is_virtual',
      'Виртуальная',
      GridCellBindable,
      defaultCellDisplayCheckBox,
      undefined,
      new BinderStore(TABLE_UNCOMMITTED_OPERATIONS, '', 'is_virtual'),
      sortingByValueString,
      defaultCellDisplayCheckBox,
      function (owner) { return new CellEditorCheckBox(owner) },
      new Binder('is_virtual')
    )
    this.buttonAddOperation = new Button('Новая операция')
    this.buttonAddOperation.click(this.clickButtonAddOperation, this)
    this.buttonReservation = new Button('Регистрировать операцию')
    this.buttonReservation.visible = false
    this.buttonReservation.click(this.clickButtonRegisterOperation, this)
    this.buttonRemoveOperation = new Button('Удалить операцию')
    this.buttonRemoveOperation.visible = false
    this.buttonRemoveOperation.click(this.clickButtonRemoveOperation, this)
    this.buttonRunOperation = new Button('Запустить операцию')
    this.buttonRunOperation.visible = false
    this.buttonRunOperation.click(this.clickButtonRunOperation, this)

    this.panelGridOperations = new PanelGrid()
    this.panelGridOperations.grid = this.gridOperations
    this.panelGridOperations.addButton(this.buttonAddOperation)
    this.panelGridOperations.addButton(this.buttonReservation)
    this.panelGridOperations.addButton(this.buttonRemoveOperation)
    this.panelGridOperations.addButton(this.buttonRunOperation)

    this.gridZones = new Grid(`zones${Date.now()}`)
    this.gridZones.AddColumn(
      'zone',
      'Рабочая зона',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_ZONES, '', 'id'),
      sortingByValueNumber
    )
    this.gridZones.AddColumn(
      'uncommitted_operation',
      'Операция',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_ZONES, '', 'uncommitted_operation', 'id'),
      sortingByValueString
    )
    this.gridZones.AddColumn(
      'status',
      'Статус',
      GridCellBindable,
      owner => { return new CellDisplayStatus(owner) },
      undefined,
      new BinderStore(TABLE_ZONES, '', 'status'),
      sortingByValueString
    )
    this.gridZones.AddColumn(
      'mode',
      'Режим',
      GridCellBindable,
      owner => { return new CellDisplayMode(owner) },
      undefined,
      new BinderStore(TABLE_DEVICES, '', 'mode'),
      sortingByValueString
    )
    this.gridZones.AddColumn(
      'request',
      'Запрос',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_ZONES, '', 'request'),
      sortingByValueNumber
    )
    this.buttonOperatorAccept = new Button('Оператор закончил работать с грузом')
    this.buttonOperatorAccept.visible = false
    this.buttonOperatorAccept.click(this.clickButtonOperatorAccept, this)
    this.panelGridZones = new PanelGrid()
    this.panelGridZones.grid = this.gridZones
    this.panelGridZones.addButton(this.buttonOperatorAccept)

    this.upPanel = new SplittedArea(Orientations.HORIZONTAL)
    this.upPanel.addPanel(new SplittedPanel(this.panelGridOperations, 'Операции'))
    this.upPanel.addPanel(new SplittedPanel(this.panelGridZones, 'Рабочие зоны'))
    // this.upPanel.setRatios([16, 42, 42])
    this.area.addPanel(this.upPanel)

    this.gridUncommittedChanges = new GridLocalable(`storage${Date.now()}`)
    this.gridUncommittedChanges.AddColumnLocalable(
      'uncommitted_operation',
      'Операция',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_UNCOMMITTED_CHANGES, '', 'uncommitted_operation', 'id'),
      sortingByValueString,
      defaultCellDisplay,
      undefined,
      new Binder('uncommitted_operation', 'id')
    )
    this.gridUncommittedChanges.AddColumnLocalable(
      'nomenclature',
      'Номенклатура',
      GridCellBindable,
      defaultCellDisplayOption,
      undefined,
      new BinderStoreOptionObject(TABLE_UNCOMMITTED_CHANGES, '', ['nomenclature'], ['designation', 'name', ['product_type', 'name']], listNomenclatures),
      sortingByOptionString,
      defaultCellDisplayOption,
      cellEditorListNomenclatures,
      new BinderOption(['nomenclature'], ['designation', 'name', ['product_type', 'name']], listNomenclatures)
    )
    this.gridUncommittedChanges.AddColumnLocalable(
      'increment',
      'Изменение количества',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_UNCOMMITTED_CHANGES, 'change_update_increment', 'increment'),
      sortingByValueNumber,
      defaultCellDisplay,
      defaultCellEditorNumber,
      new Binder('increment')
    )
    this.gridUncommittedChanges.AddColumnLocalable(
      'reason',
      'Причина',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_UNCOMMITTED_CHANGES, '', 'reason', 'name'),
      sortingByValueString,
      defaultCellDisplayOption,
      cellEditorListReasons,
      new BinderOption(['reason'], ['name'], listReasons)
    )
    this.gridUncommittedChanges.AddColumnLocalable(
      'owner',
      'Принадлежность',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_UNCOMMITTED_CHANGES, '', 'owner', 'name'),
      sortingByValueString,
      defaultCellDisplayOption,
      cellEditorListOwners,
      new BinderOption(['owner'], ['name'], listOwners)
    )
    this.gridUncommittedChanges.AddColumnLocalable(
      'basis',
      'Основание',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_UNCOMMITTED_CHANGES, '', 'basis'),
      sortingByValueString,
      defaultCellDisplay,
      defaultCellEditorString,
      new Binder('basis')
    )
    this.buttonAddChange = new Button('Новое изменение')
    this.buttonAddChange.visible = false
    this.buttonAddChange.click(this.clickButtonAddChange, this)
    this.buttonAutoChanges = new Button('Генерация изменений')
    this.buttonAutoChanges.visible = false
    this.buttonAutoChanges.click(this.clickButtonAutoChanges, this)
    this.buttonRemoveChange = new Button('Удалить изменение')
    this.buttonRemoveChange.visible = false
    this.buttonRemoveChange.click(this.clickButtonRemoveChange, this)
    this.buttonRegisterChange = new Button('Регистрировать изменения')
    this.buttonRegisterChange.visible = false
    this.buttonRegisterChange.click(this.clickButtonRegisterChange, this)
    this.panelGridChanges = new PanelGrid()
    this.panelGridChanges.grid = this.gridUncommittedChanges
    this.panelGridChanges.addButton(this.buttonAddChange)
    this.panelGridChanges.addButton(this.buttonAutoChanges)
    this.panelGridChanges.addButton(this.buttonRemoveChange)
    this.panelGridChanges.addButton(this.buttonRegisterChange)

    this.stepper = new Stepper()
    this.bottomPanel = new SplittedArea(Orientations.HORIZONTAL)
    this.bottomPanel.addPanel(new SplittedPanel(this.panelGridChanges, 'Изменения по операции'))
    this.bottomPanel.addPanel(new SplittedPanel(this.stepper, 'Ход операции'))
    this.area.addPanel(this.bottomPanel)
    this.area.size = { width: '100%', height: '100%' }

    this.editedOperation = new EditedOperation()
    this.editedOperation.subscribe(this.onEditedOperationChange.bind(this))

    this.selectedExecutingOperation = new ObservableObject()
    this.selectedExecutingOperation.subscribe(message => {
      switch (message.type) {
        case OBSERVABLE_SET_PROPERTY:
          if (message.path.length === 1) {
            this.stepper.props.zone = message.value
            if (message.value.status) {
              this.buttonOperatorAccept.visible = message.value.request === 3
              this.panelGridZones.resize()
            }
          } else if (message.path.length === 2) {
            switch (message.path[1]) {
              case 'status':
                this.panelGridZones.resize()
                break
              case 'request':
                this.buttonOperatorAccept.visible = message.value === 3
                this.panelGridZones.resize()
                break
              case 'progress':
                break
              default:
                break
            }
          }
          break
        // case OBSERVABLE_ADD_PROPERTY:
        //   if (message.path.length !== 1) return
        //   this.gridChanges.newRow(message.value)
        //   break
        // case OBSERVABLE_REMOVE_PROPERTY:
        //   if (message.path.length !== 1) return
        //   this.gridChanges.removeRow(`${message.path[0]}`)
        //   break
        default:
          break
      }
    })

    this.gridZones[PropertyObservers].selectedRow.subscribe(row => {
      if (row && row.tag) {
        this.selectedExecutingOperation.item = row.tag
      } else {
        this.selectedExecutingOperation.item = undefined
      }
    })

    this.gridOperations[PropertyObservers].selectedRow.subscribe(row => {
      if (row && row.tag) {
        if (row.tag[STORED] === true) {
          this.editedOperation.item = row.tag
          this.buttonReservation.visible = false
          this.buttonRemoveOperation.visible = true
          this.buttonRunOperation.visible = true
          this.buttonAddChange.visible = true
          this.buttonAutoChanges.visible = true
          this.panelGridOperations.resize()
          this.panelGridChanges.resize()
        } else {
          this.editedOperation.item = undefined
          this.buttonReservation.visible = true
          this.buttonRemoveOperation.visible = true
          this.buttonRunOperation.visible = false
          this.buttonAddChange.visible = false
          this.buttonAutoChanges.visible = false
          this.panelGridOperations.resize()
          this.panelGridChanges.resize()
        }
      } else {
        this.editedOperation.item = undefined
        this.buttonReservation.visible = false
        this.buttonRemoveOperation.visible = false
        this.buttonRunOperation.visible = false
        this.buttonAddChange.visible = false
        this.buttonAutoChanges.visible = false
        this.panelGridOperations.resize()
        this.panelGridChanges.resize()
      }
    })

    this.gridUncommittedChanges[PropertyObservers].selectedRow.subscribe(row => {
      if (row && row.tag) {
        if (row.tag[STORED] === true) {
          this.buttonRemoveChange.visible = true
          this.buttonRegisterChange.visible = false
          this.panelGridChanges.resize()
        } else {
          this.buttonRemoveChange.visible = true
          this.buttonRegisterChange.visible = true
          this.panelGridChanges.resize()
        }
      } else {
        this.buttonRemoveChange.visible = false
        this.buttonRegisterChange.visible = false
        this.panelGridChanges.resize()
      }
    })
  }

  clickButtonAddChange () {
    if (this.editedOperation.item === undefined) {
      Core.workspace.modal.add('Выберите операцию из таблицы области [ Операции ]')
      return
    }
    this.uncommitted_changes.newValue(this.editedOperation.item)
  }

  clickButtonRemoveChange () {
    const row = this.gridUncommittedChanges.selectedRow
    if (row && row.tag) { this.uncommitted_changes.deleteStore(row.tag.id) }
  }

  clickButtonAddOperation () {
    this.operations.newValue()
  }

  clickButtonRemoveOperation () {
    const row = this.gridOperations.selectedRow
    if (row && row.tag) { this.operations.deleteStore(row.tag.id) }
  }

  async clickButtonRegisterOperation () {
    const row = this.gridOperations.selectedRow
    if (!(row && row.tag)) {
      Core.workspace.modal.add('Выберите операцию для регистрации')
      return
    }
    const operation = row.tag
    if (operation[STORED] === true) {
      Core.workspace.modal.add('Выбранная операция уже зарегистрирована')
      return
    }
    let isValid = true
    if (!operation.source) {
      Core.workspace.modal.add('Для операции не указан начальный адрес')
      isValid = false
    }
    if (!operation.destination) {
      Core.workspace.modal.add('Для операции не указан конечный адрес')
      isValid = false
    }
    if (isValid) { this.operations.insertStore(operation) }
  }

  async clickButtonAutoChanges () {
    if (this.editedOperation.item === undefined) {
      Core.workspace.modal.add('Выберите зарегистрированную операцию из таблицы области [ Операции ]')
      return
    }
    const item = this.editedOperation.item
    const source = await getValue(item, TABLE_UNCOMMITTED_OPERATIONS, ['source'])
    const table = Core.getTable(TABLE_WAREHOUSE)
    await Core.socket.execute({
      [TABLE_WAREHOUSE]: {
        operation: {
          [$ARGUMENTS]: { destination: source.id },
          destination: _
        },
        nomenclature: _,
        quantity: _
      }
    })
    table.forEach(state => {
      if (state.operation && state.operation.destination && state.operation.destination === source && !this.uncommitted_changes.some(item => {
        const nomenclatureItem = smartGet(item, TABLE_UNCOMMITTED_CHANGES, ['nomenclature'])
        if (isDeferred(nomenclatureItem)) return false
        return item.uncommitted_operation && item.uncommitted_operation === this.editedOperation.item && nomenclatureItem === state.nomenclature
      })) { this.uncommitted_changes.newValue(this.editedOperation.item, state.nomenclature, -state.quantity) }
    })
  }

  async onEditedOperationChange (message) {
    switch (message.type) {
      case OBSERVABLE_SET_PROPERTY:
        if (message.path.length !== 1) return
        switch (message.path[0]) {
          case 'item':
            this.gridUncommittedChanges.selectedRow = undefined
            this.gridUncommittedChanges.filterColumn({
              uncommitted_operation: {
                filter: defaultFilter,
                pattern: { value: message.value.id }
              }
            })
            break
          case 'description':
            this.area.panels[1].panels[0].header.textContent = `[ Изменения по операции ${message.value} ]`
            break
          default:
            break
        }
        break
      case OBSERVABLE_REMOVE_PROPERTY:
        if (message.path.length !== 1 && message.path[0] !== 'item') return
        this.gridUncommittedChanges.selectedRow = undefined
        this.gridUncommittedChanges.filterColumn({
          uncommitted_operation: {
            filter: defaultFilter,
            pattern: { value: -1 }
          }
        })
        break
      default:
        break
    }
  }

  mockup () {
  }

  init () {
    this.uncommitted_changes = Core.getShared(TABLE_UNCOMMITTED_CHANGES, Core.getTable(TABLE_UNCOMMITTED_CHANGES), UncommittedChange, Scheme.queries.get('uncommitted_change_insert'), Scheme.queries.get('uncommitted_change_delete'))
    this.gridUncommittedChanges.available = true
    this.gridUncommittedChanges.setFontSize(20)
    this.gridUncommittedChanges.init()
    this.gridUncommittedChanges.filterColumn({
      uncommitted_operation: {
        filter: defaultFilter,
        pattern: { value: -1 }
      }
    })
    this.uncommitted_changes.forEach(item => {
      this.gridUncommittedChanges.newRow(item)
    })
    this.uncommitted_changes.subscribe(this.onUpdateMapChanges.bind(this))

    this.gridZones.available = true
    this.gridZones.setFontSize(20)
    this.gridZones.init()

    Core.getTable(TABLE_DEVICES)
    const table = Core.getTable(TABLE_ZONES)
    table.forEach(item => {
      this.newRowGridZones(item)
    })
    table.subscribe(this.onGridZonesUpdate.bind(this))
    Core.getTable(TABLE_UNCOMMITTED_CHANGES)
    Core.getTable(TABLE_OWNERS)
    Core.getTable(TABLE_REASONS)

    this.operations = Core.getShared(TABLE_UNCOMMITTED_OPERATIONS, Core.getTable(TABLE_UNCOMMITTED_OPERATIONS), UncommittedOperation, Scheme.queries.get('uncommitted_operation_insert'), Scheme.queries.get('uncommitted_operation_delete'))

    this.gridOperations.available = true
    this.gridOperations.setFontSize(20)
    this.gridOperations.init()
    this.operations.forEach(item => {
      this.gridOperations.newRow(item)
    })
    this.operations.subscribe(this.onUpdateOperations.bind(this))
    Core.socket.execute({
      [TABLE_ZONES]: {
        id: _
      }
    })
    Core.socket.execute({
      [TABLE_UNCOMMITTED_CHANGES]: {
        id: _
      }
    })
    Core.socket.execute({
      [TABLE_NOMENCLATURES]: {
        name: _
      }
    })
    Core.socket.execute({
      [TABLE_OWNERS]: {
        name: _
      }
    })
    Core.socket.execute({
      [TABLE_REASONS]: {
        id: _
      }
    })
    Core.socket.execute({
      [TABLE_ADDRESSES]: {
        id: _
      }
    })
    Core.socket.execute({
      [TABLE_UNCOMMITTED_OPERATIONS]: {
        id: _
      }
    })
  }

  clickButtonRegisterChange () {
    if (this.editedOperation.item === undefined) {
      Core.workspace.modal.add('Выберите операцию из таблицы области [ Операции ]')
      return
    }
    this.uncommitted_changes.forEachLocal(change => {
      if (change.uncommitted_operation !== this.editedOperation.item) return
      let isValid = true
      if (change.nomenclature === undefined) {
        Core.workspace.modal.add('Укажите наименование для строки в таблице области [ Регистрация изменений ]')
        isValid = false
      }
      if (change.increment === undefined) {
        Core.workspace.modal.add('Укажите изменение количества для строки в таблице области [ Регистрация изменений ]')
        isValid = false
      }
      if (change.reason === undefined) {
        Core.workspace.modal.add('Укажите причину для строки в таблице области [ Регистрация изменений ]')
        isValid = false
      }
      if (change.owner === undefined) {
        Core.workspace.modal.add('Укажите принадлежность для строки в таблице области [ Регистрация изменений ]')
        isValid = false
      }
      if (isValid) {
        this.uncommitted_changes.insertStore(change)
      }
    })
  }

  onUpdateMapChanges (message) {
    switch (message.type) {
      case OBSERVABLE_ADD_PROPERTY:
        if (message.path.length !== 1) return
        this.gridUncommittedChanges.newRow(message.value)
        break
      case OBSERVABLE_REMOVE_PROPERTY:
        if (message.path.length !== 1) return
        this.gridUncommittedChanges.removeRow(`${message.path[0]}`)
        break
      default:
        break
    }
  }

  onUpdateOperations (message) {
    switch (message.type) {
      case OBSERVABLE_ADD_PROPERTY:
        if (message.path.length !== 1) return
        this.gridOperations.newRow(message.value)
        break
      case OBSERVABLE_REMOVE_PROPERTY: {
        if (message.path.length !== 1) return
        const id = message.path[0]
        this.uncommitted_changes.forEachLocal(row => {
          if (row.uncommitted_operation.id === id) this.uncommitted_changes.delete(row.id)
        })
        if (this.editedOperation.item && this.editedOperation.item.id === message.path[0]) this.editedOperation.item = undefined
        this.gridOperations.removeRow(`${message.path[0]}`)
      }
        break
      default:
        break
    }
  }

  newRowGridZones (item) {
    const row = new GridRow(this.gridZones, item)
    this.gridZones.addRow(item.id, row)
  }

  onGridZonesUpdate (message) {
    if (message.type === OBSERVABLE_ADD_PROPERTY) {
      this.newRowGridZones(message.value)
    } else if (message.type === OBSERVABLE_REMOVE_PROPERTY) {
      this.gridUncommittedChanges.removeRow(`${message.path[0]}`)
    }
  }

  clickButtonOperatorAccept () {
    const row = this.gridZones.selectedRow
    if (!(row && row.tag)) {
      Core.workspace.modal.add('Выберите рабочую зону для подтверждения')
      return
    }
    if (row.tag.id) {
      Core.socket.execute({
        operator_accept: {
          [$ARGUMENTS]: {
            uncommitted_operation: row.tag.uncommitted_operation.id
          }
        }
      })
    }
  }

  clickButtonRunOperation () {
    const row = this.gridOperations.selectedRow
    if (!(row && row.tag)) {
      Core.workspace.modal.add('Выберите операцию для запуска')
      return
    }
    if (row.tag[STORED] === undefined || row.tag[STORED] === false) {
      Core.workspace.modal.add('Зарегистрируйте операцию для возможности ее запуска')
      return
    }
    const uncommittedOperation = row.tag
    if (this.uncommitted_changes.someLocal(change => {
      return change.uncommitted_operation === uncommittedOperation
    })) {
      Core.workspace.modal.add(`Для запуска операции [ ${uncommittedOperation.id} ], зарегистрируйте/удалите незарегистрированные изменения по операции`)
      return
    }
    Core.socket.execute({
      run_operation: {
        [$ARGUMENTS]: {
          uncommitted_operation: uncommittedOperation.id
        }
      }
    })
  }
}

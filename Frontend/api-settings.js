import { makeEnum } from './enum.js'

let Visualizer
export let THREE

export class PageFabric {
  static async Visualizer() {
    if (THREE === undefined) {
      THREE = await import('three')
    }
    if (Visualizer === undefined)
      Visualizer = (await import('./pages/visualizer.js')).Visualizer
    this.addPage('Визуализатор', new Visualizer(this, 'Визуализатор'))
  }
}

function create(module, importFn, label) {
  PageFabric[module] = async function () {
    const page = this.addPage(
      label,
      new (await importFn())[module](this, label)
    )
    page.mockup()
    page.init()
  }
}

create(
  'SimpleVisualizer',
  function () {
    return import('./pages/simple-visualizer.js')
  },
  'Схема'
)
create(
  'PageChanges',
  function () {
    return import('./pages/page-changes.js')
  },
  'Операции'
)
create(
  'PageMovementManager',
  function () {
    return import('./pages/page-movement-manager.js')
  },
  'Перемещение'
)
create(
  'PageStorage',
  function () {
    return import('./pages/page-storage.js')
  },
  'Склад'
)
create(
  'PageUserEditor',
  function () {
    return import('./pages/page-user-editor.js')
  },
  'Пользователи'
)
create(
  'PageEditorNomenclature',
  function () {
    return import('./pages/page-editor-nomenclature.js')
  },
  'Номенклатура'
)
create(
  'PageEditorProductType',
  function () {
    return import('./pages/page-editor-product-type.js')
  },
  'Вид детали'
)
create(
  'PageWorkzonesService',
  function () {
    return import('./pages/page-workzones-service.js')
  },
  'Сервис'
)
create(
  'PageEditorOwner',
  function () {
    return import('./pages/page-editor-owner.js')
  },
  'Принадлежность'
)
create(
  'PageEditorReason',
  function () {
    return import('./pages/page-editor-reason.js')
  },
  'Причины'
)
create(
  'PageEditorUnit',
  function () {
    return import('./pages/page-editor-unit.js')
  },
  'Единицы измерения'
)
create(
  'WorkersInformation',
  function () {
    return import('./pages/server-info.js')
  },
  'Сессии'
)

export const TABLE_USERS = 'users'
export const TABLE_OWNERS = 'owners'
export const TABLE_REASONS = 'reasons'
export const TABLE_CHANGES = 'changes'
export const TABLE_NOMENCLATURES = 'nomenclatures'
export const TABLE_UNITS = 'units'
export const TABLE_WAREHOUSE = 'warehouse'
export const TABLE_OPERATIONS = 'operations'
export const TABLE_WEBWORKERS = 'webworkers'
export const TABLE_ADDRESSES = 'addresses'
export const TABLE_UNCOMMITTED_CHANGES = 'uncommitted_changes'
export const TABLE_ZONES = 'zones'
export const TABLE_DEVICES = 'devices'
export const TABLE_UNCOMMITTED_OPERATIONS = 'uncommitted_operations'
export const TABLE_PRODUCT_TYPES = 'product_types'

export const Privileges = makeEnum([
  'USERS_EDIT',
  'UNITS_EDIT',
  'REASONS_EDIT',
  'ZONES_EDIT',
  'NOMENCLATURES_EDIT',
  'OWNERS_EDIT',
  'PRODUCT_TYPES_EDIT',
  'SERVICE_ALLOWED',
])

export const Directions = makeEnum(['NONE', 'ARRIVAL', 'ISSUE', 'ANY'])

export const AddressTypes = makeEnum(['DESK', 'ODD_CELL', 'EVEN_CELL'])

export const OperationTypes = makeEnum([
  'DESK_TO_CELL',
  'CELL_TO_DESK',
  'CELL_TO_CELL',
  'CELL_TO_DESK_TO_CELL',
  'CELL_TO_DESK_TO_CELL_WITHOUT_CONFIRMATION',
])

export const Orientations = makeEnum(['HORIZONTAL', 'VERTICAL'])

export const States = makeEnum(['UNLOCKED', 'LOCKED'])

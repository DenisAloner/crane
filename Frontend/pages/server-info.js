import { Core } from '../api.js'
import { TABLE_WEBWORKERS } from '../api-settings.js'
import { Page } from '../page.js'
import { GridRow, Grid, GridCellBindable, sortingByValueString } from '../components/grid/grid.js'
import { SplittedPanel } from '../splitted-area.js'
import { OBSERVABLE_ADD_PROPERTY, OBSERVABLE_REMOVE_PROPERTY } from '../observable.js'
import { _ } from '../graph-ql/gql-constants.js'
import { defaultCellDisplay } from '../components/grid/cell-display/cell-display.js'
import { BinderStore } from '../binders/binder-store.js'

export class WorkersInformation extends Page {
  constructor (owner, name) {
    super(owner, name)

    this.grid = new Grid(`serverInfo${Date.now()}`)
    this.grid.AddColumn(
      'id',
      'ID',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_WEBWORKERS, '', 'id'),
      sortingByValueString
    )
    this.grid.AddColumn(
      'ip',
      'IP',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_WEBWORKERS, '', 'ip'),
      sortingByValueString
    )
    this.grid.AddColumn(
      'login',
      'Логин',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_WEBWORKERS, '', 'user', 'login'),
      sortingByValueString
    )
    this.grid.AddColumn(
      'full_name',
      'ФИО',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_WEBWORKERS, '', 'user', 'full_name'),
      sortingByValueString
    )
    const panel = new SplittedPanel(this.grid)
    this.addComponent(panel)
    panel.size = { width: '100%', height: '100%' }
  }

  mockup () {
  }

  init () {
    this.grid.available = true
    this.grid.setFontSize(20)
    this.grid.init()
    const table = Core.getTable(TABLE_WEBWORKERS)
    table.forEach(item => {
      this.newRow(item)
    })
    table.subscribe(this.onTableUpdate.bind(this))
    Core.socket.execute({
      webworkers: {
        id: _
      }
    })
  }

  newRow (item) {
    const row = new GridRow(this.grid, item)
    this.grid.addRow(item.id, row)
  }

  onTableUpdate (message) {
    if (message.type === OBSERVABLE_ADD_PROPERTY) {
      if (message.path.length === 1) {
        this.newRow(message.value)
      }
    } else if (message.type === OBSERVABLE_REMOVE_PROPERTY) {
      this.grid.removeRow(`${message.path[0]}`)
    }
  }
}

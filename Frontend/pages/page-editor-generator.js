import { Page } from '../page.js'
import { GridLocalable } from '../components/grid/grid-localable.js'
import { SplittedPanel } from '../splitted-area.js'
import { PanelGrid } from '../panel-grid.js'
import { Button, InputButton } from '../button.js'
import { Core } from '../api.js'
import { _, STORED } from '../graph-ql/gql-constants.js'
import { OBSERVABLE_ADD_PROPERTY, OBSERVABLE_REMOVE_PROPERTY } from '../observable.js'
import { PropertyObservers } from '../mixin.js'

export function generate (nameTable, arrayColumns, arrayTables, initFn, loadFn) {
  return class extends Page {
    constructor (owner, name) {
      super(owner, name)
      this.grid = new GridLocalable(`${nameTable}${Date.now()}`)

      arrayColumns.forEach(column => {
        this.grid.AddColumnLocalable(...column)
      })

      this.buttonAdd = new Button('Добавить')
      this.buttonStored = new Button('Фиксировать')
      this.buttonStored.visible = false
      this.buttonRemove = new Button('Удалить')
      this.buttonRemove.visible = false
      this.panelGrid = new PanelGrid()
      this.panelGrid.grid = this.grid
      this.panelGrid.addButton(this.buttonAdd)
      this.panelGrid.addButton(this.buttonStored)
      this.panelGrid.addButton(this.buttonRemove)
      if (loadFn !== undefined) {
        this.buttonLoad = new InputButton('Загрузить', loadFn.bind(this))
        this.panelGrid.addButton(this.buttonLoad)
      }
      const panel = new SplittedPanel(this.panelGrid)
      this.addComponent(panel)
      panel.size = { width: '100%', height: '100%' }

      this.grid[PropertyObservers].selectedRow.subscribe(row => {
        if (row && row.tag) {
          if (row.tag[STORED] === true) {
            this.buttonStored.visible = false
            this.buttonRemove.visible = true
            this.panelGrid.resize()
          } else {
            this.buttonStored.visible = true
            this.buttonRemove.visible = true
            this.panelGrid.resize()
          }
        } else {
          this.buttonStored.visible = false
          this.buttonRemove.visible = false
          this.panelGrid.resize()
        }
      })
    }

    mockup () {}

    init () {
      this.grid.available = true
      this.grid.setFontSize(20)
      this.grid.init()
      this.map = initFn()
      this.map.forEach(item => { this.grid.newRow(item) })
      this.map.subscribe(this.onUpdateMap.bind(this))
      this.buttonAdd.click(this.clickButtonAdd, this)
      this.buttonRemove.click(this.clickButtonRemove, this)
      this.buttonStored.click(this.clickButtonStored, this)
      arrayTables.forEach(table => { Core.getTable(table) })
      arrayTables.forEach(table => {
        Core.socket.execute({
          [table]: {
            id: _
          }
        })
      })
    }

    async clickButtonAdd () {
      this.map.newValue()
    }

    clickButtonRemove () {
      const row = this.grid.selectedRow
      if (row && row.tag) { this.map.deleteStore(row.tag.id) }
    }

    async clickButtonStored () {
      const row = this.grid.selectedRow
      if (row && row.tag) { this.map.insertStore(row.tag) }
    }

    onUpdateMap (message) {
      switch (message.type) {
        case OBSERVABLE_ADD_PROPERTY:
          if (message.path.length !== 1) return
          this.grid.newRow(message.value)
          break
        case OBSERVABLE_REMOVE_PROPERTY:
          if (message.path.length !== 1) return
          this.grid.removeRow(`${message.path[0]}`)
          break
        default:
          break
      }
    }
  }
}

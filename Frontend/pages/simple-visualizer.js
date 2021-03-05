import { Core, smartGet, isDeferred } from '../api.js'
import { createMixinComponent, PropertySize } from '../mixin.js'
import { TABLE_ADDRESSES, TABLE_WAREHOUSE } from '../api-settings.js'
import { Page } from '../page.js'
import { $ARGUMENTS, _ } from '../graph-ql/gql-constants.js'
import { OBSERVABLE_SET_PROPERTY, OBSERVABLE_ADD_PROPERTY, OBSERVABLE_REMOVE_PROPERTY } from '../observable.js'
import { SplittedPanel } from '../splitted-area.js'
import { PanelGrid } from '../panel-grid.js'
import { Button } from '../button.js'
import { lazyCSS } from '../lazy-css.js'

const cellCountX = 14
const cellCountY = 15

class CellGrid extends createMixinComponent(PropertySize) {
  constructor () {
    super()
    if (this.constructor.lazyCSS === undefined) {
      lazyCSS(this.constructor,
        `Component{width:100%;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(${cellCountX},auto);grid-template-rows:repeat(${cellCountY},auto);grid-gap:0.35vw;background-color:white;padding:0.35vw}`,
        'Component>div{display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;font-size:1.5vh;box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);color:var(--first-color)}'
      )
    }
    this.domComponent = document.createElement('div')
    this.domComponent.className = `${this.constructor.lazyCSS}Component`
  }

  resize () {}
}

export class SimpleVisualizer extends Page {
  constructor (owner, name) {
    super(owner, name)
    this.addresses = new Map()
    this.changes = new Map()
    this.cellGrid = new CellGrid()
    this.panelGrid = new PanelGrid()
    this.panelGrid.grid = this.cellGrid
    this.button1 = new Button('Ряд А')
    this.button2 = new Button('Ряд Б')
    this.panelGrid.addButton(this.button1)
    this.panelGrid.addButton(this.button2)
    this.splittedPanel = new SplittedPanel(this.panelGrid)
    this.splittedPanel.size = { width: '100%', height: '100%' }
    this.addComponent(this.splittedPanel)
    this.button1.domComponent.addEventListener('click', this.clickButton1.bind(this))
    this.button2.domComponent.addEventListener('click', this.clickButton2.bind(this))
  }

  updateRack (letter) {
    while (this.cellGrid.domComponent.firstChild) {
      this.cellGrid.domComponent.firstChild.remove()
    }
    for (let y = 0; y < cellCountY; y++) {
      for (let x = 0; x < cellCountX; x++) {
        const name = `${letter}-${cellCountY - y}-${x + 1}`
        const iterator = this.addressesTable.values()
        for (let index = 0; index < this.addressesTable.size; index++) {
          const element = iterator.next().value
          if (element.name === name) {
            if (this.addresses.get(element.id)) this.cellGrid.domComponent.append(this.addresses.get(element.id).mesh)
            break
          }
        }
      }
    }
  }

  clickButton1 () {
    this.updateRack('А')
  }

  clickButton2 () {
    this.updateRack('Б')
  }

  mockup () {}

  init () {
    this.addressesTable = Core.getTable(TABLE_ADDRESSES)
    this.warehouse = Core.getTable(TABLE_WAREHOUSE)
    Core.socket.execute({
      addresses: {
        name: _
      }
    }, this.initCells.bind(this))
  }

  initCells () {
    this.addressesTable.forEach(element => {
      const address = { mesh: document.createElement('div'), address: element.id, changes: new Set() }
      address.mesh.style.backgroundColor = 'var(--second-color)'
      address.mesh.append(document.createElement('div'))
      address.mesh.append(document.createElement('div'))
      address.mesh.append(document.createElement('div'))
      address.mesh.children[0].textContent = element.name
      address.mesh.children[1].textContent = 'Масса: 0кг'
      address.mesh.children[2].textContent = 'Свободен'
      this.addresses.set(element.id, address)
    })
    this.warehouse.subscribe(value => { this.onWarehouseUpdate(value) })
    Core.socket.execute({
      warehouse: {
        operation: {
          destination: _,
          weight: _,
          time_stamp: _
        }
      }
    }, this.initCargo.bind(this))
  }

  initCargo () {
    this.warehouse.forEach(state => {
      this.setCell(state.id)
    })
  }

  onWarehouseUpdate (value) {
    if (value.type === OBSERVABLE_ADD_PROPERTY) {
      if (value.path.length === 1) {
        const state = value.value
        if (state.operation && state.operation.destination && state.operation.weight) {
          this.setCell(state.id)
        } else {
          Core.socket.execute({
            warehouse: {
              [$ARGUMENTS]: { id: state.id },
              operation: {
                weight: _
              }
            }
          }, () => { this.setCell(state.id) })
        }
      }
    } else if (value.type === OBSERVABLE_REMOVE_PROPERTY) {
      if (value.path.length === 1) {
        this.removeCell(value.path[0])
      }
    }
  }

  async addressUpdate (address) {
    let latestOperation
    const iterator = address.changes.values()
    for (let index = 0; index < address.changes.size; index++) {
      const state = this.warehouse.get(iterator.next().value)
      let timeStamp = smartGet(state, TABLE_WAREHOUSE, ['operation', 'time_stamp'])
      if (isDeferred(timeStamp)) {
        await timeStamp
        timeStamp = state.operation.time_stamp
      }
      if (latestOperation === undefined || latestOperation.time_stamp < timeStamp) { latestOperation = state.operation }
    }
    if (latestOperation.weight === undefined) latestOperation.weight = 0
    const red = latestOperation.weight / 550 * 255
    address.mesh.style.backgroundColor = `rgb(${red},${255 - red},0)`
    address.mesh.children[1].textContent = `Масса: ${latestOperation.weight}кг`
    address.mesh.children[2].textContent = 'Занят'
    if (address.unsubscribe !== undefined) address.unsubscribe()
    address.unsubscribe = latestOperation.subscribe((message) => {
      if (message.path.length === 1 && message.path[0] === 'weight' && message.type === OBSERVABLE_SET_PROPERTY) {
        const red = message.value / 550 * 255
        address.mesh.style.backgroundColor = `rgb(${red},${255 - red},0)`
        address.mesh.children[1].textContent = `Масса: ${message.value}кг`
      }
      if (message.path.length === 2 && message.path[0] === 'destination' && message.path[0] === 'name' && message.type === OBSERVABLE_SET_PROPERTY) {
        address.mesh.children[0].textContent = message.value
      }
    })
  }

  async setCell (id) {
    const state = this.warehouse.get(id)
    let addressId = smartGet(state, TABLE_WAREHOUSE, ['operation', 'destination', 'id'])
    if (isDeferred(addressId)) {
      await addressId
      addressId = state.operation.destination.id
    }
    const address = this.addresses.get(addressId)
    address.changes.add(state.id)
    this.changes.set(state.id, address)
    await this.addressUpdate(address)
  }

  async removeCell (id) {
    const address = this.changes.get(id)
    if (address !== undefined) {
      this.changes.delete(id)
      address.changes.delete(id)
      if (address.changes.size === 0) {
        if (address.unsubscribe !== undefined) address.unsubscribe()
        address.mesh.style.backgroundColor = 'var(--second-color)'
        address.mesh.children[1].textContent = 'Масса: 0кг'
        address.mesh.children[2].textContent = 'Свободен'
      } else {
        await this.addressUpdate(address)
      }
    }
  }
}

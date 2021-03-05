import { createMixinComponent, PropertySize, PropertyObservers } from './mixin.js'

export const lastVisibleItem = 'last_visible_item'

export class PanelGrid extends createMixinComponent(PropertySize) {
  constructor (buttonSize = '40px') {
    super()
    this.buttonSize = buttonSize
    this.buttons = []
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'componentWrap'
  }

  get size () {
    return super.size
  }

  set size (value) {
    if (this._size !== value) {
      this._size = value
      this.domComponent.style.width = this._size.width
      this.domComponent.style.height = this._size.height
      if (this.buttons.length === 0) {
        this.grid.size = { width: '100%', height: '100%' }
      } else {
        this.grid.size = { width: '100%', height: `calc(100% - ${this.buttonSize})` }
        this.buttons.forEach(component => {
          component.resizeText()
        })
      }
    }
  }

  resize (size) {
    if (this.grid) this.grid.resize(size)
  }

  get grid () {
    return this._grid
  }

  set grid (component) {
    this._grid = component
    if (component) {
      this.domComponent.append(this._grid.domComponent)
      this._grid.owner = this
    }
  }

  lastButton () {
    if (this.buttons.length === 1) {
      this.buttons[0].domComponent.classList.add(lastVisibleItem)
    } else {
      for (let index = 0; index < this.buttons.length; index++) {
        const button = this.buttons[index]
        button.domComponent.classList.remove(lastVisibleItem)
      }
      for (let index = this.buttons.length - 1; index > -1; index--) {
        const button = this.buttons[index]
        if (button.visible) {
          button.domComponent.classList.add(lastVisibleItem)
          break
        }
      }
    }
  }

  addButton (component) {
    if (component) {
      if (this.buttonPanel === undefined) {
        this.buttonPanel = document.createElement('div')
        this.buttonPanel.className = 'panel-grid-buttons-panel'
        this.buttonPanel.style.height = this.buttonSize
        this.domComponent.append(this.buttonPanel)
      }
      this.buttons.push(component)
      component.domComponent.classList.add('buttonPanel_ItemBorder')
      this.buttonPanel.append(component.domComponent)
      component.owner = this
      const size = { height: this.buttonSize }
      this.buttons.forEach(component => {
        component.size = size
      })
      this.lastButton()
      component[PropertyObservers].visible.subscribe(this.lastButton.bind(this))
      this.resize()
    }
  }
}

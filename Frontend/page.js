import { createMixinComponent, PropertySize } from './mixin.js'

export class Page extends createMixinComponent(PropertySize) {
  constructor(owner, name) {
    super()
    this.owner = owner
    this.components = []
    this.name = name
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'page_Component'
    this.owner.domContentSpace.append(this.domComponent)
    this._visible = true
  }

  addComponent(component) {
    component.owner = this.domComponent
    this.domComponent.append(component.domComponent)
    this.components.push(component)
  }

  resize(width, height) {
    this.components.forEach((component) => {
      component.resize(width, height)
    })
  }

  getVisible() {
    return this._visible
  }

  setVisible(value) {
    if (this._visible !== value) {
      this._visible = value
      if (this._visible) {
        this.domComponent.style.display = ''
      } else {
        this.domComponent.style.display = 'none'
      }
    }
  }
}

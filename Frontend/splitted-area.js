import {
  createMixinComponent,
  PropertySize,
  PropertyPosition,
  Scrollable,
} from './mixin.js'
import { Orientations } from './api-settings.js'
import { lazyCSS } from './lazy-css.js'

class Splitter extends createMixinComponent(
  PropertySize,
  PropertyPosition,
  Scrollable
) {
  constructor(owner, orientation = Orientations.VERTICAL) {
    super()
    if (this.constructor.lazyCSS === undefined) {
      lazyCSS(
        this.constructor,
        'Horizontal{position:absolute;width:50%;height:100%;border-right:1px dashed var(--first-color)}',
        'Vertical{position:absolute;width:100%;height:50%;border-bottom:1px dashed var(--first-color)}'
      )
    }
    this.orientation = orientation
    this.owner = owner
    this.domComponent = document.createElement('div')
    const line = document.createElement('div')
    switch (this.orientation) {
      case Orientations.VERTICAL:
        line.className = `${this.constructor.lazyCSS}Vertical`
        this.domComponent.className = 'splittedArea_Splitter splitter_Vertical'
        break
      case Orientations.HORIZONTAL:
        line.className = `${this.constructor.lazyCSS}Horizontal`
        this.domComponent.className =
          'splittedArea_Splitter splitter_Horizontal'
        break
    }
    this.domComponent.append(line)
    this.bindScrollEvents(this.domComponent)
  }

  onScrollStart(value) {
    const index = this.owner.splitters.indexOf(this)
    this.owner.panels[index].domComponent.style.pointerEvents = 'none'
    this.owner.panels[index + 1].domComponent.style.pointerEvents = 'none'
  }

  onScrollEnd(value) {
    switch (this.orientation) {
      case Orientations.VERTICAL:
        this.owner.resetPosition(value.pageY, this)
        break
      case Orientations.HORIZONTAL:
        this.owner.resetPosition(value.pageX, this)
        break
    }
    const index = this.owner.splitters.indexOf(this)
    this.owner.panels[index].domComponent.style.pointerEvents = ''
    this.owner.panels[index + 1].domComponent.style.pointerEvents = ''
  }

  onScrollMove(value) {
    switch (this.orientation) {
      case Orientations.VERTICAL:
        this.owner.resetPosition(value.pageY, this)
        break
      case Orientations.HORIZONTAL:
        this.owner.resetPosition(value.pageX, this)
        break
    }
  }
}

export class SplittedPanel extends createMixinComponent(
  PropertySize,
  PropertyPosition
) {
  constructor(items, name) {
    super()
    this.items = []
    if (this.constructor.lazyCSS === undefined) {
      lazyCSS(
        this.constructor,
        'Label{width:100%;height:40px;text-align:center;font-size:26px;line-height:40px;position:relative;color:var(--first-color)}'
      )
    }
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'component'
    this.domComponent.style.position = 'absolute'
    if (name !== undefined) {
      this.header = document.createElement('div')
      this.header.className = `${this.constructor.lazyCSS}Label`
      this.header.textContent = `[ ${name} ]`
    }
    this.content = document.createElement('div')
    this.content.className = 'splittedArea_Panel'
    this.content.style.width = '100%'
    if (this.header !== undefined) {
      this.content.style.height = 'calc(100% - 40px)'
      this.domComponent.append(this.header)
    } else {
      this.content.style.height = '100%'
    }
    this.domComponent.append(this.content)
    if (Array.isArray(items)) {
      items.forEach((item) => {
        this.add(item)
      })
    } else {
      this.add(items)
    }
  }

  add(item) {
    if (item) {
      this.items.push(item)
      this.content.append(item.domComponent)
      item.domComponent.style.left = ''
      item.domComponent.style.top = ''
      item.size = { width: '', height: '' }
      item.domComponent.classList.add('splittedArea_Wrap')
      if (this.header !== undefined) {
        item.domComponent.classList.add('splittedArea_WrapWithHeader')
      } else {
        item.domComponent.classList.add('splittedArea_WrapWithoutHeader')
      }
    }
  }

  resize() {
    if (this.items) {
      this.items.forEach((child) => {
        child.resize()
      })
    }
  }
}

export class SplittedArea extends createMixinComponent(
  PropertySize,
  PropertyPosition
) {
  constructor(orientation = Orientations.VERTICAL) {
    super()
    this.orientation = orientation
    this.owner = null
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'sharedArea_Component'
    this.panels = []
    this.splitters = []
  }

  resize() {
    this.panels.forEach((panel) => {
      panel.resize()
    })
  }

  resetPosition(pos, splitter) {
    const index = this.splitters.indexOf(splitter)
    const rectOwner = this.domComponent.getBoundingClientRect()
    switch (this.orientation) {
      case Orientations.VERTICAL:
        {
          let top
          if (index === 0) {
            top = rectOwner.top
          } else {
            const spl = this.splitters[index - 1].domComponent
            const rect = spl.getBoundingClientRect()
            top = (rect.top + rect.bottom) / 2
          }
          let bottom
          if (index === this.splitters.length - 1) {
            bottom = rectOwner.bottom
          } else {
            const spl = this.splitters[index + 1].domComponent
            const rect = spl.getBoundingClientRect()
            bottom = (rect.top + rect.bottom) / 2
          }
          if (pos < top) pos = top
          if (pos > bottom) pos = bottom
          const divider = (1 / this.domComponent.offsetHeight) * 100
          const a = (pos - top) * divider
          const b = (bottom - pos) * divider
          this.panels[index].size = { height: `${a}%` }
          this.panels[index + 1].size = { height: `${b}%` }
          this.panels[index + 1].position = {
            y: `calc(${this.panels[index].position.y} + ${a}%)`,
          }
          this.panels[index].resize()
          this.panels[index + 1].resize()
          splitter.position = {
            y: `calc(${this.panels[index + 1].position.y} - ${
              splitter.size.height
            } / 2)`,
          }
        }
        break
      case Orientations.HORIZONTAL:
        {
          let left
          if (index === 0) {
            left = rectOwner.left
          } else {
            const spl = this.splitters[index - 1].domComponent
            const rect = spl.getBoundingClientRect()
            left = (rect.left + rect.right) / 2
          }
          let right
          if (index === this.splitters.length - 1) {
            right = rectOwner.right
          } else {
            const spl = this.splitters[index + 1].domComponent
            const rect = spl.getBoundingClientRect()
            right = (rect.left + rect.right) / 2
          }
          if (pos < left) pos = left
          if (pos > right) pos = right
          const divider = (1 / this.domComponent.offsetWidth) * 100
          const a = (pos - left) * divider
          const b = (right - pos) * divider
          this.panels[index].size = { width: `${a}%` }
          this.panels[index + 1].size = { width: `${b}%` }
          this.panels[index + 1].position = {
            x: `calc(${this.panels[index].position.x} + ${a}%)`,
          }
          this.panels[index].resize()
          this.panels[index + 1].resize()
          splitter.position = {
            x: `calc(${this.panels[index + 1].position.x} - ${
              splitter.size.width
            } / 2)`,
          }
        }
        break
    }
  }

  setRatios(ratios) {
    let shift = 0
    for (let i = 0; i < this.panels.length; i++) {
      const element = this.panels[i]
      switch (this.orientation) {
        case Orientations.VERTICAL:
          element.position = { x: '0%', y: `${shift}%` }
          element.size = { width: '100%', height: `${ratios[i]}%` }
          if (i > 0) {
            this.splitters[i - 1].position = {
              x: '0%',
              y: `calc(${element.position.y} - ${
                this.splitters[i - 1].size.height
              } / 2)`,
            }
          }
          break
        case Orientations.HORIZONTAL:
          element.position = { x: `${shift}%`, y: '0%' }
          element.size = { width: `${ratios[i]}%`, height: '100%' }
          if (i > 0) {
            this.splitters[i - 1].position = {
              x: `calc(${element.position.x} - ${
                this.splitters[i - 1].size.width
              } / 2)`,
              y: '0%',
            }
          }
          break
      }
      shift += ratios[i]
    }
  }

  addPanel(panel) {
    if (this.panels.length > 0) {
      const splitter = new Splitter(this, this.orientation)
      switch (this.orientation) {
        case Orientations.VERTICAL:
          splitter.size = { width: '100%', height: '16px' }
          break
        case Orientations.HORIZONTAL:
          splitter.size = { width: '16px', height: '100%' }
          break
      }
      this.splitters.push(splitter)
      this.panels.push(panel)
      this.domComponent.append(splitter.domComponent)
      this.domComponent.append(panel.domComponent)
      const length = 100 / this.panels.length
      this.setRatios(new Array(this.panels.length).fill(length))
      this.resize()
    } else {
      panel.position = { x: '0%', y: '0%' }
      panel.size = { width: '100%', height: '100%' }
      this.panels.push(panel)
      this.domComponent.append(panel.domComponent)
      this.resize()
    }
  }
}

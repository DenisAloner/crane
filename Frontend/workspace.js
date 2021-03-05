import { createMixinComponent, PropertySize } from './mixin.js'
import { Modal } from './modal.js'
import { Button, MaskButton } from './button.js'
import { Page } from './page.js'
import { PageFabric } from './api-settings.js'
import { lazyCSS } from './lazy-css.js'

class Header {
  constructor (owner, page) {
    this.owner = owner
    this.page = page
    this.buttonClose = new MaskButton('mask-close', () => { this.owner.owner.removePage(this.page) })
    this.buttonClose.domComponent.className = 'headerPage_Button'
    this.buttonClose.size = { width: '32px', height: '32px' }
    this.buttonClose.visible = true
    this.buttonClose.domIcon.classList.add('background-second-color')
    this.buttonClose.domIcon.style.width = this.buttonClose.size.width
    this.buttonClose.domIcon.style.height = this.buttonClose.size.width
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'headerPage_Component'
    this.domLabel = document.createElement('span')
    this.domLabel.className = 'headerPage_Label'
    this.domLabel.textContent = this.page.name
    // this.domLabel.append(this.buttonClose.domComponent)
    this.domComponent.append(this.domLabel)
    this.domComponent.append(this.buttonClose.domComponent)
    this.onClick = () => { this.owner.onHeaderClick(this) }
    this.domComponent.addEventListener('click', this.onClick)
  }

  get active () {
    return this._active
  }

  set active (value) {
    if (this._active !== value) {
      this._active = value
      if (this._active) {
        this.buttonClose.visible = true
        this.domComponent.offsetWidth
        this.domComponent.classList.add('select')
      } else {
        this.buttonClose.visible = false
        this.domComponent.offsetWidth
        this.domComponent.classList.remove('select')
      }
    }
  }

  dispose () {
    this.owner = undefined
    this.page = undefined
    this.domLabel.remove()
    this.domLabel = undefined
    this.domComponent.removeEventListener('click', this.onClick)
    this.domComponent.remove()
    this.domComponent = undefined
  }
}

export class ToolBar extends createMixinComponent(PropertySize) {
  constructor (owner) {
    super()
    if (this.constructor.lazyCSS === undefined) {
      lazyCSS(this.constructor,
        'Icon{display:inline-block;vertical-align:top;width:64px;height:64px}'
      )
    }
    this.owner = owner
    this.headers = new Map()
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'workspace_Toolbar'
    const ico = document.createElement('div')
    ico.className = `${this.constructor.lazyCSS}Icon`
    this.domComponent.append(ico)
    this.domHeaderContainer = document.createElement('div')
    this.domHeaderContainer.className = 'workspace_HeaderContainer'
    this.domHeaderContainerView = document.createElement('div')
    this.domHeaderContainerView.className = 'workspace_HeaderContainerView'

    this.buttonLeft = new MaskButton('mask-chevron_left', () => {
      this.domHeaderContainerView.scrollLeft -= this.width - 128
    })
    this.buttonLeft.domComponent.className = 'paginator_button'
    this.buttonLeft.domComponent.classList.add('shadowRight2dp')
    this.buttonLeft.domIcon.classList.add('background-first-color')
    const buttonSize = { width: '64px', height: '64px' }
    this.buttonLeft.size = buttonSize
    this.domHeaderContainerView.addEventListener('scroll', () => {
      const scrollLeft = this.domHeaderContainerView.scrollLeft
      const width = this.domHeaderContainerView.scrollWidth - this.domHeaderContainerView.clientWidth
      this.buttonLeft.disabled = scrollLeft === 0
      this.buttonRight.disabled = scrollLeft === width
    })
    this.buttonRight = new MaskButton('mask-chevron_right', () => {
      this.domHeaderContainerView.scrollLeft += this.width - 128
    })
    this.buttonRight.domComponent.className = 'paginator_button'
    this.buttonRight.domComponent.classList.add('shadowLeft2dp')
    this.buttonRight.domIcon.classList.add('background-first-color')
    this.buttonRight.size = buttonSize

    this.buttonLeft.visible = false
    this.buttonRight.visible = false
    this.domHeaderContainer.append(this.buttonLeft.domComponent)
    this.domHeaderContainer.append(this.domHeaderContainerView)
    this.domHeaderContainer.append(this.buttonRight.domComponent)
    this.domComponent.append(this.domHeaderContainer)
    this._width = 0
    this._contentWidth = 0
  }

  get size () {
    return super.size
  }

  set size (value) {
    if (this._size !== value) {
      this._size = value
      this.domComponent.style.width = this._size.width
      this.domComponent.style.height = this._size.height
      this.domHeaderContainer.style.width = `calc(100% - ${this._size.height})`
      this.domHeaderContainer.style.height = this._size.height
    }
  }

  get width () {
    return this._width
  }

  set width (value) {
    this._width = value
    this.buttonController()
  }

  get contentWidth () {
    return this._contentWidth
  }

  set contentWidth (value) {
    this._contentWidth = value
    this.buttonController()
  }

  resize () {
    this.width = this.domHeaderContainer.offsetWidth
  }

  buttonController () {
    this._contentWidth = 0
    this.headers.forEach(element => {
      this._contentWidth += element.domComponent.offsetWidth
    })
    if (this._contentWidth > this._width) {
      this.buttonLeft.visible = true
      this.buttonRight.visible = true
      this.domHeaderContainerView.style.width = `calc(100% - ${128}px)`
    } else {
      this.buttonLeft.visible = false
      this.buttonRight.visible = false
      this.domHeaderContainerView.style.width = ''
    }
  }

  addHeader (page) {
    const header = new Header(this, page)
    this.headers.set(page, header)
    this.domHeaderContainerView.append(header.domComponent)
    this.buttonController()
    return header
  }

  removeHeader (page) {
    const header = this.headers.get(page)
    this.domHeaderContainerView.removeChild(header.domComponent)
    this.buttonController()
    this.headers.delete(page)
    header.dispose()
  }

  onHeaderClick (header) {
    this.owner.onActivatePage(header.page)
  }
}

class Menu {
  constructor (owner) {
    this.owner = owner
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'workspace_Menu'

    this.domLayer = document.createElement('div')
    this.domLayer.className = 'workspace_ButtonWrapper'
    this.owner.domComponent.append(this.domComponent)
    this.header = document.createElement('div')
    this.header.style.color = 'var(--second-color)'
    this.header.style.width = '100%'
    this.header.style.height = '64px'
    this.header.style.lineHeight = this.header.style.height
    this.header.style.fontSize = `calc(${this.header.style.height} - 12px)`
    this.header.style.textAlign = 'center'
    this.header.textContent = 'АРСЕНАЛУМ'
    this.header.style.cursor = 'pointer'
    this.domItemContainer = document.createElement('div')
    this.domItemContainer.style.width = '100%'
    this.domItemContainer.style.height = `calc(100% - ${this.header.style.height})`
    this.domItemContainer.style.overflowY = 'auto'
    this.logo = document.createElement('div')
    this.logo.style.width = '64px'
    this.logo.style.height = '96px'
    this.logo.style.position = 'absolute'
    this.logo.style.top = '0px'
    this.logo.style.right = '0px'
    this.logo.style.backgroundImage = 'url("/resources/logo.svg")'
    this.logo.style.backgroundSize = 'cover'
    this.logo.style.cursor = 'pointer'
    this.logo.style.pointerEvents = 'all'
    this.domLayer.append(this.header)
    this.domLayer.append(this.domItemContainer)
    this.domComponent.append(this.domLayer)
    this.domComponent.append(this.logo)
    this.onExpandDelegate = this.onExpand.bind(this)
    this.onCollapseDelegate = this.onCollapse.bind(this)
    this.domComponent.addEventListener('click', this.onExpandDelegate)
  }

  onExpand (event) {
    event.stopPropagation()
    this.domComponent.removeEventListener('click', this.onExpandDelegate)
    this.header.addEventListener('click', this.onCollapseDelegate)
    this.logo.addEventListener('click', this.onCollapseDelegate)
    this.domComponent.classList.add('active')
  }

  onCollapse (event) {
    event.stopPropagation()
    this.domComponent.classList.remove('active')
    this.header.removeEventListener('click', this.onCollapseDelegate)
    this.logo.removeEventListener('click', this.onCollapseDelegate)
    this.domComponent.addEventListener('click', this.onExpandDelegate)
  }

  addItem (label, callback) {
    const button = new Button(label)
    button.size = { width: '100%', height: '50px' }
    this.domItemContainer.append(button.domComponent)
    button.resizeText()
    button.click(callback)
    return button
  }
}

export class Workspace extends createMixinComponent(PropertySize) {
  constructor (target) {
    super()
    this.owner = target
    this.pages = new Set()
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'workspace_Component'
    this.toolBar = new ToolBar(this)
    this.domContentSpace = document.createElement('div')
    this.domContentSpace.className = 'workspace_ContentSpace'
    this.modal = new Modal(this)
    this.domComponent.append(this.toolBar.domComponent)
    this.domComponent.append(this.domContentSpace)
    this.domComponent.append(this.modal.domComponent)
    this.menu = new Menu(this)
    this.menu.addItem('Сервис', PageFabric.PageWorkzonesService.bind(this))
    this.menu.addItem('Визуализация', PageFabric.Visualizer.bind(this))
    this.menu.addItem('Схема', PageFabric.SimpleVisualizer.bind(this))
    this.menu.addItem('Перемещение', PageFabric.PageMovementManager.bind(this))
    this.menu.addItem('Склад', PageFabric.PageStorage.bind(this))
    this.menu.addItem('Пользователи', PageFabric.PageUserEditor.bind(this))
    this.menu.addItem('Номенклатура', PageFabric.PageEditorNomenclature.bind(this))
    this.menu.addItem('Принадлежность', PageFabric.PageEditorOwner.bind(this))
    this.menu.addItem('Единицы измерения', PageFabric.PageEditorUnit.bind(this))
    this.menu.addItem('Причины', PageFabric.PageEditorReason.bind(this))
    this.menu.addItem('Операции', PageFabric.PageChanges.bind(this))
    this.menu.addItem('Вид детали', PageFabric.PageEditorProductType.bind(this))
    this.menu.addItem('Сессии', PageFabric.WorkersInformation.bind(this))
    window.addEventListener('resize', this.resize.bind(this), false)
    target.append(this.domComponent)
    this.size = { width: '100%', height: '100%' }
  }

  get size () {
    return super.size
  }

  set size (value) {
    if (this._size !== value) {
      this._size = value
      this.domComponent.style.width = this._size.width
      this.domComponent.style.height = this._size.height
      this.toolBar.size = { width: '100%', height: '64px' }
      this.domContentSpace.style.width = '100%'
      this.domContentSpace.style.height = `calc(100% - ${this.toolBar.size.height})`
    }
  }

  resize () {
    const rect = this.domComponent.getBoundingClientRect()
    this.toolBar.resize()
    this.pages.forEach(page => {
      if (page.getVisible()) page.resize(rect.width, rect.height - 72)
    })
  }

  addPage (name, page, size) {
    if (!page) {
      page = new Page(this, name)
    }
    if (!size) {
      page.size = { width: '100%', height: '100%' }
    }
    this.pages.add(page)
    this.toolBar.addHeader(page)
    this.activePage = page
    return page
  }

  removePage (page) {
    if (page === undefined) return
    if (this._activePage === page) {
      for (const current of this.pages.values()) {
        if (current !== page) {
          this.activePage = current
          break
        }
        if (this._activePage === page) this.activePage = undefined
      }
    }
    this.toolBar.removeHeader(page)
    this.pages.delete(page)
    page.domComponent.remove()
  }

  get activePage () {
    return this._activePage
  }

  set activePage (page) {
    if (this._activePage !== page) {
      if (this._activePage) {
        this._activePage.setVisible(false)
        this.toolBar.headers.get(this._activePage).active = false
      }
      this._activePage = page
      if (this._activePage) {
        this._activePage.setVisible(true)
        this.toolBar.headers.get(this._activePage).active = true
      }
    }
    this.resize()
  }

  onActivatePage (page) {
    if (page) {
      this.activePage = page
    }
  }
}

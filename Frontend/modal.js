import {
  createMixinComponent,
  PropertySize,
  PropertyPosition,
} from './mixin.js'
import { Button } from './button.js'

export class ModalDialog extends createMixinComponent(
  PropertySize,
  PropertyPosition
) {
  constructor() {
    super()
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'componentWrap modal_Dialog'
    this.size = { width: '80%', height: '50%' }
    this.position = { x: '10%', y: '25%' }
    const header = document.createElement('div')
    header.className = 'modal_DialogHeader'
    header.style.width = '100%'
    header.style.height = '50px'
    header.textContent = 'Ошибка'
    this.domComponent.append(header)
    this.messages = document.createElement('div')
    this.messages.className = 'modal_Message'
    this.messages.style.width = '100%'
    this.messages.style.height = 'calc(100% - 90px)'
    this.button = new Button()
    this.button.size = { width: '100%', height: '40px' }
    this.domComponent.append(this.messages)
    this.domComponent.append(this.button.domComponent)
    this.button.resizeText()
    this.fatal = false
  }

  get fatal() {
    return this._fatal
  }

  set fatal(value) {
    if (this._fatal !== value) {
      this._fatal = value
      if (this._fatal) {
        this.button.domComponent.textContent = 'Перегрузить страницу'
      } else {
        this.button.domComponent.textContent = 'Закрыть'
      }
    }
  }
}

export class Modal extends createMixinComponent(
  PropertySize,
  PropertyPosition
) {
  constructor(owner) {
    super()
    this.owner = owner
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'componentWrap modal'
    this.size = { width: '100%', height: '100%' }
    this.position = { x: 0, y: 0 }
    this.errorDialog = new ModalDialog()
    this.domComponent.append(this.errorDialog.domComponent)
    this.errorDialog.button.domComponent.addEventListener(
      'click',
      this.closeErrorDialog.bind(this)
    )
  }

  add(text) {
    this.domComponent.classList.add('modal_Enable')
    const message = document.createElement('div')
    message.textContent = text
    this.errorDialog.messages.append(message)
  }

  fatal(text) {
    this._fatal = true
    this.owner.domContentSpace.remove()
    this.owner.menu.domComponent.remove()
    this.errorDialog.fatal = true
    this.add(text)
  }

  closeErrorDialog() {
    if (this._fatal === true) {
      document.cookie = 'token=; expires=' + new Date().toUTCString() + ';'
      document.location.reload(true)
    } else {
      this.domComponent.classList.remove('modal_Enable')
      const node = this.errorDialog.messages
      while (node.firstChild) {
        node.removeChild(node.firstChild)
      }
    }
  }
}

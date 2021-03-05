import { Core } from '../api.js'
import { createMixinComponent, PropertySize } from '../mixin.js'
import { SplittedPanel } from '../splitted-area.js'
import { Page } from '../page.js'
import { Button } from '../button.js'
import { Scheme, gql } from '../graph-ql/gql.js'
import { lazyCSS } from '../lazy-css.js'
import { $ARGUMENTS } from '../graph-ql/gql-constants.js'
import { PanelGrid } from '../panel-grid.js'

function utoa (value) {
  return window.btoa(unescape(encodeURIComponent(value)))
}

class Input {
  constructor (id, type, label) {
    this.dom = document.createElement('div')
    this.dom.className = 'material-textfield'
    this.domInput = document.createElement('input')
    this.domInput.className = 'material-textfield-input'
    this.domInput.type = type
    this.domInput.id = id
    this.domInput.required = true
    this.domLabel = document.createElement('label')
    this.domLabel.className = 'material-textfield-label'
    this.domLabel.dataset.content = label
    this.dom.append(this.domInput)
    this.dom.append(this.domLabel)
  }
}

class Inputs extends createMixinComponent(PropertySize) {
  constructor () {
    super()
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'component'
    this.domComponent.style.background = 'white'
    const avatar = document.createElement('div')
    avatar.className = 'avatar'
    this.domComponent.append(avatar)
    const inputs = document.createElement('div')
    inputs.style.display = 'inline-block'
    inputs.style.padding = ''
    inputs.style.margin = ''
    inputs.style.boxSizing = 'border-box'
    inputs.style.border = ''
    inputs.style.lineHeight = ''
    inputs.style.width = '80%'
    inputs.style.height = '100%'
    inputs.style.position = 'absolute'
    this.dom = document.createElement('div')
    this.dom.className = 'material-wrapper'
    this.inputLogin = new Input('username', 'type', 'Логин')
    this.inputPassword = new Input('password', 'password', 'Пароль')
    this.dom.append(this.inputLogin.dom)
    this.dom.append(this.inputPassword.dom)
    this.domComponent.append(this.dom)
  }

  resize () {}
}

export class PageLogin extends Page {
  constructor (owner, name, func) {
    super(owner, name)
    this.callback = func
    this.panelGrid = new PanelGrid('72px')
    this.form = new Inputs()
    this.panelGrid.grid = this.form
    this.button = new Button('Вход')
    this.button.domComponent.addEventListener('click', this.click.bind(this))
    this.panelGrid.addButton(this.button)
    this.splittedPanel = new SplittedPanel(this.panelGrid)
    this.splittedPanel.size = { width: '50%', height: 'calc(84px * 2 + 84px + 56px)' }
    this.splittedPanel.position = { x: '25%', y: '25%' }
    this.splittedPanel.domComponent.children[0].children[0].style.boxShadow = '0 10px 13px -6px rgba(0, 0, 0, .2), 0 20px 31px 3px rgba(0, 0, 0, .14), 0 8px 38px 7px rgba(0, 0, 0, .12)'
    this.addComponent(this.splittedPanel)
    this.splittedPanel.domComponent.style.overflow = 'visible'
    this.splittedPanel.domComponent.children[0].style.overflow = 'visible'
    this.domComponent.className = 'back'
  }

  async click () {
    const username = this.form.inputLogin.domInput.value
    const password = this.form.inputPassword.domInput.value
    const seed = utoa(username + ':' + password)
    let data
    try {
      data = await Core.sendRequestHttp({ create_token: { [$ARGUMENTS]: { seed } } })
      data = Scheme.resolve(data.data)[0]
      if (data.create_token) {
        document.cookie = 'token=' + data.create_token + '; path=/;'
        this.callback()
      }
    } catch (error) {
      Core.workspace.modal.add(error.errors[0].error)
    }
  }

  mockup () {
  }

  init () {
  }
}

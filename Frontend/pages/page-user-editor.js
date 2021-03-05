import { Core, getValue } from '../api.js'
import { Page } from '../page.js'
import { Button } from '../button.js'
import { GridRow, Grid, GridCellBindable, sortingByValueString, GridCell } from '../components/grid/grid.js'
import { SplittedArea, SplittedPanel } from '../splitted-area.js'
import { PanelGrid } from '../panel-grid.js'
import { ObservableObject, OBSERVABLE_ADD_PROPERTY, OBSERVABLE_REMOVE_PROPERTY, OBSERVABLE_SET_PROPERTY } from '../observable.js'
import { TABLE_USERS, Privileges } from '../api-settings.js'
import { _, STORED, $ARGUMENTS } from '../graph-ql/gql-constants.js'
import { defaultCellDisplay } from '../components/grid/cell-display/cell-display.js'
import { Binder } from '../binders/binder.js'
import { defaultCellEditorString, CellEditorString } from '../components/grid/cell-editor/cell-editor-string.js'
import { BinderStore } from '../binders/binder-store.js'
import { GridLocalable } from '../components/grid/grid-localable.js'
import { Scheme } from '../graph-ql/gql.js'
import { PropertyObservers } from '../mixin.js'
import { CellDisplayCheckBox } from '../components/grid/cell-display/cell-display-checkbox.js'
import { CellEditorCheckBox } from '../components/grid/cell-editor/cell-editor-checkbox.js'

class BinderPrivilege extends Binder {
  setValue (object, value) {
    Core.socket.execute({
      user_update_privilege: {
        [$ARGUMENTS]: {
          id: object.user.id,
          privilege: this.path[0],
          old: this.getValue(object),
          new: value
        }
      }
    })
  }
}

export class PageUserEditor extends Page {
  constructor (owner, name) {
    super(owner, name)
    this.area = new SplittedArea()
    this.addComponent(this.area)
    this.gridUsers = new GridLocalable(`users${Date.now()}`)
    this.gridUsers.AddColumnLocalable(
      'login',
      'Логин',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_USERS, '', 'login'),
      sortingByValueString,
      defaultCellDisplay,
      owner => { return new CellEditorString(owner) },
      new Binder('login')
    )
    this.gridUsers.AddColumnLocalable(
      'password',
      'Пароль',
      GridCellBindable,
      defaultCellDisplay,
      defaultCellEditorString,
      new BinderStore(TABLE_USERS, 'user_update_password', 'password'),
      sortingByValueString,
      defaultCellDisplay,
      owner => { return new CellEditorString(owner) },
      new Binder('password')
    )
    this.gridUsers.AddColumn(
      'full_name',
      'ФИО',
      GridCellBindable,
      defaultCellDisplay,
      defaultCellEditorString,
      new BinderStore(TABLE_USERS, 'user_update_full_name', 'full_name'),
      sortingByValueString
    )
    this.gridUsers.AddColumn(
      'personnel_number',
      'Табельный номер',
      GridCellBindable,
      defaultCellDisplay,
      defaultCellEditorString,
      new BinderStore(TABLE_USERS, 'user_update_personnel_number', 'personnel_number'),
      sortingByValueString
    )
    this.buttonAddUser = new Button('Добавить пользователя')
    this.buttonAddUser.domComponent.addEventListener('click', this.clickButtonAddUser.bind(this))
    this.buttonCommit = new Button('Регистрировать пользователя')
    this.buttonCommit.visible = false
    this.buttonCommit.domComponent.addEventListener('click', this.clickButtonCommit.bind(this))
    this.buttonRemoveUser = new Button('Удалить пользователя')
    this.buttonRemoveUser.visible = false
    this.buttonRemoveUser.domComponent.addEventListener('click', this.clickButtonRemoveUser.bind(this))
    this.panelGridUsers = new PanelGrid()
    this.panelGridUsers.grid = this.gridUsers
    this.panelGridUsers.addButton(this.buttonAddUser)
    this.panelGridUsers.addButton(this.buttonCommit)
    this.panelGridUsers.addButton(this.buttonRemoveUser)
    this.area.addPanel(new SplittedPanel(this.panelGridUsers))

    this.userPrivileges = new ObservableObject()
    this.userPrivileges.subscribe(async (message) => {
      // console.log(message)
      switch (message.type) {
        case OBSERVABLE_SET_PROPERTY:
          if ((message.path.length === 1 && message.path[0] === 'user')) {
            const privileges = await getValue(message.value, TABLE_USERS, ['privileges'])
            Object.keys(Privileges).forEach(key => {
              const privilege = this.userPrivileges[Privileges[key]]
              privilege.allow = privileges === null ? false : privileges.has(Privileges[key])
            })
          } else {
            if (message.path.length === 2 && message.path[1] === 'privileges') {
              Object.keys(Privileges).forEach(key => {
                const privilege = this.userPrivileges[Privileges[key]]
                privilege.allow = message.value === null ? false : message.value.has(Privileges[key])
              })
            }
          }
          break
        case OBSERVABLE_REMOVE_PROPERTY:
          if ((message.path.length === 1 && message.path[0] === 'user')) {
            Object.keys(Privileges).forEach(key => {
              const privilege = this.userPrivileges[Privileges[key]]
              privilege.allow = false
            })
          }
          break
        default:
          break
      }
    })

    this.gridPrivileges = new Grid(`privileges${Date.now()}`)
    this.gridPrivileges.AddColumn(
      'key',
      'Свойства',
      GridCell,
      defaultCellDisplay
    )
    this.gridPrivileges.AddColumn(
      'allow',
      'Доступ',
      GridCellBindable,
      owner => { return new CellDisplayCheckBox(owner) }
    )

    this.gridUsers[PropertyObservers].selectedRow.subscribe(row => {
      if (row && row.tag) {
        if (row.tag[STORED] === true) {
          this.gridPrivileges.rows.forEach(row => {
            row.disabled = false
          })
          this.userPrivileges.user = row.tag
          this.buttonCommit.visible = false
          this.buttonRemoveUser.visible = true
          this.panelGridUsers.resize()
        } else {
          this.gridPrivileges.rows.forEach(row => {
            row.disabled = true
          })
          this.userPrivileges.user = undefined
          this.buttonCommit.visible = true
          this.buttonRemoveUser.visible = true
          this.panelGridUsers.resize()
        }
      } else {
        this.gridPrivileges.rows.forEach(row => {
          row.disabled = true
        })
        this.userPrivileges.user = undefined
        this.buttonCommit.visible = false
        this.buttonRemoveUser.visible = false
        this.panelGridUsers.resize()
      }
    })

    this.panelGridPrivileges = new PanelGrid()
    this.panelGridPrivileges.grid = this.gridPrivileges
    this.area.addPanel(new SplittedPanel(this.panelGridPrivileges))
    this.area.size = { width: '100%', height: '100%' }
  }

  mockup () {
  }

  init () {
    const map = new Map()
    map.set(Privileges.USERS_EDIT, 'Управление пользователями')
    map.set(Privileges.UNITS_EDIT, 'Добавление, удаление и правка единиц измерений')
    map.set(Privileges.REASONS_EDIT, 'Добавление, удаление и правка причин')
    map.set(Privileges.ZONES_EDIT, 'Управление рабочими зонами')
    map.set(Privileges.NOMENCLATURES_EDIT, 'Добавление, удаление и правка номенклатуры')
    map.set(Privileges.OWNERS_EDIT, 'Добавление, удаление и правка принадлежности')
    map.set(Privileges.PRODUCT_TYPES_EDIT, 'Добавление, удаление и правка видов деталей')
    map.set(Privileges.SERVICE_ALLOWED, 'Сервисное обслуживание')

    this.gridPrivileges.available = true
    this.gridPrivileges.setFontSize(20)
    this.gridPrivileges.init()

    Object.values(Privileges).forEach(key => {
      const privilege = new ObservableObject()
      this.userPrivileges[key] = privilege
      privilege.allow = false
      const row = new GridRow(undefined, this.userPrivileges)
      row.owner = this.gridPrivileges
      row.disabled = true
      let cell = new GridCell(row, this.gridPrivileges.columns[0], map.get(key))
      row.cell.push(cell)
      cell = new GridCellBindable(row, this.gridPrivileges.columns[1], undefined)
      cell.editor = new CellEditorCheckBox(cell)
      cell.binder = new BinderPrivilege(key, 'allow')
      row.cell.push(cell)
      this.gridPrivileges.addRow(key, row)
    })

    this.users = Core.getShared(TABLE_USERS, Core.getTable(TABLE_USERS), ObservableObject, Scheme.queries.get('user_insert'), Scheme.queries.get('user_delete'))
    this.gridUsers.available = true
    this.gridUsers.setFontSize(20)
    this.gridUsers.init()
    this.users.forEach(item => {
      this.gridUsers.newRow(item)
    })
    this.users.subscribe(this.OnUpdateUsers.bind(this))
    Core.socket.execute({
      [TABLE_USERS]: {
        id: _
      }
    })
  }

  clickButtonAddUser () {
    this.users.newValue()
  }

  clickButtonRemoveUser () {
    const row = this.gridUsers.selectedRow
    if (row && row.tag) { this.users.deleteStore(row.tag.id) }
  }

  async clickButtonCommit () {
    const row = this.gridUsers.selectedRow
    if (!(row && row.tag)) {
      Core.workspace.modal.add('Выберите пользователя для регистрации')
      return
    }
    const user = row.tag
    if (user[STORED] === true) {
      Core.workspace.modal.add('Выбранный пользователь уже зарегистрирован')
      return
    }
    const isValid = true
    // if (!user.source) {
    //   Core.workspace.modal.add('Для операции не указан начальный адрес')
    //   isValid = false
    // }
    // if (!user.destination) {
    //   Core.workspace.modal.add('Для операции не указан конечный адрес')
    //   isValid = false
    // }
    if (isValid) { this.users.insertStore(user) }
  }

  OnUpdateUsers (message) {
    switch (message.type) {
      case OBSERVABLE_ADD_PROPERTY:
        if (message.path.length !== 1) return
        this.gridUsers.newRow(message.value)
        break
      case OBSERVABLE_REMOVE_PROPERTY:
        if (message.path.length !== 1) return
        this.gridUsers.removeRow(`${message.path[0]}`)
        break
      default:
        break
    }
  }
}

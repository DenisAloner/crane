import { createMixinComponent, PropertySize, Scrollable, ObservablePropertySelectedRow } from '../../mixin.js'
import { clamp, isDeferred } from '../../api.js'
import { GridColumn } from './column.js'
import { ScrollBar } from './scrollbar.js'
import { CheckBox } from '../../button.js'
import { CancellationTokenSource } from '../../cancellation-token.js'
export { GridCell } from './cell.js'
export { GridRow } from './row.js'
export { GridCellBindable } from './cell-bindable.js'

const ACTION_ADD = Symbol('ADD')
const ACTION_REMOVE = Symbol('REMOVE')

export const ASCENDING_SORTING = Symbol('ASCENDING_SORTING')
export const DESCENDING_SORTING = Symbol('DESCENDING_SORTING')

export const sortingByValueString = function (a, b) {
  const aValue = a ? `${a.value}` : ''
  const bValue = b ? b.value : ''
  return aValue.localeCompare(bValue)
}

export const sortingByValueNumber = function (a, b) {
  return a.value - b.value
}

export const sortingByPropertyString = function (a, b) {
  const aBinder = a.getBinder()
  const bBinder = b.getBinder()
  return `${aBinder.getProperty(a.row.tag)}`.localeCompare(bBinder.getProperty(b.row.tag))
}

export const sortingByOptionString = function (a, b) {
  const aBinder = a.getBinder()
  const bBinder = b.getBinder()
  return `${aBinder.getValue(a.row.tag)}`.localeCompare(bBinder.getValue(b.row.tag))
}

const debounce = (fn, time, context) => {
  let actions = []
  let period = performance.now()
  setInterval(() => {
    if (actions.length > 0 && performance.now() - period > time) {
      fn.call(context, actions)
      actions = []
    }
  }, time)
  return function (action) {
    actions.push(action)
    period = performance.now()
  }
}

class Splitter extends createMixinComponent(PropertySize, Scrollable) {
  constructor (owner, index) {
    super()
    this.owner = owner
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'dataGrid_Splitter'
    this.index = index
    this.bindScrollEvents(this.domComponent)
  }

  onScrollEnd (value) {
    this.owner.resetPosition(value.pageX, this)
  }

  onScrollMove (value) {
    this.owner.resetPosition(value.pageX, this)
  }
}

export class GridView {
  constructor (owner) {
    this.owner = owner
    this.update()
  }

  update () {
    this.rows = [...this.owner.rows.values()]
  }

  async undeferredColumn (column, index, token) {
    const promises = new Set()
    this.rows.forEach(row => {
      const value = column.binder.undeferred(row.tag)
      if (isDeferred(value)) {
        promises.add(value)
      }
    })
    if (promises.size !== 0) {
      await Promise.all(promises)
      await this.undeferredColumn(column, index)
    }
  }

  async sort (pattern) {
    const promises = []
    pattern.forEach(column => {
      promises.push(this.undeferredColumn(column, column.index))
    })
    if (promises.size !== 0) {
      await Promise.all(promises)
    }
    this.rows.sort((a, b) => {
      for (const column of pattern) {
        switch (column.sortOrder) {
          case ASCENDING_SORTING:
            return column.sortPattern(a.cell[column.index], b.cell[column.index])
          case DESCENDING_SORTING:
            return -column.sortPattern(a.cell[column.index], b.cell[column.index])
          default:
            break
        }
      }
    })
  }

  async filter (filterPattern, token) {
    const promises = []
    this.update()
    for (let index = 0; index < this.owner.columns.length; index++) {
      const column = this.owner.columns[index]
      const filterField = filterPattern[column.name]
      if (filterField !== undefined && filterField.pattern !== undefined && filterField.pattern.value !== undefined) {
        promises.push(this.undeferredColumn(column, index))
      }
    }
    if (promises.size !== 0) {
      await Promise.all(promises)
    }
    this.rows = this.rows.filter(element => {
      for (let index = 0; index < this.owner.columns.length; index++) {
        const column = this.owner.columns[index]
        const filterField = filterPattern[column.name]
        if (filterField !== undefined && filterField.pattern !== undefined && filterField.pattern.value !== undefined) {
          if (!filterField.filter(element.cell[index].value, filterField.pattern.value)) return false
        }
      }
      return true
    })
  }

  getHeight () {
    let totalHeight = 0
    for (let index = 0; index < this.rows.length; index++) {
      totalHeight += this.rows[index]._height
    }
    return totalHeight
  }
}

export class Grid extends createMixinComponent(PropertySize, ObservablePropertySelectedRow) {
  constructor (name) {
    super()
    this.name = name
    this.owner = null
    this.columns = []
    this.rows = new Map()
    this.splitters = []
    this.bottomRowIndex = 0
    this.topRowIndex = 0
    this.currentScroll = 0
    this.scroll = 0
    this.scrollTop = 0
    this.topView = 0
    this.bottomView = 0
    this.touchStartValue = 0
    this.view = new GridView(this)
    this.rowCache = []
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'dataGrid_Component'
    this.headers = document.createElement('div')
    this.headers.className = 'dataGrid_HeadersContainer box-shadow-1dp-bottom'
    this.headers.style.width = '100%'
    this.tableHeaders = document.createElement('div')
    this.tableHeaders.className = 'wrapperTable background-second-color'
    this.tableHeaders.style.width = '100%'
    this.tableHeaders.style.height = '100%'
    this.headers.append(this.tableHeaders)
    this.tableHeadersRow = document.createElement('div')
    this.tableHeaders.append(this.tableHeadersRow)
    this.tableContainer = document.createElement('div')
    this.tableContainer.className = 'tableContainer'
    this.table = document.createElement('div')
    this.table.className = 'wrapperTable backgroundColorWhite'
    this.table.style.width = '100%'

    this.tableContainer.append(this.table)
    this.domComponent.append(this.headers)
    this.domComponent.append(this.tableContainer)

    this.resizeDelegate = event => this.resizeComp(event)

    this.tableContainer.addEventListener('wheel', this.onWheel.bind(this), { passive: true })
    this.touchStartDelegate = event => this.touchStart(event)
    this.touchEndDelegate = event => this.touchEnd(event)
    this.touchMoveDelegate = event => this.touchMove(event)
    this.table.addEventListener('touchstart', this.touchStartDelegate, { passive: true, capture: true })

    this.scrollBar = new ScrollBar()
    this.tableContainer.append(this.scrollBar.domComponent)
    this.scrollBar.size = { width: '100%', height: '100%' }
    this.scrollBar.onScroll = this.onScrolling.bind(this)
    this.updateLayer = undefined
    this.prevRect = this.tableContainer.getBoundingClientRect()
    this.virtualDOMRows = []

    this.changeRow = debounce(this.changeRow, 100, this)
    this.cts = new CancellationTokenSource()
  }

  onChangeCellValue (row, cell, value) {
    return true
  }

  offChangeCellValue (row, cell) {}

  setFontSize (value) {
    if (this._size !== value) {
      this._fontSize = value + 2
      this.mockupDefaultRowHeight = this._fontSize + 10
      this.mockupHeadersHeight = (this._fontSize + 18) * 1.25
      this.headers.style.height = `${this.mockupHeadersHeight}px`
      this.headers.style.fontSize = `${(this._fontSize - 2) * 1.5}px`
      this.tableContainer.style.top = `${this.mockupHeadersHeight}px`
      this.tableContainer.style.height = `calc(100% - ${this.mockupHeadersHeight}px)`
      const sheet = document.styleSheets[0]
      sheet.insertRule(`.${this.name}_dataGrid_Row{font-size:${this._fontSize}px}`, sheet.cssRules.length)
      this.mockupFillerHeight = this.view.getHeight()
    }
  }

  onRowSelectChange (row) {
    if (row.selected) {
      this.selectedRow = row
    } else if (this.selectedRow === row) this.selectedRow = undefined
  }

  resize () {
    if (this.available) {
      this.UpdateAfterRowsCountChange(false)
    }
  }

  onColumnSortButtonClick (column) {
    this.sortPatternUpdate(column)
  }

  async sortPatternUpdate (column) {
    if (column) {
      if (this.sortPattern && column !== this.sortPattern[0]) {
        this.sortPattern[0].domSortIcon.removeAttribute('class')
        column.sortOrder = undefined
      }
      switch (column.sortOrder) {
        case undefined:
          this.sortPattern = [column]
          column.sortOrder = ASCENDING_SORTING
          column.domSortIcon.className = 'expand-up'
          break
        case ASCENDING_SORTING:
          this.sortPattern = [column]
          column.sortOrder = DESCENDING_SORTING
          column.domSortIcon.className = 'expand-down'
          break
        case DESCENDING_SORTING:
          this.sortPattern = undefined
          column.sortOrder = undefined
          column.domSortIcon.removeAttribute('class')
          break
        default:
          break
      }
      this.sorting()
    }
  }

  async filterColumn (filterPattern) {
    this.cts.cancel()
    const token = this.cts.getToken()
    await this.cts.task
    if (token.isCancelled()) return
    this.cts.task = (async () => {
      try {
        this.filterPattern = filterPattern
        this.table.style.display = 'none'
        await this.view.filter(filterPattern, token)
        if (this.sortPattern) { await this.view.sort(this.sortPattern, token) }
        this.mockupFillerHeight = this.view.getHeight()
        this.UpdateAfterRowsCountChange(true)
        this.table.style.display = ''
      } catch {
        console.log('cancel')
      }
    })()
  }

  addingColumn (column) {
    let element
    if (this.columns.length > 1) {
      let i
      column.dom.style.height = '100%'
      const splitter = new Splitter(this, this.columns.length - 2)
      splitter.size = { width: '32px', height: '100%' }
      this.splitters.push(splitter)
      this.headers.append(splitter.domComponent)
      this.tableHeadersRow.append(column.dom)
      const childDivs = this.headers.querySelectorAll('.dataGrid_Splitter')
      const width = 100 / this.columns.length
      let left = 0
      for (i = 0; i < this.columns.length; i++) {
        element = this.columns[i]
        element.width = width
        element.cssRule.style.width = `${width}%`
        element.position = left
        element.cssRule.style.left = `${element.position}%`
        left += width
        if (i > 0) {
          const childDiv = childDivs[i - 1]
          childDiv.style.left = `calc(${element.position}% - ${splitter.size.width} / 2)`
        }
      }
    } else {
      column.dom.style.height = '100%'
      element = this.columns[0]
      element.width = 100
      element.cssRule.style.width = `${element.width}%`
      element.position = 0
      element.cssRule.style.left = `${element.position}%`
      this.tableHeadersRow.append(column.dom)
    }
  }

  AddColumn (name, label, type, displayConstructor, editorConstructor, binder, sortPattern) {
    const column = new GridColumn(this, name, label, sortPattern, type, displayConstructor, editorConstructor, binder)
    this.columns.push(column)
    this.addingColumn(column)
    return column
  }

  getPosition (row) {
    let position = 0
    for (let index = 0; index < this.view.rows.length; index++) {
      const element = this.view.rows[index]
      if (row === element) {
        return position
      }
      position += element.height
    }
    return undefined
  }

  init () {
    if (!this.view) {
      throw new Error('view is null')
    }
    if (this.exportable) {
      this.columns.forEach(column => {
        column.includeExport = new CheckBox()
        column.includeExport.init()
        column.includeExport.value = true
        column.includeExport.domComponent.classList.add('item', 'dataGrid_HeaderIconContainer')
        column.domLabel.append(column.includeExport.domComponent)
      })
    }
    this.mockupFillerHeight = this.view.getHeight()
    this.UpdateAfterRowsCountChange(true)
  }

  async UpdateAfterRowsCountChange (reset) {
    const rect = this.tableContainer.getBoundingClientRect()
    const previous = this.mockupViewHeight
    this.mockupViewHeight = rect.height
    const diff = this.mockupViewHeight - previous
    if (diff < 0 && !reset) {
      this.bottomView += diff
      this.bottomView = clamp(this.bottomView, 0, this.mockupFillerHeight - this.mockupViewHeight)
      if (this.view.rows.length !== 0) {
        while (this.bottomRowIndex > -1 && this.bottomView - this.view.rows[this.bottomRowIndex].height < (this.scroll + this.mockupViewHeight) && this.bottomRowIndex < this.view.rows.length - 1) {
          const row = this.view.rows[this.bottomRowIndex]
          this.bottomView -= row.height
          this.bottomRowIndex += 1
          this.rowCache = this.rowCache.filter(value => {
            return value !== row
          })
        }
      }
    }
    const thumbSize = this.mockupViewHeight / this.mockupFillerHeight * this.mockupViewHeight
    if (thumbSize < 32 && this.mockupViewHeight > 32) {
      this.scrollBar.thumb.size = { width: this.scrollBar.thumb.size.width, height: '32px' }
    } else {
      this.scrollBar.thumb.size = { width: this.scrollBar.thumb.size.width, height: `${thumbSize}px` }
    }
    this.scrollTop = clamp(this.scrollTop, 0, this.mockupFillerHeight - this.mockupViewHeight)
    this.scrollBar.thumbUpdate(this.scrollTop / (this.mockupFillerHeight - this.mockupViewHeight))
    if (reset) {
      this.topRowIndex = 0
      this.bottomRowIndex = 0
      this.currentScroll = 0
      this.scroll = 0
      this.topView = 0
      this.bottomView = 0
      this.rowCache = []
    }
    this.resizeLayerUpdate(rect)
    this.scrollBar.setVisible(this.mockupFillerHeight > this.mockupViewHeight)
  }

  async sorting () {
    if (this.sortPattern === undefined) return
    this.table.style.display = 'none'
    await this.view.sort(this.sortPattern)
    this.UpdateAfterRowsCountChange(true)
    this.table.style.display = ''
  }

  changeRow (actions) {
    actions.forEach(action => {
      switch (action.type) {
        case ACTION_ADD:
          this.view.rows.push(action.row)
          action.row._height = this.mockupDefaultRowHeight
          this.mockupFillerHeight += action.row.height
          break
        case ACTION_REMOVE:
          const index = this.view.rows.indexOf(action.row)
          if (index !== -1) {
            this.view.rows.splice(index, 1)
            this.mockupFillerHeight -= action.row.height
          }
          break
        default:
          break
      }
    })
    if (this.filterPattern !== undefined) {
      this.filterColumn(this.filterPattern)
    } else if (this.sortPattern !== undefined) {
      this.sorting()
    } else {
      this.UpdateAfterRowsCountChange(true)
    }
  }

  addRow (key, row) {
    if (!this.rows.has(key)) {
      this.rows.set(key, row)
      this.changeRow({ type: ACTION_ADD, row })
    }
  }

  removeRow (key) {
    const row = this.rows.get(key)
    if (row) {
      this.rows.delete(key)
      if (this.selectedRow === row) this.selectedRow = undefined
      this.changeRow({ type: ACTION_REMOVE, row })
    }
  }

  resetPosition (pos, splitter) {
    const index = this.splitters.indexOf(splitter)
    const rectOwner = this.headers.getBoundingClientRect()
    let left
    if (index === 0) {
      left = rectOwner.left
    } else {
      const spl = this.splitters[index - 1].domComponent
      const rect = spl.getBoundingClientRect()
      left = (rect.left + rect.right) / 2
    }
    let right
    if (index === (this.splitters.length - 1)) {
      right = rectOwner.right
    } else {
      const spl = this.splitters[index + 1].domComponent
      const rect = spl.getBoundingClientRect()
      right = (rect.left + rect.right) / 2
    }
    if (pos < left) pos = left
    if (pos > right) pos = right
    const divider = 1 / this.headers.offsetWidth * 100
    const a = (pos - left) * divider
    const b = (right - pos) * divider
    this.columns[splitter.index].width = a
    this.columns[splitter.index].cssRule.style.width = a + '%'
    this.columns[splitter.index + 1].width = b
    this.columns[splitter.index + 1].cssRule.style.width = b + '%'
    this.columns[splitter.index + 1].position = this.columns[splitter.index].position + this.columns[splitter.index].width
    this.columns[splitter.index + 1].cssRule.style.left = this.columns[splitter.index + 1].position + '%'
    splitter.domComponent.style.left = `calc(${this.columns[splitter.index + 1].position}% - ${splitter.size.width} / 2)`
  }

  onWheel (event) {
    this.scrollTop += Math.sign(event.deltaY) * 64
    this.scrollTop = clamp(this.scrollTop, 0, this.mockupFillerHeight - this.mockupViewHeight)
    this.scrollBar.thumbUpdate(this.scrollTop / (this.mockupFillerHeight - this.mockupViewHeight))
    this.onScroll()
  }

  touchStart (event) {
    this.touchStartValue = event.changedTouches[0].pageY
    this.table.removeEventListener('touchstart', this.touchStartDelegate)
    this.table.removeEventListener('touchmove', this.touchMoveDelegate)
    this.table.removeEventListener('touchend', this.touchEndDelegate)
    this.table.removeEventListener('touchcancel', this.touchEndDelegate)
    this.table.addEventListener('touchmove', this.touchMoveDelegate, true)
    this.table.addEventListener('touchend', this.touchEndDelegate, true)
    this.table.addEventListener('touchcancel', this.touchEndDelegate, true)
  }

  touchEnd (event) {
    this.table.removeEventListener('touchmove', this.touchMoveDelegate)
    this.table.removeEventListener('touchend', this.touchEndDelegate)
    this.table.removeEventListener('touchcancel', this.touchEndDelegate)
    this.table.addEventListener('touchstart', this.touchStartDelegate, true)
    this.scrollTop += Math.sign(this.touchStartValue - event.changedTouches[0].pageY) * this.mockupDefaultRowHeight / 4
    this.scrollTop = clamp(this.scrollTop, 0, this.mockupFillerHeight - this.mockupViewHeight)
    this.onScroll()
  }

  touchMove (event) {
    event.preventDefault()
    this.scrollTop += Math.sign(this.touchStartValue - event.changedTouches[0].pageY) * this.mockupDefaultRowHeight / 4
    this.scrollTop = clamp(this.scrollTop, 0, this.mockupFillerHeight - this.mockupViewHeight)
    this.scrollBar.thumbUpdate(this.scrollTop / (this.mockupFillerHeight - this.mockupViewHeight))
    this.onScroll()
  }

  onScrolling (component) {
    this.scrollTop = (this.mockupFillerHeight - this.mockupViewHeight) / 100 * component.ratio
    this.scrollTop = clamp(this.scrollTop, 0, this.mockupFillerHeight - this.mockupViewHeight)
    this.onScroll()
  }

  resizeLayerUpdate (rect) {
    this.table.style.display = 'none'
    if (this.mockupFillerHeight < this.mockupViewHeight) {
      this.topRowIndex = 0
      this.bottomRowIndex = 0
      this.currentScroll = 0
      this.scroll = 0
      this.topView = 0
      this.bottomView = 0
      this.rowCache = []
      this.scrollTop = 0
    } else {
      // TODO: проверить есть ли прирост от данного алгоритма
      // let diff = rect.height - this.prevRect.height
      // if (diff > 0) {
      //   while (this.bottomView < (this.scroll + this.mockupViewHeight) && this.bottomRowIndex < this.view.rows.length - 1) {
      //     this.bottomRowIndex += 1
      //     const row = this.view.rows[this.bottomRowIndex]
      //     this.bottomView += row.height
      //     this.rowCache.push(row)
      //   }
      // } else {
      //   while (this.bottomRowIndex > 0) {
      //     const row = this.view.rows[this.bottomRowIndex]
      //     if (this.bottomView - row.height < this.scroll + this.mockupViewHeight) break
      //     this.bottomView -= row.height
      //     this.rowCache = this.rowCache.filter(value => {
      //       return value !== row
      //     })
      //     this.bottomRowIndex -= 1
      //   }
      // }
    }
    this.onScroll(true, false)
    this.prevRect = rect
    this.table.style.display = ''
  }

  onScroll (render = true, display = true) {
    if (!this.view) {
      throw new Error('view is null')
    }
    if (display) this.table.style.display = 'none'
    if (this.mockupFillerHeight < this.mockupViewHeight) {
      this.topRowIndex = 0
      this.bottomRowIndex = 0
      this.currentScroll = 0
      this.scroll = 0
      this.topView = 0
      this.bottomView = 0
      this.rowCache = []
      this.scrollTop = 0
    }
    if (this.scrollTop - this.currentScroll >= 0) {
      this.scroll += this.scrollTop - this.currentScroll
      if (this.bottomView < this.scroll) {
        this.rowCache = []
        while (this.topView + this.view.rows[this.topRowIndex].height < this.scroll && this.topRowIndex < this.view.rows.length - 1) {
          this.topView += this.view.rows[this.topRowIndex].height
          this.topRowIndex += 1
        }
        this.bottomView = this.topView
        this.bottomRowIndex = this.topRowIndex - 1
        while (this.bottomView < (this.scroll + this.mockupViewHeight) && this.bottomRowIndex < this.view.rows.length - 1) {
          this.bottomRowIndex += 1
          const row = this.view.rows[this.bottomRowIndex]
          this.bottomView += row.height
          this.rowCache.push(row)
        }
      } else {
        if (this.view.rows.length !== 0) {
          if (this.rowCache.length === 0 && this.bottomRowIndex > -1) {
            const row = this.view.rows[this.bottomRowIndex]
            this.rowCache.push(row)
            this.bottomView += row.height
          }
          while (this.bottomView < (this.scroll + this.mockupViewHeight) && this.bottomRowIndex < this.view.rows.length - 1) {
            this.bottomRowIndex += 1
            const row = this.view.rows[this.bottomRowIndex]
            this.bottomView += row.height
            this.rowCache.push(row)
          }
          while (this.topView + this.view.rows[this.topRowIndex].height < this.scroll && this.topRowIndex < this.view.rows.length - 1) {
            const row = this.view.rows[this.topRowIndex]
            this.topView += row.height
            this.rowCache = this.rowCache.filter(value => {
              return value !== row
            })
            this.topRowIndex += 1
          }
        }
      }
    } else {
      this.scroll += this.scrollTop - this.currentScroll
      if (this.topView > this.scroll + this.mockupViewHeight) {
        this.rowCache = []
        while (this.bottomRowIndex > 0) {
          const row = this.view.rows[this.bottomRowIndex]
          if (this.bottomView - row.height < this.scroll + this.mockupViewHeight) break
          this.bottomView -= row.height
          this.bottomRowIndex -= 1
        }
        this.topView = this.bottomView
        this.topRowIndex = this.bottomRowIndex + 1
        while (this.topView > this.scroll && this.topRowIndex > 0) {
          this.topRowIndex -= 1
          const row = this.view.rows[this.topRowIndex]
          this.topView -= row.height
          this.rowCache.unshift(row)
        }
      } else {
        while (this.topView > this.scroll && this.topRowIndex > 0) {
          this.topRowIndex -= 1
          const row = this.view.rows[this.topRowIndex]
          this.topView -= row.height
          this.rowCache.unshift(row)
        }
        if (this.bottomRowIndex === -1) {
          this.bottomRowIndex = 0
        }
        while (this.bottomView - this.view.rows[this.bottomRowIndex].height > (this.scroll + this.mockupViewHeight) && this.bottomRowIndex > 0) {
          const row = this.view.rows[this.bottomRowIndex]
          this.bottomView -= row.height
          this.rowCache = this.rowCache.filter(value => {
            return value !== row
          })
          this.bottomRowIndex -= 1
        }
      }
    }
    if (render) {
      let position = this.topView - this.scrollTop

      for (let i = this.virtualDOMRows.length - 1; i >= 0; i--) {
        const row = this.virtualDOMRows[i]
        let remove = true
        for (let index = 0; index < this.rowCache.length; index++) {
          if (this.rowCache[index] === row) {
            remove = false
            break
          }
        }
        if (remove) {
          this.table.removeChild(row.domComponent)
          this.virtualDOMRows = this.virtualDOMRows.filter(value => {
            return value !== row
          })
        }
      }

      const fragment = document.createDocumentFragment()
      for (let index = 0; index < this.rowCache.length; index++) {
        const row = this.rowCache[index]
        let add = true
        for (let i = this.virtualDOMRows.length - 1; i >= 0; i--) {
          if (row === this.virtualDOMRows[i]) {
            add = false
            break
          }
        }
        if (add) {
          if (!row.create) {
            row.init()
          }
          fragment.append(row.domComponent)
          this.virtualDOMRows.push(row)
        }
        if (position !== row.top) {
          row.top = position
          row.domComponent.style.top = `${position}px`
        }
        position += row.height
      }
      this.table.append(fragment)
    }
    this.currentScroll = this.scrollTop
    if (display) this.table.style.display = ''
  }
}

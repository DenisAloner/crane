import { createMixinComponent, PropertySize } from '../../mixin.js'
import {
  OperationTypes,
  TABLE_ZONES,
  TABLE_UNCOMMITTED_OPERATIONS,
  TABLE_DEVICES,
} from '../../api-settings.js'
import { smartGet, isDeferred } from '../../api.js'
import { ObservableObject, OBSERVABLE_SET_PROPERTY } from '../../observable.js'
import { STATUS_FLAGS } from '../grid/cell-display/cell-display-status.js'

function load(item, address) {
  item.label = 'Загрузка ТМЦ'
  item.summarize = `Штабелер снимает ТМЦ с адреса ${address}`
}

function unload(item, address) {
  item.label = 'Выгрузка ТМЦ'
  item.summarize = `Штабелер ставит ТМЦ на адрес ${address}`
}

function move(item, address) {
  item.label = 'Перемещение'
  item.summarize = `Выполняется перемещение штабелера к адресу ${address}`
}

function moveToDesk(item) {
  item.label = 'Перемещение'
  item.summarize = 'Выполняется перемещение штабелера к столу'
}

function loadFromDesk(item) {
  item.label = 'Загрузка ТМЦ'
  item.summarize = 'Штабелер снимает ТМЦ со стола'
}

function unloadToDesk(item) {
  item.label = 'Выгрузка ТМЦ'
  item.summarize = 'Штабелер ставит ТМЦ на стол'
}

class StepperHeader {
  constructor(index, label) {
    this.dom = document.createElement('div')
    this.dom.className = 'stepper-item'
    this.domIndex = document.createElement('div')
    this.domIndex.className = 'stepper-item-index'
    this.domIndex.textContent = index
    this.domLabel = document.createElement('div')
    this.domLabel.className = 'stepper-item-label'
    this.domLabel.textContent = label
    this.domSummarize = document.createElement('div')
    this.domSummarize.className = 'stepper-item-summarize'
    this.dom.append(this.domIndex)
    this.dom.append(this.domLabel)
    this.dom.append(this.domSummarize)
    this.disabled = true
  }

  set label(value) {
    this.domLabel.textContent = value
  }

  set summarize(value) {
    this.domSummarize.textContent = value
  }

  get visible() {
    return this._visible
  }

  set visible(value) {
    value = value === true
    if (this._visible !== value) {
      this.dom.classList[value ? 'remove' : 'add']('hidden')
      this._visible = value
    }
  }

  get disabled() {
    return this._disabled
  }

  set disabled(value) {
    value = value === true
    if (this._disabled !== value) {
      this.dom.classList[value ? 'add' : 'remove']('disabled')
      this._disabled = value
    }
  }
}

export class Stepper extends createMixinComponent(PropertySize) {
  constructor() {
    super()
    // TODO #Bug #Chrome: костыль с оборачиванием в лишний <div>, так как scrollbar закрывает собой border
    this.domComponent = document.createElement('div')
    this.domComponent.style.position = 'absolute'
    this.domComponent.style.boxSizing = 'border-box'
    this.dom = document.createElement('div')
    this.dom.className = 'stepper'
    this.content = document.createElement('div')
    this.content.className = 'stepper-content'
    this.dom.append(this.content)
    this.domComponent.append(this.dom)
    this.props = new ObservableObject()
    this.props.subscribe(this.handler.bind(this))
    this.steps = []
    for (let index = 0; index < 8; index++) {
      this.steps.push(new StepperHeader(index + 1))
    }
    this.visibleSteps = []
  }

  updateLabels() {
    const uncommittedOperation = smartGet(this.props.zone, TABLE_ZONES, [
      'uncommitted_operation',
    ])
    let status = smartGet(this.props.zone, TABLE_DEVICES, ['status'])
    if (isDeferred(uncommittedOperation)) return
    if (isDeferred(status)) {
      status = STATUS_FLAGS.BUSY
    }
    if (uncommittedOperation === null) return
    const type = smartGet(uncommittedOperation, TABLE_UNCOMMITTED_OPERATIONS, [
      'type',
    ])
    if (isDeferred(type)) return
    let currentStep = smartGet(this.props.zone, TABLE_DEVICES, ['progress'])
    if (isDeferred(currentStep)) {
      currentStep = 0
    }
    let count = 0
    const isCanceled =
      (status & STATUS_FLAGS.CANCELED) === STATUS_FLAGS.CANCELED
    switch (type) {
      case OperationTypes.DESK_TO_CELL:
        count = 4
        break
      case OperationTypes.CELL_TO_CELL:
        count = 4
        break
      case OperationTypes.CELL_TO_DESK:
        count = 4
        break
      case OperationTypes.CELL_TO_DESK_TO_CELL:
        count = 8
        break
      case OperationTypes.CELL_TO_DESK_TO_CELL_WITHOUT_CONFIRMATION:
        count = 7
        break
      default:
        break
    }
    if (isCanceled) count -= 1
    const domElementCount = this.content.childElementCount
    if (domElementCount > count) {
      for (let index = count; index < domElementCount; index++) {
        this.steps[index].dom.remove()
      }
    }
    for (let index = 0; index < count; index++) {
      const header = this.steps[index]
      header.disabled = index + 1 > currentStep
      if (index >= domElementCount) {
        this.content.append(header.dom)
      }
    }
    this.visibleSteps = this.steps.slice(0, count)
    switch (type) {
      case OperationTypes.DESK_TO_CELL:
        {
          let destination = smartGet(
            uncommittedOperation,
            TABLE_UNCOMMITTED_OPERATIONS,
            ['destination', 'name']
          )
          destination = !isDeferred(destination) ? destination : ''
          if (isCanceled) {
            unloadToDesk(this.steps[0])
            moveToDesk(this.steps[1])
            load(this.steps[2], destination)
          } else {
            moveToDesk(this.steps[0])
            loadFromDesk(this.steps[1])
            move(this.steps[2], destination)
            unload(this.steps[3], destination)
          }
        }
        break
      case OperationTypes.CELL_TO_DESK:
        {
          let source = smartGet(
            uncommittedOperation,
            TABLE_UNCOMMITTED_OPERATIONS,
            ['source', 'name']
          )
          source = !isDeferred(source) ? source : ''
          if (isCanceled) {
            unload(this.steps[0], source)
            move(this.steps[1], source)
            loadFromDesk(this.steps[2])
          } else {
            move(this.steps[0], source)
            load(this.steps[1], source)
            moveToDesk(this.steps[2])
            unloadToDesk(this.steps[3])
          }
        }
        break
      case OperationTypes.CELL_TO_CELL:
        {
          let source = smartGet(
            uncommittedOperation,
            TABLE_UNCOMMITTED_OPERATIONS,
            ['source', 'name']
          )
          let destination = smartGet(
            uncommittedOperation,
            TABLE_UNCOMMITTED_OPERATIONS,
            ['destination', 'name']
          )
          source = !isDeferred(source) ? source : ''
          destination = !isDeferred(destination) ? destination : ''
          if (isCanceled) {
            unload(this.steps[0], source)
            move(this.steps[1], source)
            load(this.steps[2], destination)
          } else {
            move(this.steps[0], source)
            load(this.steps[1], source)
            move(this.steps[2], destination)
            unload(this.steps[3], destination)
          }
        }
        break
      case OperationTypes.CELL_TO_DESK_TO_CELL:
        {
          let source = smartGet(
            uncommittedOperation,
            TABLE_UNCOMMITTED_OPERATIONS,
            ['source', 'name']
          )
          let destination = smartGet(
            uncommittedOperation,
            TABLE_UNCOMMITTED_OPERATIONS,
            ['destination', 'name']
          )
          source = !isDeferred(source) ? source : ''
          destination = !isDeferred(destination) ? destination : ''
          if (isCanceled) {
            unload(this.steps[0], source)
            move(this.steps[1], source)
            loadFromDesk(this.steps[2])
            this.steps[3].label = 'Подтверждение'
            this.steps[3].summarize =
              'Оператору по окончании работ с ТМЦ необходимо нажать кнопку подтверждения'
            unloadToDesk(this.steps[4])
            moveToDesk(this.steps[5])
            load(this.steps[6], destination)
          } else {
            move(this.steps[0], source)
            load(this.steps[1], source)
            moveToDesk(this.steps[2])
            unloadToDesk(this.steps[3])
            this.steps[4].label = 'Подтверждение'
            this.steps[4].domSummarize.innerHTML = ''
            this.steps[4].summarize =
              'Оператору по окончании работ с ТМЦ необходимо нажать кнопку подтверждения'
            loadFromDesk(this.steps[5])
            move(this.steps[6], destination)
            unload(this.steps[7], destination)
          }
        }
        break
      case OperationTypes.CELL_TO_DESK_TO_CELL_WITHOUT_CONFIRMATION:
        {
          let source = smartGet(
            uncommittedOperation,
            TABLE_UNCOMMITTED_OPERATIONS,
            ['source', 'name']
          )
          let destination = smartGet(
            uncommittedOperation,
            TABLE_UNCOMMITTED_OPERATIONS,
            ['destination', 'name']
          )
          source = !isDeferred(source) ? source : ''
          destination = !isDeferred(destination) ? destination : ''
          if (isCanceled) {
            unload(this.steps[0], source)
            move(this.steps[1], source)
            loadFromDesk(this.steps[2])
            unloadToDesk(this.steps[3])
            moveToDesk(this.steps[4])
            load(this.steps[5], destination)
          } else {
            move(this.steps[0], source)
            load(this.steps[1], source)
            moveToDesk(this.steps[2])
            unloadToDesk(this.steps[3])
            loadFromDesk(this.steps[4])
            move(this.steps[5], destination)
            unload(this.steps[6], destination)
          }
        }
        break
      default:
        break
    }
  }

  create(uncommittedOperation) {
    if (uncommittedOperation === null) {
      this.visibleSteps.forEach((step) => {
        step.dom.remove()
      })
      this.visibleSteps = []
      return
    }
    this.updateLabels()
  }

  handler(message) {
    // console.log(message)
    switch (message.type) {
      case OBSERVABLE_SET_PROPERTY:
        switch (message.path.length) {
          case 1:
            {
              const uncommittedOperation = smartGet(
                message.value,
                TABLE_ZONES,
                ['uncommitted_operation']
              )
              if (isDeferred(uncommittedOperation)) return
              this.create(uncommittedOperation)
            }
            break
          case 2:
            if (
              message.path[0] === 'zone' &&
              message.path[1] === 'uncommitted_operation'
            ) {
              this.create(message.value)
            } else if (
              message.path[0] === 'zone' &&
              message.path[1] === 'progress'
            ) {
              for (let index = 0; index < this.visibleSteps.length; index++) {
                this.steps[index].disabled = index + 1 > message.value
              }
            } else if (
              message.path[0] === 'zone' &&
              message.path[1] === 'status'
            ) {
              this.updateLabels()
            }
            break
          case 3:
            if (
              message.path[0] === 'zone' &&
              message.path[1] === 'uncommitted_operation' &&
              message.path[2] === 'type'
            ) {
              this.create(message.refs[2])
            }
            break
          default:
            break
        }
        break

      default:
        break
    }
  }

  resize() {}
}

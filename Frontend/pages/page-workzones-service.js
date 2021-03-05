import { Core, getValue } from '../api.js'
import { TABLE_ZONES, TABLE_DEVICES } from '../api-settings.js'
import { Page } from '../page.js'
import { Button } from '../button.js'
import { GridRow, Grid, GridCellBindable, sortingByValueString } from '../components/grid/grid.js'
import { SplittedArea, SplittedPanel } from '../splitted-area.js'
import { PanelGrid } from '../panel-grid.js'
import { $ARGUMENTS, _, STORED } from '../graph-ql/gql-constants.js'
import { OBSERVABLE_ADD_PROPERTY, OBSERVABLE_REMOVE_PROPERTY, OBSERVABLE_SET_PROPERTY, ObservableObject } from '../observable.js'
import { defaultCellDisplay } from '../components/grid/cell-display/cell-display.js'
import { CellDisplayStatus, STATUS_FLAGS } from '../components/grid/cell-display/cell-display-status.js'
import { CellDisplayMode } from '../components/grid/cell-display/cell-display-mode.js'
import { BinderStore } from '../binders/binder-store.js'
import { GridCell } from '../components/grid/cell.js'
import { PropertyObservers } from '../mixin.js'

const ErrorBlockSize = 352
const WarningsBlockSize = 68

export class PageWorkzonesService extends Page {
  constructor (owner, name) {
    super(owner, name)
    this.cacheErrors = new Map()
    this.cacheWarnings = new Map()
    this._zoneOffset = new Map()
    this.area = new SplittedArea()
    this.addComponent(this.area)

    this.grid = new Grid(`zones${Date.now()}`)
    this.buttonAutoMode = new Button('Режим авто')
    this.buttonAutoMode.visible = false
    this.buttonAutoMode.click(this.clickButtonAutoMode, this)
    this.buttonManualMode = new Button('Режим ручной')
    this.buttonManualMode.visible = false
    this.buttonManualMode.click(this.clickButtonManualMode, this)
    // this.buttonMetricMode = new Button('Режим метрики')
    // this.buttonMetricMode.domComponent.addEventListener('click', this.clickButtonMetricMode.bind(this))
    this.buttonReset = new Button('Сброс ошибок')
    this.buttonReset.visible = false
    this.buttonReset.click(this.clickButtonReset, this)
    this.buttonReleaseSafetyLock = new Button('Снятие защиты')
    this.buttonReleaseSafetyLock.visible = false
    this.buttonReleaseSafetyLock.click(this.clickButtonReleaseSafetyLock, this)
    this.panelGrid = new PanelGrid()
    this.panelGrid.grid = this.grid
    this.panelGrid.addButton(this.buttonAutoMode)
    this.panelGrid.addButton(this.buttonManualMode)
    // this.panelGrid.addButton(this.buttonMetricMode)
    this.panelGrid.addButton(this.buttonReset)
    this.panelGrid.addButton(this.buttonReleaseSafetyLock)
    this.area.addPanel(new SplittedPanel(this.panelGrid, 'Рабочие зоны'))

    this.gridErrors = new Grid(`errors${Date.now()}`)
    this.panelGrid2 = new PanelGrid()
    this.panelGrid2.grid = this.gridErrors
    this.area.addPanel(new SplittedPanel(this.panelGrid2, 'Ошибки'))

    this.gridWarnings = new Grid(`warnings${Date.now()}`)
    this.panelWarnings = new PanelGrid()
    this.panelWarnings.grid = this.gridWarnings
    this.area.addPanel(new SplittedPanel(this.panelWarnings, 'Предупреждения'))

    this.area.size = { width: '100%', height: '100%' }

    this.grid.AddColumn(
      'zone',
      'Рабочая зона',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_ZONES, '', 'id'),
      sortingByValueString
    )
    this.grid.AddColumn(
      'uncommitted_operation',
      'Операция',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_ZONES, '', 'uncommitted_operation', 'id'),
      sortingByValueString
    )
    this.grid.AddColumn(
      'source',
      'Начальный адрес',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_ZONES, '', 'uncommitted_operation', 'source', 'name'),
      sortingByValueString
    )
    this.grid.AddColumn(
      'destination',
      'Конечный адрес',
      GridCellBindable,
      defaultCellDisplay,
      undefined,
      new BinderStore(TABLE_ZONES, '', 'uncommitted_operation', 'destination', 'name'),
      sortingByValueString
    )
    this.grid.AddColumn(
      'status',
      'Статус',
      GridCellBindable,
      owner => { return new CellDisplayStatus(owner) },
      undefined,
      new BinderStore(TABLE_ZONES, '', 'status'),
      sortingByValueString
    )
    this.grid.AddColumn(
      'mode',
      'Режим',
      GridCellBindable,
      owner => { return new CellDisplayMode(owner) },
      undefined,
      new BinderStore(TABLE_DEVICES, '', 'mode'),
      sortingByValueString
    )

    this.gridErrors.AddColumn(
      'zone',
      'Рабочая зона',
      GridCell,
      defaultCellDisplay
    )
    this.gridErrors.AddColumn(
      'error',
      'Ошибка',
      GridCell,
      defaultCellDisplay
    )

    this.gridWarnings.AddColumn(
      'zone',
      'Рабочая зона',
      GridCell,
      defaultCellDisplay
    )
    this.gridWarnings.AddColumn(
      'warning',
      'Предупреждение',
      GridCell,
      defaultCellDisplay
    )

    this.selectedZone = new ObservableObject()
    this.selectedZone.subscribe(message => {
      switch (message.type) {
        case OBSERVABLE_SET_PROPERTY:
          if (message.path.length === 1) {
            this.buttonManualMode.visible = message.value.mode === 2
            this.buttonAutoMode.visible = message.value.mode === 1
            this.buttonReset.visible = (message.value.status !== undefined) && Boolean(message.value.status & STATUS_FLAGS.ERROR)
            this.panelGrid.resize()
          } else if (message.path.length === 2) {
            switch (message.path[1]) {
              case 'mode':
                this.buttonManualMode.visible = message.value === 2
                this.buttonAutoMode.visible = message.value === 1
                this.panelGrid.resize()
                break
              case 'status':
                this.buttonReset.visible = (message.value !== undefined) && Boolean(message.value & STATUS_FLAGS.ERROR)
                this.panelGrid.resize()
                break
              default:
                break
            }
          }
          break
        // case OBSERVABLE_ADD_PROPERTY:
        //   if (message.path.length !== 1) return
        //   this.gridChanges.newRow(message.value)
        //   break
        // case OBSERVABLE_REMOVE_PROPERTY:
        //   if (message.path.length !== 1) return
        //   this.gridChanges.removeRow(`${message.path[0]}`)
        //   break
        default:
          break
      }
    })

    this.grid[PropertyObservers].selectedRow.subscribe(row => {
      if (row && row.tag) {
        if (row.tag[STORED] === true) {
          this.selectedZone.item = row.tag
          this.panelGrid.resize()
        } else {
          this.selectedZone.item = undefined
          this.panelGrid.resize()
        }
      } else {
        this.selectedZone.item = undefined
        this.panelGrid.resize()
      }
    })
    this.unsubscribe = undefined
  }

  mockup () {

  }

  getZoneOffset (id) {
    let offset = this._zoneOffset.get(id)
    if (offset !== undefined) return offset
    offset = this._zoneOffset.size
    this._zoneOffset.set(id, offset)
    return offset
  }

  init () {
    this.mapErrors = new Map()
    this.mapWarnings = new Map()
    const OffsetForStackerError = 2
    const OffsetForStackerWarning = 1
    const fillMapAxisErrors = (offset, text) => {
      this.mapErrors.set(offset + 0, `${text}: системная ошибка ТО`)
      this.mapErrors.set(offset + 1, `${text}: ошибка конфигурации`)
      this.mapErrors.set(offset + 2, `${text}: ошибка в пользовательской программе в инструкции Motion Control или ее использовании`)
      this.mapErrors.set(offset + 3, `${text}: инструкция Motion Control не может быть выполнена, потому что необходимые требования не были выполнены`)
      this.mapErrors.set(offset + 4, `${text}: ошибка в приводе`)
      this.mapErrors.set(offset + 5, `${text}: ошибка в системе энкодера`)
      this.mapErrors.set(offset + 6, `${text}: указанные динамические значения ограничены допустимыми значениями`)
      this.mapErrors.set(offset + 7, `${text}: ошибка связи с устройствами`)
      this.mapErrors.set(offset + 8, `${text}: программный концевой выключатель достигнут`)
      this.mapErrors.set(offset + 9, `${text}: аппаратный концевой выключатель достигнут`)
      this.mapErrors.set(offset + 10, `${text}: ошибка во время определения домашней позиции. Операция не может быть завершена`)
      this.mapErrors.set(offset + 11, `${text}: Following error, превышены лимиты`)
      this.mapErrors.set(offset + 12, `${text}: ошибка позиционирования`)
      this.mapErrors.set(offset + 13, `${text}: ошибка доступа к логическому адресу`)
      this.mapErrors.set(offset + 14, `${text}: резерв`)
      this.mapErrors.set(offset + 15, `${text}: ошибка в автоматической передаче данных`)
      this.mapErrors.set(offset + 16, `${text}: резерв`)
      this.mapErrors.set(offset + 17, `${text}: резерв`)
      this.mapErrors.set(offset + 18, `${text}: резерв`)
      this.mapErrors.set(offset + 19, `${text}: не включены концевые выключатели (аппаратные или программные)`)
      this.mapErrors.set(offset + 20, `${text}: не выбран режим для управления ТО`)
      this.mapErrors.set(offset + 21, `${text}: недействительное значение энкодера`)
      this.mapErrors.set(offset + 22, `${text}: недопустимый диапазон для перемещения`)
      this.mapErrors.set(offset + 23, `${text}: оси не присвоена домашняя позиция`)
      this.mapErrors.set(offset + 24, `${text}: ошибка при выполнении MC функции`)
      this.mapErrors.set(offset + 25, `${text}: время покоя не установлено`)
      this.mapErrors.set(offset + 26, `${text}: большой разброс значений энкодера`)
      this.mapErrors.set(offset + 27, `${text}: привод стоит на месте, или неисправлен энкодер`)
      this.mapErrors.set(offset + 28, `${text}: не получается спозиционироваться после выключения привода`)
      this.mapErrors.set(offset + 29, `${text}: неверное направление движения`)
      this.mapErrors.set(offset + 30, `${text}: слишком большой разгон/торможение`)
      this.mapErrors.set(offset + 31, `${text}: позиция энкодера не соответствует TO`)
      this.mapErrors.set(offset + 32, `${text}: недоступен преобразователь частоты`)
      this.mapErrors.set(offset + 33, `${text}: недоступен энкодер`)
      this.mapErrors.set(offset + 34, `${text}: ошибка в автоматической передаче данных с частотным преобразователем`)
      this.mapErrors.set(offset + 35, `${text}: ошибка в автоматической передаче данных с энкодером`)
      this.mapErrors.set(offset + 36, `${text}: не удалось обнулить энкодер`)
      this.mapErrors.set(offset + 37, `${text}: резерв`)
      this.mapErrors.set(offset + 38, `${text}: резерв`)
      this.mapErrors.set(offset + 39, `${text}: резерв`)
      this.mapErrors.set(offset + 40, `${text}: резерв`)
      this.mapErrors.set(offset + 41, `${text}: резерв`)
      this.mapErrors.set(offset + 42, `${text}: резерв`)
      this.mapErrors.set(offset + 43, `${text}: сработал автоматический выключатель энкодера`)
      this.mapErrors.set(offset + 44, `${text}: сработало тепловое реле`)
      this.mapErrors.set(offset + 45, `${text}: сработал автоматический выключатель силовой части ПЧ`)
      this.mapErrors.set(offset + 46, `${text}: сработал автоматический выключатель модуля управления ПЧ`)
      this.mapErrors.set(offset + 47, `${text}: сработал автоматический выключатель удерживающего тормоза`)
    }

    const fillMapEncoderErrors = (offset, text) => {
      this.mapErrors.set(offset + 0, `${text}: неизвестная ошибка`)
      this.mapErrors.set(offset + 1, `${text}: измерение не активно`)
      this.mapErrors.set(offset + 2, `${text}: перегрев`)
      this.mapErrors.set(offset + 3, `${text}: аппаратный дефект`)
      this.mapErrors.set(offset + 4, `${text}: плохое качество чтения или штрих-код не читается`)
      this.mapErrors.set(offset + 5, `${text}: команда не поддерживается`)
      this.mapErrors.set(offset + 6, `${text}: ошибка памяти`)
      this.mapErrors.set(offset + 7, `${text}: недостаточное напряжение`)
      this.mapErrors.set(offset + 8, `${text}: превышено напряжение`)
      this.mapErrors.set(offset + 9, `${text}: неверное значение измерения`)
      this.mapErrors.set(offset + 10, `${text}: ошибка параметризации`)
      this.mapErrors.set(offset + 11, `${text}: большой разброс значений энкодера`)
      this.mapErrors.set(offset + 12, `${text}: резерв`)
      this.mapErrors.set(offset + 13, `${text}: резерв`)
      this.mapErrors.set(offset + 14, `${text}: резерв`)
      this.mapErrors.set(offset + 15, `${text}: резерв`)
    }

    const fillMapStackerErrors = (offset) => {
      const text = 'Штабелер: '
      this.mapErrors.set(offset + 0, `${text}Нажат АВАРИЙНЫЙ СТОП`)
      this.mapErrors.set(offset + 1, `${text}Ошибка определения координат`)
      this.mapErrors.set(offset + 2, `${text}Вилы не в центре`)
      this.mapErrors.set(offset + 3, `${text}Задача не может быть запущена`)
      this.mapErrors.set(offset + 4, `${text}Задача прервана`)
      this.mapErrors.set(offset + 5, `${text}Линейный контактор выключен`)
      this.mapErrors.set(offset + 6, `${text}Энкодер оси Z не в центральной позиции`)
      this.mapErrors.set(offset + 7, `${text}Одновременно активны ось X и ось Z`)
      this.mapErrors.set(offset + 8, `${text}Одновременно активны ось Y и ось Z`)
      this.mapErrors.set(offset + 9, `${text}Активен левый датчик ширины груза`)
      this.mapErrors.set(offset + 10, `${text}Активен правый датчик ширины груза`)
      this.mapErrors.set(offset + 11, `${text}Задача для перемещения не прошла проверку на контроллере штабелера`)
      this.mapErrors.set(offset + 12, `${text}Сработало реле контроля фаз`)
      this.mapErrors.set(offset + 13, `${text}Превышена высота груза`)
      this.mapErrors.set(offset + 14, `${text}Присутствует груз на вилах`)
      this.mapErrors.set(offset + 15, `${text}Нет груза на вилах`)
      this.mapErrors.set(offset + 16, `${text}Присутствует груз на адресе`)
      this.mapErrors.set(offset + 17, `${text}Нет груза на адресе`)
      this.mapErrors.set(offset + 18, `${text}Стойки не обнаружены`)
      this.mapErrors.set(offset + 19, `${text}Произошел внутренний сбой логики`)
      this.mapErrors.set(offset + 20, `${text}Ось Y опустилась`)
      this.mapErrors.set(offset + 21, `${text}Захват переехал центральную позицию`)
      this.mapErrors.set(offset + 22, `${text}Ось Y при подъеме/опускании груза превысила лимиты позиции`)
      this.mapErrors.set(offset + 23, `${text}ОГП - Перегруз`)
      this.mapErrors.set(offset + 24, `${text}ОГП - Ослабление троса`)
      this.mapErrors.set(offset + 25, `${text}Перегрев шкафа`)
      this.mapErrors.set(offset + 26, `${text}Низкая температура шкафа`)
      this.mapErrors.set(offset + 27, `${text}Подключен аварийный пульт`)
      this.mapErrors.set(offset + 28, `${text}Повернут ключ обхода концевых выключателей`)
      this.mapErrors.set(offset + 29, `${text}Ошибка симуляции`)
      this.mapErrors.set(offset + 30, `${text}Запрет работы с адресом`)
      this.mapErrors.set(offset + 31, `${text}Ошибка позиционирования`)
      this.mapErrors.set(offset + 32, `${text}Ошибка оси X`)
      this.mapErrors.set(offset + 33, `${text}Ошибка оси Y`)
      this.mapErrors.set(offset + 34, `${text}Ошибка оси Z`)
      this.mapErrors.set(offset + 35, `${text}Сработал ограничитель скорости`)
      this.mapErrors.set(offset + 36, `${text}Ослабление троса`)
      this.mapErrors.set(offset + 37, `${text}Открыт шкаф управления`)
      this.mapErrors.set(offset + 38, `${text}Открытка калитка 1 рабочей зоны штабелера`)
      this.mapErrors.set(offset + 39, `${text}Открытка калитка 2 рабочей зоны штабелера`)
      this.mapErrors.set(offset + 40, `${text}Аварийный выключатель выходов модулей PLC`)
      this.mapErrors.set(offset + 41, `${text}Не обнаружен ригель`)
      this.mapErrors.set(offset + 42, `${text}Ось X сместилась`)
      this.mapErrors.set(offset + 43, `${text}Ящик на адресе смещен`)
      this.mapErrors.set(offset + 44, `${text}Резерв`)
      this.mapErrors.set(offset + 45, `${text}Неисправен датчик наличия груза 1 на адресе`)
      this.mapErrors.set(offset + 46, `${text}Неисправен датчик наличия груза 2 на адресе`)
      this.mapErrors.set(offset + 47, `${text}Неисправен датчик наличия груза на вилах`)
      this.mapErrors.set(offset + 48, `${text}Резерв`)
      this.mapErrors.set(offset + 49, `${text}Резерв`)
      this.mapErrors.set(offset + 50, `${text}Резерв`)
      this.mapErrors.set(offset + 51, `${text}Резерв`)
      this.mapErrors.set(offset + 52, `${text}Резерв`)
      this.mapErrors.set(offset + 53, `${text}Резерв`)
      this.mapErrors.set(offset + 54, `${text}Резерв`)
      this.mapErrors.set(offset + 55, `${text}Резерв`)
      this.mapErrors.set(offset + 56, `${text}Вытащен 1-й модуль PLC штабелера`)
      this.mapErrors.set(offset + 57, `${text}Вытащен 2-й модуль PLC штабелера`)
      this.mapErrors.set(offset + 58, `${text}Вытащен 3-й модуль PLC штабелера`)
      this.mapErrors.set(offset + 59, `${text}Вытащен 4-й модуль PLC штабелера`)
      this.mapErrors.set(offset + 60, `${text}Вытащен 5-й модуль PLC штабелера`)
      this.mapErrors.set(offset + 61, `${text}Вытащен 6-й модуль PLC штабелера`)
      this.mapErrors.set(offset + 62, `${text}Вытащен 7-й модуль PLC штабелера`)
      this.mapErrors.set(offset + 63, `${text}Вытащен 8-й модуль PLC штабелера`)
      fillMapAxisErrors(offset + 64, `${text}Ось X`)
      fillMapAxisErrors(offset + 112, `${text}Ось Y`)
      fillMapAxisErrors(offset + 160, `${text}Ось Z`)
      fillMapEncoderErrors(offset + 208, `${text}Энкодер оси X`)
      fillMapEncoderErrors(offset + 224, `${text}Энкодер оси Y`)
      fillMapEncoderErrors(offset + 240, `${text}Энкодер оси Z`)
    }
    const fillMapAxisWarnings = (offset, text) => {
      this.mapWarnings.set(offset + 0, `${text}: активна панель управления ТО`)
      this.mapWarnings.set(offset + 1, `${text}: Following error возможен`)
      this.mapWarnings.set(offset + 2, `${text}: изменены стартовые значения, нужна перезагрузка ТО`)
      this.mapWarnings.set(offset + 3, `${text}: предупреждение энкодера`)
      this.mapWarnings.set(offset + 4, `${text}: резерв`)
      this.mapWarnings.set(offset + 5, `${text}: резерв`)
      this.mapWarnings.set(offset + 6, `${text}: резерв`)
      this.mapWarnings.set(offset + 7, `${text}: резерв`)
    }
    const fillMapEncoderWarnings = (offset, text) => {
      this.mapWarnings.set(offset + 0, `${text}: превышена допустимая температура`)
      this.mapWarnings.set(offset + 1, `${text}: низкое качество чтения`)
      this.mapWarnings.set(offset + 2, `${text}: резерв`)
      this.mapWarnings.set(offset + 3, `${text}: резерв`)
      this.mapWarnings.set(offset + 4, `${text}: резерв`)
      this.mapWarnings.set(offset + 5, `${text}: резерв`)
      this.mapWarnings.set(offset + 6, `${text}: резерв`)
      this.mapWarnings.set(offset + 7, `${text}: резерв`)
    }
    const fillMapStackerWarnings = (offset) => {
      const text = 'Штабелер: '
      this.mapWarnings.set(offset + 0, `${text}Резерв`)
      this.mapWarnings.set(offset + 1, `${text}Стойки не обнаружены`)
      this.mapWarnings.set(offset + 2, `${text}Ригель не обнаружен`)
      this.mapWarnings.set(offset + 3, `${text}Повернут ключ обхода концевых выключателей`)
      this.mapWarnings.set(offset + 4, `${text}Предупреждение оси X`)
      this.mapWarnings.set(offset + 5, `${text}Предупреждение оси Y`)
      this.mapWarnings.set(offset + 6, `${text}Предупреждение оси Z`)
      this.mapWarnings.set(offset + 7, `${text}Резерв`)
      this.mapWarnings.set(offset + 8, `${text}Резерв`)
      this.mapWarnings.set(offset + 9, `${text}Резерв`)
      this.mapWarnings.set(offset + 10, `${text}Резерв`)
      this.mapWarnings.set(offset + 11, `${text}Резерв`)
      this.mapWarnings.set(offset + 12, `${text}Резерв`)
      this.mapWarnings.set(offset + 13, `${text}Резерв`)
      this.mapWarnings.set(offset + 14, `${text}Резерв`)
      this.mapWarnings.set(offset + 15, `${text}Резерв`)
      fillMapAxisWarnings(offset + 16, `${text}Ось X`)
      fillMapAxisWarnings(offset + 16 + 8, `${text}Ось Y`)
      fillMapAxisWarnings(offset + 16 + 16, `${text}Ось Z`)
      fillMapEncoderWarnings(offset + 40, `${text}Энкодер оси X`)
      fillMapEncoderWarnings(offset + 40 + 8, `${text}Энкодер оси Y`)
      fillMapEncoderWarnings(offset + 40 + 16, `${text}Энкодер оси Z`)
    }
    const fillMapConveyorWarnings = (offset) => {
      const text = 'Тележка: '
      this.mapWarnings.set(offset + 0, `${text}Резерв`)
      this.mapWarnings.set(offset + 1, `${text}Предупреждение оси`)
      this.mapWarnings.set(offset + 2, `${text}Резерв`)
      this.mapWarnings.set(offset + 3, `${text}Повернут ключ обхода концевых выключателей`)
      this.mapWarnings.set(offset + 4, `${text}Превышена высота груза`)
      this.mapWarnings.set(offset + 5, `${text}Резерв`)
      this.mapWarnings.set(offset + 6, `${text}Резерв`)
      this.mapWarnings.set(offset + 7, `${text}Резерв`)
      this.mapWarnings.set(offset + 8, `${text}Резерв`)
      this.mapWarnings.set(offset + 9, `${text}Резерв`)
      this.mapWarnings.set(offset + 10, `${text}Резерв`)
      this.mapWarnings.set(offset + 11, `${text}Резерв`)
      this.mapWarnings.set(offset + 12, `${text}Резерв`)
      this.mapWarnings.set(offset + 13, `${text}Резерв`)
      this.mapWarnings.set(offset + 14, `${text}Резерв`)
      this.mapWarnings.set(offset + 15, `${text}Резерв`)
    }

    this.mapErrors.set(0, 'Произошел внутренний сбой логики (главный plc)')
    this.mapErrors.set(1, 'Рассинхронизация режимов управления')
    this.mapErrors.set(2, 'Задача не может быть запущена (главный plc)')
    this.mapErrors.set(3, 'Ошибка симуляции')
    this.mapErrors.set(4, 'Задача прервана (главный plc)')
    this.mapErrors.set(5, 'Разные режимы на главном plc и plc штабелера')
    this.mapErrors.set(6, 'Выбран неправильный режим')
    this.mapErrors.set(7, 'Штабелер не готов')
    this.mapErrors.set(8, 'Тележка не готова')
    this.mapErrors.set(9, 'Весы не готовы')
    this.mapErrors.set(10, 'Нажат АВАРИЙНЫЙ СТОП (общий)')
    this.mapErrors.set(11, 'Неверное входящее сообщение')
    this.mapErrors.set(12, 'Присутствует груз на тележке')
    this.mapErrors.set(13, 'Имеется ошибка штабелера')
    this.mapErrors.set(14, 'Имеется ошибка тележки')
    this.mapErrors.set(15, 'Вытащен 1-й модуль главного PLC')
    this.mapErrors.set(16, 'Вытащен 2-й модуль главного PLC')
    this.mapErrors.set(17, 'Вытащен 3-й модуль главного PLC')
    this.mapErrors.set(18, 'Вытащен 4-й модуль главного PLC')
    this.mapErrors.set(19, 'Вытащен 5-й модуль главного PLC')
    this.mapErrors.set(20, 'Вытащен 6-й модуль главного PLC')
    this.mapErrors.set(21, 'Вытащен 7-й модуль главного PLC')
    this.mapErrors.set(22, 'Вытащен 8-й модуль главного PLC')
    this.mapErrors.set(23, 'Нет груза не тележке')
    this.mapErrors.set(24, 'Тележка не в начальной позиции')
    this.mapErrors.set(25, 'Автоматический выключатель ПДУ')
    this.mapErrors.set(26, 'Автоматический выключатель питание штабелера')
    this.mapErrors.set(27, 'Открыта калитка 2 рабочей зоны')
    this.mapErrors.set(28, 'Открыта калитка 1 рабочей зоны')
    this.mapErrors.set(29, 'Открыт шкаф управления')
    this.mapErrors.set(30, 'Низкая температура в шкафу управления')
    this.mapErrors.set(31, 'Высокая температура в шкафу управления')
    fillMapStackerErrors(32)
    const t1 = 'Тележка: '
    this.mapErrors.set(288, `${t1}аварийный стоп`)
    this.mapErrors.set(289, `${t1}задача для перемещения не прошла проверку на контроллере тележки`)
    this.mapErrors.set(290, `${t1}ошибка симуляции`)
    this.mapErrors.set(291, `${t1}ошибка логики`)
    this.mapErrors.set(292, `${t1}сработало реле контроля фаз`)
    this.mapErrors.set(293, `${t1}выключен линейный контактор`)
    this.mapErrors.set(294, `${t1}автоматический выключатель выходов контроллера`)
    this.mapErrors.set(295, `${t1}слишком высокая температура в шкафу управления`)
    this.mapErrors.set(296, `${t1}слишком низкая температура в шкафу управления`)
    this.mapErrors.set(297, `${t1}шкаф управления открыт`)
    this.mapErrors.set(298, `${t1}открыта калитка 1 рабочей зоны`)
    this.mapErrors.set(299, `${t1}открыта калитка 2 рабочей зоны`)
    this.mapErrors.set(300, `${t1}повернут ключ обхода концевых выключателей`)
    this.mapErrors.set(301, `${t1}задача прервана`)
    this.mapErrors.set(302, `${t1}задача не может быть запущена`)
    this.mapErrors.set(303, `${t1}подключен ПДУ`)
    this.mapErrors.set(304, `${t1}проблема с грузом`)
    this.mapErrors.set(305, `${t1}может быть проблема с датчиком торможения телеги в положительном направлении`)
    this.mapErrors.set(306, `${t1}может быть проблема с датчиком торможения телеги в отрицательном направлении`)
    this.mapErrors.set(307, `${t1}проблема с датчиками позиционирования`)
    this.mapErrors.set(308, `${t1}проблема с датчиком торможения телеги в положительном направлении`)
    this.mapErrors.set(309, `${t1}проблема с датчиком торможения телеги в отрицательном направлении`)
    this.mapErrors.set(310, `${t1}проблема с конечным датчиком торможения телеги в положительном направлении`)
    this.mapErrors.set(311, `${t1}проблема с конечным датчиком торможения телеги в отрицательном направлении`)
    this.mapErrors.set(312, `${t1}ошибка оси`)
    this.mapErrors.set(313, `${t1}сработал концевой выключатель положительного направления`)
    this.mapErrors.set(314, `${t1}сработал концевой выключатель отрицательного направления`)
    this.mapErrors.set(315, `${t1}сработал автоматический выключатель силовой части ПЧ`)
    this.mapErrors.set(316, `${t1}сработал автоматический выключатель модуля управления ПЧ`)
    this.mapErrors.set(317, `${t1}сработал автоматический выключатель тормозов`)
    this.mapErrors.set(318, `${t1}сработало тепловое реле`)
    this.mapErrors.set(319, `${t1}резерв`)

    this.mapWarnings.set(0, 'Активирован режим симуляции')
    this.mapWarnings.set(1, 'Превышен вес')
    this.mapWarnings.set(2, 'Была потеряна связь с сервером')
    this.mapWarnings.set(3, 'Повернут ключ обхода концевых выключателей (общий)')
    this.mapWarnings.set(4, 'Резерв')
    this.mapWarnings.set(5, 'Резерв')
    this.mapWarnings.set(6, 'Резерв')
    this.mapWarnings.set(7, 'Резерв')
    this.mapWarnings.set(8, 'Резерв')
    this.mapWarnings.set(9, 'Резерв')
    this.mapWarnings.set(10, 'Резерв')
    this.mapWarnings.set(11, 'Резерв')
    this.mapWarnings.set(12, 'Резерв')
    this.mapWarnings.set(13, 'Резерв')
    this.mapWarnings.set(14, 'Резерв')
    this.mapWarnings.set(15, 'Резерв')
    fillMapStackerWarnings(16)
    fillMapConveyorWarnings(10 * 8)

    this.grid.available = true
    this.grid.setFontSize(20)
    this.grid.init()

    this.gridErrors.available = true
    this.gridErrors.setFontSize(20)
    this.gridErrors.init()

    this.gridWarnings.available = true
    this.gridWarnings.setFontSize(20)
    this.gridWarnings.init()

    Core.getTable(TABLE_DEVICES)
    const table = Core.getTable(TABLE_ZONES)
    table.forEach(item => {
      this.newRow(item)
    })
    table.subscribe(this.onTableUpdate.bind(this))
    Core.socket.execute({
      [TABLE_ZONES]: {
        id: _
      }
    })
    Core.socket.execute({
      [TABLE_DEVICES]: {
        errors: _,
        warnings: _
      }
    })
  }

  clickButtonReset () {
    const task = this.grid.selectedRow
    if (task && task.tag && task.tag.id) {
      Core.socket.execute({
        reset: {
          [$ARGUMENTS]: {
            id: task.tag.id
          }
        }
      })
    }
  }

  clickButtonReleaseSafetyLock () {
    Core.socket.execute({
      release_safety_lock: {
        [$ARGUMENTS]: {
          password: ''
        }
      }
    })
  }

  clickButtonAutoMode () {
    const task = this.grid.selectedRow
    if (task && task.tag && task.tag.id) {
      Core.socket.execute({
        change_mode: {
          [$ARGUMENTS]: {
            id: task.tag.id,
            mode: 2
          }
        }
      })
    }
  }

  clickButtonManualMode () {
    const task = this.grid.selectedRow
    if (task && task.tag && task.tag.id) {
      Core.socket.execute({
        change_mode: {
          [$ARGUMENTS]: {
            id: task.tag.id,
            mode: 1
          }
        }
      })
    }
  }

  clickButtonMetricMode () {
    const task = this.grid.selectedRow
    if (task && task.tag && task.tag.id) {
      Core.socket.execute({
        change_mode: {
          [$ARGUMENTS]: {
            id: task.tag.id,
            mode: 3
          }
        }
      })
    }
  }

  newRow (item) {
    const row = new GridRow(this.grid, item)
    this.grid.addRow(item.id, row)
  }

  onTableUpdate (message) {
    switch (message.type) {
      case OBSERVABLE_ADD_PROPERTY:
        if (message.path.length === 1) this.newRow(message.value)
        break
      case OBSERVABLE_SET_PROPERTY:
        if (message.path.length === 2) {
          switch (message.path[1]) {
            case 'errors': {
              const offset = this.getZoneOffset(message.refs[1].id) * ErrorBlockSize
              message.value.forEach((value, i) => {
                for (let j = 0; j < 32; j++) {
                  if (((value >> j) & 1) === 1) {
                    this.addRowError(offset + j + i * 32, message.refs[1].id, j + i * 32)
                  } else {
                    this.gridErrors.removeRow(`${offset + j + i * 32}`)
                  }
                }
              })
            }
              break
            case 'warnings': {
              const offset = this.getZoneOffset(message.refs[1].id) * WarningsBlockSize
              message.value.forEach((value, i) => {
                for (let j = 0; j < 32; j++) {
                  if (((value >> j) & 1) === 1) {
                    this.addRowWarning(offset + j + i * 32, message.refs[1].id, j + i * 32)
                  } else {
                    this.gridWarnings.removeRow(`${offset + j + i * 32}`)
                  }
                }
              })
            }
              break
            default:
              break
          }
        }
        break
      case OBSERVABLE_REMOVE_PROPERTY:
        this.grid.removeRow(`${message.path[0]}`)
        break
      default:
        break
    }
  }

  addRowError (id, zone, error) {
    let row = this.cacheErrors.get(id)
    if (row === undefined) {
      row = new GridRow(this.gridErrors, undefined)
      row.cell[0].value = zone
      row.cell[1].value = this.mapErrors.get(error)
      this.cacheErrors.set(id, row)
    }
    this.gridErrors.addRow(`${id}`, row)
  }

  addRowWarning (id, zone, warning) {
    let row = this.cacheWarnings.get(id)
    if (row === undefined) {
      row = new GridRow(this.gridWarnings, undefined)
      row.cell[0].value = zone
      row.cell[1].value = this.mapWarnings.get(warning)
      this.cacheWarnings.set(id, row)
    }
    this.gridWarnings.addRow(`${id}`, row)
  }
}

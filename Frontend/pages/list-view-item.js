import { ListViewItem } from '../list-view.js'
import { OBSERVABLE_SET_PROPERTY } from '../observable.js'
import {
  TABLE_NOMENCLATURES,
  TABLE_REASONS,
  TABLE_ADDRESSES,
  TABLE_UNITS,
  TABLE_PRODUCT_TYPES,
  TABLE_OWNERS,
} from '../api-settings.js'
import { smartGet, isDeferred } from '../api.js'

export class ListViewItemNomenclature extends ListViewItem {
  update(message) {
    if (
      message.type === OBSERVABLE_SET_PROPERTY &&
      ((message.path.length === 1 &&
        (message.path[0] === 'designation' ||
          message.path[0] === 'name' ||
          message.path[0] === 'product_type')) ||
        (message.path.length === 2 &&
          message.path[0] === 'product_type' &&
          message.path[1] === 'name'))
    ) {
      if (this.domComponent !== undefined) {
        this.domComponent.textContent = this.value
      }
      this.visible = this.owner.props.filter(this)
    }
  }

  get value() {
    const designation = smartGet(this.item, TABLE_NOMENCLATURES, [
      'designation',
    ])
    const productType = smartGet(this.item, TABLE_NOMENCLATURES, [
      'product_type',
      'name',
    ])
    const name = smartGet(this.item, TABLE_NOMENCLATURES, ['name'])
    if (isDeferred(designation)) return designation
    if (isDeferred(productType)) return productType
    if (isDeferred(name)) return name
    return `${designation}(${productType}) ${name}`
  }
}

export class ListViewItemReason extends ListViewItem {
  update(message) {
    if (
      message.type === OBSERVABLE_SET_PROPERTY &&
      message.path[0] === 'name'
    ) {
      if (this.domComponent !== undefined) {
        this.domComponent.textContent = this.value
      }
      this.visible = this.owner.props.filter(this)
    }
  }

  get value() {
    return smartGet(this.item, TABLE_REASONS, ['name'])
  }
}

export class ListViewItemAddress extends ListViewItem {
  update(message) {
    if (
      message.type === OBSERVABLE_SET_PROPERTY &&
      message.path[0] === 'name'
    ) {
      if (this.domComponent !== undefined) {
        this.domComponent.textContent = this.value
      }
      this.visible = this.owner.props.filter(this)
    }
  }

  get value() {
    return smartGet(this.item, TABLE_ADDRESSES, ['name'])
  }
}

export class ListViewItemUnit extends ListViewItem {
  update(message) {
    if (
      message.type === OBSERVABLE_SET_PROPERTY &&
      message.path[0] === 'name'
    ) {
      if (this.domComponent !== undefined) {
        this.domComponent.textContent = this.value
      }
      this.visible = this.owner.props.filter(this)
    }
  }

  get value() {
    return smartGet(this.item, TABLE_UNITS, ['name'])
  }
}

export class ListViewItemProductType extends ListViewItem {
  update(message) {
    if (
      message.type === OBSERVABLE_SET_PROPERTY &&
      message.path[0] === 'name'
    ) {
      if (this.domComponent !== undefined) {
        this.domComponent.textContent = this.value
      }
      this.visible = this.owner.props.filter(this)
    }
  }

  get value() {
    return smartGet(this.item, TABLE_PRODUCT_TYPES, ['name'])
  }
}

export class ListViewItemOwner extends ListViewItem {
  update(message) {
    if (
      message.type === OBSERVABLE_SET_PROPERTY &&
      message.path[0] === 'name'
    ) {
      if (this.domComponent !== undefined) {
        this.domComponent.textContent = this.value
      }
      this.visible = this.owner.props.filter(this)
    }
  }

  get value() {
    return smartGet(this.item, TABLE_OWNERS, ['name'])
  }
}

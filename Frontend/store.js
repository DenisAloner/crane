export const Store = new (class {
  constructor() {
    this.maps = new Map()
    this.observables = new Map()
  }
})()

window.STORE = Store

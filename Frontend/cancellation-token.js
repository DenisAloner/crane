export class CancellationTokenSource {
  constructor () {
    this.id = 0
    this.task = undefined
  }

  getToken () {
    return new CancellationToken(this, this.id)
  }

  cancel () {
    this.id++
  }
}

export class CancellationToken {
  constructor (owner, id) {
    this.id = id
    this.owner = owner
  }

  // throwIfCancelled () {
  //   if (this.isCancelled()) {
  //     throw new Error('Cancelled!')
  //   }
  // }

  isCancelled () {
    return this.owner.id !== this.id
  }
}

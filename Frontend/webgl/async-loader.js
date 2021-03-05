import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'

export class STLLoaderAsync extends STLLoader {
  loadAsync(url) {
    return new Promise((resolve, reject) => {
      this.load(
        `./resources/models/${url}`,
        (geometry) => {
          resolve(geometry)
        },
        () => {},
        (error) => reject(error)
      )
    })
  }
}

import { Core } from '../api.js'
import {
  AddressTypes,
  THREE,
  TABLE_OPERATIONS,
  TABLE_DEVICES,
  TABLE_ADDRESSES,
  TABLE_WAREHOUSE,
} from '../api-settings.js'
import { Page } from '../page.js'
import { $ARGUMENTS, _ } from '../graph-ql/gql-constants.js'
import {
  OBSERVABLE_SET_PROPERTY,
  OBSERVABLE_ADD_PROPERTY,
  OBSERVABLE_REMOVE_PROPERTY,
} from '../observable.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'
import { STLLoaderAsync } from '../webgl/async-loader.js'

const RACK_STACK = 10
const cargoWidth = 0.735
const cargoLength = 0.965

const floorTexture = new THREE.TextureLoader().load(
  'resources/textures/floor.jpg'
)
floorTexture.wrapS = THREE.RepeatWrapping
floorTexture.wrapT = THREE.RepeatWrapping
floorTexture.repeat.set(4, 4)

const wallTexture = new THREE.TextureLoader().load(
  'resources/textures/wall.jpg'
)
wallTexture.wrapS = THREE.RepeatWrapping
wallTexture.wrapT = THREE.RepeatWrapping
wallTexture.repeat.set(8, 2)

const wallTexture1 = new THREE.TextureLoader().load(
  'resources/textures/wall.jpg'
)
wallTexture1.wrapS = THREE.RepeatWrapping
wallTexture1.wrapT = THREE.RepeatWrapping
wallTexture1.repeat.set(4, 2)

const materialStacker = new THREE.MeshStandardMaterial({
  color: 0xff7e28,
})

const materialRack = new THREE.MeshStandardMaterial({
  color: 0xeeeeee,
})

const materialBeam = new THREE.MeshStandardMaterial({
  color: 0xff0000,
})

const strokeMaterial = new THREE.LineBasicMaterial({
  color: 0x000000,
})

class Stacker {
  constructor(id, models, owner) {
    this.id = id
    this.frame = new THREE.Group()
    this.forklift = new THREE.Group()
    this.frame.add(this.forklift)

    let mesh = new THREE.Mesh(models[0], materialStacker)
    mesh.position.set(0, 0, 0)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.frame.add(mesh)
    // let geometry = new THREE.EdgesGeometry(mesh.geometry)
    // let wireframe = new THREE.LineSegments(geometry, strokeMaterial)
    // mesh.add(wireframe)

    mesh = new THREE.Mesh(models[1], materialStacker)
    mesh.position.set(0, 0, 0)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.forklift.add(mesh)
    // geometry = new THREE.EdgesGeometry(mesh.geometry)
    // wireframe = new THREE.LineSegments(geometry, strokeMaterial)
    // mesh.add(wireframe)

    mesh = new THREE.Mesh(models[2], materialStacker)
    mesh.position.set(0, 0, 0)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.forks = mesh
    this.forklift.add(this.forks)
    // geometry = new THREE.EdgesGeometry(mesh.geometry)
    // wireframe = new THREE.LineSegments(geometry, strokeMaterial)
    // mesh.add(wireframe)
    this.frame.rotation.y = Math.PI
  }
}

export class Visualizer extends Page {
  constructor(owner, name) {
    super(owner, name)
    this.models = new Map()
    this.changes = new Map()
    this.cells = []

    const width = this.domComponent.getBoundingClientRect().width
    const height = this.domComponent.getBoundingClientRect().height
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    // this.camera = new THREE.OrthographicCamera(this.w / -2, this.w / 2, this.h / 2, this.h / -2, 0, 25000)
    this.camera.position.set(10, 7, 14) // (-1.5, 3, -1.5)
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xffffff)

    this.dolly = new THREE.Group()
    this.dolly.position.set(0, 0, 0)
    this.dolly.add(this.camera)
    this.scene.add(this.dolly)

    // this.helper = new THREE.GridHelper(250000, 10, 0xFFA500, 0x1D2B3A)
    // this.scene.add(this.helper)

    let light = new THREE.PointLight(0xffffff, 0.75, 100, 2)
    light.position.set(-13, 25, -20)
    light.castShadow = true
    light.shadow.mapSize.width = 4096
    light.shadow.mapSize.height = 4096
    light.shadow.camera.near = 0.1
    light.shadow.camera.far = 100
    light.shadow.bias = -0.001
    this.scene.add(light)

    light = new THREE.PointLight(0xffffff, 0.75, 100, 2)
    light.position.set(27, 25, 20)
    light.castShadow = true
    light.shadow.mapSize.width = 4096
    light.shadow.mapSize.height = 4096
    light.shadow.camera.near = 0.1
    light.shadow.camera.far = 100
    light.shadow.bias = -0.001
    this.scene.add(light)

    light = new THREE.AmbientLight(0xffffff, 0.75)
    this.scene.add(light)

    // const gridXZ = new THREE.GridHelper(
    //   20,
    //   80,
    //   new THREE.Color(0 / 255, 64 / 255, 128 / 255),
    //   new THREE.Color(0 / 255, 64 / 255, 128 / 255)
    // )
    // gridXZ.position.set(7, -0.1, 0) // (0.8, -0.5, 0)
    // this.scene.add(gridXZ)

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 20),
      new THREE.MeshLambertMaterial({
        map: floorTexture,
        side: THREE.DoubleSide,
      })
    )
    plane.rotateX(Math.PI / 2)
    plane.position.set(7, -0.125, 0)
    plane.receiveShadow = true
    this.scene.add(plane)

    let wall = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 10),
      new THREE.MeshLambertMaterial({
        map: wallTexture,
        side: THREE.DoubleSide,
      })
    )
    wall.position.set(7, 5 - 0.125, -10)
    wall.receiveShadow = true
    this.scene.add(wall)

    wall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 10),
      new THREE.MeshLambertMaterial({
        map: wallTexture1,
        side: THREE.DoubleSide,
      })
    )
    wall.rotateY(Math.PI / 2)
    wall.position.set(-13, 5 - 0.125, 0)
    wall.receiveShadow = true
    this.scene.add(wall)

    wall = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 10),
      new THREE.MeshLambertMaterial({
        map: wallTexture,
        side: THREE.DoubleSide,
      })
    )
    wall.position.set(7, 5 - 0.125, 10)
    wall.receiveShadow = true
    this.scene.add(wall)

    wall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 10),
      new THREE.MeshLambertMaterial({
        map: wallTexture1,
        side: THREE.DoubleSide,
      })
    )
    wall.rotateY(Math.PI / 2)
    wall.position.set(27, 5 - 0.125, 0)
    wall.receiveShadow = true
    this.scene.add(wall)

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
    })
    this.cameraVector = new THREE.Vector3()
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.VSMShadowMap
    // renderer.setClearColor(0xffffff, 1)

    this.domComponent.append(this.renderer.domElement)

    // this.controls = new OrbitControls(this.camera, this.domComponent)
    // this.controls.rotateSpeed = 1
    // this.controls.zoomSpeed = 1.2
    // this.controls.panSpeed = 0.8
    // this.controls.target = new THREE.Vector3(7, 4, 0)

    Core.getTable(TABLE_OPERATIONS)
    this.devices = Core.getTable(TABLE_DEVICES)
    this.addresses = Core.getTable(TABLE_ADDRESSES)
    this.warehouse = Core.getTable(TABLE_WAREHOUSE)

    const loader = new STLLoaderAsync()

    const models = []
    models.push(loader.loadAsync('frame.stl'))
    models.push(loader.loadAsync('forklift.stl'))
    models.push(loader.loadAsync('forks.stl'))
    models.push(loader.loadAsync('cargo.stl'))
    models.push(loader.loadAsync('rack.stl'))
    models.push(loader.loadAsync('beam.stl'))
    models.push(loader.loadAsync('beam.stl'))

    Promise.all(models)
      .then((value) => {
        return this.initModels(value)
      })
      .catch((error) => {
        console.log(error)
      })
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    // this.rect = this.domComponent.getBoundingClientRect()
    this.domComponent.addEventListener('click', this.onMouseClick.bind(this))
    this.renderer.xr.enabled = true
    this.domComponent.appendChild(VRButton.createButton(this.renderer))

    this.animate()
  }

  getCoordinates() {
    Core.socket.execute(
      {
        devices: {
          x: _,
          y: _,
          z: _,
        },
      },
      this.getCoordinates.bind(this)
    )
  }

  resize(width, height) {
    this.renderer.setSize(width, height)
    // this.camera.fov = Math.atan(height / 2 / this.camera.position.z) * 2 * THREE.Math.RAD2DEG
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    super.resize()
    this.rect = this.domComponent.getBoundingClientRect()
  }

  async initModels(values) {
    values[0].scale(0.001, 0.001, 0.001)
    values[0].translate(-1.2785, 0, -0.125)
    values[1].scale(0.001, 0.001, 0.001)
    values[1].translate(-0.586, -0.29, -0.525)
    values[2].scale(0.001, 0.001, 0.001)
    values[2].translate(-0.225, 0.01, -0.525)
    values[3].scale(0.001, 0.001, 0.001)
    values[3].translate(-cargoLength / 2, 0, -cargoWidth / 2)
    values[4].scale(0.001, 0.001, 0.001)
    values[4].rotateX(-Math.PI / 2)
    values[4].translate(0.2, 2.9, -0.7)
    values[5].scale(0.001, 0.001, 0.001)
    values[5].rotateX(-Math.PI / 2)
    values[5].rotateY(Math.PI / 2)
    values[5].translate(2.035, 0.5, -0.725)
    values[6].scale(0.001, 0.001, 0.001)
    values[6].rotateX(-Math.PI / 2)
    values[6].rotateY(-Math.PI / 2)
    values[6].translate(0.235, 0.5, -0.725)
    this.devices.subscribe(this.onTableUpdate.bind(this))
    await Core.socket.execute({
      devices: {
        id: _,
      },
    })
    this.stackers = new Map()
    this.devices.forEach((stacker) => {
      this.stackers.set(stacker.id, new Stacker(stacker.id, values, this))
    })
    this.stackers.forEach((stacker) => {
      this.scene.add(stacker.frame)
    })
    this.getCoordinates()
    this.cargo = values[3]

    Core.socket.execute(
      {
        addresses: {
          name: _,
          zone: _,
          type: _,
          x: _,
          y: _,
          z: _,
        },
      },
      this.initCells.bind(this)
    )

    this.warehouse.subscribe((value) => {
      this.onWarehouseUpdate(value)
    })
    Core.socket.execute(
      {
        warehouse: {
          operation: {
            destination: _,
            weight: _,
          },
        },
      },
      this.initCargo.bind(this)
    )
    for (let j = 0; j < 8; ++j) {
      let mesh = new THREE.Mesh(values[4], materialRack)
      mesh.position.set(j * 1.9, 0, 0)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.scene.add(mesh)
      mesh = new THREE.Mesh(values[4], materialRack)
      mesh.position.set(j * 1.9, 0, 2.4)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.scene.add(mesh)
    }

    for (let y = 0; y < 15; ++y) {
      for (let x = 0; x < 7; ++x) {
        let mesh = new THREE.Mesh(values[5], materialBeam)
        mesh.position.set(x * 1.9, y * 0.55, 0)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.scene.add(mesh)
        mesh = new THREE.Mesh(values[6], materialBeam)
        mesh.position.set(x * 1.9, y * 0.55, -0.975)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.scene.add(mesh)
        mesh = new THREE.Mesh(values[6], materialBeam)
        mesh.position.set(x * 1.9, y * 0.55, 1.425)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.scene.add(mesh)
        mesh = new THREE.Mesh(values[5], materialBeam)
        mesh.position.set(x * 1.9, y * 0.55, 2.4)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.scene.add(mesh)
      }
    }
  }

  initCargo() {
    this.warehouse.forEach((state) => {
      this.setCell(state.id)
    })
  }

  initCells() {
    const deskMaterial = new THREE.MeshLambertMaterial({
      color: 0x001b53,
      opacity: 0.75,
      transparent: true,
    })
    const cellMaterial = new THREE.MeshLambertMaterial({
      color: 0xc0121c,
      opacity: 0.5,
      transparent: true,
    })

    // this.addresses.forEach((cell) => {
    //   const object = new THREE.Mesh(
    //     new THREE.BoxGeometry(cargoWidth, 0.025, cargoLength),
    //     cell.type === AddressTypes.DESK ? deskMaterial : cellMaterial
    //   )
    //   const x = cell.x / 1000
    //   // if (x > 2.2) {
    //   //   object.position.x = 2.2 + (cell.z < 0 ? (0.4515 + cargoLength / 2 + 0.041) : (-0.4515 - cargoLength / 2))
    //   //   object.position.z = -0.7 - (x - 2.2)
    //   //   object.rotation.set(0, Math.PI / 2, 0)
    //   // } else {
    //   object.position.x = x
    //   object.position.z =
    //     cell.z < 0 ? 0.7 + cargoLength / 2 : -0.7 - cargoLength / 2
    //   // }
    //   object.position.y = cell.y / 1000
    //   this.scene.add(object)
    //   this.cells.push(object)
    // })
  }

  onTableUpdate(message) {
    switch (message.type) {
      case OBSERVABLE_SET_PROPERTY:
        if (message.path.length === 2) {
          const stacker = this.stackers.get(message.path[0])
          switch (message.path[1]) {
            case 'x':
              stacker.frame.position.x = message.value / 1000
              break
            case 'y':
              stacker.forklift.position.y = message.value / 1000
              break
            case 'z':
              stacker.forks.position.z = message.value / 1000
              break
          }
        }
        break
    }
  }

  onWarehouseUpdate(value) {
    if (value.type === OBSERVABLE_ADD_PROPERTY) {
      if (value.path.length === 1) {
        const state = value.value
        if (
          state.operation &&
          state.operation.destination &&
          state.operation.destination.x &&
          state.operation.weight
        ) {
          this.setCell(state.id)
        } else {
          Core.socket.execute(
            {
              [TABLE_WAREHOUSE]: {
                [$ARGUMENTS]: { id: state.id },
                operation: {
                  destination: {
                    x: _,
                    y: _,
                    z: _,
                  },
                  weight: _,
                },
              },
            },
            () => {
              this.setCell(state.id)
            }
          )
        }
      }
    } else if (value.type === OBSERVABLE_REMOVE_PROPERTY) {
      if (value.path.length === 1) {
        this.removeCell(value.path[0])
      }
    }
  }

  setCell(id) {
    const state = this.warehouse.get(id)
    const weight = state.operation.weight / 550
    if (state.operation.weight === undefined) state.operation.weight = 0

    let model = this.models.get(state.operation.destination.id)
    if (model === undefined) {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(weight, 1 - weight, 0),
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      })

      const mesh = new THREE.Mesh(this.cargo, material)
      const cell = this.addresses.get(state.operation.destination.id)
      mesh.rotation.set(0, Math.PI / 2, 0)
      mesh.position.set(
        cell.x / 1000,
        cell.y / 1000 + 0.025,
        cell.z < 0
          ? 0.7 + cargoLength / 2 + 0.041
          : -0.7 - cargoLength / 2 + 0.041
      )
      const geometry = new THREE.EdgesGeometry(mesh.geometry)
      const wireframe = new THREE.LineSegments(geometry, strokeMaterial)
      mesh.add(wireframe)
      this.scene.add(mesh)
      const changes = new Set()
      changes.add(state.id)
      model = {
        mesh,
        changes: changes,
        address: state.operation.destination.id,
      }
      this.models.set(state.operation.destination.id, model)
      this.changes.set(state.id, model)
      // Core.socket.execute({ operations: { [ARGS]: { id: state.operation.id }, weight: _ } })
      state.operation.subscribe(function (value) {
        if (
          value.path.length === 1 &&
          value.path[0] === 'weight' &&
          value.type === OBSERVABLE_SET_PROPERTY
        ) {
          mesh.material.color.setRGB(
            value.value / 550,
            1 - value.value / 550,
            0
          )
        }
      })
    } else {
      model.changes.add(state.id)
      this.changes.set(state.id, model)
    }
  }

  removeCell(id) {
    const model = this.changes.get(id)
    if (model !== undefined) {
      this.changes.delete(id)
      model.changes.delete(id)
      if (model.changes.size === 0) {
        this.models.delete(model.address)
        this.scene.remove(model.mesh)
        model.mesh.geometry.dispose()
        model.mesh.material.dispose()
      }
    }
  }

  ascSort(a, b) {
    return a.distance - b.distance
  }

  intersects() {
    const intersects = []
    this.models.forEach((object) => {
      this.raycaster.intersectObject(object.mesh, false, intersects)
    })
    intersects.sort(this.ascSort)
    return intersects
  }

  onMouseClick(event) {
    this.mouse.x = (event.clientX / this.rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - this.rect.top) / this.rect.height) * 2 + 1
    if (this.models) {
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const intersects = this.intersects()
      if (intersects[0]) {
        intersects[0].object.material.color.set(0xff0000)
      }
    }
  }

  animate() {
    this.renderer.setAnimationLoop(this.render.bind(this))
    // requestAnimationFrame(this.animate.bind(this))
  }

  render() {
    const xrCamera = this.renderer.xr.getCamera(this.camera)
    xrCamera.getWorldDirection(this.cameraVector)
    const gamepad = navigator.getGamepads()?.[0]

    if (gamepad != null) {
      const x = gamepad.axes[0]
      const z = gamepad.axes[1]
      const y = gamepad.axes[3]
      if (Math.abs(x) > 0.5 || Math.abs(z) > 0.5) {
        const angle = new THREE.Vector2(-z, -x).angle()
        this.cameraVector.setFromMatrixColumn(xrCamera.matrix, 0)
        this.cameraVector.crossVectors(xrCamera.up, this.cameraVector)
        const axis = new THREE.Vector3(0, 1, 0)
        this.cameraVector.applyAxisAngle(axis, angle)
        this.dolly.position.addScaledVector(this.cameraVector, 0.025)
      }
      if (Math.abs(y) > 0.5) {
        this.dolly.position.addScaledVector(
          new THREE.Vector3(0, 1, 0),
          y > 0 ? -0.025 : 0.025
        )
      }
    }
    this.renderer.render(this.scene, this.camera)
    // this.controls.update()
  }
}

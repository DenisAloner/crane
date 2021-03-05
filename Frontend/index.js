import { Core } from './api.js'
import { PageLogin } from './pages/login.js'
import { _, $ARGUMENTS } from './graph-ql/gql-constants.js'
import { InitStorable } from './storable.js'

window.addEventListener('load', init)
async function init () {
  Core.init(document.querySelector('#SPA'))
  const page = Core.workspace.addPage('Авторизация', new PageLogin(Core.workspace, 'Авторизация', async () => {
    Core.workspace.removePage(page)
    Core.socket.connect()
    // Core.socket.execute({
    //   nomenclature: {
    //     [ARGS]: { id: 2291 },
    //     id: _,
    //     unit: { value: _ }
    //   }
    // })
    // Core.socket.execute({
    //   create_operation: {
    //     [ARGS]: {
    //       source: 23,
    //       destination: 213
    //     }
    //   }
    // })

    // Core.socket.execute({
    //   devices: {
    //     [$ARGUMENTS]: { user: 3 },
    //     id: _,
    //     fail: _
    //   }
    // })
    InitStorable()
  }))
  page.mockup()
  page.init()
  Core.workspace.resize()
}

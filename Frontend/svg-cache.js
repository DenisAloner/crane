export class SvgCache {
  constructor(owner) {
    this.owner = owner
    this.styleSheets = document.styleSheets[3]
  }

  async add(name, file) {
    const response = await fetch(`/resources/${file}.svg`)
    const svg = await response.text()
    const rule = `.${name}{background-image:url("data:image/svg+xml;utf8,${svg}");background-size:cover}`
    this.styleSheets.insertRule(rule)
  }

  async addSVGMask(name, file) {
    const response = await fetch(`/resources/${file}.svg`)
    const svg = await response.text()
    const rule = `.mask-${name}{mask-image:url("data:image/svg+xml;utf8,${svg}");mask-size:cover;-webkit-mask-image:url("data:image/svg+xml;utf8,${svg}");-webkit-mask-size:cover}`
    this.styleSheets.insertRule(rule)
  }
}

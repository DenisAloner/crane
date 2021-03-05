export function lazyCSS(constructor, ...rules) {
  constructor.lazyCSS = `lazy-${constructor.name.replace('$', '')}`
  rules.forEach((rule) => {
    document.styleSheets[0].insertRule(`.${constructor.lazyCSS}${rule}`)
  })
  console.log(`create CSS ${constructor.lazyCSS}`)
}

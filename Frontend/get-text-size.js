const dom = document.querySelector('#measureText')

export function getTextWidth(text, fontSize) {
  dom.style.fontSize = fontSize
  dom.textContent = text
  return dom.clientWidth
}

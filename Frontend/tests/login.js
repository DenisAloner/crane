const { chromium } = require('playwright');
// const fetch = require('node-fetch');

(async () => {
  const browserWSEndpoint = 'ws://127.0.0.1:9222/devtools/browser/40d53440-5b1b-4bdf-a271-e58dfec7da3c'
  // await fetch('http://127.0.0.1:9222/json/version')
  //   .then(response => response.json())
  //   .then(function (data) {
  //     browserWSEndpoint = data.webSocketDebuggerUrl
  //   })
  //   .catch(error => console.log(error))
  try {
    const browser = await chromium.connect({ browserWSEndpoint, defaultViewport: null, args: ['--start-maximized'] })
    const context = await browser.browserContexts()[0]
    const pages = await context.pages()
    let page
    pages.forEach(openedPage => {
      if (openedPage.url().includes(':49120/spa.html')) page = openedPage
    })
    await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded', 'load'] })
    console.log(page.url())
    await page.waitForSelector('id="username"')
    await page.click('id="username"')
    await page.keyboard.type('root')
    await page.waitForSelector('id="password"')
    await page.click('id="password"')
    await page.keyboard.type('12345')
    await page.waitForSelector('text="Вход"')
    await page.click('text="Вход"')
    const sideMenu = await page.$('div[style*="background-image: url("][style*="/resources/logo.svg"]')
    await sideMenu.click()
    await page.evaluate(() => {
      document.querySelector('text="Перемещение"').click()
    })
    await sideMenu.click()
  } catch (error) {
    console.log(error)
  }
})()

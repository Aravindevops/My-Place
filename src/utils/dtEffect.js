const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+'

export function dtInit(el) {
  if (!el) return null

  // Ensure original text is cached and never lost
  if (!el.dataset.origText) {
    el.dataset.origText = el.textContent.trim()
  }
  const text = el.dataset.origText
  if (!text) return null

  // If already initialized on this element, return existing runner
  if (el._dtRun) {
    return { run: el._dtRun, reset: el._dtReset }
  }

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.setAttribute('aria-label', text)
  el.textContent = ''

  const letters = []
  ;[...text].forEach(ch => {
    if (ch === ' ') {
      el.append(' ')
      return
    }
    const c = document.createElement('span')
    const gh = document.createElement('span')
    const g = document.createElement('span')
    c.className = 'c' // Clean, not scrambled initially
    c.setAttribute('aria-hidden', 'true')
    gh.className = 'gh'
    gh.textContent = ch
    g.className = 'g'
    g.textContent = POOL[Math.floor(Math.random() * POOL.length)]
    c.append(gh, g)
    el.append(c)
    letters.push({ c, gh, g, char: ch })
  })

  let timer = null

  const resetToReadable = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    letters.forEach(item => {
      item.c.classList.remove('s')
    })
  }

  const run = () => {
    if (calm) {
      resetToReadable()
      return
    }
    if (timer) clearInterval(timer)

    let step = 0

    // Scramble initially
    letters.forEach(item => {
      item.c.classList.add('s')
      item.g.textContent = POOL[Math.floor(Math.random() * POOL.length)]
    })

    timer = setInterval(() => {
      step++
      // Start resolving letters from left to right after 4 ticks
      const resolvedCount = Math.max(0, step - 4)

      letters.forEach((item, idx) => {
        if (idx < resolvedCount) {
          item.c.classList.remove('s')
        } else {
          item.c.classList.add('s')
          item.g.textContent = POOL[Math.floor(Math.random() * POOL.length)]
        }
      })

      if (resolvedCount >= letters.length) {
        clearInterval(timer)
        timer = null
        resetToReadable()
      }
    }, 28)
  }

  // Hover triggers the scramble & reveal animation
  el.addEventListener('mouseenter', run)

  el._dtRun = run
  el._dtReset = resetToReadable

  return { run, reset: resetToReadable }
}

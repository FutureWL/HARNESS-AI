const buttons = Array.from(document.querySelectorAll('[data-copy]'))

function toast(text) {
  const el = document.createElement('div')
  el.className = 'toast'
  el.textContent = text
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  window.setTimeout(() => {
    el.classList.remove('show')
    window.setTimeout(() => el.remove(), 220)
  }, 1300)
}

function resolveCode(key) {
  if (key === 'dev') return document.getElementById('code-dev')
  if (key === 'pkg') return document.getElementById('code-pkg')
  if (key === 'docker') return document.getElementById('code-docker')
  if (key === 'content') return document.getElementById('code-content')
  return null
}

for (const btn of buttons) {
  btn.addEventListener('click', async () => {
    const key = btn.getAttribute('data-copy')
    const node = resolveCode(key)
    const value = node?.textContent?.trim() || ''
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toast('已复制')
    } catch {
      toast('复制失败')
    }
  })
}

for (const a of Array.from(document.querySelectorAll('a[href^="#"]'))) {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href')
    if (!href || href === '#') return
    const id = href.slice(1)
    const target = document.getElementById(id)
    if (!target) return
    e.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    history.replaceState(null, '', href)
  })
}


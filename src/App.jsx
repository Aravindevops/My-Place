import { useState, useEffect, useRef, useCallback } from 'react'
import Loader from './components/Loader.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Work from './components/Work.jsx'
import Contact from './components/Contact.jsx'
import Menu from './components/Menu.jsx'
import MoreAbout from './components/MoreAbout.jsx'
import AllWork from './components/AllWork.jsx'
import Play from './components/Play.jsx'

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [go, setGo] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [allWorkOpen, setAllWorkOpen] = useState(false)
  const [playOpen, setPlayOpen] = useState(false)
  const curRef = useRef(null)

  // Lock body scroll on overlays
  useEffect(() => {
    const lock = menuOpen || moreOpen || allWorkOpen || playOpen
    document.body.classList.toggle('lock', lock)
    document.body.classList.toggle('menu-open', menuOpen)
  }, [menuOpen, moreOpen, allWorkOpen, playOpen])

  // Custom cursor
  useEffect(() => {
    const cur = curRef.current
    if (!cur) return
    let mx = 0, my = 0, cx = 0, cy = 0
    function onMove(e) { mx = e.clientX; my = e.clientY }
    window.addEventListener('pointermove', onMove)
    let raf
    function loop() {
      cx += (mx - cx) * 0.18
      cy += (my - cy) * 0.18
      cur.style.transform = `translate(${cx - 11}px, ${cy - 11}px)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    // Action cursor on interactive elements
    function addBig(e) { cur.classList.add('big') }
    function removeBig(e) { cur.classList.remove('big') }
    function onDown() { cur.classList.add('clicking') }
    function onUp() { cur.classList.remove('clicking') }

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)

    const sel = 'a, button, .row span, .photo, .wcard, .flex-carousel, .dt, .dx, .pc, .gi, .bk4'
    function attach() {
      document.querySelectorAll(sel).forEach(el => {
        el.addEventListener('pointerenter', addBig)
        el.addEventListener('pointerleave', removeBig)
      })
    }
    attach()
    const mo = new MutationObserver(attach)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      cancelAnimationFrame(raf)
      mo.disconnect()
    }
  }, [])

  const handleLoaderDone = useCallback(() => {
    setLoaded(true)
    document.body.classList.remove('lock')
    setTimeout(() => { setGo(true); document.body.classList.add('go') }, 500)
  }, [])

  const openMenu = useCallback(() => setMenuOpen(true), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const openMore = useCallback(() => setMoreOpen(true), [])
  const closeMore = useCallback(() => setMoreOpen(false), [])
  const openAllWork = useCallback(() => setAllWorkOpen(true), [])
  const closeAllWork = useCallback(() => setAllWorkOpen(false), [])
  const openPlay = useCallback(() => setPlayOpen(true), [])
  const closePlay = useCallback(() => setPlayOpen(false), [])

  return (
    <>
      <div className="cursor" ref={curRef} />
      <Loader onDone={handleLoaderDone} />

      <MoreAbout open={moreOpen} onClose={closeMore} />
      <Menu open={menuOpen} onClose={closeMenu} onPlayOpen={openPlay} />
      <AllWork open={allWorkOpen} onClose={closeAllWork} />
      <Play open={playOpen} onClose={closePlay} />

      <Hero go={go} onMenuOpen={openMenu} />
      <About onMoreOpen={openMore} />
      <Work onAllWorkOpen={openAllWork} />
      <Contact onPlayOpen={openPlay} />
    </>
  )
}


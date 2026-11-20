import { useEffect, useRef } from 'react'

export default function MoreAbout({ open, onClose }) {
  const rvRefs = useRef([])

  // Animate reveal items when open
  useEffect(() => {
    const el = document.getElementById('more-about-panel')
    if (!el) return
    if (open) {
      el.scrollTop = 0
      setTimeout(() => {
        const rvs = el.querySelectorAll('.rv')
        const io = new IntersectionObserver(es =>
          es.forEach(e => e.isIntersecting && e.target.classList.add('in')),
          { root: el, threshold: 0.15 })
        rvs.forEach(r => { r.classList.remove('in'); io.observe(r) })
        document.getElementById('mback')?.focus({ preventScroll: true })
      }, 450)
    } else {
      setTimeout(() => {
        el.querySelectorAll('.rv').forEach(r => r.classList.remove('in'))
      }, 900)
    }
  }, [open])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && open) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      className={`more${open ? ' open' : ''}`}
      id="more-about-panel"
      aria-hidden={!open}
      role="dialog"
      aria-label="More about me"
    >
      <div className="mtop">
        <span>AB</span>
        <button className="back" id="mback" onClick={onClose}>← Back</button>
      </div>
      <div className="mwrap">
        <h2 className="mh rv">More<br />about me</h2>
        <div className="mgrid">
          {/* Drop your photo at public/profile.jpg */}
          <img
            className="mpic rv"
            src="/profile.jpg"
            alt="Portrait of Aravind Babu"
            onError={e => { e.target.style.background = 'linear-gradient(135deg,#4f63ff,#2535d0)'; e.target.style.aspectRatio='320/380' }}
          />
          <div className="mtxt rv">
            <p>I'm Aravind, a full stack developer and designer based in Kochi, Kerala.</p>
            <p>I like projects where the code and the design are made together, so what looks good also works well, and feels good to use.</p>
            <p>Most days I move between sketching interfaces, building them and wiring up everything behind them.</p>
          </div>
        </div>

        <div className="mrow rv">
          <h3>What I do</h3>
          <div>
            <div className="it">
              <b>Full stack development</b>
              <span>From the front end to the back end: fast, accessible web apps and the APIs behind them.</span>
            </div>
            <div className="it">
              <b>Web design (UI/UX)</b>
              <span>Layouts, flows and interfaces shaped around how people actually use them.</span>
            </div>
            <div className="it">
              <b>Graphic design</b>
              <span>Bold type, strong colour and identities, like the AB mark.</span>
            </div>
          </div>
        </div>

        <div className="mrow rv">
          <h3>Off the keyboard</h3>
          <div>
            <div className="it">
              <b>Travel</b>
              <span>Always plotting the next adventure.</span>
            </div>
            <div className="it">
              <b>New hobbies</b>
              <span>Trying things I have absolutely no business trying.</span>
            </div>
            <div className="it">
              <b>Anime &amp; movies</b>
              <span>Passionately defending favourite arcs and plot twists.</span>
            </div>
          </div>
        </div>

        <div className="mcta rv">
          <p>Let's build something</p>
          <a href="mailto:aravindbabu.0001@gmail.com">aravindbabu.0001@gmail.com</a>
        </div>
      </div>
    </div>
  )
}


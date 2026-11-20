import { useEffect, useRef } from 'react'

const BIO_TEXT = `Hello! I am a developer and designer who thrives on a dangerous mix of caffeine and curiosity. I specialize in building digital experiences that actually make people want to click, scroll, and stay a while. When I am away from my keyboard, you can usually find me plotting my next travel adventure, attempting a random new hobby I have absolutely no business trying, or passionately defending my favorite anime arcs and movie plot twists. I take my work incredibly seriously, but I try never to take myself too seriously. Let's build something that makes the internet a slightly cooler place.`

const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function About({ onMoreOpen }) {
  const bioRef = useRef(null)
  const abRef = useRef(null)
  const mbtnRef = useRef(null)

  useEffect(() => {
    const bio = bioRef.current
    const ab = abRef.current
    const mbtn = mbtnRef.current
    if (!bio || !ab || !mbtn) return

    // Build word spans
    bio.innerHTML = BIO_TEXT.trim().split(/\s+/).map(w => `<span class="wd">${w}</span>`).join(' ')
    const wds = [...bio.children]
    let ap = 0, lp = -1

    function aloop() {
      const r = ab.getBoundingClientRect()
      const at = Math.min(Math.max(-r.top / (r.height - innerHeight), 0), 1)
      ap += (at - ap) * 0.12
      if (Math.abs(at - ap) < 0.0004) ap = at
      if (ap !== lp) {
        lp = ap
        const q = Math.min(ap / 0.82, 1)
        const n = wds.length
        wds.forEach((s, i) => {
          s.style.opacity = still ? 1 : (0.14 + 0.86 * Math.min(Math.max((q * (n + 8) - i) / 8, 0), 1))
        })
        const b = still ? 1 : Math.min(Math.max((q - 0.92) / 0.08, 0), 1)
        mbtn.style.opacity = b
        mbtn.style.pointerEvents = b > 0.5 ? 'auto' : 'none'
      }
      requestAnimationFrame(aloop)
    }
    aloop()
  }, [])

  return (
    <section className="about" id="about" ref={abRef}>
      <div className="stick">
        <span className="lab">(About me)</span>
        <div className="col">
          <p className="bio" ref={bioRef}>{BIO_TEXT}</p>
          <a className="mbtn" ref={mbtnRef} href="#more-about" onClick={e => { e.preventDefault(); onMoreOpen() }}>
            <span>More about me</span><i>→</i>
          </a>
        </div>
      </div>
    </section>
  )
}


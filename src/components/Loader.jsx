import { useEffect, useRef } from 'react'

export default function Loader({ onDone }) {
  const countRef = useRef(null)
  const loaderRef = useRef(null)

  useEffect(() => {
    const cnt = countRef.current
    const loader = loaderRef.current
    const D = 2800
    const t0 = performance.now()

    function tick(now) {
      const p = Math.min((now - t0) / D, 1)
      const e = 1 - Math.pow(1 - p, 3)
      const n = Math.round(e * 100)
      if (cnt) cnt.textContent = n + '%'
      if (p < 1) {
        requestAnimationFrame(tick)
      } else {
        setTimeout(() => {
          loader.classList.add('done')
          setTimeout(() => onDone(), 500)
        }, 350)
      }
    }
    requestAnimationFrame(tick)
  }, [onDone])

  return (
    <div id="loader" ref={loaderRef}>
      <svg className="loader-star" viewBox="0 0 100 100" aria-hidden="true">
        <path
          fill="#2535d0"
          d="M50 0l8 12 14-6 3 15 15 3-6 14 12 8-12 8 6 14-15 3-3 15-14-6-8 12-8-12-14 6-3-15-15-3 6-14L0 50l12-8-6-14 15-3 3-15 14 6z"
        />
      </svg>
      <div className="q tr">
        <b>"May the force be with you"</b>Star Wars - 1978
      </div>
      <div className="loader-mark" aria-hidden="true">AB</div>
      <div className="q tl">
        <b>"Get busy living or get busy dying."</b>The Shawshank Redemption - 1994
      </div>
      <div id="count" ref={countRef}>0%</div>
    </div>
  )
}


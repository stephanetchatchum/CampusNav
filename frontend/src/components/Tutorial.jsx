import { useState, useEffect, useRef } from 'react'

// First-run walkthrough. Each step points at a real element on the page
// rather than describing it, because the friend who tested this could not
// map instructions onto the interface. Steps whose target is missing are
// skipped automatically, so this never dead-ends on a screen where the
// element does not exist yet (no position set, not logged in, and so on).
const STEPS = [
  {
    sel: '[data-tut="search"]',
    title: 'Find a room',
    body: 'Type any room name here, like Djibouti or Vendors. Picking one takes the map straight to it, on the right floor.',
    speak: 'Type any room name here. Picking one takes the map straight to it.',
  },
  {
    sel: '[data-tut="setpos"]',
    title: 'Tell it where you are',
    body: 'The app cannot sense your position indoors, so you set it once. Tap here, then tap a purple dot near where you are standing.',
    speak: 'The app cannot sense where you are indoors, so you set it once. Tap here, then tap a purple dot near where you are standing.',
  },
  {
    sel: '[data-tut="map"]',
    title: 'Or scan a code',
    body: 'Faster still, find a CampusNav sticker on a wall and scan it with your phone camera. Your position is set instantly, no tapping.',
    speak: 'Faster still, scan a CampusNav sticker on the wall with your camera. Your position is set instantly.',
  },
  {
    sel: '[data-tut="map"]',
    title: 'Tap any room',
    body: 'Tap a room on the map to see whether it is free, and to start directions to it.',
    speak: 'Tap any room on the map to see if it is free, and to start directions.',
  },
  {
    sel: '[data-tut="voice"]',
    title: 'Turn on the voice',
    body: 'Spoken directions name what you can actually see, like turn right at the Vendors. Tap EN to switch to French.',
    speak: 'Spoken directions name what you can see around you. Tap E N to switch to French.',
  },
  {
    sel: '[data-tut="floors"]',
    title: 'Change floor',
    body: 'These switch floors. During navigation the floor changes on its own when you reach the stairs or the lift.',
    speak: 'These switch floors. During navigation the floor changes by itself at the stairs or the lift.',
  },
]

const STORAGE_KEY = 'cn_tutorial_done'

export default function Tutorial({ onClose, voiceLang = 'en', speakEnabled = true }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const [ready, setReady] = useState(false)
  const spokenRef = useRef(-1)

  const steps = STEPS
  const step = steps[i]

  // Measure the target each time the step changes, and keep measuring on
  // resize and scroll so the spotlight cannot drift away from its element.
  useEffect(() => {
    let raf
    const measure = () => {
      if (!step) return
      const el = document.querySelector(step.sel)
      if (!el) { setRect(null); setReady(true); return }
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) { setRect(null); setReady(true); return }
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      setReady(true)
    }
    measure()
    raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [i, step])

  // Bring the target into view before pointing at it, or the arrow ends up
  // aimed at something off screen.
  useEffect(() => {
    if (!step) return
    const el = document.querySelector(step.sel)
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [i, step])

  useEffect(() => {
    if (!step || !speakEnabled) return
    if (spokenRef.current === i) return
    spokenRef.current = i
    if (!window.speechSynthesis) return
    const u = new SpeechSynthesisUtterance(step.speak)
    u.lang = voiceLang === 'fr' ? 'fr-FR' : 'en-GB'
    u.rate = 0.97
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }, [i, step, speakEnabled, voiceLang])

  const finish = () => {
    window.speechSynthesis && window.speechSynthesis.cancel()
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* private mode */ }
    onClose && onClose()
  }

  const next = () => { if (i >= steps.length - 1) finish(); else setI(i + 1) }
  const back = () => setI(Math.max(0, i - 1))

  if (!step || !ready) return null

  const pad = 8
  const hole = rect ? {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  } : null

  // Card sits below the target when there is room, otherwise above.
  const below = hole ? hole.top + hole.height + 150 < window.innerHeight : true
  const cardTop = hole ? (below ? hole.top + hole.height + 16 : Math.max(12, hole.top - 168)) : window.innerHeight / 2 - 90

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      {/* Four panels around the target instead of one overlay with a hole,
          so the highlighted element stays fully interactive underneath. */}
      {hole ? (
        <>
          <div onClick={next} style={{ position: 'fixed', left: 0, top: 0, right: 0, height: Math.max(0, hole.top), background: 'rgba(15,23,42,0.72)' }} />
          <div onClick={next} style={{ position: 'fixed', left: 0, top: hole.top + hole.height, right: 0, bottom: 0, background: 'rgba(15,23,42,0.72)' }} />
          <div onClick={next} style={{ position: 'fixed', left: 0, top: hole.top, width: Math.max(0, hole.left), height: hole.height, background: 'rgba(15,23,42,0.72)' }} />
          <div onClick={next} style={{ position: 'fixed', left: hole.left + hole.width, top: hole.top, right: 0, height: hole.height, background: 'rgba(15,23,42,0.72)' }} />
          <div style={{
            position: 'fixed', top: hole.top, left: hole.left, width: hole.width, height: hole.height,
            border: '3px solid #facc15', borderRadius: 10, pointerEvents: 'none',
            boxShadow: '0 0 0 3px rgba(250,204,21,0.25)',
          }} />
        </>
      ) : (
        <div onClick={next} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.72)' }} />
      )}

      {/* Arrow, pointing from the card toward the highlighted element. */}
      {hole && (
        <svg width="34" height="26" style={{
          position: 'fixed',
          left: Math.min(window.innerWidth - 60, Math.max(20, hole.left + hole.width / 2 - 17)),
          top: below ? cardTop - 24 : hole.top + hole.height + 6,
          transform: below ? 'rotate(180deg)' : 'none',
          pointerEvents: 'none',
        }} viewBox="0 0 34 26">
          <path d="M17 26 L2 4 Q17 12 32 4 Z" fill="#facc15" />
        </svg>
      )}

      <div style={{
        position: 'fixed',
        top: cardTop,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(340px, calc(100vw - 32px))',
        background: 'white',
        borderRadius: 14,
        padding: '16px 18px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', color: '#8B0000', textTransform: 'uppercase' }}>
            Step {i + 1} of {steps.length}
          </span>
          <button onClick={finish} style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            Skip
          </button>
        </div>

        <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 5 }}>{step.title}</div>
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.55 }}>{step.body}</div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, flex: 1 }}>
            {steps.map((_, k) => (
              <span key={k} style={{
                width: k === i ? 16 : 6, height: 6, borderRadius: 3,
                background: k === i ? '#8B0000' : '#e2e8f0', transition: 'width .2s',
              }} />
            ))}
          </div>
          {i > 0 && (
            <button onClick={back} style={{
              padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: 'white', color: '#475569', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
            }}>Back</button>
          )}
          <button onClick={next} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none',
            background: '#8B0000', color: 'white', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
          }}>{i === steps.length - 1 ? 'Done' : 'Next'}</button>
        </div>
      </div>
    </div>
  )
}

export const tutorialSeen = () => {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return true }
}
export const resetTutorial = () => {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}
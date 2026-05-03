import Head from 'next/head'
import { useEffect, useRef, useState, useCallback } from 'react'

const TIERS = [
  { max: 200,      rank: 'GODLIKE ⚡', color: '#00eeff', glow: true,  confetti: 150 },
  { max: 250,      rank: 'ELITE 🎯',   color: '#00ff88', glow: true,  confetti: 80  },
  { max: 320,      rank: 'HUMAN 🏃',   color: '#ffffff', glow: false, confetti: 0   },
  { max: 450,      rank: 'SLOW 🐢',    color: '#ffe500', glow: false, confetti: 0   },
  { max: Infinity, rank: 'ZOMBIE 🧟',  color: '#ff2d2d', glow: false, confetti: 0   },
]

function getTier(ms) { return TIERS.find(t => ms < t.max) }
function getChaseText(ms) {
  const idx = TIERS.findIndex(t => ms < t.max)
  if (idx === 0) return "you're untouchable 👁️"
  return `${ms - TIERS[idx - 1].max}ms from ${TIERS[idx - 1].rank}`
}

export async function getServerSideProps({ query }) {
  const score = query.score || null
  const rank = query.rank || null
  return { props: { score, rank } }
}

export default function Home({ score, rank }) {
  const [state, setState] = useState('IDLE')
  const [result, setResult] = useState(null)
  const [pb, setPb] = useState(null)
  const [isNewPb, setIsNewPb] = useState(false)
  const [sdk, setSdk] = useState(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const isMobile = useRef(false)

  useEffect(() => {
    isMobile.current = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const saved = parseInt(localStorage.getItem('rfx_pb'))
    if (!isNaN(saved)) setPb(saved)

    import('https://esm.sh/@farcaster/miniapp-sdk').then(({ sdk }) => {
      sdk.actions.ready()
      setSdk(sdk)
    }).catch(() => {})
  }, [])

  const startWaiting = useCallback(() => {
    setState('WAITING')
    setResult(null)
    setIsNewPb(false)
    const delay = Math.random() * 3500 + 1800
    timerRef.current = setTimeout(() => {
      startTimeRef.current = performance.now()
      setState('GO')
    }, delay)
  }, [])

  const handleEarly = useCallback(() => {
    clearTimeout(timerRef.current)
    setState('EARLY')
    setTimeout(() => setState('IDLE'), 1100)
  }, [])

  const recordResult = useCallback(() => {
    const end = performance.now()
    let diff = Math.round(end - startTimeRef.current)
    if (isMobile.current) diff = Math.max(0, diff - 15)

    const tier = getTier(diff)
    setResult({ ms: diff, tier })

    const saved = parseInt(localStorage.getItem('rfx_pb'))
    if (isNaN(saved) || diff < saved) {
      localStorage.setItem('rfx_pb', diff)
      setPb(diff)
      setIsNewPb(true)
    }

    if (tier.confetti > 0 && typeof window !== 'undefined' && window.confetti) {
      window.confetti({ particleCount: tier.confetti, spread: 70, origin: { y: 0.45 } })
    }
    if (tier.confetti > 0 && navigator.vibrate) {
      navigator.vibrate(tier.confetti > 100 ? [80, 40, 80, 40, 120] : [60])
    }

    setState('RESULT')

    if (diff < 250 && sdk) {
      setTimeout(() => sdk.actions.addMiniApp(), 900)
    }
  }, [sdk])

  const handleZoneTap = useCallback((e) => {
    e.stopPropagation()
    if (state === 'WAITING') handleEarly()
    else if (state === 'GO') recordResult()
  }, [state, handleEarly, recordResult])

  const handleMainBtn = useCallback(() => {
    if (state === 'IDLE' || state === 'RESULT' || state === 'EARLY') startWaiting()
    else if (state === 'GO') recordResult()
  }, [state, startWaiting, recordResult])

  const share = useCallback(() => {
    if (!result) return
    const ms = result.ms + 'ms'
    const rankStr = result.tier.rank
    const pbLine = pb ? ` (pb: ${pb}ms)` : ''
    const text = `${rankStr} — ${ms}${pbLine}\n\nthink you can beat me? ⚡`
    const shareUrl = `https://reflex-gold.vercel.app?score=${encodeURIComponent(ms)}&rank=${encodeURIComponent(rankStr)}`
    if (sdk) {
      sdk.actions.composeCast({ text, embeds: [shareUrl] })
    } else {
      navigator.clipboard?.writeText(text)
        .then(() => alert('Score copied to clipboard!'))
        .catch(() => alert(text))
    }
  }, [result, pb, sdk])

  const zoneClass = { IDLE: '', WAITING: 'state-ready', GO: 'state-go', EARLY: 'state-fail', RESULT: '' }[state] || ''
  const mainBtnLabel = { IDLE: 'START', WAITING: 'WAITING...', GO: 'TAP!', EARLY: 'START', RESULT: 'CAST MY SCORE' }[state] || 'START'
  const mainBtnClass = state === 'GO' ? 'btn-primary go-btn' : 'btn-primary'
  const mainBtnDisabled = state === 'WAITING'

  const ogImage = `https://reflex-gold.vercel.app/api/og${score && rank ? `?score=${encodeURIComponent(score)}&rank=${encodeURIComponent(rank)}` : ''}`

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <meta property="og:title" content="REFLEX — How fast are you?" />
        <meta property="og:description" content="Tap when it goes green. Simple. Brutal." />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content="https://reflex-gold.vercel.app" />
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content={ogImage} />
        <meta name="fc:frame:button:1" content="Test Your Reflex" />
        <meta name="fc:frame:post_url" content="https://reflex-gold.vercel.app" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js" />
        <title>REFLEX</title>
        <style>{`
          :root { --black: #000; --white: #fff; --green: #00ff88; --red: #ff2d2d; --yellow: #ffe500; --cyan: #00eeff; --mid: #1e1e1e; --muted: #444; --text-muted: #555; }
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html, body { height: 100%; }
          body { background: var(--black); color: var(--white); font-family: 'DM Mono', monospace; height: 100dvh; display: flex; justify-content: center; overflow: hidden; touch-action: manipulation; user-select: none; }
          body::after { content: ''; position: fixed; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px); pointer-events: none; z-index: 100; }
          #__next { width: 100%; display: flex; justify-content: center; }
          .app { width: 100%; max-width: 390px; display: flex; flex-direction: column; height: 100dvh; }
          header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 16px; border-bottom: 1px solid var(--mid); flex-shrink: 0; }
          .logo { font-family: 'Bebas Neue', sans-serif; font-size: 2.2rem; letter-spacing: 6px; line-height: 1; }
          .pb-display { text-align: right; }
          .pb-label { font-size: 0.58rem; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 2px; }
          .pb-value { font-size: 1rem; font-weight: 500; letter-spacing: 1px; }
          .pb-value.empty { color: var(--muted); }
          .game-zone { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; position: relative; overflow: hidden; transition: background 0.07s; min-height: 0; }
          .corner { position: absolute; width: 36px; height: 36px; transition: border-color 0.1s; }
          .corner.tl { top: 20px; left: 20px; border-top: 2px solid var(--mid); border-left: 2px solid var(--mid); }
          .corner.br { bottom: 20px; right: 20px; border-bottom: 2px solid var(--mid); border-right: 2px solid var(--mid); }
          .flash { position: absolute; inset: 0; opacity: 0; transition: opacity 0.07s; pointer-events: none; }
          .game-zone.state-ready .flash { background: rgba(124,101,193,0.09); opacity: 1; }
          .game-zone.state-ready .corner { border-color: rgba(124,101,193,0.5); }
          .game-zone.state-go .flash { background: rgba(0,255,136,0.1); opacity: 1; }
          .game-zone.state-go .corner { border-color: var(--green); }
          .game-zone.state-fail .flash { background: rgba(255,45,45,0.13); opacity: 1; }
          .game-zone.state-fail .corner { border-color: var(--red); }
          .pulse-ring { position: absolute; width: 100px; height: 100px; border-radius: 50%; border: 1px solid rgba(124,101,193,0.35); opacity: 0; pointer-events: none; }
          .game-zone.state-ready .pulse-ring { animation: ringPulse 1.3s ease-out infinite; }
          @keyframes ringPulse { 0% { transform: scale(0.7); opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; } }
          .idle-screen { text-align: center; pointer-events: none; }
          .main-text { font-family: 'Bebas Neue', sans-serif; font-size: 5rem; letter-spacing: 4px; line-height: 1.05; }
          .game-zone.state-go .main-text { color: var(--black); text-shadow: 0 0 60px rgba(0,255,136,0.4); }
          .sub-text { font-size: 0.7rem; letter-spacing: 3px; color: var(--text-muted); margin-top: 14px; text-transform: uppercase; }
          .game-zone.state-go .sub-text { color: rgba(0,0,0,0.5); }
          .result-screen { text-align: center; pointer-events: none; animation: popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; padding: 0 24px; width: 100%; }
          @keyframes popIn { from { transform: scale(0.82) translateY(8px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
          .res-time { font-family: 'Bebas Neue', sans-serif; font-size: 7.5rem; line-height: 1; letter-spacing: -2px; }
          .res-rank { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; letter-spacing: 5px; margin-top: 4px; }
          .res-chase { font-size: 0.65rem; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; margin-top: 10px; min-height: 14px; }
          .pb-badge { display: inline-block; font-size: 0.62rem; letter-spacing: 2px; text-transform: uppercase; border: 1px solid var(--white); padding: 4px 14px; border-radius: 2px; margin-top: 16px; }
          .ticker { position: absolute; bottom: 14px; left: 0; right: 0; text-align: center; font-size: 0.58rem; letter-spacing: 3px; color: var(--mid); text-transform: uppercase; pointer-events: none; }
          .action-bar { padding: 18px 24px 28px; border-top: 1px solid var(--mid); display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
          .btn-primary { background: var(--white); color: var(--black); border: none; padding: 18px; border-radius: 3px; font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; letter-spacing: 4px; cursor: pointer; transition: transform 0.1s, background 0.1s; width: 100%; }
          .btn-primary:active { transform: scale(0.97); }
          .btn-primary:disabled { opacity: 0.4; cursor: default; }
          .btn-primary.go-btn { background: var(--green); }
          .btn-ghost { background: none; color: var(--muted); border: 1px solid var(--mid); padding: 13px; border-radius: 3px; font-family: 'DM Mono', monospace; font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: color 0.15s, border-color 0.15s; width: 100%; }
          .btn-ghost:active { color: var(--white); border-color: var(--muted); }
        `}</style>
      </Head>

      <div className="app">
        <header>
          <div className="logo">REFLEX</div>
          <div className="pb-display">
            <span className="pb-label">personal best</span>
            <span className={`pb-value${pb ? '' : ' empty'}`}>{pb ? `${pb}ms` : '—'}</span>
          </div>
        </header>

        <div className={`game-zone ${zoneClass}`} onPointerDown={handleZoneTap}>
          <div className="flash" />
          <div className="pulse-ring" />
          <div className="corner tl" />
          <div className="corner br" />

          {state !== 'RESULT' ? (
            <div className="idle-screen">
              <div className="main-text">
                {state === 'IDLE' && <>TAP TO<br />START</>}
                {state === 'WAITING' && <>READY<br />...</>}
                {state === 'GO' && <>NOW!</>}
                {state === 'EARLY' && <>TOO<br />SOON</>}
              </div>
              <div className="sub-text">
                {state === 'IDLE' && 'VAULT REFLEX TEST'}
                {state === 'WAITING' && 'WAIT FOR IT'}
                {state === 'GO' && 'TAP!'}
                {state === 'EARLY' && 'calm down'}
              </div>
            </div>
          ) : result && (
            <div className="result-screen">
              <div className="res-time" style={{ color: result.tier.color }}>{result.ms}ms</div>
              <div className="res-rank" style={{
                color: result.tier.color,
                textShadow: result.tier.glow ? `0 0 40px ${result.tier.color}88` : 'none'
              }}>{result.tier.rank}</div>
              <div className="res-chase">{getChaseText(result.ms)}</div>
              {isNewPb && <div className="pb-badge">🏆 new personal best</div>}
            </div>
          )}

          <div className="ticker">
            {state === 'IDLE' && 'tap anywhere to start'}
            {state === 'WAITING' && "don't tap yet"}
            {state === 'EARLY' && 'calm down...'}
          </div>
        </div>

        <div className="action-bar">
          <button
            className={mainBtnClass}
            disabled={mainBtnDisabled}
            onClick={state === 'RESULT' ? share : handleMainBtn}
          >
            {mainBtnLabel}
          </button>
          {state === 'RESULT' && (
            <button className="btn-ghost" onClick={startWaiting}>
              TRY AGAIN
            </button>
          )}
        </div>
      </div>
    </>
  )
}

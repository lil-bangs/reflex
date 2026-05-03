import Head from 'next/head'
import { useEffect, useRef, useState, useCallback } from 'react'

const TIERS = [
  { max: 200,      rank: 'GODLIKE ⚡', color: '#00eeff', glow: true,  confettiCount: 150 },
  { max: 250,      rank: 'ELITE 🎯',   color: '#00ff88', glow: true,  confettiCount: 80  },
  { max: 320,      rank: 'HUMAN 🏃',   color: '#ffffff', glow: false, confettiCount: 0   },
  { max: 450,      rank: 'SLOW 🐢',    color: '#ffe500', glow: false, confettiCount: 0   },
  { max: Infinity, rank: 'ZOMBIE 🧟',  color: '#ff2d2d', glow: false, confettiCount: 0   },
]

function getTier(ms) {
  return TIERS.find(t => ms < t.max)
}

function getChaseText(ms) {
  const idx = TIERS.findIndex(t => ms < t.max)
  if (idx === 0) return "you're untouchable 👁️"
  const gap = ms - TIERS[idx - 1].max
  return `${gap}ms from ${TIERS[idx - 1].rank}`
}

export async function getServerSideProps({ query }) {
  return {
    props: {
      ogScore: query.score || null,
      ogRank: query.rank || null,
    }
  }
}

export default function Home({ ogScore, ogRank }) {
  const [gameState, setGameState] = useState('IDLE') // IDLE | WAITING | GO | EARLY | RESULT
  const [result, setResult] = useState(null)         // { ms, tier }
  const [pb, setPb] = useState(null)
  const [isNewPb, setIsNewPb] = useState(false)
  const [farcasterSdk, setFarcasterSdk] = useState(null)

  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const isMobileRef = useRef(false)

  // Init
  useEffect(() => {
    isMobileRef.current = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const saved = parseInt(localStorage.getItem('rfx_pb'))
    if (!isNaN(saved)) setPb(saved)
import('@farcaster/miniapp-sdk')
      .then(({ sdk }) => {
        sdk.actions.ready()
        setFarcasterSdk(sdk)
      })
      .catch(() => {})
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const startWaiting = useCallback(() => {
    clearTimeout(timerRef.current)
    setResult(null)
    setIsNewPb(false)
    setGameState('WAITING')

    const delay = Math.random() * 3500 + 1800
    timerRef.current = setTimeout(() => {
      startTimeRef.current = performance.now()
      setGameState('GO')
    }, delay)
  }, [])

  const handleEarly = useCallback(() => {
    clearTimeout(timerRef.current)
    setGameState('EARLY')
    if (navigator.vibrate) navigator.vibrate([25, 25, 25])
    setTimeout(() => setGameState('IDLE'), 1100)
  }, [])

  const recordResult = useCallback(() => {
    if (!startTimeRef.current) return
    const end = performance.now()
    let diff = Math.round(end - startTimeRef.current)
    if (isMobileRef.current) diff = Math.max(0, diff - 15)

    const tier = getTier(diff)
    setResult({ ms: diff, tier })

    // Personal best
    const saved = parseInt(localStorage.getItem('rfx_pb'))
    if (isNaN(saved) || diff < saved) {
      localStorage.setItem('rfx_pb', diff)
      setPb(diff)
      setIsNewPb(true)
    }

    // Confetti + haptics
    if (tier.confettiCount > 0) {
      if (typeof window !== 'undefined' && window.confetti) {
        window.confetti({ particleCount: tier.confettiCount, spread: 70, origin: { y: 0.45 } })
      }
      if (navigator.vibrate) {
        navigator.vibrate(tier.confettiCount > 100 ? [80, 40, 80, 40, 120] : [60])
      }
    }

    setGameState('RESULT')

    // Prompt to save app at peak dopamine
    if (diff < 250 && farcasterSdk) {
      setTimeout(() => farcasterSdk.actions.addMiniApp(), 900)
    }
  }, [farcasterSdk])

  const handleZoneTap = useCallback((e) => {
    e.stopPropagation()
    if (gameState === 'WAITING') handleEarly()
    else if (gameState === 'GO') recordResult()
  }, [gameState, handleEarly, recordResult])

  const handleMainBtn = useCallback(() => {
    if (gameState === 'IDLE' || gameState === 'EARLY') startWaiting()
    else if (gameState === 'GO') recordResult()
    else if (gameState === 'RESULT') share()
  }, [gameState, startWaiting, recordResult])

  const share = useCallback(() => {
    if (!result) return
    const ms = `${result.ms}ms`
    const rank = result.tier.rank
    const pbLine = pb ? ` (pb: ${pb}ms)` : ''
    const text = `${rank} — ${ms}${pbLine}\n\nthink you can beat me? ⚡`
    const shareUrl = `https://reflex-gold.vercel.app?score=${encodeURIComponent(ms)}&rank=${encodeURIComponent(rank)}`

    if (farcasterSdk) {
      farcasterSdk.actions.composeCast({ text, embeds: [shareUrl] })
    } else {
      navigator.clipboard?.writeText(text)
        .then(() => alert('Score copied!'))
        .catch(() => alert(text))
    }
  }, [result, pb, farcasterSdk])

  // Derived UI state
  const zoneClass = {
    IDLE: '', WAITING: 'state-ready', GO: 'state-go', EARLY: 'state-fail', RESULT: ''
  }[gameState] || ''

  const mainBtnText = {
    IDLE: 'START', WAITING: 'WAITING...', GO: 'TAP!', EARLY: 'START', RESULT: 'CAST MY SCORE'
  }[gameState] || 'START'

  const ogImage = `https://reflex-gold.vercel.app/api/og${
    ogScore && ogRank
      ? `?score=${encodeURIComponent(ogScore)}&rank=${encodeURIComponent(ogRank)}`
      : ''
  }`

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
        <meta name="fc:frame:button:1" content="Test Your Reflex ⚡" />
        <meta name="fc:frame:post_url" content="https://reflex-gold.vercel.app" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js" />
        <title>REFLEX</title>
        <style>{`
          *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html, body, #__next { height: 100%; width: 100%; }
          body {
            background: #000;
            color: #fff;
            font-family: 'DM Mono', monospace;
            display: flex;
            justify-content: center;
            overflow: hidden;
            touch-action: manipulation;
            user-select: none;
            -webkit-user-select: none;
          }
          body::after {
            content: '';
            position: fixed;
            inset: 0;
            background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px);
            pointer-events: none;
            z-index: 999;
          }
          #__next { display: flex; justify-content: center; }
          .app {
            width: 100%;
            max-width: 430px;
            height: 100dvh;
            display: flex;
            flex-direction: column;
            position: relative;
          }

          /* ── Header ── */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 24px 14px;
            border-bottom: 1px solid #1a1a1a;
            flex-shrink: 0;
          }
          .logo {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 2.2rem;
            letter-spacing: 6px;
            line-height: 1;
            color: #fff;
          }
          .pb-wrap { text-align: right; }
          .pb-label { font-size: 0.55rem; color: #444; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 2px; }
          .pb-val { font-size: 0.95rem; font-weight: 500; letter-spacing: 1px; color: #fff; }
          .pb-val.empty { color: #333; }

          /* ── Game zone ── */
          .zone {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: background 0.07s;
          }
          .zone-flash {
            position: absolute;
            inset: 0;
            opacity: 0;
            transition: opacity 0.07s;
            pointer-events: none;
          }
          .zone.state-ready .zone-flash { background: rgba(124,101,193,0.09); opacity: 1; }
          .zone.state-go    .zone-flash { background: rgba(0,255,136,0.1);    opacity: 1; }
          .zone.state-fail  .zone-flash { background: rgba(255,45,45,0.13);   opacity: 1; }

          /* Corner brackets */
          .corner {
            position: absolute;
            width: 32px;
            height: 32px;
            transition: border-color 0.12s;
          }
          .corner.tl { top: 18px;    left: 18px;    border-top: 2px solid #1a1a1a;  border-left: 2px solid #1a1a1a; }
          .corner.br { bottom: 18px; right: 18px;   border-bottom: 2px solid #1a1a1a; border-right: 2px solid #1a1a1a; }
          .zone.state-ready .corner { border-color: rgba(124,101,193,0.5); }
          .zone.state-go    .corner { border-color: #00ff88; }
          .zone.state-fail  .corner { border-color: #ff2d2d; }

          /* Pulse ring */
          .pulse-ring {
            position: absolute;
            width: 90px; height: 90px;
            border-radius: 50%;
            border: 1px solid rgba(124,101,193,0.3);
            opacity: 0;
            pointer-events: none;
          }
          .zone.state-ready .pulse-ring { animation: ringPulse 1.4s ease-out infinite; }
          @keyframes ringPulse {
            0%   { transform: scale(0.7); opacity: 0.5; }
            100% { transform: scale(2.8); opacity: 0; }
          }

          /* ── Idle content ── */
          .idle-content { text-align: center; pointer-events: none; position: relative; z-index: 1; }
          .main-text {
            font-family: 'Bebas Neue', sans-serif;
            font-size: clamp(3.5rem, 12vw, 5.5rem);
            letter-spacing: 4px;
            line-height: 1.0;
            color: #fff;
            transition: color 0.07s, text-shadow 0.07s;
          }
          .zone.state-go .main-text { color: #000; text-shadow: 0 0 60px rgba(0,255,136,0.5); }
          .sub-text {
            font-size: 0.68rem;
            letter-spacing: 3px;
            color: #444;
            margin-top: 14px;
            text-transform: uppercase;
          }
          .zone.state-go .sub-text { color: rgba(0,0,0,0.45); }

          /* ── Result content ── */
          .result-content {
            text-align: center;
            pointer-events: none;
            position: relative;
            z-index: 1;
            padding: 0 28px;
            width: 100%;
            animation: popIn 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
          }
          @keyframes popIn {
            from { transform: scale(0.82) translateY(10px); opacity: 0; }
            to   { transform: scale(1)    translateY(0);    opacity: 1; }
          }
          .res-ms {
            font-family: 'Bebas Neue', sans-serif;
            font-size: clamp(5rem, 20vw, 7.5rem);
            line-height: 1;
            letter-spacing: -2px;
          }
          .res-rank {
            font-family: 'Bebas Neue', sans-serif;
            font-size: clamp(1.8rem, 6vw, 2.4rem);
            letter-spacing: 5px;
            margin-top: 4px;
          }
          .res-chase {
            font-size: 0.63rem;
            color: #444;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 10px;
            min-height: 14px;
          }
          .pb-badge {
            display: inline-block;
            font-size: 0.6rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            border: 1px solid #fff;
            padding: 4px 14px;
            border-radius: 2px;
            margin-top: 16px;
          }

          /* Ticker */
          .ticker {
            position: absolute;
            bottom: 14px;
            left: 0; right: 0;
            text-align: center;
            font-size: 0.55rem;
            letter-spacing: 3px;
            color: #222;
            text-transform: uppercase;
            pointer-events: none;
            z-index: 1;
          }

          /* ── Action bar ── */
          .action-bar {
            padding: 16px 24px 32px;
            border-top: 1px solid #1a1a1a;
            display: flex;
            flex-direction: column;
            gap: 10px;
            flex-shrink: 0;
          }
          .btn-main {
            background: #fff;
            color: #000;
            border: none;
            padding: 17px;
            border-radius: 3px;
            font-family: 'Bebas Neue', sans-serif;
            font-size: 1.45rem;
            letter-spacing: 4px;
            cursor: pointer;
            transition: transform 0.1s, background 0.1s, opacity 0.1s;
            width: 100%;
            -webkit-tap-highlight-color: transparent;
          }
          .btn-main:active:not(:disabled) { transform: scale(0.97); }
          .btn-main:disabled { opacity: 0.35; cursor: default; }
          .btn-main.go { background: #00ff88; }
          .btn-secondary {
            background: transparent;
            color: #444;
            border: 1px solid #1a1a1a;
            padding: 13px;
            border-radius: 3px;
            font-family: 'DM Mono', monospace;
            font-size: 0.72rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            cursor: pointer;
            transition: color 0.15s, border-color 0.15s;
            width: 100%;
            -webkit-tap-highlight-color: transparent;
          }
          .btn-secondary:active { color: #fff; border-color: #444; }
        `}</style>
      </Head>

      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="logo">REFLEX</div>
          <div className="pb-wrap">
            <span className="pb-label">personal best</span>
            <span className={`pb-val${pb ? '' : ' empty'}`}>
              {pb ? `${pb}ms` : '—'}
            </span>
          </div>
        </header>

        {/* Game zone */}
        <div className={`zone ${zoneClass}`} onPointerDown={handleZoneTap}>
          <div className="zone-flash" />
          <div className="pulse-ring" />
          <div className="corner tl" />
          <div className="corner br" />

          {gameState !== 'RESULT' ? (
            <div className="idle-content">
              <div className="main-text">
                {gameState === 'IDLE'    && <>TAP TO<br />START</>}
                {gameState === 'WAITING' && <>READY<br />...</>}
                {gameState === 'GO'      && <>NOW!</>}
                {gameState === 'EARLY'   && <>TOO<br />SOON</>}
              </div>
              <div className="sub-text">
                {gameState === 'IDLE'    && 'vault reflex test'}
                {gameState === 'WAITING' && 'wait for it'}
                {gameState === 'GO'      && 'tap!'}
                {gameState === 'EARLY'   && 'calm down...'}
              </div>
            </div>
          ) : result ? (
            <div className="result-content">
              <div className="res-ms" style={{ color: result.tier.color }}>
                {result.ms}ms
              </div>
              <div
                className="res-rank"
                style={{
                  color: result.tier.color,
                  textShadow: result.tier.glow ? `0 0 40px ${result.tier.color}88` : 'none',
                }}
              >
                {result.tier.rank}
              </div>
              <div className="res-chase">{getChaseText(result.ms)}</div>
              {isNewPb && <div className="pb-badge">🏆 new personal best</div>}
            </div>
          ) : null}

          <div className="ticker">
            {gameState === 'IDLE'    && 'tap anywhere to start'}
            {gameState === 'WAITING' && "don't tap yet"}
            {gameState === 'EARLY'   && 'too soon...'}
            {gameState === 'GO'      && ''}
            {gameState === 'RESULT'  && ''}
          </div>
        </div>

        {/* Action bar */}
        <div className="action-bar">
          <button
            className={`btn-main${gameState === 'GO' ? ' go' : ''}`}
            disabled={gameState === 'WAITING'}
            onClick={handleMainBtn}
          >
            {mainBtnText}
          </button>
          {gameState === 'RESULT' && (
            <button className="btn-secondary" onClick={startWaiting}>
              TRY AGAIN
            </button>
          )}
        </div>
      </div>
    </>
  )
}

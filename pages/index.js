import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <meta property="og:title" content="REFLEX — How fast are you?" />
        <meta property="og:description" content="Tap when it goes green. Simple. Brutal." />
        <meta property="og:image" content="https://reflex-gold.vercel.app/api/og" />
        <meta property="og:url" content="https://reflex-gold.vercel.app" />
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content="https://reflex-gold.vercel.app/api/og" />
        <meta name="fc:frame:button:1" content="Test Your Reflex" />
        <meta name="fc:frame:post_url" content="https://reflex-gold.vercel.app" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js" />
        <title>REFLEX</title>
        <style>{`
          :root { --black: #000; --white: #fff; --green: #00ff88; --red: #ff2d2d; --yellow: #ffe500; --cyan: #00eeff; --mid: #1e1e1e; --muted: #444; --text-muted: #555; }
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          body { background: var(--black); color: var(--white); font-family: 'DM Mono', monospace; height: 100dvh; display: flex; justify-content: center; overflow: hidden; touch-action: manipulation; user-select: none; }
          body::after { content: ''; position: fixed; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px); pointer-events: none; z-index: 100; }
          .app { width: 100%; max-width: 390px; display: flex; flex-direction: column; }
          header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 16px; border-bottom: 1px solid var(--mid); flex-shrink: 0; }
          .logo { font-family: 'Bebas Neue', sans-serif; font-size: 2.2rem; letter-spacing: 6px; line-height: 1; }
          .pb-display { text-align: right; }
          .pb-label { font-size: 0.58rem; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 2px; }
          .pb-value { font-size: 1rem; font-weight: 500; letter-spacing: 1px; }
          .pb-value.empty { color: var(--muted); }
          #gameZone { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; position: relative; overflow: hidden; transition: background 0.07s; }
          .corner { position: absolute; width: 36px; height: 36px; }
          .corner.tl { top: 20px; left: 20px; border-top: 2px solid var(--mid); border-left: 2px solid var(--mid); }
          .corner.br { bottom: 20px; right: 20px; border-bottom: 2px solid var(--mid); border-right: 2px solid var(--mid); }
          .flash { position: absolute; inset: 0; opacity: 0; transition: opacity 0.07s; pointer-events: none; }
          #gameZone.state-ready .flash { background: rgba(124,101,193,0.09); opacity: 1; }
          #gameZone.state-ready .corner { border-color: rgba(124,101,193,0.5); }
          #gameZone.state-go .flash { background: rgba(0,255,136,0.1); opacity: 1; }
          #gameZone.state-go .corner { border-color: var(--green); }
          #gameZone.state-fail .flash { background: rgba(255,45,45,0.13); opacity: 1; }
          #gameZone.state-fail .corner { border-color: var(--red); }
          .pulse-ring { position: absolute; width: 100px; height: 100px; border-radius: 50%; border: 1px solid rgba(124,101,193,0.35); opacity: 0; pointer-events: none; }
          #gameZone.state-ready .pulse-ring { animation: ringPulse 1.3s ease-out infinite; }
          @keyframes ringPulse { 0% { transform: scale(0.7); opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; } }
          #idleScreen { text-align: center; pointer-events: none; }
          .main-text { font-family: 'Bebas Neue', sans-serif; font-size: 5rem; letter-spacing: 4px; line-height: 1.05; transition: color 0.07s; }
          #gameZone.state-go .main-text { color: var(--black); text-shadow: 0 0 60px rgba(0,255,136,0.4); }
          .sub-text { font-size: 0.7rem; letter-spacing: 3px; color: var(--text-muted); margin-top: 14px; text-transform: uppercase; }
          #gameZone.state-go .sub-text { color: rgba(0,0,0,0.5); }
          #resultScreen { display: none; text-align: center; pointer-events: none; animation: popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; padding: 0 24px; width: 100%; }
          @keyframes popIn { from { transform: scale(0.82) translateY(8px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
          .res-time { font-family: 'Bebas Neue', sans-serif; font-size: 7.5rem; line-height: 1; letter-spacing: -2px; }
          .res-rank { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; letter-spacing: 5px; margin-top: 4px; }
          .res-chase { font-size: 0.65rem; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; margin-top: 10px; min-height: 14px; }
          .pb-badge { display: inline-block; font-size: 0.62rem; letter-spacing: 2px; text-transform: uppercase; border: 1px solid var(--white); padding: 4px 14px; border-radius: 2px; margin-top: 16px; opacity: 0; transform: translateY(5px); transition: opacity 0.3s 0.25s, transform 0.3s 0.25s; }
          .pb-badge.show { opacity: 1; transform: translateY(0); }
          #actionBar { padding: 18px 24px 28px; border-top: 1px solid var(--mid); display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
          .btn-primary { background: var(--white); color: var(--black); border: none; padding: 18px; border-radius: 3px; font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; letter-spacing: 4px; cursor: pointer; transition: transform 0.1s, background 0.1s; width: 100%; }
          .btn-primary:active { transform: scale(0.97); }
          .btn-primary:disabled { opacity: 0.4; cursor: default; }
          .btn-primary.go-btn { background: var(--green); }
          .btn-ghost { background: none; color: var(--muted); border: 1px solid var(--mid); padding: 13px; border-radius: 3px; font-family: 'DM Mono', monospace; font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: color 0.15s, border-color 0.15s; width: 100%; }
          .btn-ghost:active { color: var(--white); border-color: var(--muted); }
          .ticker { position: absolute; bottom: 14px; left: 0; right: 0; text-align: center; font-size: 0.58rem; letter-spacing: 3px; color: var(--mid); text-transform: uppercase; pointer-events: none; }
        `}</style>
      </Head>
      <div className="app">
        <header>
          <div className="logo">REFLEX</div>
          <div className="pb-display">
            <span className="pb-label">personal best</span>
            <span className="pb-value empty" id="pbValue">—</span>
          </div>
        </header>
        <div id="gameZone" onPointerDown="handleZoneTap(event)">
          <div className="flash"></div>
          <div className="pulse-ring"></div>
          <div className="corner tl"></div>
          <div className="corner br"></div>
          <div id="idleScreen">
            <div className="main-text" id="mainText">TAP TO<br/>START</div>
            <div className="sub-text" id="subText">VAULT REFLEX TEST</div>
          </div>
          <div id="resultScreen">
            <div className="res-time" id="resTime">000ms</div>
            <div className="res-rank" id="resRank">—</div>
            <div className="res-chase" id="resChase"></div>
            <div className="pb-badge" id="pbBadge">🏆 new personal best</div>
          </div>
          <div className="ticker" id="ticker">tap anywhere to start</div>
        </div>
        <div id="actionBar">
          <button className="btn-primary" id="mainBtn" onClick="handleMainBtn()">START</button>
          <button className="btn-ghost" id="retryBtn" style={{display:'none'}} onClick="resetGame()">TRY AGAIN</button>
        </div>
      </div>
      <script type="module" dangerouslySetInnerHTML={{__html: `
        import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk';
        await sdk.actions.ready();
        window.farcasterSDK = sdk;
      `}} />
      <script dangerouslySetInnerHTML={{__html: `
        let state = 'IDLE';
        let startTime, goTimer;
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        let personalBest = parseInt(localStorage.getItem('rfx_pb')) || null;
        const TIERS = [
          { max: 200, rank: 'GODLIKE ⚡', color: '#00eeff', glow: true, confetti: 150 },
          { max: 250, rank: 'ELITE 🎯', color: '#00ff88', glow: true, confetti: 80 },
          { max: 320, rank: 'HUMAN 🏃', color: '#ffffff', glow: false, confetti: 0 },
          { max: 450, rank: 'SLOW 🐢', color: '#ffe500', glow: false, confetti: 0 },
          { max: Infinity, rank: 'ZOMBIE 🧟', color: '#ff2d2d', glow: false, confetti: 0 },
        ];
        function getTier(ms) { return TIERS.find(t => ms < t.max); }
        function getChaseText(ms) {
          const idx = TIERS.findIndex(t => ms < t.max);
          if (idx === 0) return "you're untouchable 👁️";
          const gap = ms - TIERS[idx - 1].max;
          return gap + 'ms from ' + TIERS[idx - 1].rank;
        }
        function refreshPb() {
          const el = document.getElementById('pbValue');
          if (personalBest) { el.textContent = personalBest + 'ms'; el.classList.remove('empty'); }
          else { el.textContent = '—'; el.classList.add('empty'); }
        }
        refreshPb();
        function handleZoneTap(e) { e.stopPropagation(); if (state === 'WAITING') handleEarly(); else if (state === 'GO') recordResult(); }
        function handleMainBtn() { if (state === 'IDLE' || state === 'RESULT') startWaiting(); else if (state === 'GO') recordResult(); }
        function startWaiting() {
          state = 'WAITING';
          document.getElementById('resultScreen').style.display = 'none';
          document.getElementById('idleScreen').style.display = 'block';
          document.getElementById('gameZone').className = 'state-ready';
          document.getElementById('mainText').innerHTML = 'READY<br>...';
          document.getElementById('mainText').style.color = '';
          document.getElementById('subText').textContent = 'WAIT FOR IT';
          document.getElementById('ticker').textContent = "don't tap yet";
          const btn = document.getElementById('mainBtn');
          btn.textContent = 'WAITING...'; btn.className = 'btn-primary'; btn.disabled = true;
          document.getElementById('retryBtn').style.display = 'none';
          goTimer = setTimeout(triggerGo, Math.random() * 3500 + 1800);
        }
        function triggerGo() {
          state = 'GO';
          requestAnimationFrame(() => {
            startTime = performance.now();
            document.getElementById('gameZone').className = 'state-go';
            document.getElementById('mainText').innerHTML = 'NOW!';
            document.getElementById('subText').textContent = 'TAP!';
            document.getElementById('ticker').textContent = '';
            const btn = document.getElementById('mainBtn');
            btn.textContent = 'TAP!'; btn.className = 'btn-primary go-btn'; btn.disabled = false;
          });
        }
        function handleEarly() {
          clearTimeout(goTimer); state = 'IDLE';
          document.getElementById('gameZone').className = 'state-fail';
          document.getElementById('mainText').innerHTML = 'TOO<br>SOON';
          document.getElementById('subText').textContent = '';
          document.getElementById('ticker').textContent = 'calm down';
          const btn = document.getElementById('mainBtn');
          btn.textContent = 'START'; btn.className = 'btn-primary'; btn.disabled = false;
          if (navigator.vibrate) navigator.vibrate([25, 25, 25]);
          setTimeout(() => {
            if (state === 'IDLE') {
              document.getElementById('gameZone').className = '';
              document.getElementById('mainText').innerHTML = 'TAP TO<br>START';
              document.getElementById('subText').textContent = 'VAULT REFLEX TEST';
              document.getElementById('ticker').textContent = 'tap anywhere to start';
            }
          }, 1100);
        }
        function recordResult() {
          const end = performance.now();
          let diff = Math.round(end - startTime);
          if (isMobile) diff = Math.max(0, diff - 15);
          state = 'RESULT_SHOWN';
          const tier = getTier(diff);
          document.getElementById('idleScreen').style.display = 'none';
          document.getElementById('resultScreen').style.display = 'block';
          document.getElementById('gameZone').className = '';
          document.getElementById('ticker').textContent = '';
          const resTime = document.getElementById('resTime');
          const resRank = document.getElementById('resRank');
          resTime.textContent = diff + 'ms'; resTime.style.color = tier.color;
          resRank.textContent = tier.rank; resRank.style.color = tier.color;
          resRank.style.textShadow = tier.glow ? '0 0 40px ' + tier.color + '88' : 'none';
          document.getElementById('resChase').textContent = getChaseText(diff);
          const pbBadge = document.getElementById('pbBadge');
          if (!personalBest || diff < personalBest) {
            personalBest = diff; localStorage.setItem('rfx_pb', diff); refreshPb();
            requestAnimationFrame(() => pbBadge.classList.add('show'));
          } else { pbBadge.classList.remove('show'); }
          if (tier.confetti > 0) {
            confetti({ particleCount: tier.confetti, spread: 70, origin: { y: 0.45 } });
            if (navigator.vibrate) navigator.vibrate(tier.confetti > 100 ? [80, 40, 80, 40, 120] : [60]);
          }
          const mainBtn = document.getElementById('mainBtn');
          mainBtn.textContent = 'CAST MY SCORE'; mainBtn.className = 'btn-primary'; mainBtn.disabled = false;
          mainBtn.onclick = share;
          document.getElementById('retryBtn').style.display = 'block';
          if (diff < 250 && window.farcasterSDK) setTimeout(() => window.farcasterSDK.actions.addMiniApp(), 900);
        }
        function resetGame() {
          state = 'IDLE';
          document.getElementById('idleScreen').style.display = 'block';
          document.getElementById('resultScreen').style.display = 'none';
          document.getElementById('gameZone').className = '';
          document.getElementById('mainText').innerHTML = 'TAP TO<br>START';
          document.getElementById('mainText').style.color = '';
          document.getElementById('subText').textContent = 'VAULT REFLEX TEST';
          document.getElementById('ticker').textContent = 'tap anywhere to start';
          const mainBtn = document.getElementById('mainBtn');
          mainBtn.textContent = 'START'; mainBtn.className = 'btn-primary'; mainBtn.disabled = false;
          mainBtn.onclick = handleMainBtn;
          document.getElementById('retryBtn').style.display = 'none';
        }
        function share() {
          const ms = document.getElementById('resTime').textContent;
          const rank = document.getElementById('resRank').textContent;
          const pbLine = personalBest ? ' (pb: ' + personalBest + 'ms)' : '';
          const text = rank + ' — ' + ms + pbLine + '\\n\\nthink you can beat me? ⚡';
          const shareUrl = 'https://reflex-gold.vercel.app?score=' + encodeURIComponent(ms) + '&rank=' + encodeURIComponent(rank);
          if (window.farcasterSDK) {
            window.farcasterSDK.actions.composeCast({ text, embeds: [shareUrl] });
          } else {
            navigator.clipboard?.writeText(text).then(() => alert('Copied!')).catch(() => alert(text));
          }
        }
      `}} />
    </>
  )
}

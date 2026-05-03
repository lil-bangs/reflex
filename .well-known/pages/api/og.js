import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const score = searchParams.get('score') || '???';
  const rank = searchParams.get('rank') || 'REFLEX';
  const colors = {
    'GODLIKE ⚡': '#00eeff',
    'ELITE 🎯': '#00ff88',
    'HUMAN 🏃': '#ffffff',
    'SLOW 🐢': '#ffe500',
    'ZOMBIE 🧟': '#ff2d2d',
  };
  const color = colors[rank] || '#ffffff';

  return new ImageResponse(
    (
      <div style={{
        width: '1200px', height: '630px',
        background: '#000000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace',
        border: '2px solid #1e1e1e',
      }}>
        <div style={{ fontSize: '48px', color: '#555', letterSpacing: '8px', marginBottom: '20px' }}>
          REFLEX
        </div>
        <div style={{ fontSize: '160px', fontWeight: 900, color: color, lineHeight: 1, letterSpacing: '-4px' }}>
          {score}
        </div>
        <div style={{ fontSize: '52px', fontWeight: 800, color: color, letterSpacing: '6px', marginTop: '10px' }}>
          {rank}
        </div>
        <div style={{ fontSize: '24px', color: '#444', letterSpacing: '4px', marginTop: '40px', textTransform: 'uppercase' }}>
          reflex-gold.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

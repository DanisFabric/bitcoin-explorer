import { useMemo } from 'react'
import type { Chapter, EventKind, FlowEvent, Lang, SceneNode } from '../types'

const KIND_COLOR: Record<EventKind, string> = {
  tx: '#f7931a',
  sig: '#6d4bdc',
  block: '#2d6cdf',
  inv: '#0a9b6d',
  hash: '#e19b00',
  proof: '#0b8b98',
  msg: '#8494b4',
  channel: '#6d4bdc',
  coinbase: '#f2b90d',
}

const cos = Math.cos(Math.PI / 6)
const sin = 0.5
const pt = (x: number, y: number, z: number): [number, number] => [(x - y) * cos, (x + y) * sin - z]

function quad(a: { x: number; y: number }, c: { x: number; y: number }, b: { x: number; y: number }, t: number) {
  const u = 1 - t
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  }
}

function arrowPath(a: { x: number; y: number }, b: { x: number; y: number }, curve = 0) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const c = { x: (a.x + b.x) / 2 + nx * curve, y: (a.y + b.y) / 2 + ny * curve }
  const trim = 15
  const t = 1 - trim / len
  const end = quad(a, c, b, t)
  const before = quad(a, c, b, Math.max(0, t - 0.05))
  const angle = (Math.atan2(end.y - before.y, end.x - before.x) * 180) / Math.PI
  return { c, end, angle, d: `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${end.x} ${end.y}` }
}

export function Scene({
  chapter,
  time,
  focus,
  playing,
  lang,
  stepIndex,
}: {
  chapter: Chapter
  time: number
  focus: string[]
  playing: boolean
  lang: Lang
  stepIndex: number
}) {
  const nodes = chapter.nodes
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  const active = chapter.events.find((e) => time >= e.t && time <= e.t + 1.15)
  const progress = active ? Math.min(1, (time - active.t) / 0.95) : 0
  const activeNodes = active ? [active.from, active.to] : []

  const camera = useMemo(() => {
    const targets = focus.map((id) => nodeMap.get(id)).filter(Boolean) as SceneNode[]
    if (!targets.length) return { s: 1, tx: 0, ty: 0 }
    const cx = targets.reduce((s, n) => s + n.x, 0) / targets.length
    const cy = targets.reduce((s, n) => s + (n.y - 45), 0) / targets.length
    const s = targets.length === 1 ? 1.16 : targets.length === 2 ? 1.06 : 0.98
    return { s, tx: 500 - cx * s, ty: 315 - cy * s }
  }, [focus, nodeMap])

  const pathFor = (from: string, to: string) => {
    const link = chapter.links.find((l) => (l.from === from && l.to === to) || (l.from === to && l.to === from))
    const a = nodeMap.get(from)
    const b = nodeMap.get(to)
    if (!a || !b) return null
    const start = { x: a.x, y: a.y - 55 }
    const end = { x: b.x, y: b.y - 55 }
    return arrowPath(start, end, link?.curve ?? 0)
  }

  const tokenPos = active && active.from !== active.to ? (() => {
    const p = pathFor(active.from, active.to)
    const a = nodeMap.get(active.from)
    const b = nodeMap.get(active.to)
    if (!p || !a || !b) return null
    const start = { x: a.x, y: a.y - 55 }
    const target = { x: b.x, y: b.y - 55 }
    const t = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
    return { ...quad(start, p.c, target, t), color: KIND_COLOR[active.kind] }
  })() : null

  const label = (en: string, zh: string) => (lang === 'zh' ? zh : en)

  return (
    <div className="scene">
      <div className="scene-overlay top-left">
        <span className="live-dot" /> {label('SIMULATED LEDGER', '模拟账本')}
        <span className="ov-sep">/</span> {label('MAINNET PARAMETERS', '主网参数')}
      </div>
      <div className="scene-overlay top-right">
        {label('BLOCK', '区块')} <strong>870,001</strong>
        <span className="ov-sep">·</span> {label('FEE', '费率')} <strong>{playing ? '15.5' : '15.5'} sat/vB</strong>
      </div>

      <svg viewBox="0 0 1000 620" className="scene-svg" role="img" aria-label={`${chapter.name} network diagram`}>
        <defs>
          <radialGradient id="tokenGlow">
            <stop offset="0%" stopColor={active ? KIND_COLOR[active.kind] : '#f7931a'} stopOpacity="0.65" />
            <stop offset="55%" stopColor={active ? KIND_COLOR[active.kind] : '#f7931a'} stopOpacity="0.16" />
            <stop offset="100%" stopColor={active ? KIND_COLOR[active.kind] : '#f7931a'} stopOpacity="0" />
          </radialGradient>
          <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="scene-axis">
          <line x1="40" y1="560" x2="120" y2="560" />
          <text x="42" y="552">10 min</text>
          <line x1="955" y1="60" x2="955" y2="88" />
          <text x="930" y="56">H</text>
        </g>

        <g className="camera" style={{ transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.s})` }}>
          <ellipse className="scene-floor" cx="460" cy="430" rx="390" ry="150" />

          {chapter.links.map((l, i) => {
            const p = pathFor(l.from, l.to)
            if (!p) return null
            const hot =
              active &&
              ((active.from === l.from && active.to === l.to) || (active.from === l.to && active.to === l.from))
            return (
              <g key={i} className={`link ${hot ? 'hot' : ''}`} style={hot ? { color: KIND_COLOR[active!.kind] } : undefined}>
                <path d={p.d} className="link-path" />
                <path d={`M ${p.end.x} ${p.end.y} l -8 -4.2 l 0 8.4 Z`} transform={`rotate(${p.angle} ${p.end.x} ${p.end.y})`} className="link-arrow" />
              </g>
            )
          })}

          {nodes.map((n) => (
            <g
              key={n.id}
              className={`node ${activeNodes.includes(n.id) ? 'active' : ''} ${focus.includes(n.id) ? 'focused' : ''}`}
              transform={`translate(${n.x} ${n.y})`}
            >
              {activeNodes.includes(n.id) && <ellipse className="node-pulse" cx="0" cy="-45" rx="95" ry="34" style={{ stroke: active ? KIND_COLOR[active.kind] : undefined }} />}
              <g transform={`scale(${n.scale ?? 1})`}>
                <NodeArt kind={n.kind} active={activeNodes.includes(n.id)} />
              </g>
              <text className="node-name" y="30" textAnchor="middle">
                {n.label[lang]}
              </text>
              <text className="node-sub" y="48" textAnchor="middle">
                {n.sub}
              </text>
            </g>
          ))}

          {tokenPos && active && (
            <g className="token" style={{ color: tokenPos.color }}>
              <circle cx={tokenPos.x} cy={tokenPos.y} r="30" fill="url(#tokenGlow)" />
              <circle cx={tokenPos.x} cy={tokenPos.y} r="5.5" className="token-core" />
              <circle cx={tokenPos.x} cy={tokenPos.y} r="10" className="token-ring" />
              {active.from !== active.to && (
                <line
                  x1={quad({ x: nodeMap.get(active.from)!.x, y: nodeMap.get(active.from)!.y - 55 }, pathFor(active.from, active.to)!.c, { x: nodeMap.get(active.to)!.x, y: nodeMap.get(active.to)!.y - 55 }, Math.max(0, (progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2) - 0.16)).x}
                  y1={quad({ x: nodeMap.get(active.from)!.x, y: nodeMap.get(active.from)!.y - 55 }, pathFor(active.from, active.to)!.c, { x: nodeMap.get(active.to)!.x, y: nodeMap.get(active.to)!.y - 55 }, Math.max(0, (progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2) - 0.16)).y}
                  x2={tokenPos.x}
                  y2={tokenPos.y}
                  className="token-trail"
                />
              )}
            </g>
          )}

          {active && active.from === active.to && (
            <g className="self-event" style={{ color: KIND_COLOR[active.kind] }}>
              <circle cx={nodeMap.get(active.from)?.x} cy={(nodeMap.get(active.from)?.y ?? 0) - 55} r={34 + progress * 40} className="self-ring" />
            </g>
          )}
        </g>
      </svg>

      <div className="scene-overlay bottom-left">
        <span className="legend-line" style={{ color: KIND_COLOR[active?.kind ?? 'tx'] }} />
        {active ? chapter.events.find((e) => e.id === active.id)?.info[lang] : label('READY · PRESS PLAY', '就绪 · 点击播放')}
      </div>
      <div className="scene-overlay bottom-right">
        {chapter.events.length ? `${Math.max(0, Math.min(chapter.events.length, stepIndex + 1))} / ${chapter.events.length}` : ''}
      </div>
    </div>
  )
}

function Box({
  w,
  d,
  h,
  z = 0,
  className = '',
  children,
}: {
  w: number
  d: number
  h: number
  z?: number
  className?: string
  children?: React.ReactNode
}) {
  const top = [pt(-w / 2, -d / 2, z + h), pt(w / 2, -d / 2, z + h), pt(w / 2, d / 2, z + h), pt(-w / 2, d / 2, z + h)]
  const left = [pt(-w / 2, d / 2, z), pt(w / 2, d / 2, z), pt(w / 2, d / 2, z + h), pt(-w / 2, d / 2, z + h)]
  const right = [pt(w / 2, -d / 2, z), pt(w / 2, d / 2, z), pt(w / 2, d / 2, z + h), pt(w / 2, -d / 2, z + h)]
  const poly = (pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ')
  return (
    <g className={`iso-box ${className}`}>
      <polygon points={poly(left)} className="face-left" />
      <polygon points={poly(right)} className="face-right" />
      <polygon points={poly(top)} className="face-top" />
      {children}
    </g>
  )
}

function Line3({ a, b, className = 'detail' }: { a: [number, number, number]; b: [number, number, number]; className?: string }) {
  const p = pt(...a)
  const q = pt(...b)
  return <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} className={className} />
}

function Dot({ x, y, z, lit }: { x: number; y: number; z: number; lit?: boolean }) {
  const p = pt(x, y, z)
  return <circle cx={p[0]} cy={p[1]} r="2.1" className={`led ${lit ? 'lit' : ''}`} />
}

function NodeArt({ kind, active }: { kind: string; active: boolean }) {
  switch (kind) {
    case 'wallet':
      return (
        <g>
          <ellipse className="shadow" cx="0" cy="5" rx="66" ry="18" />
          <Box w={64} d={12} h={86} z={0}>
            <polygon points={[pt(-26, -6, 76), pt(26, -6, 76), pt(26, -6, 20), pt(-26, -6, 20)].map((p) => p.join(',')).join(' ')} className="screen" />
            <Line3 a={[-18, -6, 64]} b={[14, -6, 64]} className="screen-line" />
            <Line3 a={[-18, -6, 56]} b={[20, -6, 56]} className="screen-line" />
            <Line3 a={[-18, -6, 48]} b={[4, -6, 48]} className="screen-line" />
            <Line3 a={[-18, -6, 40]} b={[16, -6, 40]} className="screen-line" />
            <circle cx={pt(0, -6, 29)[0]} cy={pt(0, -6, 29)[1]} r="7" className="coin" />
            <text x={pt(0, -6, 29)[0]} y={pt(0, -6, 29)[1] + 3} textAnchor="middle" className="coin-glyph">₿</text>
          </Box>
          <Line3 a={[-22, 6, 8]} b={[22, 6, 8]} className="detail" />
          <Line3 a={[-22, 6, 16]} b={[22, 6, 16]} className="detail dim" />
          <line x1={pt(30, 0, 0)[0]} y1={pt(30, 0, 0)[1]} x2={pt(30, 0, -14)[0]} y2={pt(30, 0, -14)[1]} className="detail" />
        </g>
      )
    case 'node':
      return (
        <g>
          <ellipse className="shadow" cx="0" cy="4" rx="64" ry="18" />
          <Box w={88} d={66} h={96}>
            <Line3 a={[-30, 33, 18]} b={[30, 33, 18]} />
            <Line3 a={[-30, 33, 40]} b={[30, 33, 40]} />
            <Line3 a={[-30, 33, 62]} b={[30, 33, 62]} />
            <Line3 a={[-30, 33, 84]} b={[30, 33, 84]} className="detail dim" />
            <Dot x={-26} y={33} z={26} lit={active} />
            <Dot x={-26} y={33} z={48} lit />
            <Dot x={-26} y={33} z={70} />
            <Line3 a={[0, 0, 96]} b={[0, 0, 120]} />
            <circle cx={pt(0, 0, 124)[0]} cy={pt(0, 0, 124)[1]} r="3.2" className="beacon" />
          </Box>
          <path d={`M ${pt(0, 0, 124)[0]} ${pt(0, 0, 124)[1] - 9} a 9 9 0 0 1 12 -6`} className="signal" />
        </g>
      )
    case 'miner':
      return (
        <g>
          <ellipse className="shadow" cx="0" cy="4" rx="76" ry="22" />
          <Box w={116} d={78} h={46}>
            <ellipse cx={pt(-26, -10, 46)[0]} cy={pt(-26, -10, 46)[1]} rx="19" ry="10.5" className="fan" />
            <ellipse cx={pt(24, -10, 46)[0]} cy={pt(24, -10, 46)[1]} rx="19" ry="10.5" className="fan" />
            <path d={`M ${pt(-26, -10, 46)[0] - 17} ${pt(-26, -10, 46)[1]} h 34`} className="fan-blade" />
            <path d={`M ${pt(-26, -10, 46)[0]} ${pt(-26, -10, 46)[1] - 9} v 18`} className="fan-blade" />
            <path d={`M ${pt(24, -10, 46)[0] - 17} ${pt(24, -10, 46)[1]} h 34`} className="fan-blade" />
            <Line3 a={[-40, 39, 12]} b={[40, 39, 12]} className="detail" />
            <Line3 a={[-40, 39, 24]} b={[40, 39, 24]} className="detail" />
            <Dot x={-44} y={39} z={34} lit />
            <Dot x={-36} y={39} z={34} lit={active} />
          </Box>
          <path d={`M -62 -66 c -10 -8 -4 -20 6 -20 M 58 -72 c 12 -4 12 -18 2 -22`} className="heat" />
        </g>
      )
    case 'mempool':
      return (
        <g>
          <ellipse className="shadow" cx="0" cy="6" rx="66" ry="20" />
          <Box w={98} d={70} h={6} z={0} className="card-box" />
          <Box w={98} d={70} h={6} z={16} className="card-box" />
          <Box w={98} d={70} h={6} z={32} className="card-box">
            <Line3 a={[-30, 35, 33]} b={[18, 35, 33]} className="detail" />
            <Line3 a={[-30, 35, 28]} b={[6, 35, 28]} className="detail dim" />
          </Box>
          <g className="float-tx">
            <rect x="26" y="-72" width="34" height="22" rx="1" className="paper" />
            <line x1="31" y1="-65" x2="51" y2="-65" className="paper-line" />
            <line x1="31" y1="-59" x2="45" y2="-59" className="paper-line" />
          </g>
        </g>
      )
    case 'chain':
      return (
        <g>
          <ellipse className="shadow" cx="0" cy="8" rx="104" ry="24" />
          <g transform="translate(-70 0) scale(0.78)">
            <Box w={64} d={64} h={58}>
              <Line3 a={[-16, 32, 22]} b={[16, 32, 22]} className="detail" />
              <Line3 a={[-16, 32, 34]} b={[16, 32, 34]} className="detail dim" />
            </Box>
          </g>
          <g transform="translate(0 0) scale(0.86)">
            <Box w={64} d={64} h={58}>
              <Line3 a={[-16, 32, 22]} b={[16, 32, 22]} className="detail" />
              <Line3 a={[-16, 32, 34]} b={[16, 32, 34]} className="detail dim" />
            </Box>
          </g>
          <g transform="translate(72 0) scale(0.78)">
            <Box w={64} d={64} h={58} className={active ? 'chain-hot' : ''}>
              <Line3 a={[-16, 32, 22]} b={[16, 32, 22]} className="detail" />
              <Line3 a={[-16, 32, 34]} b={[16, 32, 34]} className="detail dim" />
            </Box>
          </g>
          <path d="M -30 -40 l 26 0 M 36 -40 l 24 0" className="chain-link" />
        </g>
      )
    case 'block':
      return (
        <g>
          <ellipse className="shadow" cx="0" cy="6" rx="78" ry="24" />
          <Box w={100} d={100} h={92} className="block-box">
            <Line3 a={[-32, 50, 22]} b={[32, 50, 22]} className="block-line" />
            <Line3 a={[-32, 50, 36]} b={[32, 50, 36]} className="block-line" />
            <Line3 a={[-32, 50, 50]} b={[14, 50, 50]} className="block-line dim" />
            <Line3 a={[-32, 50, 64]} b={[32, 50, 64]} className="block-line dim" />
            <text x={pt(0, 50, 79)[0]} y={pt(0, 50, 79)[1]} textAnchor="middle" className="block-glyph">
              #870001
            </text>
          </Box>
          <text x="0" y="-112" textAnchor="middle" className="floating-hash">
            {active ? '0000…7b1a' : 'SHA-256d'}
          </text>
        </g>
      )
    case 'tx':
      return (
        <g>
          <ellipse className="shadow" cx="0" cy="8" rx="66" ry="18" />
          <Box w={94} d={62} h={5} z={18} className="paper-box">
            <Line3 a={[-28, 31, 20]} b={[20, 31, 20]} className="detail" />
            <Line3 a={[-28, 31, 14]} b={[8, 31, 14]} className="detail dim" />
            <Line3 a={[-28, -2, 20]} b={[-8, -2, 20]} className="detail" />
          </Box>
          <g transform="translate(54 -32)">
            <circle r="15" className="sig-badge" />
            <path d="M -5 0 l 4 4 l 7 -9" className="sig-tick" />
          </g>
          <line x1="0" y1="8" x2="0" y2="-46" className="detail dim" />
        </g>
      )
    case 'gauge':
      return (
        <g>
          <ellipse className="shadow" cx="0" cy="4" rx="56" ry="16" />
          <Box w={44} d={30} h={16} />
          <line x1={pt(0, 0, 16)[0]} y1={pt(0, 0, 16)[1]} x2={pt(0, 0, 74)[0]} y2={pt(0, 0, 74)[1]} className="detail" />
          <circle cx={pt(0, 0, 96)[0]} cy={pt(0, 0, 96)[1]} r="40" className="dial" />
          <circle cx={pt(0, 0, 96)[0]} cy={pt(0, 0, 96)[1]} r="30" className="dial-inner" />
          {Array.from({ length: 9 }).map((_, i) => {
            const a = Math.PI * (1.15 + (i / 8) * 1.7)
            const cx = pt(0, 0, 96)[0]
            const cy = pt(0, 0, 96)[1]
            return <line key={i} x1={cx + Math.cos(a) * 32} y1={cy + Math.sin(a) * 32} x2={cx + Math.cos(a) * 37} y2={cy + Math.sin(a) * 37} className="dial-tick" />
          })}
          <line
            x1={pt(0, 0, 96)[0]}
            y1={pt(0, 0, 96)[1]}
            x2={pt(0, 0, 96)[0] + Math.cos(Math.PI * 1.9) * 30}
            y2={pt(0, 0, 96)[1] + Math.sin(Math.PI * 1.9) * 30}
            className="dial-needle"
          />
          <circle cx={pt(0, 0, 96)[0]} cy={pt(0, 0, 96)[1]} r="3.4" className="dial-pin" />
          <path d={`M ${pt(0, 0, 96)[0] - 46} ${pt(0, 0, 96)[1] + 34} a 54 54 0 0 1 92 0`} className="dial-arc" />
        </g>
      )
    case 'vault':
      return (
        <g>
          <ellipse className="shadow" cx="0" cy="4" rx="62" ry="18" />
          <Box w={92} d={74} h={96}>
            <ellipse cx={pt(0, 37, 54)[0]} cy={pt(0, 37, 54)[1]} rx="21" ry="21" className="vault-dial" />
            <ellipse cx={pt(0, 37, 54)[0]} cy={pt(0, 37, 54)[1]} rx="13" ry="13" className="vault-inner" />
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2
              const cx = pt(0, 37, 54)[0]
              const cy = pt(0, 37, 54)[1]
              return <line key={i} x1={cx + Math.cos(a) * 15} y1={cy + Math.sin(a) * 15} x2={cx + Math.cos(a) * 19} y2={cy + Math.sin(a) * 19} className="dial-tick" />
            })}
            <line x1={pt(-30, 37, 84)[0]} y1={pt(-30, 37, 84)[1]} x2={pt(30, 37, 84)[0]} y2={pt(30, 37, 84)[1]} className="detail" />
          </Box>
          <text x="0" y="-112" textAnchor="middle" className="floating-hash">
            {active ? 'sign ✓' : 'secp256k1'}
          </text>
        </g>
      )
    case 'pool':
      return (
        <g>
          <ellipse className="shadow" cx="0" cy="4" rx="72" ry="20" />
          <Box w={106} d={74} h={64}>
            <Line3 a={[-36, 37, 20]} b={[36, 37, 20]} className="detail" />
            <Line3 a={[-36, 37, 42]} b={[36, 37, 42]} className="detail" />
            <Line3 a={[-36, 37, 54]} b={[36, 37, 54]} className="detail dim" />
            <Dot x={-40} y={37} z={30} lit />
            <Dot x={-32} y={37} z={30} lit={active} />
          </Box>
          <path d={`M ${pt(-30, -20, 84)[0]} ${pt(-30, -20, 84)[1]} l 12 -10 l 10 5 l 12 -5 l 10 -12`} className="pool-line" />
          <g transform="translate(42 -78)">
            <rect x="0" y="0" width="34" height="20" className="paper" />
            <text x="17" y="13" textAnchor="middle" className="paper-text">shares</text>
          </g>
        </g>
      )
    case 'seed':
      return (
        <g>
          <ellipse className="shadow" cx="0" cy="6" rx="64" ry="18" />
          <Box w={96} d={62} h={6} z={26} className="paper-box">
            {[0, 1, 2].map((r) => (
              <g key={r}>
                {[0, 1, 2].map((c) => (
                  <rect
                    key={c}
                    x={-30 + c * 21}
                    y={pt(0, 0, 0)[1] - 44 + r * 14}
                    width="17"
                    height="9"
                    className="word-chip"
                  />
                ))}
              </g>
            ))}
          </Box>
          <g transform="translate(-50 -58)">
            <rect width="26" height="26" rx="2" className="lock-badge" />
            <path d="M8 12 v-3 a5 5 0 0 1 10 0 v3 M6 12 h14 v10 h-14 z" className="lock-glyph" />
          </g>
          <line x1="0" y1="32" x2="0" y2="-42" className="detail dim" />
        </g>
      )
    case 'cloud':
      return (
        <g>
          <path
            d="M -70 0 c -22 0 -34 -14 -30 -30 c -16 -18 0 -42 22 -40 c 8 -24 42 -28 55 -8 c 24 -8 44 10 38 30 c 22 6 22 34 -2 44 Z"
            className="cloud"
          />
          <circle cx="0" cy="-40" r="26" className="cloud-globe" />
          <ellipse cx="0" cy="-40" rx="10" ry="26" className="cloud-globe" />
          <path d="M -26 -40 h 52 M -24 -50 h 48 M -24 -30 h 48" className="cloud-globe" />
        </g>
      )
    case 'channel':
      return (
        <g>
          <ellipse className="shadow" cx="0" cy="6" rx="92" ry="20" />
          <Box w={30} d={30} h={96} z={0} className="pillar" />
          <g transform="translate(112 0)">
            <Box w={30} d={30} h={96} z={0} className="pillar" />
          </g>
          <path d="M 42 -74 L 58 -46 L 46 -46 L 66 -8 L 60 -38 L 72 -38 Z" className="bolt" />
          <line x1={pt(0, 0, 96)[0]} y1={pt(0, 0, 96)[1]} x2={pt(0, 0, 118)[0]} y2={pt(0, 0, 118)[1]} className="detail" />
          <line x1={pt(112, 0, 96)[0]} y1={pt(112, 0, 96)[1]} x2={pt(112, 0, 118)[0]} y2={pt(112, 0, 118)[1]} className="detail" />
          <path d={`M ${pt(0, 0, 118)[0]} ${pt(0, 0, 118)[1]} q 50 -20 56 0`} className="channel-link" />
        </g>
      )
    case 'router':
      return (
        <g>
          <ellipse className="shadow" cx="0" cy="4" rx="52" ry="14" />
          <Box w={60} d={48} h={64}>
            <Line3 a={[-20, 24, 20]} b={[20, 24, 20]} className="detail" />
            <Dot x={-24} y={24} z={32} lit={active} />
            <Dot x={-24} y={24} z={42} lit />
          </Box>
          <line x1={pt(0, 0, 64)[0]} y1={pt(0, 0, 64)[1]} x2={pt(0, 0, 90)[0]} y2={pt(0, 0, 90)[1]} className="detail" />
          <path d={`M ${pt(0, 0, 90)[0]} ${pt(0, 0, 90)[1] - 14} q -20 -18 -36 -10 M ${pt(0, 0, 90)[0]} ${pt(0, 0, 90)[1] - 14} q 20 -18 36 -10`} className="signal" />
        </g>
      )
    default:
      return null
  }
}

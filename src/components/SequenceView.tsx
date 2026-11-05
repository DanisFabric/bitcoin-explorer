import type { Chapter, EventKind, Lang } from '../types'

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

export function SequenceView({
  chapter,
  time,
  lang,
  stepIndex,
  onSelect,
}: {
  chapter: Chapter
  time: number
  lang: Lang
  stepIndex: number
  onSelect?: (id: number) => void
}) {
  const ids = chapter.nodes.filter((n) => chapter.events.some((e) => e.from === n.id || e.to === n.id))
  const xOf = (id: string) => {
    const i = ids.findIndex((n) => n.id === id)
    return 150 + (i / Math.max(1, ids.length - 1)) * 700
  }
  const maxT = Math.max(1, ...chapter.events.map((e) => e.t))
  const yOf = (t: number) => 120 + (t / maxT) * 350
  const playY = yOf(Math.min(time, maxT + 1.4))

  return (
    <div className="sequence">
      <svg viewBox="0 0 1000 620" className="sequence-svg">
        <defs>
          <marker id="seqArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>
        <text x="60" y="48" className="seq-kicker">
          {lang === 'zh' ? '事件时序 · 时间向下' : 'EVENT SEQUENCE · TIME FLOWS DOWN'}
        </text>
        <line x1="80" y1="104" x2="920" y2="104" className="seq-top" />
        <line x1="80" y1="520" x2="920" y2="520" className="seq-top" />

        {ids.map((n) => (
          <g key={n.id}>
            <line x1={xOf(n.id)} y1="108" x2={xOf(n.id)} y2="516" className="lifeline" />
            <text x={xOf(n.id)} y="72" textAnchor="middle" className="seq-node">
              {n.label[lang]}
            </text>
            <text x={xOf(n.id)} y="90" textAnchor="middle" className="seq-sub">
              {n.sub}
            </text>
            <circle cx={xOf(n.id)} cy="104" r="3.5" className="seq-dot" />
            <circle cx={xOf(n.id)} cy="520" r="3.5" className="seq-dot" />
          </g>
        ))}

        {chapter.steps.map((s, i) => {
          const y = yOf(s.t) - 24
          return (
            <g key={i} className={`seq-step ${i === stepIndex ? 'on' : ''}`}>
              <line x1="80" y1={y} x2="920" y2={y} className="seq-step-line" />
              <text x="86" y={y + 12} className="seq-step-label">
                {String(i + 1).padStart(2, '0')} · {s.title[lang]}
              </text>
            </g>
          )
        })}

        {chapter.events.map((e) => {
          const x1 = xOf(e.from)
          const x2 = xOf(e.to)
          const y = yOf(e.t)
          const done = time >= e.t
          const active = time >= e.t && time < e.t + 1.2
          const mid = (x1 + x2) / 2
          const self = e.from === e.to
          const d = self
            ? `M ${x1} ${y} c 55 -20 55 34 0 34`
            : `M ${x1} ${y} L ${x2} ${y}`
          return (
            <g
              key={e.id}
              className={`seq-event ${done ? 'done' : ''} ${active ? 'active' : ''}`}
              style={{ color: KIND_COLOR[e.kind] }}
              onClick={() => onSelect?.(e.id)}
            >
              <path d={d} className="seq-arrow" markerEnd="url(#seqArrow)" style={{ opacity: done ? 1 : 0.28 }} />
              <text x={self ? x1 + 64 : mid} y={y - 8} textAnchor="middle" className="seq-label" style={{ opacity: done ? 1 : 0.4 }}>
                {e.info[lang]}
              </text>
              <text x="86" y={y + 4} className="seq-time" style={{ opacity: done ? 1 : 0.35 }}>
                {e.t.toFixed(3)}s
              </text>
            </g>
          )
        })}

        <line x1="80" y1={playY} x2="920" y2={playY} className="seq-playhead" />
        <circle cx="80" cy={playY} r="4" className="seq-playdot" />
      </svg>
      <div className="sequence-note">
        {lang === 'zh' ? '点击任意事件可打开逐字节解码。' : 'Click any event to open its byte-level decoder.'}
      </div>
    </div>
  )
}

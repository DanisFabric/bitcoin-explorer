import type { Chapter, EventKind, Lang } from '../types'
import { Icon, PlayPause } from './icons'
import { formatTime } from '../lib/format'

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

const KIND_LABEL: Record<EventKind, { en: string; zh: string }> = {
  tx: { en: 'TX', zh: '交易' },
  sig: { en: 'SIG', zh: '签名' },
  block: { en: 'BLOCK', zh: '区块' },
  inv: { en: 'INV', zh: '库存' },
  hash: { en: 'HASH', zh: '哈希' },
  proof: { en: 'PROOF', zh: '证明' },
  msg: { en: 'MSG', zh: '消息' },
  channel: { en: 'STATE', zh: '状态' },
  coinbase: { en: 'COINBASE', zh: 'Coinbase' },
}

export function EventTable({
  chapter,
  time,
  lang,
  selected,
  playing,
  speed,
  onSpeed,
  onPlay,
  onStep,
  onReset,
  onSelect,
}: {
  chapter: Chapter
  time: number
  lang: Lang
  selected: number | null
  playing: boolean
  speed: number
  onSpeed: () => void
  onPlay: () => void
  onStep: (dir: 1 | -1) => void
  onReset: () => void
  onSelect: (id: number) => void
}) {
  const nodes = new Map(chapter.nodes.map((n) => [n.id, n]))
  const current = [...chapter.events].reverse().find((e) => time >= e.t)?.id ?? -1
  const kinds = Array.from(new Set(chapter.events.map((e) => e.kind))).slice(0, 5)

  return (
    <section className="panel flow">
      <div className="flow-head">
        <h3 className="panel-title">
          {lang === 'zh' ? '事件流' : 'EVENT FLOW'} <span className="flow-count">{chapter.events.length}</span>
        </h3>
        <div className="flow-legend">
          {kinds.map((k) => (
            <span key={k} className="legend-item">
              <i style={{ background: KIND_COLOR[k] }} /> {KIND_LABEL[k][lang]}
            </span>
          ))}
        </div>
        <div className="flow-controls">
          <button className="ctl speed" onClick={onSpeed} title="Playback speed">
            {speed}×
          </button>
          <button className="ctl icon-only" onClick={() => onStep(-1)} aria-label="Previous event" title="Previous event">
            <Icon name="prev" size={15} />
          </button>
          <button className="ctl primary play" onClick={onPlay} title="Play / pause (space)">
            <PlayPause playing={playing} size={15} />
            {playing ? (lang === 'zh' ? '暂停' : 'PAUSE') : lang === 'zh' ? '播放' : 'PLAY'}
          </button>
          <button className="ctl" onClick={() => onStep(1)} title="Next event (→)">
            {lang === 'zh' ? '单步' : 'STEP'}
          </button>
          <button className="ctl icon-only" onClick={onReset} aria-label="Reset" title="Reset">
            <Icon name="reset" size={15} />
          </button>
        </div>
      </div>

      <div className="flow-table-wrap">
        <table className="flow-table">
          <thead>
            <tr>
              <th className="c-no">NO.</th>
              <th className="c-time">TIME</th>
              <th className="c-from">{lang === 'zh' ? '来源' : 'FROM'}</th>
              <th className="c-to">{lang === 'zh' ? '目标' : 'TO'}</th>
              <th className="c-kind">TYPE</th>
              <th>{lang === 'zh' ? '说明' : 'INFO'}</th>
              <th className="c-size">SIZE</th>
            </tr>
          </thead>
          <tbody>
            {chapter.events.map((e) => (
              <tr
                key={e.id}
                className={`${selected === e.id ? 'selected' : ''} ${current === e.id ? 'current' : ''}`}
                onClick={() => onSelect(e.id)}
              >
                <td className="c-no">
                  <span className="ev-num" style={{ background: KIND_COLOR[e.kind] }}>
                    {e.id}
                  </span>
                </td>
                <td className="c-time">{formatTime(e.t)}</td>
                <td className="c-from mono">{nodes.get(e.from)?.label[lang] ?? e.from}</td>
                <td className="c-to mono">{nodes.get(e.to)?.label[lang] ?? e.to}</td>
                <td className="c-kind">
                  <span className="kind-pill" style={{ color: KIND_COLOR[e.kind], borderColor: KIND_COLOR[e.kind] }}>
                    {KIND_LABEL[e.kind][lang]}
                  </span>
                </td>
                <td className="ev-info">{e.info[lang]}</td>
                <td className="c-size">{e.size}</td>
              </tr>
            ))}
            {!chapter.events.length && (
              <tr>
                <td colSpan={7} className="empty-row">
                  {lang === 'zh' ? '这个实验没有事件流。' : 'This lab has no event stream.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

import { useMemo, useState } from 'react'
import type { Chapter, Lang } from '../types'
import { asciiOf, formatTime, hexPairs } from '../lib/format'
import { Icon } from './icons'

export function Inspector({
  chapter,
  eventId,
  lang,
  onClose,
  onPrev,
  onNext,
}: {
  chapter: Chapter
  eventId: number
  lang: Lang
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const event = chapter.events.find((e) => e.id === eventId)
  const nodes = new Map(chapter.nodes.map((n) => [n.id, n]))
  const payload = event?.payload
  const [field, setField] = useState(0)
  const [copied, setCopied] = useState(false)

  const rows = useMemo(() => (payload ? hexPairs(payload.hex) : []), [payload])
  const selected = payload?.fields[field]
  const bytes = payload ? payload.hex.length / 2 : 0
  const totalLayer = payload?.layers?.reduce((s, l) => s + l.bytes, 0) ?? bytes

  if (!event) return null

  const copy = async () => {
    if (!payload) return
    try {
      await navigator.clipboard.writeText(payload.hex)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="inspector">
      <div className="inspect-head">
        <span className="ev-num" style={{ background: 'var(--accent)' }}>{event.id}</span>
        <div className="inspect-title">
          <strong>{event.info[lang]}</strong>
          <span>
            {formatTime(event.t)} · {nodes.get(event.from)?.label[lang] ?? event.from} → {nodes.get(event.to)?.label[lang] ?? event.to} · {event.size}
          </span>
        </div>
        <div className="inspect-nav">
          <button onClick={onPrev} aria-label="Previous event"><Icon name="prev" size={15} /></button>
          <button onClick={onNext} aria-label="Next event"><Icon name="next" size={15} /></button>
          <button onClick={onClose} aria-label="Close inspector"><Icon name="close" size={15} /></button>
        </div>
      </div>

      {payload ? (
        <div className="inspect-body">
          <div className="inspect-sectionhead">
            <span>{payload.title[lang]}</span>
            <button className="copy-btn" onClick={copy}>
              <Icon name="copy" size={13} /> {copied ? (lang === 'zh' ? '已复制' : 'COPIED') : lang === 'zh' ? '复制 HEX' : 'COPY HEX'}
            </button>
          </div>

          <div className="layerbar">
            {(payload.layers ?? [{ name: { en: 'Payload', zh: '负载' }, bytes, color: 'var(--accent)' }]).map((l, i) => (
              <div
                key={i}
                className="layer-seg"
                style={{ flexGrow: Math.max(0.4, l.bytes), background: l.color }}
                title={`${l.name[lang]} · ${l.bytes} B`}
              >
                <span>{l.name[lang]}</span>
                <em>{l.bytes} B</em>
              </div>
            ))}
          </div>
          <div className="layer-scale">
            <span>0</span>
            <span>{totalLayer} bytes</span>
          </div>

          <div className="inspect-cols">
            <div className="fields">
              <div className="fields-head">
                <span>{lang === 'zh' ? '字段' : 'FIELD'}</span>
                <span>{lang === 'zh' ? '值' : 'VALUE'}</span>
              </div>
              {payload.fields.map((f, i) => {
                const on = i === field
                return (
                  <button
                    key={i}
                    className={`field ${on ? 'on' : ''}`}
                    onClick={() => setField(i)}
                    style={on ? { borderColor: payload.layers?.[0]?.color } : undefined}
                  >
                    <span className="field-top">
                      <span className="field-off">+0x{f.off.toString(16).padStart(2, '0')}</span>
                      <strong>{f.name[lang]}</strong>
                      <span className="field-len">{f.len ? `${f.len} B` : '—'}</span>
                    </span>
                    <span className="field-value">{f.value}</span>
                    <span className="field-note">{f.note[lang]}</span>
                  </button>
                )
              })}
            </div>

            <div className="hex-wrap">
              <div className="hex-head">
                <span>{lang === 'zh' ? '字节' : 'BYTES'}</span>
                <span>{bytes} {lang === 'zh' ? '在本消息中' : 'in this message'}</span>
              </div>
              <div className="hexdump">
                {rows.map((r, ri) => {
                  const rowStart = ri * 16
                  return (
                    <div className="hex-row" key={ri}>
                      <span className="hex-off">{(rowStart).toString(16).padStart(4, '0')}</span>
                      <span className="hex-bytes">
                        {Array.from({ length: 16 }).map((_, ci) => {
                          const b = r[ci]
                          if (!b) return <span key={ci} className="hex-byte blank">  </span>
                          const idx = rowStart + ci
                          const hot = selected && selected.len > 0 && idx >= selected.off && idx < selected.off + selected.len
                          return (
                            <span key={ci} className={`hex-byte ${hot ? 'hot' : ''}`}>
                              {b}
                            </span>
                          )
                        })}
                      </span>
                      <span className="hex-ascii">
                        {Array.from({ length: 16 }).map((_, ci) => {
                          const b = r[ci]
                          if (!b) return <span key={ci} className="hex-byte blank"> </span>
                          const idx = rowStart + ci
                          const hot = selected && selected.len > 0 && idx >= selected.off && idx < selected.off + selected.len
                          return (
                            <span key={ci} className={`hex-byte ${hot ? 'hot' : ''}`}>
                              {asciiOf(b)}
                            </span>
                          )
                        })}
                      </span>
                    </div>
                  )
                })}
              </div>
              {payload.note && <p className="hex-note">{payload.note[lang]}</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="inspect-empty">
          <div className="inspect-empty-art">
            <Icon name="layers" size={38} />
          </div>
          <h3>{lang === 'zh' ? '这是一个网络事件' : 'THIS EVENT CARRIES NO DECODED PAYLOAD'}</h3>
          <p>
            {lang === 'zh'
              ? `该事件传输 ${event.size}，属于“${event.info.zh}”。选择带字段详情的事件（如交易或区块头）可以逐字节查看。`
              : `${event.info.en} — ${event.size} on the wire. Select an event that carries a transaction or block header to inspect it byte by byte.`}
          </p>
          <button className="ctl" onClick={onClose}>
            <Icon name="prev" size={14} /> {lang === 'zh' ? '返回动画' : 'BACK TO SCENE'}
          </button>
        </div>
      )}
    </div>
  )
}

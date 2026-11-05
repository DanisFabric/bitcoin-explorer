import { useState, type CSSProperties } from 'react'
import type { Chapter, Lang } from '../types'
import { Icon } from './icons'

const FILTERS: { id: 'ALL' | 'CORE' | 'NETWORK' | 'LAYER 2'; en: string; zh: string }[] = [
  { id: 'ALL', en: 'ALL', zh: '全部' },
  { id: 'CORE', en: 'CORE', zh: '核心' },
  { id: 'NETWORK', en: 'NETWORK', zh: '网络' },
  { id: 'LAYER 2', en: 'LAYER 2', zh: '二层' },
]

export function Sidebar({
  chapters,
  labs,
  activeId,
  onSelect,
  progress,
  lang,
  filter,
  setFilter,
  open,
  onClose,
  onResetProgress,
  stepIndex,
  onStep,
}: {
  chapters: Chapter[]
  labs: Chapter[]
  activeId: string
  onSelect: (id: string) => void
  progress: Record<string, string>
  lang: Lang
  filter: 'ALL' | 'CORE' | 'NETWORK' | 'LAYER 2'
  setFilter: (f: 'ALL' | 'CORE' | 'NETWORK' | 'LAYER 2') => void
  open: boolean
  onClose: () => void
  onResetProgress: () => void
  stepIndex: number
  onStep: (i: number) => void
}) {
  const [menu, setMenu] = useState(false)
  const shown = chapters.filter((c) => filter === 'ALL' || c.category === filter)

  return (
    <>
      <aside className={`panel sidebar ${open ? 'open' : ''}`}>
        <div className="panel-head sidebar-head">
          <h2 className="panel-title">
            {lang === 'zh' ? '比特币协议' : 'BITCOIN PROTOCOLS'} <sup className="count">{chapters.length}</sup>
          </h2>
          <div className="head-actions">
            <button className="dots-btn" aria-label="Sidebar menu" onClick={() => setMenu((v) => !v)}>
              <Icon name="dots" size={18} />
            </button>
            <button className="drawer-close" aria-label="Close" onClick={onClose}>
              <Icon name="close" size={18} />
            </button>
            {menu && (
              <div className="mini-menu" onMouseLeave={() => setMenu(false)}>
                <button onClick={() => { onResetProgress(); setMenu(false) }}>
                  <Icon name="refresh" size={14} /> {lang === 'zh' ? '清除学习进度' : 'Reset progress'}
                </button>
                <div className="mini-note">
                  {lang === 'zh' ? '进度保存在此浏览器。' : 'Progress is stored in this browser.'}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="filters" role="tablist" aria-label="Filter protocols">
          {FILTERS.map((f) => {
            const n = f.id === 'ALL' ? chapters.length : chapters.filter((c) => c.category === f.id).length
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                className={`filter ${filter === f.id ? 'on' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                <span>{f[lang]}</span>
                <sup>{n}</sup>
              </button>
            )
          })}
        </div>

        <div className="chapter-list">
          {shown.map((c) => {
            const active = c.id === activeId
            const state = progress[c.id]
            return (
              <div key={c.id} className={`chapter ${active ? 'active' : ''}`}>
                <button className="chapter-btn" onClick={() => onSelect(c.id)} aria-expanded={active}>
                  <span className={`chapter-dot ${state ?? ''}`} />
                  <span className="chapter-name">
                    <strong>
                      {c.name}
                      <span className="step-count">
                        {c.steps.length} {lang === 'zh' ? '步' : 'STEPS'}
                      </span>
                    </strong>
                    <em>{c.subtitle[lang]}</em>
                  </span>
                  {state === 'done' ? (
                    <span className="chapter-check">
                      <Icon name="check" size={13} />
                    </span>
                  ) : (
                    <Icon name="chevron" size={15} className={`chapter-chev ${active ? 'down' : ''}`} />
                  )}
                </button>

                {active && c.steps.length > 0 && (
                  <div className="step-list">
                    {c.steps.map((s, i) => {
                      const done = state === 'done' || (state === 'in-progress' && i < stepIndex)
                      const current = i === stepIndex && state !== 'done'
                      return (
                        <button
                          key={i}
                          className={`step ${current ? 'on' : ''} ${done ? 'done' : ''}`}
                          onClick={() => onStep(i)}
                          style={{ '--i': i } as CSSProperties}
                        >
                          <span className="step-num">{done ? <Icon name="check" size={11} /> : i + 1}</span>
                          <span className="step-text">
                            <strong>{s.title[lang]}</strong>
                            <em>{s.short[lang]}</em>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="labs-head">
          <h3>
            {lang === 'zh' ? '交互实验' : 'INTERACTIVE LABS'} <sup className="count">{labs.length}</sup>
          </h3>
        </div>
        <div className="labs-list">
          {labs.map((l) => (
            <button key={l.id} className={`lab-item ${l.id === activeId ? 'active' : ''}`} onClick={() => onSelect(l.id)}>
              <span className="lab-glyph" style={{ color: l.accent }}>
                <Icon name={l.lab === 'difficulty' ? 'search' : l.lab === 'keys' ? 'key' : l.lab === 'merkle' ? 'layers' : l.lab === 'utxo' ? 'download' : 'spark'} size={16} />
              </span>
              <span className="lab-text">
                <strong>{l.name}</strong>
                <em>{l.labTagline?.[lang]}</em>
              </span>
              <Icon name="arrow" size={14} className="lab-arrow" />
            </button>
          ))}
        </div>

        <div className="sidebar-foot">
          <span>v1.0 · 2026</span>
          <span>{lang === 'zh' ? '本地运行 · 无追踪' : 'LOCAL · NO TRACKING'}</span>
        </div>
      </aside>
      <div className={`drawer-scrim ${open ? 'on' : ''}`} onClick={onClose} />
    </>
  )
}

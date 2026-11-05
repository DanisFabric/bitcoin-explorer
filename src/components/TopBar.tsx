import { useEffect, useState } from 'react'
import type { Chapter, Lang, T } from '../types'
import { Icon } from './icons'

export function TopBar({
  lang,
  setLang,
  theme,
  setTheme,
  chapter,
  stepIndex,
  completed,
  totalProtocols,
  progress,
  layers,
  onOpenLearn,
  onMenu,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  theme: 'light' | 'dark'
  setTheme: (t: 'light' | 'dark') => void
  chapter: Chapter
  stepIndex: number
  completed: number
  totalProtocols: number
  progress: Record<string, string>
  layers: T[]
  onOpenLearn: () => void
  onMenu: () => void
}) {
  const [langOpen, setLangOpen] = useState(false)
  const inProgress = Object.values(progress).filter((p) => p === 'in-progress').length
  const pct = Math.round((completed / totalProtocols) * 100)
  const steps = chapter.steps
  const stepDashes = steps.length || 5

  useEffect(() => {
    if (!langOpen) return
    const close = () => setLangOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [langOpen])

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenu} aria-label="Protocols">
        <Icon name="menu" size={20} />
      </button>

      <button className="brand" onClick={onOpenLearn} title={lang === 'zh' ? '所有课程与实验' : 'All chapters and labs'}>
        <BrandMark />
        <span className="brand-text">
          <span className="brand-name">BITCOIN EXPLORER</span>
          <span className="brand-tag">{lang === 'zh' ? '了解比特币如何运作' : 'LEARN HOW BITCOIN WORKS'}</span>
        </span>
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
      </button>

      <div className="now-learning">
        <span className="micro-label">{lang === 'zh' ? '正在学习' : 'NOW LEARNING'}</span>
        <button className="now-title" onClick={onOpenLearn}>
          {chapter.name} <span className="dim">·</span> {chapter.subtitle[lang].toUpperCase()}
        </button>
        <div className="now-meta">
          <span className="mini-dashes">
            {Array.from({ length: stepDashes }).map((_, i) => (
              <i key={i} className={steps.length && i <= stepIndex ? 'fill' : ''} />
            ))}
          </span>
          <span className="micro">
            {chapter.lab
              ? lang === 'zh'
                ? '交互实验'
                : 'INTERACTIVE LAB'
              : `${lang === 'zh' ? '概览' : 'OVERVIEW'} · ${steps.length} ${lang === 'zh' ? '步' : 'STEPS'}`}
          </span>
        </div>
      </div>

      <div className="stack">
        <span className="micro-label">{lang === 'zh' ? '比特币栈' : 'BITCOIN STACK'}</span>
        <span className="stack-active">{layers[chapter.layer - 1]?.[lang]}</span>
        <div className="stack-chips" aria-hidden="true">
          {layers.map((l, i) => (
            <span key={i} className={`stack-chip ${chapter.layer === i + 1 ? 'on' : ''}`} title={l[lang]}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      <div className="progress-block">
        <div className="progress-top">
          <span className="micro-label">{lang === 'zh' ? '学习进度' : 'LEARNING PROGRESS'}</span>
          <span className="progress-pct">{pct}%</span>
        </div>
        <div className="progress-bar">
          {Array.from({ length: totalProtocols }).map((_, i) => (
            <i key={i} className={i < completed ? 'done' : i === completed && inProgress > 0 ? 'partial' : ''} />
          ))}
        </div>
        <span className="micro progress-caption">
          {completed} / {totalProtocols} {lang === 'zh' ? '完成' : 'COMPLETE'} · {inProgress} {lang === 'zh' ? '进行中' : 'IN PROGRESS'}
        </span>
      </div>

      <div className="credit">
        <span className="micro-label">{lang === 'zh' ? '源自' : 'BASED ON'}</span>
        <span className="credit-name">
          <span className="credit-x">₿</span> Satoshi Nakamoto
        </span>
        <span className="micro dim">2008 · WHITEPAPER</span>
      </div>

      <div className="top-actions">
        <div className={`lang ${langOpen ? 'open' : ''}`}>
          <button
            className="icon-btn lang-btn"
            aria-label="Language"
            aria-expanded={langOpen}
            onClick={(e) => {
              e.stopPropagation()
              setLangOpen((v) => !v)
            }}
          >
            <Icon name="globe" size={17} />
            <span>{lang === 'zh' ? '中文' : 'EN'}</span>
            <Icon name="chevron" size={12} className="rot90" />
          </button>
          {langOpen && (
            <div className="lang-menu" onClick={(e) => e.stopPropagation()}>
              <button className={lang === 'en' ? 'on' : ''} onClick={() => { setLang('en'); setLangOpen(false) }}>
                <span>English</span><em>EN</em>
              </button>
              <button className={lang === 'zh' ? 'on' : ''} onClick={() => { setLang('zh'); setLangOpen(false) }}>
                <span>简体中文</span><em>ZH</em>
              </button>
            </div>
          )}
        </div>
        <button
          className="icon-btn theme-btn toggle-icon"
          aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Icon name="moon" size={18} className="tg-shape tg-moon" />
          <Icon name="sun" size={18} className="tg-shape tg-sun" />
        </button>
      </div>
    </header>
  )
}

function BrandMark() {
  return (
    <svg className="brand-mark" width="42" height="42" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 5 42 14.5 24 24 6 14.5 24 5Z" fill="var(--logo-top)" stroke="var(--logo-line)" strokeWidth="1.6" />
      <path d="M6 14.5v18L24 42V24L6 14.5Z" fill="var(--logo-left)" stroke="var(--logo-line)" strokeWidth="1.6" />
      <path d="M42 14.5v18L24 42V24l18-9.5Z" fill="var(--logo-right)" stroke="var(--logo-line)" strokeWidth="1.6" />
      <path d="M24 5v19M6 14.5 24 24l18-9.5" stroke="var(--logo-line)" strokeWidth="1.1" opacity=".55" />
      <text x="24" y="30" textAnchor="middle" fill="var(--logo-line)" fontSize="13" fontWeight="800" fontFamily="Iosevka, monospace">
        ₿
      </text>
    </svg>
  )
}

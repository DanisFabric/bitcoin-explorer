import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TopBar } from './components/TopBar'
import { Sidebar } from './components/Sidebar'
import { Scene } from './components/Scene'
import { SequenceView } from './components/SequenceView'
import { Inspector } from './components/Inspector'
import { EventTable } from './components/EventTable'
import { RightPanel } from './components/RightPanel'
import { HashLab } from './components/labs/HashLab'
import { MerkleLab } from './components/labs/MerkleLab'
import { KeyLab } from './components/labs/KeyLab'
import { UtxoLab } from './components/labs/UtxoLab'
import { DifficultyLab } from './components/labs/DifficultyLab'
import { chapters, layerNames, labs, protocols } from './data/chapters'
import type { Chapter, Lang } from './types'
import { Icon } from './components/icons'

type Progress = Record<string, 'in-progress' | 'done'>

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function App() {
  const [chapterId, setChapterId] = useState(chapters[0].id)
  const [stepIndex, setStepIndex] = useState(0)
  const [panel, setPanel] = useState<'overview' | 'step'>('overview')
  const [view, setView] = useState<'network' | 'sequence'>('network')
  const [selected, setSelected] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' ? ((document.documentElement.dataset.theme as 'light' | 'dark') ?? 'light') : 'light',
  )
  const [lang, setLang] = useState<Lang>(() => load<Lang>('btc-explorer:lang', 'en'))
  const [progress, setProgress] = useState<Progress>(() => load<Progress>('btc-explorer:progress', {}))
  const [drawer, setDrawer] = useState(false)
  const [learnOpen, setLearnOpen] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'CORE' | 'NETWORK' | 'LAYER 2'>('ALL')

  const chapter = chapters.find((c) => c.id === chapterId) ?? chapters[0]
  const isLab = Boolean(chapter.lab)

  const total = useMemo(() => {
    if (!chapter.events.length) return 1
    return Math.max(...chapter.events.map((e) => e.t)) + 2.4
  }, [chapter])

  const timeRef = useRef(0)
  useEffect(() => {
    timeRef.current = time
  }, [time])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('btc-explorer:theme', theme)
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute('content', theme === 'dark' ? '#0b1020' : '#fbfcff')
    }
  }, [theme])

  useEffect(() => {
    localStorage.setItem('btc-explorer:lang', JSON.stringify(lang))
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }, [lang])

  useEffect(() => {
    localStorage.setItem('btc-explorer:progress', JSON.stringify(progress))
  }, [progress])

  const mark = useCallback((id: string, state: 'in-progress' | 'done') => {
    setProgress((p) => (p[id] === 'done' ? p : { ...p, [id]: state }))
  }, [])

  const setChapter = useCallback((id: string) => {
    setChapterId(id)
    setStepIndex(0)
    setPanel('overview')
    setSelected(null)
    setPlaying(false)
    setTime(0)
    timeRef.current = 0
    setDrawer(false)
  }, [])

  const gotoStep = useCallback(
    (i: number) => {
      const safe = Math.max(0, Math.min(chapter.steps.length - 1, i))
      setStepIndex(safe)
      setPanel('step')
      setSelected(null)
      setPlaying(false)
      const next = chapter.steps[safe]?.t ?? 0
      setTime(next)
      timeRef.current = next
      if (!isLab) mark(chapter.id, 'in-progress')
    },
    [chapter, isLab, mark],
  )

  const play = useCallback(() => {
    if (isLab) return
    if (timeRef.current >= total - 0.05) {
      timeRef.current = 0
      setTime(0)
    }
    setSelected(null)
    setPanel('step')
    setPlaying((p) => !p)
    mark(chapter.id, 'in-progress')
  }, [chapter.id, isLab, mark, total])

  const review = useCallback(() => {
    setPanel('overview')
    setSelected(null)
    setPlaying(false)
    setTime(0)
    timeRef.current = 0
  }, [])

  const reset = useCallback(() => {
    setPanel('overview')
    setSelected(null)
    setPlaying(false)
    setTime(0)
    timeRef.current = 0
    setStepIndex(0)
    setView('network')
  }, [])

  const stepEvent = useCallback(
    (dir: 1 | -1) => {
      setSelected(null)
      setPanel('step')
      setPlaying(false)
      const events = chapter.events
      const now = timeRef.current
      let target: number | undefined
      if (dir === 1) target = events.find((e) => e.t > now + 0.02)?.t
      else target = [...events].reverse().find((e) => e.t < now - 0.02)?.t
      if (target === undefined) target = dir === 1 ? 0 : 0
      setTime(target)
      timeRef.current = target
      mark(chapter.id, 'in-progress')
    },
    [chapter, mark],
  )

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const next = timeRef.current + dt * speed
      if (next >= total) {
        timeRef.current = total
        setTime(total)
        setPlaying(false)
        mark(chapter.id, 'done')
        return
      }
      timeRef.current = next
      setTime(next)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, total, chapter.id, mark])

  useEffect(() => {
    if (!playing) return
    let idx = 0
    chapter.steps.forEach((s, i) => {
      if (time >= s.t) idx = i
    })
    setStepIndex(idx)
  }, [time, playing, chapter])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
      if (e.code === 'Space') {
        e.preventDefault()
        play()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        stepEvent(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        stepEvent(-1)
      } else if (e.key === 'Escape') {
        setSelected(null)
      } else if (e.key.toLowerCase() === 'n') {
        setView('network')
      } else if (e.key.toLowerCase() === 's') {
        setView('sequence')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [play, stepEvent])

  const completed = protocols.filter((p) => progress[p.id] === 'done').length
  const activeStep = chapter.steps[stepIndex]
  // The overview keeps the whole network in frame; step mode may pan to the actors involved.
  const focus = panel === 'step' ? activeStep?.focus ?? [] : []

  const rightPanel = (
    <RightPanel
      chapter={chapter}
      panel={panel}
      stepIndex={stepIndex}
      lang={lang}
      onOverview={review}
      onStep={gotoStep}
      progress={progress[chapter.id]}
      completed={completed}
      onStart={play}
    />
  )

  return (
    <div className="app">
      <TopBar
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        chapter={chapter}
        stepIndex={stepIndex}
        completed={completed}
        totalProtocols={protocols.length}
        progress={progress}
        layers={layerNames}
        onOpenLearn={() => setLearnOpen((v) => !v)}
        onMenu={() => setDrawer(true)}
      />
      <div className="workspace">
        <Sidebar
          chapters={protocols}
          labs={labs}
          activeId={chapter.id}
          onSelect={setChapter}
          progress={progress}
          lang={lang}
          filter={filter}
          setFilter={setFilter}
          open={drawer}
          onClose={() => setDrawer(false)}
          onResetProgress={() => setProgress({})}
          stepIndex={stepIndex}
          onStep={gotoStep}
        />

        <div className="right-area">
          {isLab ? (
            <div className="top-row">
              <section className="panel lab-panel">
                {chapter.lab === 'hash' && <HashLab lang={lang} />}
                {chapter.lab === 'merkle' && <MerkleLab lang={lang} />}
                {chapter.lab === 'keys' && <KeyLab lang={lang} />}
                {chapter.lab === 'utxo' && <UtxoLab lang={lang} />}
                {chapter.lab === 'difficulty' && <DifficultyLab lang={lang} />}
              </section>
              {rightPanel}
            </div>
          ) : (
            <>
              <div className="top-row">
                <section className="panel simulation">
                <div className="view-tabs" role="tablist" aria-label="Visualisation mode">
                  <button
                    role="tab"
                    aria-selected={view === 'network'}
                    className={`view-tab ${view === 'network' ? 'on' : ''}`}
                    onClick={() => setView('network')}
                  >
                    <Icon name="layers" /> {lang === 'zh' ? '网络' : 'NETWORK'}
                  </button>
                  <button
                    role="tab"
                    aria-selected={view === 'sequence'}
                    className={`view-tab ${view === 'sequence' ? 'on' : ''}`}
                    onClick={() => setView('sequence')}
                  >
                    <Icon name="sequence" /> {lang === 'zh' ? '时序' : 'SEQUENCE'}
                  </button>
                </div>

                {selected !== null ? (
                  <Inspector
                    chapter={chapter}
                    eventId={selected}
                    lang={lang}
                    onClose={() => setSelected(null)}
                    onPrev={() => {
                      const i = chapter.events.findIndex((e) => e.id === selected)
                      const prev = chapter.events[(i - 1 + chapter.events.length) % chapter.events.length]
                      setSelected(prev.id)
                    }}
                    onNext={() => {
                      const i = chapter.events.findIndex((e) => e.id === selected)
                      const next = chapter.events[(i + 1) % chapter.events.length]
                      setSelected(next.id)
                    }}
                  />
                ) : view === 'network' ? (
                  <Scene chapter={chapter} time={time} focus={focus} playing={playing} lang={lang} stepIndex={stepIndex} />
                ) : (
                  <SequenceView chapter={chapter} time={time} lang={lang} stepIndex={stepIndex} onSelect={(id) => { setSelected(id); setPlaying(false) }} />
                )}
              </section>
              {rightPanel}
              </div>

              <EventTable
                chapter={chapter}
                time={time}
                lang={lang}
                selected={selected}
                playing={playing}
                speed={speed}
                onSpeed={() => setSpeed((s) => (s === 0.5 ? 1 : s === 1 ? 2 : 0.5))}
                onPlay={play}
                onStep={stepEvent}
                onReset={reset}
                onSelect={(id) => {
                  setSelected(id)
                  setPlaying(false)
                  setPanel('step')
                }}
              />
            </>
          )}
        </div>
      </div>

      {!isLab && (
        <div className="mobile-controls">
          <button className="ctl small" onClick={() => setSpeed((s) => (s === 0.5 ? 1 : s === 1 ? 2 : 0.5))}>
            {speed}×
          </button>
          <button className="ctl" onClick={() => stepEvent(-1)} aria-label="Previous event">
            <Icon name="prev" />
          </button>
          <button className="ctl primary wide" onClick={play}>
            <Icon name={playing ? 'pause' : 'play'} /> {playing ? (lang === 'zh' ? '暂停' : 'PAUSE') : lang === 'zh' ? '播放' : 'PLAY'}
          </button>
          <button className="ctl" onClick={() => stepEvent(1)}>
            {lang === 'zh' ? '单步' : 'STEP'}
          </button>
          <button className="ctl" onClick={reset} aria-label="Reset">
            <Icon name="reset" />
          </button>
        </div>
      )}

      {learnOpen && (
        <LearnMenu lang={lang} onClose={() => setLearnOpen(false)} onPick={(id) => { setChapter(id); setLearnOpen(false) }} />
      )}
    </div>
  )
}

function LearnMenu({ lang, onClose, onPick }: { lang: Lang; onClose: () => void; onPick: (id: string) => void }) {
  return (
    <div className="learn-overlay" onClick={onClose}>
      <div className="learn-card" onClick={(e) => e.stopPropagation()}>
        <div className="learn-head">
          <span>{lang === 'zh' ? '开始学习' : 'START LEARNING'}</span>
          <button onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <p className="learn-intro">
          {lang === 'zh'
            ? '八章协议课程与五个可交互实验。按顺序学习，或直接跳进任意实验。'
            : 'Eight protocol chapters and five interactive labs. Follow the path, or jump straight into a lab.'}
        </p>
        <div className="learn-grid">
          {[...protocols, ...labs].map((c) => (
            <button key={c.id} className="learn-item" onClick={() => onPick(c.id)}>
              <span className="li-cat">{c.category}</span>
              <strong>{c.name}</strong>
              <span className="li-sub">{c.subtitle[lang]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

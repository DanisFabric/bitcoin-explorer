import type { Chapter, Lang, T } from '../types'
import { Icon } from './icons'

const LAB_HINTS: Record<string, T[]> = {
  hash: [
    { en: 'Edit any header field — the digest changes completely.', zh: '修改任意区块头字段，摘要会彻底改变。' },
    { en: 'Press MINE and watch the nonce race the target.', zh: '点击“挖矿”，观察 nonce 与目标赛跑。' },
    { en: 'Raise the leading-zero target to feel real difficulty.', zh: '提高前导零目标，感受真实难度。' },
  ],
  merkle: [
    { en: 'Click a leaf, then tamper with one byte.', zh: '点击叶子，然后篡改一个字节。' },
    { en: 'Watch the root change at every level.', zh: '观察根在每一层发生的变化。' },
    { en: 'Verify inclusion with three sibling hashes.', zh: '用三个兄弟哈希验证包含关系。' },
  ],
  keys: [
    { en: 'Generate a fresh keypair — it never leaves the browser.', zh: '生成新密钥对——它不会离开浏览器。' },
    { en: 'Sign a message, then edit one character and verify again.', zh: '签署消息，然后改动一个字符再验证。' },
    { en: 'Compare the Base58 address with the compressed key.', zh: '对比 Base58 地址与压缩公钥。' },
  ],
  utxo: [
    { en: 'Select coins until the payment plus fee is covered.', zh: '选择币，直到覆盖付款加手续费。' },
    { en: 'Raise the fee rate and watch change shrink.', zh: '提高费率，观察找零减少。' },
    { en: 'A change output below dust becomes extra fee.', zh: '低于粉尘阈值的找零会变成额外手续费。' },
  ],
  difficulty: [
    { en: 'Hover a year to read difficulty and hashrate.', zh: '悬停年份查看难度与算力。' },
    { en: 'Toggle the log scale to compare eras.', zh: '切换对数刻度比较不同年代。' },
    { en: 'Halvings cut subsidy, not security — look at the line.', zh: '减半削减补贴而非安全——看折线就明白。' },
  ],
}

export function RightPanel({
  chapter,
  panel,
  stepIndex,
  lang,
  onOverview,
  onStep,
  progress,
  completed,
  onStart,
}: {
  chapter: Chapter
  panel: 'overview' | 'step'
  stepIndex: number
  lang: Lang
  onOverview: () => void
  onStep: (i: number) => void
  progress?: string
  completed: number
  onStart: () => void
}) {
  const step = chapter.steps[stepIndex]
  const isLab = Boolean(chapter.lab)
  const isDone = !isLab && progress === 'done'
  const showStep = panel === 'step' && !isLab && step && !isDone

  const status = isLab ? { en: 'LAB', zh: '实验' } : progress === 'done' ? { en: 'COMPLETE', zh: '已完成' } : progress ? { en: 'IN PROGRESS', zh: '进行中' } : { en: 'ACTIVE', zh: '可用' }

  return (
    <aside className={`panel right ${showStep ? 'is-step' : ''}`}>
      <div className="panel-head right-head">
        <h2 className="panel-title">
          {showStep ? (lang === 'zh' ? '步骤详情' : 'STEP DETAILS') : isDone ? (lang === 'zh' ? '课程总结' : 'LESSON SUMMARY') : isLab ? (lang === 'zh' ? '实验说明' : 'LAB NOTES') : lang === 'zh' ? '协议概览' : 'PROTOCOL OVERVIEW'}
        </h2>
        <div className="right-actions">
          {showStep && (
            <button className="overview-back" onClick={onOverview}>
              <Icon name="prev" size={12} /> {lang === 'zh' ? '概览' : 'OVERVIEW'}
            </button>
          )}
          <button className="dots-btn" aria-label="More">
            <Icon name="dots" size={16} />
          </button>
        </div>
      </div>

      {showStep ? (
        <div className="right-body step-body">
          <div className="step-crumb">
            {lang === 'zh' ? '第' : 'STEP'} {stepIndex + 1} {lang === 'zh' ? '步 / 共' : 'OF'} {chapter.steps.length}
            <span className="crumb-dashes">
              {chapter.steps.map((s, i) => (
                <button key={i} className={i === stepIndex ? 'on' : ''} onClick={() => onStep(i)} aria-label={s.title[lang]} />
              ))}
            </span>
          </div>
          <h3 className="step-title">{step.title[lang]}</h3>
          <p className="step-short">{step.short[lang]}</p>
          <p className="step-long">{step.body[lang]}</p>

          <div className="fact-list">
            {step.facts.map((f, i) => (
              <div className="fact" key={i}>
                <span>{f.label[lang]}</span>
                <i />
                <strong>{f.value}</strong>
              </div>
            ))}
          </div>

          <div className="step-next">
            {stepIndex < chapter.steps.length - 1 ? (
              <button onClick={() => onStep(stepIndex + 1)}>
                {lang === 'zh' ? '下一步' : 'NEXT STEP'} · {chapter.steps[stepIndex + 1].title[lang]} <Icon name="arrow" size={14} />
              </button>
            ) : (
              <button onClick={onOverview}>
                {lang === 'zh' ? '完成本课' : 'FINISH CHAPTER'} <Icon name="check" size={14} />
              </button>
            )}
          </div>
        </div>
      ) : isDone ? (
        <div className="right-body done-body">
          <div className="done-mark">
            <span><Icon name="check" size={24} /></span>
          </div>
          <div className="right-hero done-hero">
            <div className="hero-top">
              <span className="protocol-kicker">{chapter.category}</span>
              <span className="status-pill done"><i /> {status[lang]}</span>
            </div>
            <h3 className="right-name">{chapter.name}</h3>
            <p className="right-sub">{chapter.subtitle[lang]}</p>
          </div>

          <p className="right-summary">{chapter.summary[lang]}</p>

          <div className="done-steps">
            <h4>
              {lang === 'zh' ? '你已覆盖' : 'WHAT YOU COVERED'} <span>{chapter.steps.length}</span>
            </h4>
            <div className="done-step-list">
              {chapter.steps.map((s, i) => (
                <div className="done-step" key={i}>
                  <span className="done-check"><Icon name="check" size={9} /></span>
                  <strong>{s.title[lang]}</strong>
                  <em>{s.short[lang]}</em>
                </div>
              ))}
            </div>
          </div>

          <button className="start-btn replay" onClick={onStart}>
            <Icon name="reset" size={14} />
            {lang === 'zh' ? '重新播放完整流程' : 'REPLAY WALKTHROUGH'}
          </button>

          <div className="right-foot">
            <Icon name="lock" size={13} />
            <span>{lang === 'zh' ? '已记录到本机学习进度；可随时清除。' : 'Marked complete in your local progress. Reset anytime from the sidebar.'}</span>
          </div>

          <div className="right-progress">
            <span>{lang === 'zh' ? '总进度' : 'COURSE PROGRESS'}</span>
            <div className="rp-bar">
              {Array.from({ length: 8 }).map((_, i) => (
                <i key={i} className={i < completed ? 'done' : ''} />
              ))}
            </div>
            <em>{completed}/8</em>
          </div>
        </div>
      ) : (
        <div className="right-body">
          <div className="right-hero">
            <div className="hero-top">
              <span className="protocol-kicker">{chapter.category === 'LAB' ? (lang === 'zh' ? '交互实验' : 'INTERACTIVE LAB') : chapter.category}</span>
              <span className={`status-pill ${progress ?? (isLab ? 'lab' : '')}`}>
                <i /> {status[lang]}
              </span>
            </div>
            <h3 className="right-name">{chapter.name}</h3>
            <p className="right-sub">{chapter.subtitle[lang]}</p>
          </div>

          <p className="right-summary">{chapter.summary[lang]}</p>

          <div className="fact-list meta-list">
            {chapter.meta.map((f, i) => (
              <div className="fact" key={i}>
                <span>{f.label[lang]}</span>
                <i />
                <strong>{f.value}</strong>
              </div>
            ))}
          </div>

          {isLab ? (
            <div className="lab-hints">
              <h4>{lang === 'zh' ? '试试这些' : 'TRY THIS'}</h4>
              <ol>
                {(LAB_HINTS[chapter.id] ?? []).map((h, i) => (
                  <li key={i}>{h[lang]}</li>
                ))}
              </ol>
            </div>
          ) : (
            <>
              <div className="step-index">
                <h4>
                  {lang === 'zh' ? '本课步骤' : 'IN THIS CHAPTER'} <span>{chapter.steps.length}</span>
                </h4>
                <div className="step-index-list">
                  {chapter.steps.map((s, i) => (
                    <button key={i} className={i === stepIndex ? 'on' : ''} onClick={() => onStep(i)}>
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      <strong>{s.title[lang]}</strong>
                      <Icon name="chevron" size={11} />
                    </button>
                  ))}
                </div>
              </div>
              <button className="start-btn" onClick={onStart}>
                <Icon name="play" size={14} />
                {lang === 'zh' ? '播放完整流程' : 'PLAY THE WALKTHROUGH'}
              </button>
            </>
          )}

          <div className="right-foot">
            <Icon name={isLab ? 'spark' : 'lock'} size={13} />
            <span>
              {isLab
                ? lang === 'zh'
                  ? '所有计算都在你的浏览器中完成，不会广播任何内容。'
                  : 'Everything runs in your browser. Nothing is broadcast.'
                : lang === 'zh'
                  ? '数据为教学模拟；主网参数与真实协议一致。'
                  : 'Simulated data, real protocol parameters.'}
            </span>
          </div>

          {!isLab && (
            <div className="right-progress">
              <span>{lang === 'zh' ? '总进度' : 'COURSE PROGRESS'}</span>
              <div className="rp-bar">
                {Array.from({ length: 8 }).map((_, i) => (
                  <i key={i} className={i < completed ? 'done' : ''} />
                ))}
              </div>
              <em>{completed}/8</em>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}

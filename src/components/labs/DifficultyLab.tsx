import { useMemo, useState } from 'react'
import type { Lang } from '../../types'

interface Point { year: number; diff: number; reward: number; note?: string }

const POINTS: Point[] = [
  { year: 2009.02, diff: 1, reward: 50 },
  { year: 2009.99, diff: 1.18, reward: 50 },
  { year: 2010.99, diff: 14_484, reward: 50 },
  { year: 2011.99, diff: 1_564_050, reward: 50 },
  { year: 2012.99, diff: 3_249_750, reward: 25 },
  { year: 2013.99, diff: 1_180_000_000, reward: 25 },
  { year: 2014.99, diff: 40_300_000_000, reward: 25 },
  { year: 2015.99, diff: 120_000_000_000, reward: 25 },
  { year: 2016.99, diff: 317_588_000_000, reward: 12.5 },
  { year: 2017.99, diff: 1_364_422_000_000, reward: 12.5 },
  { year: 2018.99, diff: 5_618_426_000_000, reward: 12.5 },
  { year: 2019.99, diff: 13_000_000_000_000, reward: 12.5 },
  { year: 2020.99, diff: 18_670_000_000_000, reward: 6.25 },
  { year: 2021.99, diff: 24_000_000_000_000, reward: 6.25 },
  { year: 2022.99, diff: 35_364_000_000_000, reward: 6.25 },
  { year: 2023.99, diff: 72_000_000_000_000, reward: 6.25 },
  { year: 2024.99, diff: 109_000_000_000_000, reward: 3.125 },
  { year: 2025.99, diff: 130_000_000_000_000, reward: 3.125 },
  { year: 2026.85, diff: 152_000_000_000_000, reward: 3.125 },
]

const HALVINGS = [
  { year: 2012.91, block: 210_000, reward: '25' },
  { year: 2016.52, block: 420_000, reward: '12.5' },
  { year: 2020.37, block: 630_000, reward: '6.25' },
  { year: 2024.30, block: 840_000, reward: '3.125' },
  { year: 2028.3, block: 1_050_000, reward: '1.5625', future: true },
]

const hashrateEH = (diff: number) => diff * 7.158e-12

function short(n: number) {
  if (n >= 1e15) return (n / 1e15).toFixed(1) + 'P'
  if (n >= 1e12) return (n / 1e12).toFixed(n >= 1e14 ? 0 : 1) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'G'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(n < 10 ? 2 : 0)
}

export function DifficultyLab({ lang }: { lang: Lang }) {
  const L = (en: string, zh: string) => (lang === 'zh' ? zh : en)
  const [log, setLog] = useState(true)
  const [hover, setHover] = useState<number | null>(null)

  const W = 1000
  const H = 560
  const ml = 76
  const mr = 74
  const mt = 66
  const mb = 72
  const x = (year: number) => ml + ((year - 2009) / (2027.4 - 2009)) * (W - ml - mr)
  const logY = (d: number) => mt + (1 - Math.log10(Math.max(1, d)) / 15) * (H - mt - mb)
  const linMax = 1.6e14
  const linY = (d: number) => mt + (1 - d / linMax) * (H - mt - mb)
  const y = log ? logY : linY

  const line = useMemo(() => {
    return POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.year).toFixed(1)} ${y(p.diff).toFixed(1)}`).join(' ')
  }, [log, hover])

  const area = `${line} L ${x(POINTS[POINTS.length - 1].year)} ${H - mb} L ${x(POINTS[0].year)} ${H - mb} Z`

  const ticks = log ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 0.4e14, 0.8e14, 1.2e14, 1.6e14]
  const subsidyY = (r: number) => H - mb - (r / 50) * (H - mt - mb) * 0.22

  const point = hover !== null ? POINTS[hover] : POINTS[POINTS.length - 1]

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    let bd = Infinity
    POINTS.forEach((p, i) => {
      const d = Math.abs(x(p.year) - px)
      if (d < bd) { bd = d; best = i }
    })
    setHover(best)
  }

  return (
    <div className="lab diff-lab">
      <div className="lab-topbar">
        <div>
          <span className="lab-kicker">{L('INTERACTIVE LAB 05', '交互实验 05')}</span>
          <h2>{L('SEVENTEEN YEARS OF WORK', '十七年的工作量')}</h2>
        </div>
        <div className="lab-topactions">
          <div className="seg-toggle">
            <button className={log ? 'on' : ''} onClick={() => setLog(true)}>LOG</button>
            <button className={!log ? 'on' : ''} onClick={() => setLog(false)}>LINEAR</button>
          </div>
          <span className="lab-badge">{L('hover the curve', '悬停折线')}</span>
        </div>
      </div>

      <div className="lab-card chart-card">
        <div className="chart-legend">
          <span><i className="sw diff" /> {L('difficulty', '难度')}</span>
          <span><i className="sw reward" /> {L('block subsidy', '区块补贴')}</span>
          <span><i className="sw halving" /> {L('halving', '减半')}</span>
        </div>

        <div className="chart-readout">
          <div>
            <span>{L('YEAR', '年份')}</span>
            <strong>{Math.floor(point.year)}</strong>
          </div>
          <div>
            <span>{L('DIFFICULTY', '难度')}</span>
            <strong>{short(point.diff)}</strong>
          </div>
          <div>
            <span>{L('HASHRATE', '算力')}</span>
            <strong>{short(hashrateEH(point.diff))}H/s</strong>
          </div>
          <div>
            <span>{L('SUBSIDY', '补贴')}</span>
            <strong>{point.reward} BTC</strong>
          </div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f7931a" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#f7931a" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {ticks.map((t, i) => {
            const ty = log ? logY(10 ** t) : linY(t)
            return (
              <g key={i}>
                <line x1={ml} y1={ty} x2={W - mr} y2={ty} className="grid-line" />
                <text x={ml - 12} y={ty + 4} textAnchor="end" className="axis-label">
                  {log ? (t === 0 ? '1' : `10${sup(t)}`) : short(t)}
                </text>
              </g>
            )
          })}

          {[2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024, 2026].map((yr) => (
            <g key={yr}>
              <line x1={x(yr)} y1={mt} x2={x(yr)} y2={H - mb} className="grid-line v" />
              <text x={x(yr)} y={H - mb + 24} textAnchor="middle" className="axis-label">{yr}</text>
            </g>
          ))}

          {HALVINGS.map((h, i) => (
            <g key={i} className={`halving ${h.future ? 'future' : ''}`}>
              <line x1={x(h.year)} y1={mt} x2={x(h.year)} y2={H - mb} className="halving-line" />
              <rect x={x(h.year) - 22} y={mt - 30} width="44" height="17" className="halving-tag" />
              <text x={x(h.year)} y={mt - 18} textAnchor="middle" className="halving-text">{h.reward}</text>
              <text x={x(h.year)} y={H - mb + 42} textAnchor="middle" className="halving-block">
                {h.future ? L('NEXT', '下次') : `#${(h.block / 1000).toFixed(0)}K`}
              </text>
            </g>
          ))}

          <path d={area} fill="url(#areaFill)" />
          <path d={line} className="diff-line" />

          <path
            d={POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.year)} ${subsidyY(p.reward)}`).join(' ')}
            className="reward-line"
          />

          {POINTS.map((p, i) => (
            <circle key={i} cx={x(p.year)} cy={y(p.diff)} r={hover === i ? 5 : 3} className={`point ${hover === i ? 'on' : ''}`} />
          ))}

          {hover !== null && (
            <line x1={x(POINTS[hover].year)} y1={mt} x2={x(POINTS[hover].year)} y2={H - mb} className="crosshair" />
          )}

          <text x={ml} y={mt - 18} className="axis-title">{L('DIFFICULTY (LOG)', '难度（对数）')}</text>
          <text x={W - mr + 10} y={subsidyY(50) + 4} className="axis-label">{L('50 BTC', '50 BTC')}</text>
          <text x={W - mr + 10} y={subsidyY(3.125) + 4} className="axis-label">{L('3.125', '3.125')}</text>
        </svg>
      </div>

      <div className="diff-stats">
        <div><span>{L('DIFFICULTY GROWTH', '难度增长')}</span><strong>1 → 152T</strong><em>× 1.52 × 10¹⁴</em></div>
        <div><span>{L('HASHRATE TODAY', '今日全网算力')}</span><strong>≈ 1.09 ZH/s</strong><em>{L('modeled from difficulty', '由难度推算')}</em></div>
        <div><span>{L('BLOCKS MINED', '已挖区块')}</span><strong>870,001</strong><em>{L('since 2009-01-03', '自 2009-01-03')}</em></div>
        <div><span>{L('NEXT HALVING', '下次减半')}</span><strong>2028</strong><em>{L('1.5625 BTC subsidy', '补贴 1.5625 BTC')}</em></div>
      </div>
    </div>
  )
}

function sup(n: number) {
  const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
  return String(n).split('').map((c) => map[c] ?? c).join('')
}

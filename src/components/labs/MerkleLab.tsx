import { useMemo, useState } from 'react'
import { MERKLE_ROOT, MERKLE_TXIDS } from '../../data/payloads'
import { merkleLevels } from '../../lib/btc'
import type { Lang } from '../../types'
import { Icon } from '../icons'

export function MerkleLab({ lang }: { lang: Lang }) {
  const L = (en: string, zh: string) => (lang === 'zh' ? zh : en)
  const [selected, setSelected] = useState(5)
  const [tampered, setTampered] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const txids = useMemo(
    () =>
      MERKLE_TXIDS.map((h, i) =>
        i === tampered ? (h[0] === '0' ? '1' : '0') + h.slice(1) : h,
      ),
    [tampered],
  )
  const levels = useMemo(() => merkleLevels(txids), [txids])
  const root = levels[levels.length - 1][0]

  const proof = useMemo(() => {
    const siblings: { hash: string; dir: 'L' | 'R' }[] = []
    const path: number[] = []
    let idx = selected
    for (let l = 0; l < levels.length - 1; l++) {
      const sib = idx ^ 1
      siblings.push({ hash: levels[l][sib] ?? levels[l][idx], dir: sib < idx ? 'L' : 'R' })
      path.push(idx)
      idx >>= 1
    }
    path.push(0)
    return { siblings, path }
  }, [levels, selected])

  const rootOk = root === MERKLE_ROOT && tampered === null

  const copyRoot = async () => {
    try {
      await navigator.clipboard.writeText(root)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { /* ignore */ }
  }

  const nodeW = 104
  const height = 560
  const top = 42
  const bottom = 470
  const gap = (bottom - top) / (levels.length - 1)
  const xOf = (level: number, index: number) => {
    const count = levels[level].length
    const step = 880 / count
    return 60 + (index + 0.5) * step
  }
  const yOf = (level: number) => bottom - level * gap

  return (
    <div className="lab merkle-lab">
      <div className="lab-topbar">
        <div>
          <span className="lab-kicker">{L('INTERACTIVE LAB 02', '交互实验 02')}</span>
          <h2>{L('MERKLE INCLUSION PROOF', 'MERKLE 包含证明')}</h2>
        </div>
        <div className="lab-topactions">
          <button
            className={`ctl ${tampered !== null ? 'stop' : ''}`}
            onClick={() => setTampered(tampered === null ? selected : null)}
          >
            <Icon name="warning" size={14} /> {tampered !== null ? L('RESTORE LEAF', '恢复叶子') : L('TAMPER WITH LEAF', '篡改叶子')}
          </button>
          <span className={`verify-pill ${rootOk ? 'ok' : 'bad'}`}>
            <i /> {rootOk ? L('PROOF VALID', '证明有效') : L('ROOT MISMATCH', '根不匹配')}
          </span>
        </div>
      </div>

      <div className="merkle-stage">
        <svg viewBox={`0 0 1000 ${height}`} className="merkle-svg">
          {levels.map((level, l) => {
            if (l === 0) return null
            return level.map((_, i) => {
              const parent = Math.floor(i / 2)
              const x1 = xOf(l, i)
              const y1 = yOf(l) - 15
              const x2 = xOf(l - 1, parent)
              const y2 = yOf(l - 1) + 15
              const onPath = proof.path[l - 1] === parent
              return <line key={`e${l}-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} className={`tree-edge ${onPath ? 'path' : ''}`} />
            })
          })}

          {levels.map((level, l) =>
            level.map((hash, i) => {
              const isLeaf = l === 0
              const isSelectedLeaf = isLeaf && i === selected
              const sibling = proof.siblings[l]
              const isSibling = !isLeaf && sibling && proof.path[l] === i
              const onPath = proof.path[l] === i
              const tamperedNode = tampered === i && isLeaf
              return (
                <g
                  key={`${l}-${i}`}
                  className={`tree-node ${isLeaf ? 'leaf' : ''} ${isSelectedLeaf ? 'selected' : ''} ${isSibling ? 'sibling' : ''} ${onPath ? 'path' : ''} ${tamperedNode ? 'tampered' : ''}`}
                  onClick={() => isLeaf && setSelected(i)}
                  style={{ cursor: isLeaf ? 'pointer' : 'default' }}
                >
                  <rect x={xOf(l, i) - nodeW / 2} y={yOf(l)} width={nodeW} height="30" rx="2" />
                  <text x={xOf(l, i)} y={yOf(l) + 13} textAnchor="middle" className="tree-idx">
                    {isLeaf ? `TX ${String(i + 1).padStart(2, '0')}` : `${l === levels.length - 1 ? 'ROOT' : `H${l}.${i}`}`}
                  </text>
                  <text x={xOf(l, i)} y={yOf(l) + 24} textAnchor="middle" className="tree-hash">
                    {hash.slice(0, 8)}…{hash.slice(-4)}
                  </text>
                  <title>{hash}</title>
                  {isLeaf && <circle cx={xOf(l, i) - nodeW / 2 - 8} cy={yOf(l) + 15} r="3" className="leaf-dot" />}
                </g>
              )
            }),
          )}

          <text x="60" y={bottom + 44} className="tree-label">{L('LEAVES · TXIDS', '叶子 · 交易 ID')}</text>
          <text x="60" y={yOf(levels.length - 1) - 22} className="tree-label">{L('ROOT COMMITTED IN HEADER', '写入区块头的根')}</text>
        </svg>

        <div className="merkle-side">
          <div className="root-card">
            <span>{L('HEADER MERKLE ROOT', '区块头 MERKLE 根')}</span>
            <code>{MERKLE_ROOT.slice(0, 32)}…</code>
            <button onClick={copyRoot}><Icon name="copy" size={12} /> {copied ? L('COPIED', '已复制') : 'COPY'}</button>
          </div>
          <div className={`root-card computed ${rootOk ? '' : 'bad'}`}>
            <span>{L('COMPUTED FROM LEAF', '由叶子重新计算')}</span>
            <code>{root.slice(0, 32)}…</code>
            <em>{L(`${proof.siblings.length} hashes · ${proof.siblings.length * 32} bytes`, `${proof.siblings.length} 个哈希 · ${proof.siblings.length * 32} 字节`)}</em>
          </div>

          <div className="proof-list">
            <h4>{L('PROOF PATH', '证明路径')} <em>TX {String(selected + 1).padStart(2, '0')}</em></h4>
            {proof.siblings.map((s, i) => (
              <div className="proof-row" key={i}>
                <span className="proof-level">L{i + 1}</span>
                <span className={`proof-dir ${s.dir.toLowerCase()}`}>{s.dir}</span>
                <code>{s.hash.slice(0, 20)}…</code>
              </div>
            ))}
          </div>

          <p className="merkle-note">
            {tampered !== null
              ? L(
                  'One changed leaf propagates upward: every parent hash changes, so the computed root no longer matches the header. This is why a block cannot hide an edited transaction.',
                  '一个叶子改动会向上传播：每一级父哈希都改变，计算出的根不再匹配区块头。因此区块无法隐藏被篡改的交易。',
                )
              : L(
                  'A light client needs only the highlighted siblings to recompute the root. It never downloads the other leaves.',
                  '轻客户端只需高亮的兄弟节点即可重算根，无需下载其他叶子。',
                )}
          </p>
        </div>
      </div>
    </div>
  )
}

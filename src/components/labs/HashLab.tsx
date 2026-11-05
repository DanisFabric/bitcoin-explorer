import { useEffect, useMemo, useRef, useState } from 'react'
import { SAMPLE_HEADER } from '../../data/payloads'
import { bytesToHex, hexToBytes, sha256d, u32le } from '../../lib/btc'
import type { Lang } from '../../types'
import { Icon } from '../icons'

const encoder = new TextEncoder()

export function HashLab({ lang }: { lang: Lang }) {
  const L = (en: string, zh: string) => (lang === 'zh' ? zh : en)
  const [message, setMessage] = useState('Bitcoin: a peer-to-peer electronic cash system')
  const [prevMessage, setPrevMessage] = useState('Bitcoin: a peer-to-peer electronic cash syste')
  const [zeros, setZeros] = useState(4)
  const [mining, setMining] = useState(false)
  const [nonce, setNonce] = useState(0)
  const [hashes, setHashes] = useState(0)
  const [found, setFound] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<number[]>([])
  const [hashrate, setHashrate] = useState(0)
  const timer = useRef<number | null>(null)
  const nonceRef = useRef(0)
  const hashesRef = useRef(0)
  const lastTick = useRef(performance.now())
  const startedAt = useRef(0)

  const digest = useMemo(() => bytesToHex(sha256d(encoder.encode(message))), [message])
  const prevDigest = useMemo(() => bytesToHex(sha256d(encoder.encode(prevMessage))), [prevMessage])
  const changed = digest.match(/../g)!.reduce((n, b, i) => n + (b !== prevDigest.match(/../g)![i] ? 1 : 0), 0)

  const prefixHex = SAMPLE_HEADER.hex.slice(0, 152)
  const headerHex = prefixHex + bytesToHex(u32le(nonce))
  const headerHash = useMemo(() => bytesToHex(sha256d(hexToBytes(headerHex))), [headerHex])

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [])

  const startMining = () => {
    if (mining) {
      setMining(false)
      if (timer.current) window.clearInterval(timer.current)
      return
    }
    setFound(null)
    setAttempts([])
    setHashes(0)
    hashesRef.current = 0
    startedAt.current = performance.now()
    lastTick.current = performance.now()
    setMining(true)
    timer.current = window.setInterval(() => {
      const target = '0'.repeat(zeros)
      let n = nonceRef.current
      let localHashes = hashesRef.current
      const recent: number[] = []
      let hit: { nonce: number; hash: string } | null = null
      const started = performance.now()
      for (let i = 0; i < 2200; i++) {
        n++
        const h = bytesToHex(sha256d(hexToBytes(prefixHex + bytesToHex(u32le(n)))))
        if (recent.length < 24) recent.push(parseInt(h.slice(0, 2), 16))
        if (h.startsWith(target) && !hit) hit = { nonce: n, hash: h }
        if (hit) break
      }
      localHashes += 2200
      nonceRef.current = n
      hashesRef.current = localHashes
      setNonce(n)
      setHashes(localHashes)
      setAttempts((prev) => [...recent, ...prev].slice(0, 96))
      const now = performance.now()
      setHashrate(localHashes / Math.max(0.001, (now - startedAt.current) / 1000))
      void started
      if (hit) {
        setFound(`${hit.nonce}`)
        setMining(false)
        if (timer.current) window.clearInterval(timer.current)
      }
      lastTick.current = now
    }, 24)
  }

  const resetMining = () => {
    if (timer.current) window.clearInterval(timer.current)
    setMining(false)
    setFound(null)
    setNonce(0)
    nonceRef.current = 0
    setHashes(0)
    hashesRef.current = 0
    setAttempts([])
    setHashrate(0)
  }

  const probability = 16 ** zeros

  return (
    <div className="lab hash-lab">
      <div className="lab-topbar">
        <div>
          <span className="lab-kicker">{L('INTERACTIVE LAB 01', '交互实验 01')}</span>
          <h2>{L('SHA-256 & PROOF OF WORK', 'SHA-256 与工作量证明')}</h2>
        </div>
        <span className="lab-badge">SHA-256d · secp256k1-free</span>
      </div>

      <div className="hash-grid">
        <div className="lab-card input-card">
          <div className="card-title">
            <span>{L('MESSAGE', '输入消息')}</span>
            <em>{message.length} chars</em>
          </div>
          <textarea value={message} onChange={(e) => { setPrevMessage(message); setMessage(e.target.value) }} spellCheck={false} />
          <div className="hash-explain">
            {L('SHA-256 is a one-way function: the same input always gives the same 32-byte digest, and no shortcut exists to reverse it.', 'SHA-256 是单向函数：相同输入永远得到相同的 32 字节摘要，且不存在可逆的捷径。')}
          </div>
          <div className="prev-hash">
            <span>{L('PREVIOUS DIGEST', '上一次摘要')}</span>
            <code>{prevDigest.slice(0, 40)}…</code>
          </div>
        </div>

        <div className="lab-card digest-card">
          <div className="card-title">
            <span>{L('DIGEST', '摘要')}</span>
            <em>{changed} / 32 bytes changed</em>
          </div>
          <div className="digest-grid">
            {digest.match(/../g)!.map((b, i) => (
              <span key={i} className={b !== prevDigest.slice(i * 2, i * 2 + 2) ? 'diff' : ''}>{b}</span>
            ))}
          </div>
          <div className="avalanche">
            <div className="avalanche-bar">
              <i style={{ width: `${(changed / 32) * 100}%` }} />
            </div>
            <span>{L('AVALANCHE EFFECT', '雪崩效应')} · {Math.round((changed / 32) * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="lab-card mining-card">
        <div className="card-title mining-head">
          <span>{L('BLOCK HEADER · NONCE SEARCH', '区块头 · 随机数搜索')}</span>
          <div className="mine-actions">
            <button className="ctl" onClick={resetMining}>{L('RESET', '重置')}</button>
            <button className={`ctl primary ${mining ? 'stop' : ''}`} onClick={startMining}>
              <Icon name={mining ? 'pause' : 'play'} size={14} /> {mining ? L('STOP', '停止') : L('MINE', '开始挖矿')}
            </button>
          </div>
        </div>

        <div className="header-fields">
          {[
            [L('VERSION', '版本'), '0x20000000'],
            [L('PREV BLOCK', '前区块'), SAMPLE_HEADER.fields[1].value],
            [L('MERKLE ROOT', 'MERKLE 根'), SAMPLE_HEADER.fields[2].value],
            [L('TIME', '时间'), '1729500000'],
            [L('BITS', '目标'), '0x1d00ffff'],
          ].map(([k, v]) => (
            <div className="hf" key={k}>
              <span>{k}</span>
              <code>{v}</code>
            </div>
          ))}
          <div className={`hf nonce ${found ? 'hit' : ''}`}>
            <span>NONCE</span>
            <code>{nonce.toLocaleString()}</code>
          </div>
        </div>

        <div className="mine-stats">
          <div><span>{L('TARGET', '目标')}</span><strong>{'0'.repeat(zeros)}</strong><em>{L(`${zeros} leading hex zeros`, `${zeros} 个前导十六进制零`)}</em></div>
          <div><span>{L('PROBABILITY', '单次概率')}</span><strong>1 / {probability.toLocaleString()}</strong><em>{L('per hash', '每次哈希')}</em></div>
          <div><span>{L('HASHES', '哈希次数')}</span><strong>{hashes.toLocaleString()}</strong><em>{Math.round(hashrate).toLocaleString()} H/s</em></div>
          <div><span>{L('CURRENT HASH', '当前哈希')}</span><strong className={headerHash.startsWith('0'.repeat(zeros)) ? 'ok' : ''}>{headerHash.slice(0, 18)}…</strong><em>{L('double SHA-256', '双 SHA-256')}</em></div>
        </div>

        <div className="nonce-strip">
          <div className="strip-head">
            <span>{L('RECENT ATTEMPTS', '最近的尝试')}</span>
            <span>{L('first byte of each hash', '每次哈希的首字节')}</span>
          </div>
          <div className="strip-grid">
            {Array.from({ length: 96 }).map((_, i) => {
              const v = attempts[i]
              const hot = v !== undefined && v < 16 ** zeros
              return <i key={i} className={`${v === undefined ? 'empty' : ''} ${hot ? 'hot' : ''}`} title={v === undefined ? '' : `0x${v.toString(16).padStart(2, '0')}`} />
            })}
          </div>
        </div>

        <div className="target-row">
          <span>{L('DIFFICULTY TARGET', '难度目标')}</span>
          <input type="range" min={1} max={6} step={1} value={zeros} onChange={(e) => { setZeros(Number(e.target.value)); resetMining() }} />
          <span className="target-label">{'0'.repeat(zeros)}<em>{"f".repeat(8)}…</em></span>
          <span className="target-note">{L('educational target, not consensus bits', '教学目标，并非共识 bits')}</span>
        </div>

        {found && (
          <div className="found-banner">
            <Icon name="check" size={15} /> {L(`NONCE ${Number(found).toLocaleString()} FOUND`, `找到 NONCE ${Number(found).toLocaleString()}`)}
            <span>{headerHash}</span>
          </div>
        )}
      </div>
    </div>
  )
}

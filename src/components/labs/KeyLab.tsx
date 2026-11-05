import { useMemo, useState } from 'react'
import * as secp from '@noble/secp256k1'
import { sha256 } from '@noble/hashes/sha2.js'
import { base58Address, bytesToHex, derEncode, hash160, hexToBytes, utf8ToBytes } from '../../lib/btc'
import type { Lang } from '../../types'
import { Icon } from '../icons'

function freshKey() {
  return secp.utils.randomSecretKey()
}

export function KeyLab({ lang }: { lang: Lang }) {
  const L = (en: string, zh: string) => (lang === 'zh' ? zh : en)
  const [priv, setPriv] = useState<Uint8Array>(() => freshKey())
  const [message, setMessage] = useState('I own this UTXO.')
  const [signedMessage, setSignedMessage] = useState<string | null>(null)
  const [compact, setCompact] = useState<string | null>(null)
  const [showPriv, setShowPriv] = useState(false)
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)

  const pub = useMemo(() => secp.getPublicKey(priv, true), [priv])
  const address = useMemo(() => base58Address(hash160(pub)), [pub])
  const digest = useMemo(() => bytesToHex(sha256(utf8ToBytes(message))), [message])
  const signedDigest = useMemo(() => (signedMessage === null ? null : bytesToHex(sha256(utf8ToBytes(signedMessage)))), [signedMessage])

  const der = compact ? bytesToHex(derEncode(hexToBytes(compact))) : null
  const valid = useMemo(() => {
    if (!compact || signedMessage === null || signedMessage !== message) return false
    try {
      return secp.verify(hexToBytes(compact), hexToBytes(digest), pub, { prehash: false })
    } catch {
      return false
    }
  }, [compact, digest, message, pub, signedMessage])

  const sign = () => {
    const sig = secp.sign(hexToBytes(digest), priv, { prehash: false })
    setCompact(bytesToHex(sig))
    setSignedMessage(message)
    setFlash('ok')
    setTimeout(() => setFlash(null), 900)
  }

  const verify = () => {
    setFlash(valid ? 'ok' : 'bad')
    setTimeout(() => setFlash(null), 1200)
  }

  const regenerate = () => {
    setPriv(freshKey())
    setCompact(null)
    setSignedMessage(null)
    setShowPriv(false)
    setFlash(null)
  }

  return (
    <div className="lab key-lab">
      <div className="lab-topbar">
        <div>
          <span className="lab-kicker">{L('INTERACTIVE LAB 03', '交互实验 03')}</span>
          <h2>{L('KEYS, ADDRESSES & SIGNATURES', '密钥、地址与签名')}</h2>
        </div>
        <div className="lab-topactions">
          <span className="lab-badge">secp256k1 · real crypto</span>
          <button className="ctl" onClick={regenerate}><Icon name="refresh" size={14} /> {L('NEW KEYPAIR', '新密钥对')}</button>
        </div>
      </div>

      <div className="key-grid">
        <div className="lab-card key-card">
          <div className="card-title"><span>{L('KEY MATERIAL', '密钥材料')}</span><em>{L('never leaves this tab', '不会离开此标签页')}</em></div>

          <label className="field-label">{L('PRIVATE KEY', '私钥')} · 32 bytes</label>
          <div className="secret-row">
            <code className={showPriv ? '' : 'blurred'}>{showPriv ? bytesToHex(priv) : '•'.repeat(64)}</code>
            <button className="mini-btn" onClick={() => setShowPriv((v) => !v)}>{showPriv ? L('HIDE', '隐藏') : L('REVEAL', '显示')}</button>
          </div>

          <label className="field-label">{L('PUBLIC KEY', '公钥')} · 33 bytes compressed</label>
          <code className="long">{bytesToHex(pub)}</code>

          <label className="field-label">{L('P2PKH ADDRESS', 'P2PKH 地址')} · Base58Check</label>
          <div className="address-row">
            <span className="addr">{address}</span>
            <span className="addr-tag">HASH160</span>
          </div>

          <div className="key-steps">
            <div><span>1</span>{L('32 bytes from a CSPRNG', 'CSPRNG 生成 32 字节')}</div>
            <div><span>2</span>{L('scalar × generator point', '标量 × 生成元')}</div>
            <div><span>3</span>{L('RIPEMD160(SHA256(key))', 'RIPEMD160(SHA256(公钥))')}</div>
            <div><span>4</span>{L('Base58Check checksum', 'Base58Check 校验和')}</div>
          </div>
        </div>

        <div className="lab-card sign-card">
          <div className="card-title"><span>{L('SIGN & VERIFY', '签名与验证')}</span><em>ECDSA / SHA-256</em></div>

          <label className="field-label">{L('MESSAGE', '消息')}</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} spellCheck={false} />

          <div className="digest-line">
            <span>{L('DIGEST', '摘要')}</span>
            <code>{digest}</code>
          </div>

          <div className="sign-actions">
            <button className="ctl primary" onClick={sign}><Icon name="key" size={14} /> {L('SIGN', '签名')}</button>
            <button className={`ctl ${flash === 'bad' ? 'stop' : ''}`} onClick={verify} disabled={!compact}>
              <Icon name="check" size={14} /> {L('VERIFY', '验证')}
            </button>
            <button className="ctl ghost" onClick={() => setMessage((m) => m + '!')}>{L('TAMPER MESSAGE', '篡改消息')}</button>
            <span className={`verify-pill ${valid ? 'ok' : 'bad'}`}>
              <i /> {valid ? L('VALID SIGNATURE', '签名有效') : compact ? L('INVALID', '无效') : L('UNSIGNED', '未签名')}
            </span>
          </div>

          <div className="sig-box">
            <div className="sig-head">
              <span>{L('DER SIGNATURE', 'DER 签名')}</span>
              <em>{der ? `${der.length / 2} bytes` : '—'}</em>
            </div>
            <code className={flash === 'ok' ? 'flash-ok' : flash === 'bad' ? 'flash-bad' : ''}>
              {der ?? L('Press SIGN to produce a signature with this key.', '点击“签名”用此密钥生成签名。')}
            </code>
          </div>

          <div className="sig-parts">
            <div><span>R</span><code>{compact ? compact.slice(0, 24) + '…' : '—'}</code></div>
            <div><span>S</span><code>{compact ? compact.slice(32, 56) + '…' : '—'}</code></div>
            <div><span>SIGNED DIGEST</span><code>{signedDigest ? signedDigest.slice(0, 24) + '…' : '—'}</code></div>
          </div>

          <p className="key-note">
            {L(
              'Change one character of the message and verification fails: the digest changes, and the signature no longer matches. The private key itself is never part of a transaction.',
              '改动消息中的一个字符，验证就会失败：摘要改变，签名不再匹配。私钥本身永远不会出现在交易里。',
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

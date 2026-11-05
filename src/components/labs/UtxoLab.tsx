import { useMemo, useState } from 'react'
import { bytesToHex, reverseHex, sha256d, utf8ToBytes } from '../../lib/btc'
import type { Lang } from '../../types'
import { Icon } from '../icons'

interface Coin { id: string; value: number; conf: number; kind: 'segwit' | 'legacy'; label: string }

const COINS: Coin[] = [
  { id: 'a', value: 1_500_000, conf: 128, kind: 'segwit', label: 'bc1q…4m2e' },
  { id: 'b', value: 420_000, conf: 6, kind: 'segwit', label: 'bc1q…7f3a' },
  { id: 'c', value: 210_000, conf: 1, kind: 'legacy', label: '1H3k…9Xq2' },
  { id: 'd', value: 84_000, conf: 0, kind: 'segwit', label: 'bc1q…0c9d' },
]

const btc = (sats: number) => (sats / 1e8).toFixed(8).replace(/0+$/, '').replace(/\.$/, '')
const fmt = (sats: number) => sats.toLocaleString('en-US')

export function UtxoLab({ lang }: { lang: Lang }) {
  const L = (en: string, zh: string) => (lang === 'zh' ? zh : en)
  const [picked, setPicked] = useState<string[]>(['b'])
  const [amount, setAmount] = useState('0.0025')
  const [rate, setRate] = useState(12)
  const [broadcast, setBroadcast] = useState<string | null>(null)

  const selected = COINS.filter((c) => picked.includes(c.id))
  const total = selected.reduce((s, c) => s + c.value, 0)
  const pay = Math.max(0, Math.round(Number(amount || 0) * 1e8))
  const inputsWeight = selected.reduce((s, c) => s + (c.kind === 'segwit' ? 68 : 148), 0)
  const outputs = 2
  const vsize = Math.ceil(10.5 + inputsWeight + outputs * 31)
  const fee = Math.ceil(rate * vsize)
  const rawChange = total - pay - fee
  const dust = rawChange >= 0 && rawChange < 546
  const change = dust ? 0 : rawChange
  const extraFee = dust ? rawChange : 0
  const insufficient = rawChange < 0
  const empty = !pay || selected.length === 0
  const valid = !insufficient && !empty

  const txid = useMemo(() => {
    if (!broadcast) return null
    return reverseHex(bytesToHex(sha256d(utf8ToBytes(`utxo-lab:${picked.join('')}:${pay}:${rate}:${broadcast}`))))
  }, [broadcast, pay, picked, rate])

  const toggle = (id: string) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
    setBroadcast(null)
  }

  const broadcastTx = () => {
    if (!valid) return
    setBroadcast(new Date().toISOString())
  }

  return (
    <div className="lab utxo-lab">
      <div className="lab-topbar">
        <div>
          <span className="lab-kicker">{L('INTERACTIVE LAB 04', '交互实验 04')}</span>
          <h2>{L('BUILD A TRANSACTION', '构造一笔交易')}</h2>
        </div>
        <span className="lab-badge">P2WPKH · 68 vB / input</span>
      </div>

      <div className="utxo-grid">
        <div className="lab-card coins-card">
          <div className="card-title"><span>{L('AVAILABLE UTXOS', '可用 UTXO')}</span><em>{COINS.length} coins</em></div>
          {COINS.map((c) => {
            const on = picked.includes(c.id)
            return (
              <button key={c.id} className={`coin-row ${on ? 'on' : ''}`} onClick={() => toggle(c.id)}>
                <span className={`checkbox ${on ? 'on' : ''}`}>{on && <Icon name="check" size={11} />}</span>
                <span className="coin-main">
                  <strong>{btc(c.value)} BTC</strong>
                  <em>{c.label} · {c.kind === 'segwit' ? 'P2WPKH' : 'P2PKH'}</em>
                </span>
                <span className={`conf ${c.conf === 0 ? 'pending' : ''}`}>{c.conf === 0 ? L('unconfirmed', '未确认') : `${c.conf} conf`}</span>
              </button>
            )
          })}
          <div className="coins-total">
            <span>{L('SELECTED', '已选择')}</span>
            <strong>{btc(total)} BTC</strong>
          </div>
        </div>

        <div className="lab-card build-card">
          <div className="card-title"><span>{L('PAYMENT', '付款')}</span><em>{L('one recipient + change', '一个收款 + 找零')}</em></div>

          <label className="field-label">{L('RECIPIENT', '收款地址')}</label>
          <code className="long">bc1qn57gkxn7tuk5c6u2pc0n6kmunghy7mvtps326mlz</code>

          <label className="field-label">{L('AMOUNT', '金额')} · BTC</label>
          <div className="amount-row">
            <input value={amount} inputMode="decimal" onChange={(e) => { setAmount(e.target.value); setBroadcast(null) }} />
            <span>{fmt(pay)} sats</span>
          </div>

          <label className="field-label">{L('FEE RATE', '费率')} · {rate} sat/vB</label>
          <input className="range" type="range" min={1} max={80} value={rate} onChange={(e) => { setRate(Number(e.target.value)); setBroadcast(null) }} />
          <div className="range-labels"><span>1</span><span>20</span><span>40</span><span>80</span></div>

          <div className="calc">
            <div><span>{L('vsize', '虚拟大小')}</span><strong>{vsize} vB</strong></div>
            <div><span>{L('fee', '手续费')}</span><strong>{fmt(fee)} sats</strong></div>
            <div className={insufficient ? 'bad' : ''}><span>{L('change', '找零')}</span><strong>{insufficient ? '—' : fmt(change)} sats</strong></div>
          </div>

          {insufficient && <div className="warn"><Icon name="warning" size={14} /> {L('Not enough selected value. Add another coin.', '所选金额不足，请再选择一枚币。')}</div>}
          {dust && <div className="warn">{L(`Change is dust (${fmt(extraFee)} sats); it is added to the fee.`, `找零低于粉尘阈值（${fmt(extraFee)} 聪），将并入手续费。`)}</div>}

          <button className={`ctl primary broadcast ${broadcast ? 'done' : ''}`} disabled={!valid} onClick={broadcastTx}>
            <Icon name={broadcast ? 'check' : 'arrow'} size={14} /> {broadcast ? L('ACCEPTED INTO MEMPOOL', '已进入内存池') : L('SIGN & BROADCAST', '签名并广播')}
          </button>
          {txid && <div className="tx-result"><span>TXID</span><code>{txid}</code></div>}
        </div>
      </div>

      <div className="lab-card diagram-card">
        <div className="card-title"><span>{L('VALUE FLOW', '价值流')}</span><em>{L('nothing is created, nothing is destroyed', '不凭空创造，也不销毁')}</em></div>

        <div className="utxo-diagram">
          <div className="dcol">
            <span className="dlabel">{L('INPUTS', '输入')} · {selected.length}</span>
            {selected.map((c) => (
              <div className="dchip in" key={c.id}>
                <strong>{btc(c.value)}</strong>
                <em>{c.label}</em>
              </div>
            ))}
            {!selected.length && <div className="dchip empty">{L('select a coin', '选择一枚币')}</div>}
          </div>

          <div className="darrow"><Icon name="arrow" size={18} /></div>

          <div className="dtx">
            <span>TX</span>
            <strong>{vsize} vB</strong>
            <em>{selected.length} in · {outputs} out</em>
          </div>

          <div className="darrow"><Icon name="arrow" size={18} /></div>

          <div className="dcol">
            <span className="dlabel">{L('OUTPUTS', '输出')}</span>
            <div className="dchip out">
              <strong>{btc(pay)}</strong>
              <em>{L('recipient', '收款方')}</em>
            </div>
            <div className="dchip change">
              <strong>{btc(change)}</strong>
              <em>{L('change', '找零')} {dust ? '· dust' : ''}</em>
            </div>
            <div className="dchip fee">
              <strong>{btc(fee + extraFee)}</strong>
              <em>{L('miner fee', '矿工费')}</em>
            </div>
          </div>
        </div>

        <div className="value-bar">
          {selected.length > 0 && (
            <>
              <i className="v-pay" style={{ width: `${(pay / total) * 100}%` }} />
              <i className="v-change" style={{ width: `${(change / total) * 100}%` }} />
              <i className="v-fee" style={{ width: `${((fee + extraFee) / total) * 100}%` }} />
            </>
          )}
        </div>
        <div className="value-legend">
          <span><i className="v-pay" /> {L('payment', '付款')} {btc(pay)}</span>
          <span><i className="v-change" /> {L('change', '找零')} {btc(change)}</span>
          <span><i className="v-fee" /> {L('fee', '手续费')} {btc(fee + extraFee)}</span>
          <strong>{L('total', '合计')} {btc(total)} BTC</strong>
        </div>
      </div>
    </div>
  )
}

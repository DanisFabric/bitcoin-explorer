import { sha256 } from '@noble/hashes/sha2.js'
import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { bytesToHex, concatBytes, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js'
import * as secp from '@noble/secp256k1'
import { base58check, bech32, bech32m } from '@scure/base'

// @noble/secp256k1 v3 requires an explicit HMAC-SHA256 provider for sync ECDSA.
secp.hashes.sha256 = sha256
secp.hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg)

export { bytesToHex, concatBytes, hexToBytes, utf8ToBytes }

export const sha256d = (data: Uint8Array): Uint8Array => sha256(sha256(data))

export const hash160 = (data: Uint8Array): Uint8Array => ripemd160(sha256(data))

export function reverseHex(hex: string): string {
  const b = hexToBytes(hex)
  return bytesToHex(b.slice().reverse())
}

export function varint(n: number): Uint8Array {
  if (n < 0xfd) return new Uint8Array([n])
  if (n <= 0xffff) return new Uint8Array([0xfd, n & 0xff, (n >> 8) & 0xff])
  return new Uint8Array([0xfe, n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff])
}

export function u32le(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff])
}

export function u64le(n: number): Uint8Array {
  const b = new Uint8Array(8)
  let v = BigInt(n)
  for (let i = 0; i < 8; i++) {
    b[i] = Number(v & 0xffn)
    v >>= 8n
  }
  return b
}

export function pushData(data: Uint8Array): Uint8Array {
  if (data.length < 0x4c) return concatBytes(new Uint8Array([data.length]), data)
  if (data.length <= 0xff) return concatBytes(new Uint8Array([0x4c, data.length]), data)
  return concatBytes(new Uint8Array([0x4d, data.length & 0xff, data.length >> 8]), data)
}

export function derEncode(compact: Uint8Array): Uint8Array {
  let r = compact.slice(0, 32)
  let s = compact.slice(32, 64)
  const trim = (x: Uint8Array) => {
    let i = 0
    while (i < x.length - 1 && x[i] === 0) i++
    let out = x.slice(i)
    if (out[0] & 0x80) out = concatBytes(new Uint8Array([0]), out)
    return out
  }
  r = trim(r)
  s = trim(s)
  return concatBytes(
    new Uint8Array([0x30, 4 + r.length + s.length, 0x02, r.length]),
    r,
    new Uint8Array([0x02, s.length]),
    s,
  )
}

export function base58Address(hash: Uint8Array, version = 0): string {
  return base58check(sha256).encode(concatBytes(new Uint8Array([version]), hash))
}

export function segwitAddress(hash: Uint8Array, version = 0, hrp = 'bc'): string {
  const words = [...(version === 0 ? bech32 : bech32m).toWords(hash)]
  return (version === 0 ? bech32 : bech32m).encode(hrp, [version, ...words], 90)
}

export const FIXED_KEY = hexToBytes('8f2f9c3a6e1d4b7a9c0e5f3b2d8a7c6e1f4b9d2a5c8e7f0b3d6a9c2e5f8b1d4a')
export const FIXED_PUB = secp.getPublicKey(FIXED_KEY, true)
export const FIXED_HASH160 = hash160(FIXED_PUB)

export interface BuiltTx {
  hex: string
  txid: string
  wtxid: string
  size: number
  vsize: number
  weight: number
  signatureHex: string
  pubkeyHex: string
  scriptSigHex: string
  fields: {
    off: number
    len: number
    name: { en: string; zh: string }
    value: string
    note: { en: string; zh: string }
  }[]
  outputs: { value: number; address: string; hash: Uint8Array }[]
  inputValue: number
  fee: number
}

/** Build a genuine legacy P2PKH transaction and sign it with a fixed key. */
export function buildP2PKHTransaction(opts: {
  prevTxid: string
  vout: number
  inputValue: number
  outputs: { value: number; hash?: Uint8Array }[]
  locktime?: number
}): BuiltTx {
  const outputs = opts.outputs.map((o, i) => ({ value: o.value, hash: o.hash ?? hash160(utf8ToBytes(`btc-explorer-output-${i}`)) }))
  const scriptPubKey = (h: Uint8Array) => concatBytes(new Uint8Array([0x76, 0xa9, 0x14]), h, new Uint8Array([0x88, 0xac]))

  const prevOut = reverseHex(opts.prevTxid)
  const prefix = concatBytes(u32le(2), varint(1))
  const prevRef = concatBytes(hexToBytes(prevOut), u32le(opts.vout))
  const sequence = u32le(0xfffffffd)
  const outputBytes = concatBytes(
    varint(outputs.length),
    ...outputs.flatMap((o) => [u64le(o.value), varint(25), scriptPubKey(o.hash)]),
  )
  const locktime = u32le(opts.locktime ?? 0)

  // Legacy SIGHASH_ALL: the signed input's script slot must hold the prevout
  // scriptPubKey (the locking script being satisfied), other inputs are empty.
  const scriptCode = scriptPubKey(FIXED_HASH160)
  const unsigned = concatBytes(prefix, prevRef, varint(scriptCode.length), scriptCode, sequence, outputBytes, locktime)
  const sigHash = sha256d(concatBytes(unsigned, u32le(1)))
  const compact = secp.sign(sigHash, FIXED_KEY, { prehash: false })
  const der = concatBytes(derEncode(compact), new Uint8Array([0x01]))
  const scriptSig = concatBytes(pushData(der), pushData(FIXED_PUB))
  const finalTx = concatBytes(prefix, prevRef, varint(scriptSig.length), scriptSig, sequence, outputBytes, locktime)
  const txid = reverseHex(bytesToHex(sha256d(finalTx)))

  let off = 0
  const fields: BuiltTx['fields'] = []
  const add = (len: number, name: { en: string; zh: string }, value: string, note: { en: string; zh: string }) => {
    fields.push({ off, len, name, value, note })
    off += len
  }
  add(4, { en: 'Version', zh: '版本号' }, '2', { en: 'Signals BIP-68 relative locktime rules.', zh: '表示支持 BIP-68 相对锁定时间规则。' })
  add(1, { en: 'Input count', zh: '输入数量' }, '1', { en: 'One coin is being spent.', zh: '本交易花费一个输出。' })
  add(32, { en: 'Previous txid', zh: '前一笔交易 ID' }, opts.prevTxid.slice(0, 16) + '…', { en: 'The transaction that created the coin. Stored in reverse byte order.', zh: '创建这枚币的交易，序列化时字节序相反。' })
  add(4, { en: 'Output index', zh: '输出索引' }, String(opts.vout), { en: 'Which output of that transaction is spent.', zh: '花费该交易的第几个输出。' })
  add(1, { en: 'Script length', zh: '脚本长度' }, String(scriptSig.length) + ' bytes', { en: 'Length of the unlocking script.', zh: '解锁脚本的字节长度。' })
  add(scriptSig.length, { en: 'ScriptSig', zh: '解锁脚本' }, 'DER sig + pubkey', { en: 'Pushes the signature and the compressed public key.', zh: '依次推入签名和压缩公钥。' })
  add(4, { en: 'Sequence', zh: '序列号' }, '0xfffffffd', { en: 'Opts into relative locktime and RBF.', zh: '启用相对锁定时间和 RBF。' })
  add(1, { en: 'Output count', zh: '输出数量' }, String(outputs.length), { en: 'Recipient plus change.', zh: '收款输出加找零输出。' })
  for (let i = 0; i < outputs.length; i++) {
    add(8, { en: `Output ${i + 1} value`, zh: `输出 ${i + 1} 金额` }, `${outputs[i].value} sats`, { en: 'Value in satoshis, little-endian.', zh: '以聪为单位的金额，小端序。' })
    add(1, { en: `Output ${i + 1} script length`, zh: `输出 ${i + 1} 脚本长度` }, '25 bytes', { en: 'A standard P2PKH locking script.', zh: '标准 P2PKH 锁定脚本。' })
    add(25, { en: `Output ${i + 1} scriptPubKey`, zh: `输出 ${i + 1} 锁定脚本` }, 'OP_DUP … OP_CHECKSIG', { en: 'Locks to a 20-byte public-key hash.', zh: '锁定到一个 20 字节公钥哈希。' })
  }
  add(4, { en: 'Locktime', zh: '锁定时间' }, '0', { en: 'No height or time restriction.', zh: '不限制区块高度或时间。' })

  const size = finalTx.length
  const weight = size * 4
  return {
    hex: bytesToHex(finalTx),
    txid,
    wtxid: txid,
    size,
    vsize: Math.ceil(weight / 4),
    weight,
    signatureHex: bytesToHex(der),
    pubkeyHex: bytesToHex(FIXED_PUB),
    scriptSigHex: bytesToHex(scriptSig),
    fields,
    outputs: outputs.map((o) => ({ value: o.value, address: base58Address(o.hash), hash: o.hash })),
    inputValue: opts.inputValue,
    fee: opts.inputValue - outputs.reduce((s, o) => s + o.value, 0),
  }
}

export interface BuiltHeader {
  hex: string
  hash: string
  fields: { off: number; len: number; name: { en: string; zh: string }; value: string; note: { en: string; zh: string } }[]
}

export function buildBlockHeader(opts: {
  version?: number
  prevHash: string
  merkleRoot: string
  time: number
  bits: number
  nonce: number
}): BuiltHeader {
  const version = opts.version ?? 0x20000000
  const bytes = concatBytes(
    u32le(version),
    hexToBytes(reverseHex(opts.prevHash)),
    hexToBytes(reverseHex(opts.merkleRoot)),
    u32le(opts.time),
    u32le(opts.bits),
    u32le(opts.nonce),
  )
  const hash = reverseHex(bytesToHex(sha256d(bytes)))
  const bitsHex = opts.bits.toString(16).padStart(8, '0')
  const fields = [
    { off: 0, len: 4, name: { en: 'Version', zh: '版本号' }, value: String(version), note: { en: 'Soft-fork signalling bits live here.', zh: '软分叉信号位在这里。' } },
    { off: 4, len: 32, name: { en: 'Previous block', zh: '前一区块哈希' }, value: opts.prevHash.slice(0, 16) + '…', note: { en: 'Links the chain backwards; changing it changes every later hash.', zh: '向前链接区块链；改动它会改变之后所有哈希。' } },
    { off: 36, len: 32, name: { en: 'Merkle root', zh: 'Merkle 根' }, value: opts.merkleRoot.slice(0, 16) + '…', note: { en: 'One 32-byte commitment to every transaction in the block.', zh: '对区块内全部交易的 32 字节承诺。' } },
    { off: 68, len: 4, name: { en: 'Timestamp', zh: '时间戳' }, value: new Date(opts.time * 1000).toISOString().replace('.000Z', 'Z'), note: { en: 'Unix time, allowed to drift slightly from real time.', zh: 'Unix 时间，允许与真实时间有小幅偏差。' } },
    { off: 72, len: 4, name: { en: 'Bits', zh: '难度目标' }, value: `0x${bitsHex}`, note: { en: 'Compact encoding of the proof-of-work target.', zh: '工作量证明目标的紧凑编码。' } },
    { off: 76, len: 4, name: { en: 'Nonce', zh: '随机数' }, value: String(opts.nonce), note: { en: 'The only freely variable field a miner grinds.', zh: '矿工可以自由试探的唯一字段。' } },
  ]
  return { hex: bytesToHex(bytes), hash, fields }
}

export function merkleLevels(txids: string[]): string[][] {
  const internal = (h: string) => hexToBytes(reverseHex(h))
  const display = (b: Uint8Array) => reverseHex(bytesToHex(b))
  let level: Uint8Array[] = txids.map(internal)
  const levels: string[][] = [level.map(display)]
  while (level.length > 1) {
    const next: Uint8Array[] = []
    for (let i = 0; i < level.length; i += 2) {
      const a = level[i]
      const b = level[i + 1] ?? level[i]
      next.push(sha256d(concatBytes(a, b)))
    }
    level = next
    levels.push(level.map(display))
  }
  return levels
}

export function targetFromBits(bits: number): bigint {
  const exponent = bits >>> 24
  const mantissa = bits & 0x007fffff
  return BigInt(mantissa) << BigInt(8 * (exponent - 3))
}

export function hexToBigInt(hex: string): bigint {
  return BigInt('0x' + (hex || '0'))
}

export function formatSats(n: number): string {
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(8).replace(/0+$/, '').replace(/\.$/, '') + ' BTC'
  return n.toLocaleString('en-US') + ' sats'
}

export const shortHash = (h: string, n = 8) => `${h.slice(0, n)}…${h.slice(-n)}`

import {
  buildBlockHeader,
  buildP2PKHTransaction,
  bytesToHex,
  concatBytes,
  hexToBytes,
  merkleLevels,
  reverseHex,
  sha256d,
  u32le,
  u64le,
  utf8ToBytes,
  varint,
} from '../lib/btc'
import type { Payload, T } from '../types'

const t = (en: string, zh: string): T => ({ en, zh })

export const SAMPLE_PREV_TXID = '7f3a91c4e8b2d6f0a1c5e9b3d7f2a6c8e4b0d9f5a3c7e1b8d2f6a4c0e9b5d1a7'

export const SAMPLE_TX = buildP2PKHTransaction({
  prevTxid: SAMPLE_PREV_TXID,
  vout: 1,
  inputValue: 420_000,
  outputs: [{ value: 250_000 }, { value: 166_500 }],
})

const FEE_RATE = SAMPLE_TX.fee / SAMPLE_TX.vsize

const txOutputCountOffset = SAMPLE_TX.fields.find((f) => f.name.en === 'Output count')?.off ?? 153
const txLocktimeOffset = SAMPLE_TX.fields.find((f) => f.name.en === 'Locktime')?.off ?? 230

export const txPayload: Payload = {
  title: t('Signed P2PKH transaction', '已签名的 P2PKH 交易'),
  hex: SAMPLE_TX.hex,
  fields: SAMPLE_TX.fields,
  layers: [
    { name: t('Version', '版本'), bytes: 4, color: '#0b8b98' },
    { name: t('Inputs', '输入'), bytes: txOutputCountOffset - 4, color: '#f7931a' },
    { name: t('Outputs', '输出'), bytes: txLocktimeOffset - txOutputCountOffset, color: '#2d6cdf' },
    { name: t('Locktime', '锁定时间'), bytes: 4, color: '#6d4bdc' },
  ],
  note: t(
    `Real serialization, signed with a fixed demo key. ${SAMPLE_TX.vsize} vB · ${SAMPLE_TX.fee.toLocaleString()} sats fee · ${FEE_RATE.toFixed(1)} sat/vB.`,
    `真实序列化结果，使用固定演示密钥签名。${SAMPLE_TX.vsize} vB · ${SAMPLE_TX.fee.toLocaleString()} 聪手续费 · ${FEE_RATE.toFixed(1)} sat/vB。`,
  ),
}

function derFields(): Payload['fields'] {
  const der = hexToBytes(SAMPLE_TX.signatureHex)
  const rLen = der[3]
  const rOff = 4
  const sLenOff = rOff + rLen
  const sLen = der[sLenOff + 1]
  const sOff = sLenOff + 2
  return [
    { off: 0, len: 1, name: t('DER sequence', 'DER 序列'), value: '0x30', note: t('Marks an ASN.1 DER sequence.', 'ASN.1 DER 序列标记。') },
    { off: 1, len: 1, name: t('Sequence length', '序列长度'), value: `${der[1]} bytes`, note: t('Length of the signature body.', '签名主体长度。') },
    { off: 2, len: 2, name: t('R header', 'R 头部'), value: '0x02 0x' + rLen.toString(16), note: t('R is an integer of secp256k1 order.', 'R 是 secp256k1 阶内的整数。') },
    { off: rOff, len: rLen, name: t('R value', 'R 值'), value: bytesToHex(der.slice(rOff, rOff + rLen)).slice(0, 16) + '…', note: t('x-coordinate of the ephemeral point, modulo n.', '临时点 x 坐标对 n 取模。') },
    { off: sLenOff, len: 2, name: t('S header', 'S 头部'), value: '0x02 0x' + sLen.toString(16), note: t('Second DER integer.', '第二个 DER 整数。') },
    { off: sOff, len: sLen, name: t('S value', 'S 值'), value: bytesToHex(der.slice(sOff, sOff + sLen)).slice(0, 16) + '…', note: t('Proof scalar. Low-S is required by standardness.', '证明标量；标准性规则要求 low-S。') },
    { off: der.length - 1, len: 1, name: t('SIGHASH type', 'SIGHASH 类型'), value: '0x01 (ALL)', note: t('The signature commits to every input and output.', '签名承诺全部输入与输出。') },
  ]
}

export const signaturePayload: Payload = {
  title: t('DER-encoded ECDSA signature', 'DER 编码的 ECDSA 签名'),
  hex: SAMPLE_TX.signatureHex,
  fields: derFields(),
  layers: [
    { name: t('Header', '头部'), bytes: 2, color: '#6d4bdc' },
    { name: t('R', 'R'), bytes: 2 + (hexToBytes(SAMPLE_TX.signatureHex)[3] ?? 32), color: '#2d6cdf' },
    { name: t('S', 'S'), bytes: 2 + (hexToBytes(SAMPLE_TX.signatureHex)[4 + (hexToBytes(SAMPLE_TX.signatureHex)[3] ?? 32) + 1] ?? 32), color: '#f7931a' },
    { name: t('Type', '类型'), bytes: 1, color: '#0b8b98' },
  ],
  note: t(
    'The R and S integers prove knowledge of the private key without revealing it. Nodes check it against the public key in the input.',
    'R 与 S 两个整数在不泄露私钥的前提下证明私钥持有者身份。节点用输入中的公钥来验证。',
  ),
}

export const scriptSigPayload: Payload = {
  title: t('Unlocking script (scriptSig)', '解锁脚本（scriptSig）'),
  hex: SAMPLE_TX.scriptSigHex,
  fields: [
    { off: 0, len: 1, name: t('Push 72 bytes', '推入 72 字节'), value: '0x48', note: t('Pushes the signature onto the stack.', '把签名推入栈。') },
    { off: 1, len: 72, name: t('Signature + sighash', '签名 + sighash'), value: SAMPLE_TX.signatureHex.slice(0, 16) + '…', note: t('DER signature followed by SIGHASH_ALL.', 'DER 签名后跟 SIGHASH_ALL。') },
    { off: 73, len: 1, name: t('Push 33 bytes', '推入 33 字节'), value: '0x21', note: t('Pushes a compressed public key.', '推入一个压缩公钥。') },
    { off: 74, len: 33, name: t('Public key', '公钥'), value: SAMPLE_TX.pubkeyHex, note: t('Compressed secp256k1 key: 02/03 prefix + 32-byte x.', '压缩 secp256k1 公钥：02/03 前缀 + 32 字节 x 坐标。') },
  ],
  note: t(
    'ScriptSig carries no logic — only data. The locking script decides what to do with it.',
    'scriptSig 本身没有逻辑，只携带数据。真正的逻辑在锁定脚本中。',
  ),
}

export const MERKLE_TXIDS = [
  '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
  'f0e1d2c3b4a5968778695a4b3c2d1e0f1a2b3c4d5e6f708192a3b4c5d6e7f809',
  '8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c5b4a39',
  '0f1e2d3c4b5a69788796a5b4c3d2e1f00a1b2c3d4e5f60718293a4b5c6d7e8f9',
  '5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c',
  'b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2',
  '2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7081e',
  'c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4',
]

export const MERKLE_LEVELS = merkleLevels(MERKLE_TXIDS)
export const MERKLE_ROOT = MERKLE_LEVELS[MERKLE_LEVELS.length - 1][0]

function merkleProof(index = 5): { sibling: string[]; dir: ('L' | 'R')[] } {
  const dirs: ('L' | 'R')[] = []
  const siblings: string[] = []
  let i = index
  for (let level = 0; level < MERKLE_LEVELS.length - 1; level++) {
    const arr = MERKLE_LEVELS[level]
    const sib = i ^ 1
    siblings.push(arr[sib] ?? arr[i])
    dirs.push(sib < i ? 'L' : 'R')
    i = i >> 1
  }
  return { sibling: siblings, dir: dirs }
}

const proof = merkleProof(5)

export const merkleProofPayload: Payload = {
  title: t('Merkle inclusion proof (8 transactions)', 'Merkle 包含证明（8 笔交易）'),
  hex: proof.sibling.join(''),
  fields: [
    ...proof.sibling.map((s, i) => ({
      off: i * 32,
      len: 32,
      name: t(`Sibling ${i + 1} (${proof.dir[i]})`, `兄弟节点 ${i + 1}（${proof.dir[i]}）`),
      value: s.slice(0, 20) + '…',
      note: t(
        `Hash of the ${proof.dir[i] === 'L' ? 'left' : 'right'} neighbour at level ${i + 1}. Combine and hash upward.`,
        `第 ${i + 1} 层${proof.dir[i] === 'L' ? '左' : '右'}侧相邻节点的哈希。合并后继续向上哈希。`,
      ),
    })),
    { off: proof.sibling.length * 32, len: 0, name: t('Computed root', '计算得到的根'), value: MERKLE_ROOT.slice(0, 24) + '…', note: t('Matches the header Merkle root, so the transaction is included.', '与区块头 Merkle 根一致，证明该交易确实被包含。') },
  ],
  note: t(
    `Only ${proof.sibling.length} hashes (${proof.sibling.length * 32} bytes) prove inclusion in this block — no need to download all 8 transactions.`,
    `仅凭 ${proof.sibling.length} 个哈希（${proof.sibling.length * 32} 字节）即可证明交易被包含，无需下载全部 8 笔交易。`,
  ),
}

function findLowNonce(prevHash: string, merkleRoot: string, bits: number) {
  let nonce = 0
  for (;;) {
    const header = buildBlockHeader({ prevHash, merkleRoot, time: 1729500000, bits, nonce })
    if (header.hash.slice(0, 2) === '00') return nonce
    nonce++
  }
}

const SAMPLE_PREV_BLOCK = '00000000000000000001a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7'
const blockNonce = findLowNonce(SAMPLE_PREV_BLOCK, MERKLE_ROOT, 0x1d00ffff)
export const SAMPLE_HEADER = buildBlockHeader({
  prevHash: SAMPLE_PREV_BLOCK,
  merkleRoot: MERKLE_ROOT,
  time: 1729500000,
  bits: 0x1d00ffff,
  nonce: blockNonce,
})

export const headerPayload: Payload = {
  title: t('80-byte block header', '80 字节区块头'),
  hex: SAMPLE_HEADER.hex,
  fields: SAMPLE_HEADER.fields,
  layers: [
    { name: t('Version', '版本'), bytes: 4, color: '#0b8b98' },
    { name: t('Previous hash', '前一区块哈希'), bytes: 32, color: '#2d6cdf' },
    { name: t('Merkle root', 'Merkle 根'), bytes: 32, color: '#f7931a' },
    { name: t('Time · Bits · Nonce', '时间 · 目标 · 随机数'), bytes: 12, color: '#6d4bdc' },
  ],
  note: t(
    `Double-SHA-256 of these 80 bytes is ${SAMPLE_HEADER.hash.slice(0, 24)}… for nonce ${blockNonce}. Its leading byte is 0x00 — an easy educational target (mainnet difficulty 1 would need ~2³²× more work).`,
    `对这 80 字节做两次 SHA-256 得到 ${SAMPLE_HEADER.hash.slice(0, 24)}…（nonce ${blockNonce}）。其首字节为 0x00——一个极简的教学目标（主网难度 1 需要约 2³² 倍的工作量）。`,
  ),
}

function p2pMessage(command: string, payload: Uint8Array, magic = 'f9beb4d9'): Uint8Array {
  const cmd = new Uint8Array(12)
  cmd.set(utf8ToBytes(command))
  const checksum = sha256d(payload).slice(0, 4)
  return concatBytes(hexToBytes(magic), cmd, u32le(payload.length), checksum, payload)
}

const versionPayload = (() => {
  const services = u64le(0x409)
  const timestamp = u64le(1729500142)
  const addrRecv = concatBytes(services, new Uint8Array(10), new Uint8Array([0xff, 0xff, 203, 0, 113, 10]), new Uint8Array([0x20, 0x8d]))
  const addrFrom = concatBytes(services, new Uint8Array(10), new Uint8Array([0xff, 0xff, 192, 168, 1, 20]), new Uint8Array([0x20, 0x8d]))
  const nonce = u64le(0x9a3f7c21d4e58b06)
  const ua = utf8ToBytes('/btc-explorer:1.0')
  const height = u32le(870_001)
  return concatBytes(u32le(70016), services, timestamp, addrRecv, addrFrom, nonce, varint(ua.length), ua, height, new Uint8Array([1]))
})()

const versionMessage = p2pMessage('version', versionPayload)
export const versionPayloadDoc: Payload = {
  title: t('P2P version message', 'P2P version 消息'),
  hex: bytesToHex(versionMessage),
  fields: [
    { off: 0, len: 4, name: t('Magic', '魔数'), value: 'f9beb4d9', note: t('Mainnet marker. Wrong magic closes the connection.', '主网标记；魔数错误会断开连接。') },
    { off: 4, len: 12, name: t('Command', '命令'), value: 'version', note: t('ASCII command, zero-padded to 12 bytes.', 'ASCII 命令，补零至 12 字节。') },
    { off: 16, len: 4, name: t('Payload length', '负载长度'), value: `${versionPayload.length} bytes`, note: t('Little-endian size of the payload that follows.', '后面负载的小端字节长度。') },
    { off: 20, len: 4, name: t('Checksum', '校验和'), value: bytesToHex(versionMessage.slice(20, 24)), note: t('First 4 bytes of double-SHA-256(payload).', '负载双 SHA-256 的前 4 字节。') },
    { off: 24, len: 4, name: t('Protocol version', '协议版本'), value: '70016', note: t('70016 negotiates modern features such as wtxid relay.', '70016 协商 wtxid 中继等现代特性。') },
    { off: 28, len: 8, name: t('Services', '服务位'), value: '0x0000000000000409', note: t('NODE_NETWORK | NODE_WITNESS | NODE_NETWORK_LIMITED.', 'NODE_NETWORK | NODE_WITNESS | NODE_NETWORK_LIMITED。') },
    { off: 36, len: 8, name: t('Timestamp', '时间戳'), value: '1729500142', note: t('int64 Unix time; used for peer address bookkeeping.', 'int64 Unix 时间；用于对等节点地址管理。') },
    { off: 44, len: 26, name: t('Receiver address', '接收方地址'), value: '203.0.113.10:8333', note: t('Network address of the peer being greeted.', '被问候对等节点的网络地址。') },
    { off: 70, len: 26, name: t('Sender address', '发送方地址'), value: '192.168.1.20:8333', note: t('What the sender believes its own address is.', '发送方认为自己拥有的地址。') },
    { off: 96, len: 8, name: t('Nonce', '随机数'), value: '0x9a3f7c21d4e58b06', note: t('Detects connections to yourself.', '用于检测连接到自身。') },
    { off: 104, len: 1, name: t('User agent length', '用户代理长度'), value: '17', note: t('Length prefix of the user agent string.', '用户代理字符串的长度前缀。') },
    { off: 105, len: 17, name: t('User agent', '用户代理'), value: '/btc-explorer:1.0', note: t('Free-form software identifier; never trust it.', '自由格式的软件标识；不要信任其声明。') },
    { off: 122, len: 4, name: t('Start height', '起始高度'), value: '870,001', note: t('Tells the peer how far the sender has synced.', '告诉对方自己已同步到的区块高度。') },
    { off: 126, len: 1, name: t('Relay', '中继'), value: '1 (yes)', note: t('Ask for unconfirmed transaction announcements.', '请求未确认交易公告。') },
  ],
  note: t(
    'The reply is a verack. Only after that exchange do peers exchange addresses and inventory.',
    '对方回复 verack；握手完成后才开始交换地址与库存消息。',
  ),
}

const invPayloadBytes = concatBytes(varint(1), u32le(1), hexToBytes(reverseHex(SAMPLE_TX.txid)))
const invMessage = p2pMessage('inv', invPayloadBytes)
export const invPayloadDoc: Payload = {
  title: t('P2P inv (inventory) message', 'P2P inv（库存）消息'),
  hex: bytesToHex(invMessage),
  fields: [
    { off: 0, len: 4, name: t('Magic', '魔数'), value: 'f9beb4d9', note: t('Mainnet network marker.', '主网网络标记。') },
    { off: 4, len: 12, name: t('Command', '命令'), value: 'inv', note: t('“I have something you may want.”', '“我有你可能会要的数据。”') },
    { off: 16, len: 4, name: t('Length', '长度'), value: '37 bytes', note: t('Count + one inventory vector.', '计数 + 一个库存向量。') },
    { off: 20, len: 4, name: t('Checksum', '校验和'), value: bytesToHex(invMessage.slice(20, 24)), note: t('Integrity check for the payload.', '负载完整性校验。') },
    { off: 24, len: 1, name: t('Vector count', '向量数量'), value: '1', note: t('One item is announced.', '公告一个数据项。') },
    { off: 25, len: 4, name: t('Type', '类型'), value: '1 (MSG_TX)', note: t('MSG_BLOCK would announce a block.', 'MSG_BLOCK 表示公告区块。') },
    { off: 29, len: 32, name: t('TXID', '交易 ID'), value: SAMPLE_TX.txid.slice(0, 20) + '…', note: t('The announced transaction (internal byte order). Interested peers answer getdata.', '被公告的交易（内部字节序）；感兴趣的节点用 getdata 请求。') },
  ],
  note: t(
    'Inv is a rumour, not the data. It keeps the network cheap: peers fetch only what they lack.',
    'inv 只是“传闻”而非数据本身，这样网络开销很小：节点只请求自己缺少的内容。',
  ),
}

const onion = (() => {
  const bytes = new Uint8Array(126)
  bytes[0] = 0x00
  bytes.set(hexToBytes('02e8f3a1b7c4d6902a5e8f1b3c7d9e0a4b6c8d2e5f7a9b1c3d5e7f9a0b2c4d6e80'), 1)
  const hop = utf8ToBytes('short_channel_id=812345x42x0 amt=250000 cltv=871240')
  bytes.set(hop, 34)
  bytes.set(hexToBytes('9a3f7c21d4e58b06a1c3e5f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b'), 94)
  return bytes
})()

export const onionPayloadDoc: Payload = {
  title: t('Onion routing packet (first 126 bytes)', '洋葱路由包（前 126 字节）'),
  hex: bytesToHex(onion),
  fields: [
    { off: 0, len: 1, name: t('Version', '版本'), value: '0x00', note: t('Sphinx packet version.', 'Sphinx 包版本。') },
    { off: 1, len: 33, name: t('Ephemeral public key', '临时公钥'), value: bytesToHex(onion.slice(1, 34)).slice(0, 20) + '…', note: t('Each hop derives its own shared secret from this key.', '每一跳用它派生各自的共享密钥。') },
    { off: 34, len: 60, name: t('Hop payload', '跳负载'), value: 'scid · amount · cltv', note: t('Decrypted hop payload (demo, shown in plaintext).', '已解密的跳负载（演示，明文展示）。') },
    { off: 94, len: 32, name: t('HMAC', 'HMAC'), value: bytesToHex(onion.slice(94, 126)).slice(0, 20) + '…', note: t('Per-hop integrity field (illustrative bytes here).', '每一跳的完整性字段（此处为示意字节）。') },
  ],
  note: t(
    'A real onion is 1,366 bytes and layers one encrypted payload per hop. Routers cannot see the whole path; this demo shows the first hop decrypted for clarity.',
    '真实洋葱包为 1,366 字节，每一跳只有一层可解密负载；路由节点看不到完整路径。本演示为清晰起见展示已解密的第一跳。',
  ),
}

export const feeRate = FEE_RATE

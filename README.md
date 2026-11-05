# Bitcoin Explorer

> An interactive, byte-level guide to how Bitcoin actually works — block by block.

**Bitcoin Explorer** is a self-hosted, browser-only learning site that animates transactions, scripts, blocks, mining, consensus, the peer-to-peer network, keys and the Lightning Network — then lets you open any event and decode its raw bytes. No accounts, no tracking, no server: everything (including the real cryptography) runs locally in your browser.

It closely follows the interaction and animation language of [protocol-explorer-alpha](https://protocol-explorer-alpha.vercel.app/) — the same blueprint/instrument-panel aesthetic, three-pane workspace, playback engine, sequence view and byte inspector — re-themed around Bitcoin.

---

## Features

- **8 protocol chapters × 5 steps**, each an animated walkthrough with a step-by-step explanation panel.
- **5 interactive labs** using *real* cryptography in the browser:
  - **Hash Lab** — SHA-256 avalanche + a live proof-of-work nonce search.
  - **Merkle Lab** — tamper a leaf and watch the root change; verify an inclusion proof.
  - **Key Lab** — generate a keypair, sign and verify with `secp256k1`.
  - **UTXO Lab** — select coins, build and price a transaction, watch change/dust/fee math.
  - **Difficulty Lab** — seventeen years of difficulty and hashrate on an interactive chart.
- **Byte-level inspector** — click any event to see its field/value breakdown and a hex dump with field↔byte highlighting.
- **Sequence view** — a message-sequence diagram with flowing lifelines and a playhead.
- **Playback engine** — play / pause / speed (0.5×–2×) / step / reset, with keyboard shortcuts (`Space`, `←`, `→`, `N`, `S`).
- **Dark/light theme**, **English / 简体中文**, and **local progress** persistence.
- **Responsive** — a mobile drawer and a fixed playback bar on small screens.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [@noble/hashes](https://github.com/paulmillr/noble-hashes) — SHA-256, RIPEMD-160, HMAC
- [@noble/secp256k1](https://github.com/paulmillr/noble-secp256k1) — real ECDSA signing/verification
- [@scure/base](https://github.com/paulmillr/scure-base) — base58check / bech32 addresses
- Hand-written CSS (no framework), [Iosevka](https://typeof.net/Iosevka/) typeface

## Getting started

```bash
# install
npm install

# start the dev server
npm run dev

# production build
npm run build

# preview the build
npm run preview
```

The dev server runs on `http://localhost:5173` by default.

## Project structure

```
src/
  App.tsx                  # root state + playback engine
  components/              # TopBar, Sidebar, Scene, SequenceView,
                           # EventTable, Inspector, RightPanel, icons
  components/labs/         # HashLab, MerkleLab, KeyLab, UtxoLab, DifficultyLab
  data/
    chapters.ts            # all chapter/step/event/node content (EN + ZH)
    payloads.ts            # real tx / header / P2P / merkle / onion payloads
  lib/
    btc.ts                 # crypto + serialization (SHA-256d, P2PKH tx builder, …)
    format.ts              # hex / time helpers
  styles.css               # design system + all styling
ref/                       # Playwright scripts used to verify parity with the reference
```

## Chapters & labs

| # | Chapter | 中文 | Description |
|---|---------|------|-------------|
| 1 | Transaction | 交易 | Spending unspent outputs |
| 2 | Script | 脚本 | Programs that lock coins |
| 3 | Block | 区块 | Batching transactions into history |
| 4 | Mining | 挖矿 | Proof of work and issuance |
| 5 | Consensus | 共识 | One history without a ruler |
| 6 | Network | 网络 | Gossip between peers |
| 7 | Keys | 密钥 | Ownership is a signature |
| 8 | Lightning | 闪电网络 | Scaling with payment channels |

Interactive labs: **Hash Lab**, **Merkle Lab**, **Key Lab**, **UTXO Lab**, **Difficulty Lab**.

## Notes

- All simulation data is educational; protocol parameters (mainnet sizes, fees, difficulty, subsidy) are real.
- Nothing is broadcast, and no data leaves the browser.

## License

MIT

---

# Bitcoin Explorer（中文说明）

> 一份逐字节、可交互的比特币工作原理指南——一个区块一个区块地理解比特币。

**Bitcoin Explorer** 是一个完全在浏览器本地运行的学习站点：动画演示交易、脚本、区块、挖矿、共识、P2P 网络、密钥与闪电网络，并允许你点击任意事件、逐字节解码其原始数据。无需账号、无追踪、无服务器——包括真实密码学在内的一切都在浏览器中本地完成。

它在交互与动画语言上深度参考了 [protocol-explorer-alpha](https://protocol-explorer-alpha.vercel.app/)——同样的蓝图/仪表盘美学、三栏工作区、播放引擎、时序视图与字节解码器，只是主题换成了比特币。

## 特性

- **8 章协议课程 × 每章 5 步**，每章都是一段带动画的分步讲解，并配有说明面板。
- **5 个交互实验**，使用浏览器内的**真实密码学**：
  - **哈希实验** —— SHA-256 雪崩效应 + 实时工作量证明 nonce 搜索。
  - **Merkle 实验** —— 篡改叶子观察根变化；验证包含证明。
  - **密钥实验** —— 生成密钥对，用 `secp256k1` 签名与验证。
  - **UTXO 实验** —— 选币、构造并计算一笔交易的费用，观察找零/粉尘/手续费。
  - **难度实验** —— 十七年的难度与全网算力交互图表。
- **逐字节解码器** —— 点击任意事件查看字段/数值拆解，以及字段↔字节高亮联动的十六进制转储。
- **时序视图** —— 带流动生命线与播放游标的消息时序图。
- **播放引擎** —— 播放 / 暂停 / 变速（0.5×–2×）/ 单步 / 重置，支持快捷键（`Space`、`←`、`→`、`N`、`S`）。
- **深色/浅色主题**、**英文 / 简体中文**、**本地进度**持久化。
- **响应式** —— 移动端抽屉菜单与固定播放栏。

## 技术栈

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [@noble/hashes](https://github.com/paulmillr/noble-hashes) —— SHA-256、RIPEMD-160、HMAC
- [@noble/secp256k1](https://github.com/paulmillr/noble-secp256k1) —— 真实 ECDSA 签名/验证
- [@scure/base](https://github.com/paulmillr/scure-base) —— base58check / bech32 地址
- 手写 CSS（无框架），字体 [Iosevka](https://typeof.net/Iosevka/)

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

开发服务器默认运行于 `http://localhost:5173`。

## 项目结构

```
src/
  App.tsx                  # 根状态 + 播放引擎
  components/              # TopBar、Sidebar、Scene、SequenceView、
                           # EventTable、Inspector、RightPanel、icons
  components/labs/         # HashLab、MerkleLab、KeyLab、UtxoLab、DifficultyLab
  data/
    chapters.ts            # 全部章节/步骤/事件/节点内容（中英双语）
    payloads.ts            # 真实交易 / 区块头 / P2P / Merkle / 洋葱包负载
  lib/
    btc.ts                 # 密码学与序列化（SHA-256d、P2PKH 交易构造等）
    format.ts              # 十六进制 / 时间工具
  styles.css               # 设计系统与全部样式
ref/                       # 用于对照参考站点做一致性验证的 Playwright 脚本
```

## 章节与实验

| 序号 | 章节 | 说明 |
|------|------|------|
| 1 | 交易 | 花费未花费输出 |
| 2 | 脚本 | 锁定比特币的脚本 |
| 3 | 区块 | 把交易写入历史 |
| 4 | 挖矿 | 工作量证明与发行 |
| 5 | 共识 | 没有统治者的唯一历史 |
| 6 | 网络 | 对等节点之间的 gossip |
| 7 | 密钥 | 所有权就是一个签名 |
| 8 | 闪电网络 | 用支付通道扩容 |

交互实验：**哈希实验**、**Merkle 实验**、**密钥实验**、**UTXO 实验**、**难度实验**。

## 说明

- 所有演示数据均为教学用途；协议参数（主网大小、手续费、难度、补贴）均为真实值。
- 不会广播任何内容，也不会有任何数据离开浏览器。

## 许可证

MIT

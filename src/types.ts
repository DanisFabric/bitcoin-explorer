export type Lang = 'en' | 'zh'

export interface T {
  en: string
  zh: string
}

export type NodeKind =
  | 'wallet'
  | 'node'
  | 'miner'
  | 'mempool'
  | 'chain'
  | 'pool'
  | 'gauge'
  | 'vault'
  | 'tx'
  | 'block'
  | 'cloud'
  | 'channel'
  | 'router'
  | 'seed'

export type EventKind = 'tx' | 'sig' | 'block' | 'inv' | 'hash' | 'proof' | 'msg' | 'channel' | 'coinbase'

export interface PayloadField {
  off: number
  len: number
  name: T
  value: string
  note: T
}

export interface Payload {
  title: T
  hex: string
  fields: PayloadField[]
  layers?: { name: T; bytes: number; color: string }[]
  note?: T
}

export interface FlowEvent {
  id: number
  t: number
  from: string
  to: string
  kind: EventKind
  info: T
  size: string
  duration?: number
  payload?: Payload
}

export interface Fact {
  label: T
  value: string
}

export interface Step {
  title: T
  short: T
  body: T
  t: number
  focus: string[]
  facts: Fact[]
}

export interface SceneNode {
  id: string
  kind: NodeKind
  label: T
  sub: string
  x: number
  y: number
  scale?: number
}

export interface SceneLink {
  from: string
  to: string
  curve?: number
}

export type LabId = 'hash' | 'merkle' | 'keys' | 'utxo' | 'difficulty'

export interface Chapter {
  id: string
  name: string
  subtitle: T
  category: 'CORE' | 'LEDGER' | 'NETWORK' | 'LAYER 2' | 'LAB'
  layer: number
  summary: T
  meta: Fact[]
  steps: Step[]
  events: FlowEvent[]
  nodes: SceneNode[]
  links: SceneLink[]
  accent: string
  lab?: LabId
  labTagline?: T
}

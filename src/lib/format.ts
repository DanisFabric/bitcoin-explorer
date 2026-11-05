export const formatTime = (t: number) => `${t.toFixed(3)}s`

export function hexPairs(hex: string): string[][] {
  const bytes = hex.match(/.{1,2}/g) ?? []
  const rows: string[][] = []
  for (let i = 0; i < bytes.length; i += 16) rows.push(bytes.slice(i, i + 16))
  return rows
}

export function asciiOf(hex: string): string {
  return (hex.match(/.{1,2}/g) ?? [])
    .map((b) => {
      const n = parseInt(b, 16)
      return n >= 32 && n < 127 ? String.fromCharCode(n) : '.'
    })
    .join('')
}

export type IconName =
  | 'menu'
  | 'globe'
  | 'sun'
  | 'moon'
  | 'play'
  | 'pause'
  | 'prev'
  | 'next'
  | 'reset'
  | 'layers'
  | 'sequence'
  | 'check'
  | 'dots'
  | 'close'
  | 'copy'
  | 'arrow'
  | 'chevron'
  | 'lock'
  | 'key'
  | 'spark'
  | 'warning'
  | 'search'
  | 'download'
  | 'refresh'

const paths: Record<IconName, React.ReactNode> = {
  menu: (
    <>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.6 3 14.4 0 18M12 3c-3 3.6-3 14.4 0 18" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
    </>
  ),
  moon: <path d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8 8.7 8.7 0 1 0 20.2 14.6Z" />,
  play: <path d="M8 5.4v13.2L19 12 8 5.4Z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6.5" y="5" width="4" height="14" rx="0.6" fill="currentColor" stroke="none" />
      <rect x="13.5" y="5" width="4" height="14" rx="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  prev: <path d="M15 5 8 12l7 7" />,
  next: <path d="M9 5l7 7-7 7" />,
  reset: (
    <>
      <path d="M4.5 10.5A7.8 7.8 0 1 1 5 15" />
      <path d="M4 5v5.5h5.5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" />
      <path d="m4 12 8 4.4 8-4.4M4 16.4l8 4.4 8-4.4" />
    </>
  ),
  sequence: (
    <>
      <path d="M3 6h18M3 18h18" />
      <path d="M7 6v12M17 6v12" strokeDasharray="2 3" />
      <path d="m9 9 3-2 3 2M9 13l3 2 3-2" />
    </>
  ),
  check: <path d="m4 12.5 5 5L20 6.5" />,
  dots: (
    <>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  close: <path d="M5 5l14 14M19 5 5 19" />,
  copy: (
    <>
      <rect x="8" y="8" width="11" height="12" rx="1.5" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v11A1.5 1.5 0 0 0 5.5 18H8" />
    </>
  ),
  arrow: <path d="M4 12h16M14 6l6 6-6 6" />,
  chevron: <path d="m8 5 7 7-7 7" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="1.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="m11 11 9 9M17 17l2-2M14 14l2-2" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
      <circle cx="12" cy="12" r="2.4" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3 22 20H2L12 3Z" />
      <path d="M12 9v5M12 17.2v.2" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </>
  ),
  download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />,
  refresh: <path d="M20 11a8 8 0 0 0-14.7-4M4 5v4h4M4 13a8 8 0 0 0 14.7 4M20 19v-4h-4" />,
}

export function Icon({ name, size = 18, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

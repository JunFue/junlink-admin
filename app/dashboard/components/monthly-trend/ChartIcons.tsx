import React from 'react'
import { ChartStyle } from './types'

export function BarIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 20 16" className="h-4 w-4" fill="none">
      <rect x="2" y="6" width="4" height="10" rx="1" fill={active ? 'currentColor' : 'currentColor'} opacity={active ? 1 : 0.4} />
      <rect x="8" y="2" width="4" height="14" rx="1" fill={active ? 'currentColor' : 'currentColor'} opacity={active ? 1 : 0.4} />
      <rect x="14" y="8" width="4" height="8" rx="1" fill={active ? 'currentColor' : 'currentColor'} opacity={active ? 1 : 0.4} />
    </svg>
  )
}

export function SmoothLineIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 20 16" className="h-4 w-4" fill="none">
      <path d="M2 12 C5 12, 6 4, 10 4 C14 4, 15 10, 18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={active ? 1 : 0.4} />
    </svg>
  )
}

export function LineDotIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 20 16" className="h-4 w-4" fill="none">
      <path d="M2 12 L7 5 L13 8 L18 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={active ? 1 : 0.4} />
      <circle cx="2" cy="12" r="1.5" fill="currentColor" opacity={active ? 1 : 0.4} />
      <circle cx="7" cy="5" r="1.5" fill="currentColor" opacity={active ? 1 : 0.4} />
      <circle cx="13" cy="8" r="1.5" fill="currentColor" opacity={active ? 1 : 0.4} />
      <circle cx="18" cy="3" r="1.5" fill="currentColor" opacity={active ? 1 : 0.4} />
    </svg>
  )
}

export function BarSmoothIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 20 16" className="h-4 w-4" fill="none">
      <rect x="2" y="8" width="3" height="8" rx="0.5" fill="currentColor" opacity={active ? 0.3 : 0.15} />
      <rect x="8.5" y="5" width="3" height="11" rx="0.5" fill="currentColor" opacity={active ? 0.3 : 0.15} />
      <rect x="15" y="10" width="3" height="6" rx="0.5" fill="currentColor" opacity={active ? 0.3 : 0.15} />
      <path d="M3.5 7 C6 7, 7 3, 10 3 C13 3, 14 9, 16.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={active ? 1 : 0.4} />
    </svg>
  )
}

export function BarLineDotIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 20 16" className="h-4 w-4" fill="none">
      <rect x="2" y="8" width="3" height="8" rx="0.5" fill="currentColor" opacity={active ? 0.3 : 0.15} />
      <rect x="8.5" y="5" width="3" height="11" rx="0.5" fill="currentColor" opacity={active ? 0.3 : 0.15} />
      <rect x="15" y="10" width="3" height="6" rx="0.5" fill="currentColor" opacity={active ? 0.3 : 0.15} />
      <path d="M3.5 7 L10 3 L16.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={active ? 1 : 0.4} />
      <circle cx="3.5" cy="7" r="1.5" fill="currentColor" opacity={active ? 1 : 0.4} />
      <circle cx="10" cy="3" r="1.5" fill="currentColor" opacity={active ? 1 : 0.4} />
      <circle cx="16.5" cy="9" r="1.5" fill="currentColor" opacity={active ? 1 : 0.4} />
    </svg>
  )
}

export const CHART_STYLE_OPTIONS: { value: ChartStyle; label: string; Icon: React.FC<{ active?: boolean }> }[] = [
  { value: 'bar', label: 'Bar', Icon: BarIcon },
  { value: 'smooth-line', label: 'Smooth Line', Icon: SmoothLineIcon },
  { value: 'line-dot', label: 'Line Dot', Icon: LineDotIcon },
  { value: 'bar-smooth', label: 'Bar + Smooth', Icon: BarSmoothIcon },
  { value: 'bar-line-dot', label: 'Bar + Line Dot', Icon: BarLineDotIcon },
]

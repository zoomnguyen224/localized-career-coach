'use client'

import { FilterState } from '@/types/jobs'

interface FilterBarProps {
  filters: FilterState
  totalCount: number
  onChange: (filters: FilterState) => void
}

const CATEGORIES: Array<{ value: FilterState['category']; label: string }> = [
  { value: 'all', label: 'All roles' },
  { value: 'ai-ml', label: 'AI / ML' },
  { value: 'product', label: 'Product' },
  { value: 'data', label: 'Data' },
  { value: 'engineering', label: 'Engineering' },
]

const COUNTRIES: Array<FilterState['countries'][number]> = ['UAE', 'KSA', 'Qatar']

export function FilterBar({ filters, totalCount, onChange }: FilterBarProps) {
  const chip = (active: boolean, onClick: () => void, label: string, variant: 'blue' | 'green' = 'blue') =>
    `flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
      active
        ? variant === 'green'
          ? 'bg-[var(--brand-severity-ok-soft)] border-[var(--brand-severity-ok)] text-[var(--brand-severity-ok)]'
          : 'bg-[var(--brand-severity-info-soft)] border-[var(--brand-accent)] text-[var(--brand-accent)]'
        : 'bg-white border-[var(--brand-line)] text-[var(--brand-ink-2)] hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]'
    }`

  return (
    <div className="flex items-center gap-2.5 px-7 py-4 border-b border-[var(--brand-line)] flex-wrap">
      {CATEGORIES.map(cat => (
        <button
          key={cat.value}
          className={chip(filters.category === cat.value, () => {}, cat.label)}
          onClick={() => onChange({ ...filters, category: cat.value })}
        >
          {cat.label}
        </button>
      ))}

      <div className="w-px h-5 bg-[var(--brand-line)] flex-shrink-0" />

      <button
        className={chip(filters.minScore === 4.0, () => {}, 'Strong match (4.0+)', 'green')}
        onClick={() => onChange({ ...filters, minScore: filters.minScore === 4.0 ? null : 4.0 })}
      >
        Strong match (4.0+)
      </button>

      <button
        className={chip(filters.remoteOnly, () => {}, 'Remote only')}
        onClick={() => onChange({ ...filters, remoteOnly: !filters.remoteOnly })}
      >
        Remote only
      </button>

      {COUNTRIES.map(c => (
        <button
          key={c}
          className={chip(filters.countries.includes(c), () => {}, c)}
          onClick={() => {
            const next = filters.countries.includes(c)
              ? filters.countries.filter(x => x !== c)
              : [...filters.countries, c]
            onChange({ ...filters, countries: next })
          }}
        >
          {c}
        </button>
      ))}

      <span className="ml-auto text-xs text-[var(--brand-ink-2)] flex-shrink-0">
        {totalCount} jobs · sorted by match
      </span>
    </div>
  )
}

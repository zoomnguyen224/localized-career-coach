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
          ? 'bg-[#E6FAF4] border-[#03BA82] text-[#009C6C]'
          : 'bg-[#e8f0fe] border-[#0052ff] text-[#0052ff]'
        : 'bg-white border-[#d8dbe4] text-[#727998] hover:border-[#0052ff] hover:text-[#0052ff]'
    }`

  return (
    <div className="flex items-center gap-2.5 px-7 py-4 border-b border-[#d8dbe4] flex-wrap">
      {CATEGORIES.map(cat => (
        <button
          key={cat.value}
          className={chip(filters.category === cat.value, () => {}, cat.label)}
          onClick={() => onChange({ ...filters, category: cat.value })}
        >
          {cat.label}
        </button>
      ))}

      <div className="w-px h-5 bg-[#d8dbe4] flex-shrink-0" />

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

      <span className="ml-auto text-xs text-[#727998] flex-shrink-0">
        {totalCount} jobs · sorted by match
      </span>
    </div>
  )
}

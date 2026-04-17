// src/components/dashboard/StatCard.tsx

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  valueColor?: string
}

export function StatCard({ label, value, subtitle, valueColor = '#0a0b0d' }: StatCardProps) {
  return (
    <div className="bg-white border border-[#d8dbe4] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)] flex flex-col gap-1">
      <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em]">{label}</div>
      <div className="text-[28px] font-extrabold leading-none" style={{ color: valueColor }}>{value}</div>
      {subtitle && <div className="text-[11px] text-[#727998]">{subtitle}</div>}
    </div>
  )
}

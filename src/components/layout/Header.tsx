export default function Header() {
  return (
    <header className="bg-white h-14 px-6 flex items-center justify-between border-b border-border shadow-[0px_2px_4px_rgba(141,150,180,0.12)]">
      <div className="flex items-baseline gap-1">
        <span className="text-navy font-bold text-xl">Localized</span>
        <span className="text-blue text-sm font-semibold ml-1">AI Career Coach</span>
      </div>
      <span className="bg-blue/10 text-blue text-xs font-semibold px-2 py-0.5 rounded-full">
        Beta
      </span>
    </header>
  )
}

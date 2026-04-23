// src/components/cv/CVPreview.tsx
'use client'

import { useState } from 'react'
import { GeneratedCV } from '@/types/cv'

interface CVPreviewProps {
  masterCvMarkdown: string
  activeCV: GeneratedCV | null
  onGenerate: (jobTitle: string, company: string, jobDescription: string) => Promise<void>
  isGenerating: boolean
  initialJobTitle?: string
  initialCompany?: string
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[^<]*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n\n+/g, '</p><p>')
}

export function CVPreview({ masterCvMarkdown, activeCV, onGenerate, isGenerating, initialJobTitle, initialCompany }: CVPreviewProps) {
  const [jobTitle, setJobTitle] = useState(initialJobTitle ?? '')
  const [company, setCompany] = useState(initialCompany ?? '')
  const [jobDescription, setJobDescription] = useState('')
  const [showForm, setShowForm] = useState(!!initialJobTitle)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jobTitle.trim() || !company.trim() || !jobDescription.trim()) return
    await onGenerate(jobTitle, company, jobDescription)
    setShowForm(false)
    setJobDescription('')
  }

  const masterHtml = `<!DOCTYPE html><html><head><style>
    body { font-family: -apple-system, Arial, sans-serif; font-size: 13px; line-height: 1.6; color: var(--brand-ink-0); padding: 32px; max-width: 700px; margin: 0 auto; }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
    h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--brand-ink-3); margin: 20px 0 8px; border-bottom: 1px solid var(--brand-line); padding-bottom: 4px; }
    h3 { font-size: 13px; font-weight: 700; margin: 8px 0 2px; }
    p { margin: 0 0 8px; color: var(--brand-ink-2); }
    ul { margin: 4px 0 8px 16px; color: var(--brand-ink-2); }
    li { margin-bottom: 3px; }
  </style></head><body><p>${markdownToHtml(masterCvMarkdown)}</p></body></html>`

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        {activeCV ? (
          <div className="bg-[var(--brand-severity-info-soft)] border border-[#d0e4ff] rounded-[10px] px-4 py-3 flex-1 flex items-center justify-between">
            <div>
              <div className="text-[12px] font-bold text-[var(--brand-accent)]">
                Tailored for {activeCV.company} · {activeCV.jobTitle}
              </div>
              <div className="text-[11px] text-[var(--brand-ink-2)] mt-0.5">
                {activeCV.keywordsInjected} keywords injected · {activeCV.atsScore}% ATS score
              </div>
            </div>
            <div className="flex flex-wrap gap-1 max-w-[220px] ml-4">
              {activeCV.keywords.slice(0, 4).map(kw => (
                <span key={kw} className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{kw}</span>
              ))}
              {activeCV.keywords.length > 4 && (
                <span className="text-[10px] text-[var(--brand-ink-2)]">+{activeCV.keywords.length - 4}</span>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="text-[13px] font-bold text-[var(--brand-ink-0)]">Master CV</div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-[var(--brand-accent)] text-white text-[12px] font-bold px-4 py-2 rounded-[14px] ml-4 flex-shrink-0"
            >
              Generate tailored version
            </button>
          </>
        )}
      </div>

      {/* Generate form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-[var(--brand-line)] rounded-[10px] p-5 mb-4 flex-shrink-0 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
          <div className="text-[10px] font-bold text-[var(--brand-ink-3)] uppercase tracking-[0.08em] mb-3">Generate tailored CV</div>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              placeholder="Job title"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              className="flex-1 border border-[var(--brand-line)] rounded-[10px] px-3 py-2 text-[12px] text-[var(--brand-ink-0)] placeholder:text-[var(--brand-ink-3)] outline-none focus:border-[var(--brand-accent)]"
              required
            />
            <input
              type="text"
              placeholder="Company"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="flex-1 border border-[var(--brand-line)] rounded-[10px] px-3 py-2 text-[12px] text-[var(--brand-ink-0)] placeholder:text-[var(--brand-ink-3)] outline-none focus:border-[var(--brand-accent)]"
              required
            />
          </div>
          <textarea
            placeholder="Paste job description here..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            rows={4}
            className="w-full border border-[var(--brand-line)] rounded-[10px] px-3 py-2 text-[12px] text-[var(--brand-ink-0)] placeholder:text-[var(--brand-ink-3)] outline-none focus:border-[var(--brand-accent)] resize-none mb-3"
            required
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-[12px] text-[var(--brand-ink-2)] font-semibold px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={isGenerating} className="bg-[var(--brand-accent)] text-white text-[12px] font-bold px-5 py-2 rounded-[14px] disabled:opacity-50">
              {isGenerating ? 'Generating…' : 'Generate with agent'}
            </button>
          </div>
        </form>
      )}

      {/* CV preview iframe */}
      <div className="flex-1 bg-white border border-[var(--brand-line)] rounded-[10px] overflow-hidden shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
        <iframe
          srcDoc={activeCV ? activeCV.html : masterHtml}
          className="w-full h-full border-none"
          title="CV Preview"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  )
}

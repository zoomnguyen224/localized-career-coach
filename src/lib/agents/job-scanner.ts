// src/lib/agents/job-scanner.ts
import { Job, ATSSource, RoleCategory } from '@/types/jobs'
import { v4 as uuidv4 } from 'uuid'

function classifyRole(title: string): RoleCategory {
  const t = title.toLowerCase()
  if (t.match(/ai|ml|machine learning|llm|nlp|rag|generative/)) return 'ai-ml'
  if (t.match(/product manager|product owner|pm\b/)) return 'product'
  if (t.match(/data scientist|data engineer|data analyst|analytics/)) return 'data'
  if (t.match(/software|engineer|developer|backend|frontend|fullstack/)) return 'engineering'
  return 'other'
}

function inferRemoteType(location: string): Job['remoteType'] {
  const l = location.toLowerCase()
  if (l.includes('remote')) return 'remote'
  if (l.includes('hybrid')) return 'hybrid'
  return 'onsite'
}

export async function fetchGreenhouseJobs(
  companySlug: string,
  companyName: string,
  country: Job['country']
): Promise<Job[]> {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs`,
      { next: { revalidate: 21600 } } as RequestInit // 6h cache
    )
    if (!res.ok) return []
    const data = await res.json()
    const jobs: Array<{ id: number; title: string; absolute_url: string; location?: { name?: string } }> = data.jobs ?? []
    return jobs.map(j => ({
      id: uuidv4(),
      externalId: String(j.id),
      atsSource: 'greenhouse' as ATSSource,
      company: companyName,
      companySlug,
      title: j.title,
      location: j.location?.name ?? country,
      country,
      url: j.absolute_url,
      remoteType: inferRemoteType(j.location?.name ?? ''),
      roleCategory: classifyRole(j.title),
    }))
  } catch {
    return []
  }
}

export async function fetchLeverJobs(
  companySlug: string,
  companyName: string,
  country: Job['country']
): Promise<Job[]> {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${companySlug}?mode=json`,
      { next: { revalidate: 21600 } } as RequestInit
    )
    if (!res.ok) return []
    const jobs: Array<{ id: string; text: string; hostedUrl?: string; applyUrl?: string; categories?: { location?: string } }> = await res.json()
    return jobs.map(j => ({
      id: uuidv4(),
      externalId: j.id,
      atsSource: 'lever' as ATSSource,
      company: companyName,
      companySlug,
      title: j.text,
      location: j.categories?.location ?? country,
      country,
      url: j.hostedUrl ?? j.applyUrl ?? '',
      remoteType: inferRemoteType(j.categories?.location ?? ''),
      roleCategory: classifyRole(j.text),
    }))
  } catch {
    return []
  }
}

export function buildMockJobs(): Job[] {
  return [
    {
      id: 'mock-1', externalId: 'mock-1', atsSource: 'mock',
      company: 'STC', companySlug: 'stc', title: 'Senior AI Engineer',
      location: 'Riyadh · Hybrid', country: 'KSA', url: 'https://stc.com.sa/careers',
      remoteType: 'hybrid', roleCategory: 'ai-ml', salaryRange: 'SAR 28,000–35,000/mo',
      isVision2030: true, postedAt: new Date(Date.now() - 3 * 86400000).toISOString(), isNew: true,
    },
    {
      id: 'mock-2', externalId: 'mock-2', atsSource: 'mock',
      company: 'Talabat', companySlug: 'talabat', title: 'LLM Platform Engineer',
      location: 'Dubai · Remote', country: 'UAE', url: 'https://talabat.com/careers',
      remoteType: 'remote', roleCategory: 'ai-ml', salaryRange: 'AED 25,000–32,000/mo',
      postedAt: new Date(Date.now() - 1 * 86400000).toISOString(), isNew: true,
    },
    {
      id: 'mock-3', externalId: 'mock-3', atsSource: 'mock',
      company: 'Careem', companySlug: 'careem', title: 'AI Product Manager',
      location: 'Dubai · Hybrid', country: 'UAE', url: 'https://careem.com/careers',
      remoteType: 'hybrid', roleCategory: 'product', salaryRange: 'AED 22,000–28,000/mo',
      postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'mock-4', externalId: 'mock-4', atsSource: 'mock',
      company: 'NEOM', companySlug: 'neom', title: 'ML Engineer',
      location: 'Tabuk · Onsite', country: 'KSA', url: 'https://neom.com/careers',
      remoteType: 'onsite', roleCategory: 'ai-ml', salaryRange: 'SAR 32,000–40,000/mo',
      isVision2030: true, postedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: 'mock-5', externalId: 'mock-5', atsSource: 'mock',
      company: 'Geidea', companySlug: 'geidea', title: 'GenAI Engineer',
      location: 'Riyadh · Hybrid', country: 'KSA', url: 'https://geidea.net/careers',
      remoteType: 'hybrid', roleCategory: 'ai-ml', salaryRange: 'SAR 25,000–30,000/mo',
      postedAt: new Date(Date.now() - 2 * 86400000).toISOString(), isNew: true,
    },
    {
      id: 'mock-6', externalId: 'mock-6', atsSource: 'mock',
      company: 'Emirates NBD', companySlug: 'emiratesnbd', title: 'Data Science Lead',
      location: 'Dubai · Hybrid', country: 'UAE', url: 'https://emiratesnbd.com/careers',
      remoteType: 'hybrid', roleCategory: 'data', salaryRange: 'AED 28,000–35,000/mo',
      postedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ]
}

// MENA companies on Greenhouse/Lever — real ATS slugs
const MENA_ATS_COMPANIES: Array<{
  slug: string; name: string; ats: 'greenhouse' | 'lever'; country: Job['country']
}> = [
  { slug: 'careem', name: 'Careem', ats: 'lever', country: 'UAE' },
  { slug: 'fetchrewards', name: 'Fetch', ats: 'greenhouse', country: 'UAE' },
]

export async function scanAllMENAPortals(): Promise<Job[]> {
  const promises = MENA_ATS_COMPANIES.map(c =>
    c.ats === 'greenhouse'
      ? fetchGreenhouseJobs(c.slug, c.name, c.country)
      : fetchLeverJobs(c.slug, c.name, c.country)
  )
  const results = await Promise.allSettled(promises)
  const liveJobs = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])

  // Always include mock MENA jobs for demo reliability
  const mockJobs = buildMockJobs()

  // Merge: real jobs first, mock jobs deduplicated by company+title
  const seen = new Set(liveJobs.map(j => `${j.company}::${j.title}`))
  const dedupedMock = mockJobs.filter(j => !seen.has(`${j.company}::${j.title}`))

  return [...liveJobs, ...dedupedMock]
}

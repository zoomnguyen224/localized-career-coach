import { Suspense } from 'react'
import { InterviewPageClient } from '@/components/interview/InterviewPageClient'

export default function InterviewPage() {
  return (
    <Suspense fallback={null}>
      <InterviewPageClient />
    </Suspense>
  )
}

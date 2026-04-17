// src/app/(app)/cv/page.tsx
import { Suspense } from 'react'
import { CVPageClient } from '@/components/cv/CVPageClient'

export default function CVPage() {
  return (
    <Suspense fallback={null}>
      <CVPageClient />
    </Suspense>
  )
}

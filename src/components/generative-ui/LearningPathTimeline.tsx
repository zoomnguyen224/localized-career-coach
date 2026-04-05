import type { LearningPathResult, LearningResource } from '@/types'

function ResourceItem({ resource }: { resource: LearningResource }) {
  const isLocalized = resource.type === 'localized'
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span
        className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${isLocalized ? 'bg-teal' : 'bg-gray-400'}`}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-navy leading-tight">{resource.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-500">{resource.provider}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{resource.estimatedHours}h</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              isLocalized
                ? 'bg-teal/10 text-teal'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {isLocalized ? 'Localized' : 'External'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function LearningPathTimeline({ phases, totalDuration }: LearningPathResult) {
  return (
    <div className="my-3 w-full max-w-lg">
      <div className="relative">
        {phases.map((phase, index) => {
          const isLast = index === phases.length - 1
          return (
            <div key={phase.phase} className="flex gap-4">
              {/* Timeline marker column */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center text-sm font-bold shrink-0 z-10">
                  {phase.phase}
                </div>
                {!isLast && (
                  <div className="w-px flex-1 border-l-2 border-dashed border-gray-300 my-1" />
                )}
              </div>

              {/* Phase card */}
              <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <h3 className="font-semibold text-navy text-base">{phase.title}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {phase.duration}
                    </span>
                  </div>

                  {/* Skill badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {phase.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Resources */}
                  <div className="divide-y divide-gray-50">
                    {phase.resources.map((resource) => (
                      <ResourceItem key={resource.name} resource={resource} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total duration */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">Total Duration:</span>
        <span className="text-teal font-semibold">{totalDuration}</span>
      </div>
    </div>
  )
}

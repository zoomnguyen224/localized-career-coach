import type { LearningPathResult, LearningResource } from '@/types'

function ResourceItem({ resource }: { resource: LearningResource }) {
  const isLocalized = resource.type === 'localized'
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span
        className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${isLocalized ? 'bg-blue' : 'bg-muted'}`}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-navy leading-tight">{resource.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted">{resource.provider}</span>
          <span className="text-xs text-muted">·</span>
          <span className="text-xs text-muted">{resource.estimatedHours}h</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              isLocalized
                ? 'bg-blue/10 text-blue'
                : 'bg-gray-100 text-muted'
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
                <div className="w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center text-sm font-bold shrink-0 z-10">
                  {phase.phase}
                </div>
                {!isLast && (
                  <div className="w-px flex-1 border-l-2 border-dashed border-border my-1" />
                )}
              </div>

              {/* Phase card */}
              <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                <div className="bg-white rounded-[10px] shadow-[0px_5px_60px_0px_rgba(151,155,192,0.2)] p-4">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <h3 className="font-semibold text-navy text-base">{phase.title}</h3>
                    <span className="bg-blue/10 text-blue rounded-full text-xs px-2 py-0.5">
                      {phase.duration}
                    </span>
                  </div>

                  {/* Skill badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {phase.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs bg-gray-100 text-navy rounded-full px-2 py-0.5"
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
      <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-sm text-muted">
        <span className="font-medium">Total Duration:</span>
        <span className="text-blue font-semibold">{totalDuration}</span>
      </div>
    </div>
  )
}

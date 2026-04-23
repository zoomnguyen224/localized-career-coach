// src/components/home/CareerMapSection.tsx
'use client'

import Link from 'next/link'
import type { CareerGraph, CareerNode, CareerEdge } from '@/lib/career-map'
import { SectionLabel } from '@/components/primitives/SectionLabel'
import styles from '@/app/(shell)/home/home.module.css'
import { computeLayout, LAYOUT_LEARNER_POSITION, LAYOUT_CANVAS, type Point } from './layout'

interface CareerMapSectionProps {
  graph: CareerGraph
  /** Hand-authored layout for deck demos; falls back to `computeLayout`. */
  layoutOverride?: Record<string, Point>
  /** Ahmed is hardcoded here; the textual label changes when a CV is parsed. */
  learnerName: string
  learnerTagline: string
}

// ── helpers ───────────────────────────────────────────────────────────────

function primaryRoleOf(graph: CareerGraph): CareerNode | undefined {
  const roles = graph.nodes.filter(n => n.kind === 'role')
  if (roles.length === 0) return undefined
  // Prefer the role matching targetRoleId; else first by id.
  return (
    roles.find(r => r.id === `role:${graph.targetRoleId}`) ??
    roles.find(r => r.id.endsWith(graph.targetRoleId ?? '')) ??
    [...roles].sort((a, b) => a.id.localeCompare(b.id))[0]
  )
}

function secondaryRolesOf(graph: CareerGraph, primaryId: string | undefined): CareerNode[] {
  return graph.nodes.filter(n => n.kind === 'role' && n.id !== primaryId)
}

function severityTone(weight: number): 'low' | 'mid' | 'hot' {
  if (weight >= 0.7) return 'hot'
  if (weight >= 0.4) return 'mid'
  return 'low'
}

// SVG stroke/fill literals — CSS `var(--*)` does not resolve inside
// presentation attributes like `fill`/`stroke`, so we use hex equivalents
// that mirror the design tokens. Keep in sync with globals.css.
const COLOR = {
  emerald: '#16a34a',
  rose: '#e05a6a',
  amber: '#e09d3b',
  navy: '#0b2b6f',
  accent: '#1a8fff',
  white: '#ffffff',
}

function nodeFillStroke(node: CareerNode): { fill: string; stroke: string } {
  if (node.kind === 'role') return { fill: COLOR.white, stroke: COLOR.navy }
  switch (node.status) {
    case 'confirmed':
      return { fill: COLOR.emerald, stroke: COLOR.emerald }
    case 'gap':
      return { fill: COLOR.rose, stroke: COLOR.rose }
    case 'weak':
      return { fill: COLOR.amber, stroke: COLOR.amber }
    case 'unknown':
    default:
      return { fill: COLOR.white, stroke: COLOR.navy }
  }
}

function edgeStyleClass(edge: CareerEdge, fromStatus: CareerNode['status']): string {
  if (edge.kind === 'unlock') return `${styles.edge} ${styles.target} ${styles.hot}`
  if (fromStatus === 'confirmed') return `${styles.edge} ${styles.confirmed}`
  if (fromStatus === 'gap' || fromStatus === 'weak') return `${styles.edge} ${styles.gap}`
  return `${styles.edge} ${styles.inprog}`
}

function pathFor(from: Point, to: Point): string {
  // Gentle quadratic bezier. Keeps visual lineage with the deck's curved edges.
  const midX = (from.x + to.x) / 2
  return `M ${from.x} ${from.y} Q ${midX} ${(from.y + to.y) / 2 - 20} ${to.x} ${to.y}`
}

// ── component ─────────────────────────────────────────────────────────────

export function CareerMapSection({
  graph,
  layoutOverride,
  learnerName,
  learnerTagline,
}: CareerMapSectionProps) {
  const layout = layoutOverride ?? computeLayout(graph)
  const primary = primaryRoleOf(graph)
  const secondaries = secondaryRolesOf(graph, primary?.id)

  const nodeById = Object.fromEntries(graph.nodes.map(n => [n.id, n]))

  // For the bottom meta strip
  const skillNodes = graph.nodes.filter(n => n.kind === 'skill')
  const edgeCount = graph.edges.length
  const roleCount = graph.nodes.filter(n => n.kind === 'role').length

  // Top 3 gaps for the side rail — sorted by node weight descending.
  const topGaps = skillNodes
    .filter(n => n.status === 'gap' || n.status === 'weak')
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)

  const primaryLabel = primary?.label ?? 'your target role'

  return (
    <section className={styles.map}>
      <SectionLabel
        number="02"
        title="Your Career Map, responding"
        meta={
          <span className={styles.vstrip}>
            <span className={styles.vlbl}>Enrolled · 2 of 4</span>
            <span className={`${styles.vchip} ${styles.on} ${styles.ai}`}>
              <span className={styles.vdot} />
              AI &amp; Data
            </span>
            <span className={`${styles.vchip} ${styles.on} ${styles.virt}`}>
              <span className={styles.vdot} />
              Virtual Intelligence
            </span>
            <span className={`${styles.vchip} ${styles.green}`}>
              <span className={styles.vdot} />
              Green Skills
            </span>
            <span className={`${styles.vchip} ${styles.ready}`}>
              <span className={styles.vdot} />
              Career Readiness
            </span>
          </span>
        }
      />

      <div className={styles.mapWrap}>
        <div className={styles.mapCanvas}>
          <div className={styles.mapLegend}>
            <span>
              <span className={`${styles.sw} ${styles.confirmed}`} /> Confirmed
            </span>
            <span>
              <span className={`${styles.sw} ${styles.inprog}`} /> In progress
            </span>
            <span>
              <span className={`${styles.sw} ${styles.gap}`} /> Gap
            </span>
            <span>
              <span className={`${styles.sw} ${styles.target}`} /> Target
            </span>
          </div>

          <svg
            viewBox={`0 0 ${LAYOUT_CANVAS.width} ${LAYOUT_CANVAS.height}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`Career map for ${learnerName} — ${graph.matchScore}% match to ${primaryLabel}`}
          >
            {/* edges */}
            {graph.edges.map(edge => {
              const from = layout[edge.from]
              const to = layout[edge.to]
              const fromNode = nodeById[edge.from]
              if (!from || !to || !fromNode) return null
              return (
                <path
                  key={`${edge.from}->${edge.to}:${edge.kind}`}
                  className={edgeStyleClass(edge, fromNode.status)}
                  d={pathFor(from, to)}
                />
              )
            })}

            {/* You are here */}
            <g
              className={styles.youCard}
              transform={`translate(${LAYOUT_LEARNER_POSITION.x},${LAYOUT_LEARNER_POSITION.y})`}
            >
              <rect className={styles.ycBg} x="0" y="0" width="220" height="68" rx="10" />
              <text className={styles.ycSub} x="18" y="22">
                ◆ You are here
              </text>
              <text className={styles.ycTitle} x="18" y="42">
                {learnerName}
              </text>
              <text className={styles.ycSub} x="18" y="58" style={{ opacity: 0.55 }}>
                {learnerTagline}
              </text>
            </g>

            {/* skill nodes */}
            {skillNodes.map(node => {
              const pos = layout[node.id]
              if (!pos) return null
              const { fill, stroke } = nodeFillStroke(node)
              const radius = 6 + Math.round(node.weight * 8) // 6..14
              const highlight = node.status === 'gap' && node.weight >= 0.85

              return (
                <g key={node.id} transform={`translate(${pos.x},${pos.y})`}>
                  {highlight ? <circle className={styles.pulseRing} r={radius + 4} /> : null}
                  <circle r={radius} fill={fill} stroke={stroke} strokeWidth={2} />
                  {node.status === 'gap' && highlight ? (
                    <circle r={radius / 3} fill={COLOR.white} />
                  ) : null}
                  <text className={styles.nodeLabel} y={pos.y < 200 ? radius + 22 : -(radius + 6)}>
                    {node.label}
                  </text>
                  <text className={styles.nodeSub} y={pos.y < 200 ? radius + 34 : -(radius + 18)}>
                    {node.status === 'confirmed'
                      ? 'CONFIRMED'
                      : node.status === 'gap'
                      ? 'GAP'
                      : node.status === 'weak'
                      ? 'WEAK'
                      : 'UNKNOWN'}
                  </text>
                </g>
              )
            })}

            {/* primary target role card */}
            {primary && layout[primary.id] ? (
              <g
                className={styles.roleCard}
                transform={`translate(${layout[primary.id].x},${layout[primary.id].y - 50})`}
              >
                <rect className={styles.rcBg} x="0" y="0" width="150" height="108" rx="10" />
                <text className={styles.rcCo} x="12" y="20">
                  ◆ TARGET
                </text>
                <text className={styles.rcTitle} x="12" y="40">
                  {primary.label.split(' · ')[0]}
                </text>
                <text className={styles.rcCo} x="12" y="56">
                  {primary.label.split(' · ')[1] ?? ''}
                </text>
                <text
                  className={`${styles.rcMatch} ${graph.matchScore < 70 ? styles.down : styles.up}`}
                  x="12"
                  y="88"
                >
                  {graph.matchScore}
                  <tspan fontSize="14">%</tspan>
                </text>
                <text
                  className={`${styles.rcDelta} ${graph.matchScore < 70 ? styles.down : styles.up}`}
                  x="12"
                  y="100"
                >
                  current match
                </text>
              </g>
            ) : null}

            {/* secondary role cards (no match-score at the data model level) */}
            {secondaries.map(role => {
              const pos = layout[role.id]
              if (!pos) return null
              return (
                <g
                  key={role.id}
                  className={`${styles.roleCard} ${styles.sec}`}
                  transform={`translate(${pos.x},${pos.y - 50})`}
                >
                  <rect className={styles.rcBg} x="0" y="0" width="150" height="108" rx="10" />
                  <text className={styles.rcCo} x="12" y="20" style={{ fill: COLOR.emerald }}>
                    ◇ SECONDARY
                  </text>
                  <text className={styles.rcTitle} x="12" y="40">
                    {role.label.split(' · ')[0]}
                  </text>
                  <text className={styles.rcCo} x="12" y="56">
                    {role.label.split(' · ')[1] ?? ''}
                  </text>
                </g>
              )
            })}
          </svg>

          <div className={styles.mapMeta}>
            <strong>
              {skillNodes.length} nodes visible
            </strong>{' '}
            · {edgeCount} edges · {roleCount} target{roleCount === 1 ? '' : 's'} · re-weighted 08:14
          </div>
        </div>

        {/* Top 3 gaps rail */}
        <aside className={styles.gaps}>
          <h4>
            Top {topGaps.length} gap{topGaps.length === 1 ? '' : 's'} · this week{' '}
            <small>for {primary?.label.split(' · ')[1] ?? primary?.label ?? 'target'}</small>
          </h4>

          {topGaps.length === 0 ? (
            <div className={styles.gapMeta}>No gaps detected — you're ready to apply.</div>
          ) : (
            topGaps.map((gap, i) => {
              const tone = severityTone(gap.weight)
              const barPercent = Math.max(8, Math.round((1 - gap.weight) * 100))
              return (
                <div key={gap.id} className={styles.gapRow}>
                  <div className={`${styles.gapRank} ${i === 0 ? styles.hot : ''}`}>{i + 1}</div>
                  <div className={styles.gapBody}>
                    <div className={styles.gapName}>
                      {i === 0 ? <span className={styles.gapMarker} /> : null}
                      {gap.label}
                    </div>
                    <div className={styles.gapMeta}>
                      Recovers ~+{Math.round(gap.weight * 5)}% match · {Math.round(gap.weight * 30)} min
                    </div>
                  </div>
                  <div
                    className={`${styles.gapBar} ${tone === 'hot' ? styles.low : tone === 'mid' ? styles.mid : ''}`}
                    style={{ '--w': `${barPercent}%` } as React.CSSProperties}
                  />
                </div>
              )
            })
          )}

          <div className={styles.gapsFooter}>
            <span>↓ feeds into Next Move</span>
            <Link href="#">Full map →</Link>
          </div>
        </aside>
      </div>
    </section>
  )
}

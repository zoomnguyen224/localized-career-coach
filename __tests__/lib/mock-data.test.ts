import { MENA_ROLES, EXPERT_NETWORK, CAREER_INSIGHTS } from '@/lib/mock-data'

describe('MENA_ROLES', () => {
  it('has at least 10 roles', () => {
    expect(MENA_ROLES.length).toBeGreaterThanOrEqual(10)
  })
  it('each role has id, title, company, location', () => {
    MENA_ROLES.forEach(role => {
      expect(role.id).toBeTruthy()
      expect(role.title).toBeTruthy()
      expect(role.company).toBeTruthy()
      expect(role.location).toBeTruthy()
    })
  })
  it('each role has at least 4 required skills with levels 1-10', () => {
    MENA_ROLES.forEach(role => {
      expect(role.requiredSkills.length).toBeGreaterThanOrEqual(4)
      role.requiredSkills.forEach(skill => {
        expect(skill.level).toBeGreaterThanOrEqual(1)
        expect(skill.level).toBeLessThanOrEqual(10)
        expect(['technical', 'business', 'soft']).toContain(skill.category)
      })
    })
  })
  it('includes AI/ML Engineer at NEOM', () => {
    const neom = MENA_ROLES.find(r => r.company === 'NEOM')
    expect(neom).toBeDefined()
    expect(neom?.title).toMatch(/AI|ML/i)
  })
})

describe('EXPERT_NETWORK', () => {
  it('has at least 8 experts', () => {
    expect(EXPERT_NETWORK.length).toBeGreaterThanOrEqual(8)
  })
  it('each expert has required fields', () => {
    EXPERT_NETWORK.forEach(expert => {
      expect(expert.id).toBeTruthy()
      expect(expert.name).toBeTruthy()
      expect(expert.initials).toMatch(/^[A-Z]{2}$/)
      expect(expert.industries.length).toBeGreaterThan(0)
    })
  })
})

describe('CAREER_INSIGHTS', () => {
  it('has at least 5 insights', () => {
    expect(CAREER_INSIGHTS.length).toBeGreaterThanOrEqual(5)
  })
  it('each insight has stat, description, source, topics', () => {
    CAREER_INSIGHTS.forEach(insight => {
      expect(insight.stat).toBeTruthy()
      expect(insight.source).toBeTruthy()
      expect(insight.topics.length).toBeGreaterThan(0)
    })
  })
})

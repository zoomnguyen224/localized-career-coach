import type { MENARole, Expert, CareerInsight, SalaryRange } from '@/types'

export const MENA_ROLES: MENARole[] = [
  {
    id: 'data-analyst-aramco',
    title: 'Data Analyst',
    company: 'Saudi Aramco',
    location: 'Dhahran',
    requiredSkills: [
      { name: 'Python', level: 7, category: 'technical' },
      { name: 'SQL', level: 8, category: 'technical' },
      { name: 'Data Visualization', level: 6, category: 'technical' },
      { name: 'Statistics', level: 6, category: 'technical' },
      { name: 'Stakeholder Management', level: 5, category: 'business' },
      { name: 'Presentation Skills', level: 5, category: 'soft' },
    ],
  },
  {
    id: 'pm-careem',
    title: 'Product Manager',
    company: 'Careem',
    location: 'Dubai',
    requiredSkills: [
      { name: 'Agile/Scrum', level: 8, category: 'business' },
      { name: 'Stakeholder Management', level: 9, category: 'business' },
      { name: 'SQL', level: 5, category: 'technical' },
      { name: 'Business Strategy', level: 7, category: 'business' },
      { name: 'Cross-Cultural Leadership', level: 7, category: 'soft' },
      { name: 'Arabic Business Communication', level: 5, category: 'soft' },
    ],
  },
  {
    id: 'cloud-eng-stc',
    title: 'Cloud Engineer',
    company: 'STC',
    location: 'Riyadh',
    requiredSkills: [
      { name: 'AWS', level: 8, category: 'technical' },
      { name: 'Linux', level: 7, category: 'technical' },
      { name: 'Networking', level: 7, category: 'technical' },
      { name: 'Terraform', level: 6, category: 'technical' },
      { name: 'Python', level: 5, category: 'technical' },
      { name: 'Agile/Scrum', level: 5, category: 'business' },
    ],
  },
  {
    id: 'aiml-neom',
    title: 'AI/ML Engineer',
    company: 'NEOM',
    location: 'NEOM',
    requiredSkills: [
      { name: 'Python', level: 9, category: 'technical' },
      { name: 'Machine Learning', level: 8, category: 'technical' },
      { name: 'Deep Learning', level: 7, category: 'technical' },
      { name: 'Cloud Architecture', level: 6, category: 'technical' },
      { name: 'Mathematics', level: 7, category: 'technical' },
      { name: 'Research Communication', level: 6, category: 'soft' },
    ],
  },
  {
    id: 'ux-noon',
    title: 'UX Designer',
    company: 'Noon',
    location: 'Dubai',
    requiredSkills: [
      { name: 'Figma', level: 9, category: 'technical' },
      { name: 'User Research', level: 8, category: 'business' },
      { name: 'Prototyping', level: 7, category: 'technical' },
      { name: 'Arabic UX Patterns', level: 6, category: 'technical' },
      { name: 'Cross-Cultural Leadership', level: 5, category: 'soft' },
    ],
  },
  {
    id: 'marketing-almarai',
    title: 'Digital Marketing Manager',
    company: 'Almarai',
    location: 'Riyadh',
    requiredSkills: [
      { name: 'SEO/SEM', level: 7, category: 'technical' },
      { name: 'Analytics', level: 7, category: 'technical' },
      { name: 'Arabic Copywriting', level: 8, category: 'soft' },
      { name: 'Business Strategy', level: 6, category: 'business' },
      { name: 'Presentation Skills', level: 6, category: 'soft' },
    ],
  },
  {
    id: 'cybersec-snb',
    title: 'Cybersecurity Analyst',
    company: 'Saudi National Bank',
    location: 'Riyadh',
    requiredSkills: [
      { name: 'Network Security', level: 8, category: 'technical' },
      { name: 'SIEM Tools', level: 7, category: 'technical' },
      { name: 'Python', level: 6, category: 'technical' },
      { name: 'Risk Management', level: 7, category: 'business' },
      { name: 'Compliance', level: 7, category: 'business' },
    ],
  },
  {
    id: 'swe-talabat',
    title: 'Software Engineer',
    company: 'Talabat',
    location: 'Kuwait City',
    requiredSkills: [
      { name: 'React', level: 8, category: 'technical' },
      { name: 'Node.js', level: 7, category: 'technical' },
      { name: 'SQL', level: 6, category: 'technical' },
      { name: 'System Design', level: 7, category: 'technical' },
      { name: 'Agile/Scrum', level: 6, category: 'business' },
    ],
  },
  {
    id: 'ba-pif',
    title: 'Business Analyst',
    company: 'PIF',
    location: 'Riyadh',
    requiredSkills: [
      { name: 'Financial Modeling', level: 8, category: 'business' },
      { name: 'Business Strategy', level: 8, category: 'business' },
      { name: 'Stakeholder Management', level: 7, category: 'business' },
      { name: 'Data Visualization', level: 6, category: 'technical' },
      { name: 'Arabic Business Communication', level: 8, category: 'soft' },
      { name: 'Presentation Skills', level: 8, category: 'soft' },
    ],
  },
  {
    id: 'fintech-stcpay',
    title: 'FinTech Developer',
    company: 'stc pay',
    location: 'Riyadh',
    requiredSkills: [
      { name: 'React Native', level: 8, category: 'technical' },
      { name: 'Node.js', level: 7, category: 'technical' },
      { name: 'API Design', level: 8, category: 'technical' },
      { name: 'Security', level: 7, category: 'technical' },
      { name: 'FinTech Regulations', level: 6, category: 'business' },
    ],
  },
]

export const EXPERT_NETWORK: Expert[] = [
  {
    id: 'fatima-rashidi',
    name: 'Fatima Al-Rashidi',
    initials: 'FA',
    title: 'Senior Data Scientist',
    company: 'Saudi Aramco',
    location: 'Dhahran',
    specialization: 'Data Science & ML in Oil & Gas',
    industries: ['Oil & Gas', 'Data Science', 'AI'],
    bio: "Led data transformation at Aramco's Digital Transformation program. Mentor for 50+ data professionals across the GCC.",
  },
  {
    id: 'omar-hassan',
    name: 'Omar Hassan',
    initials: 'OH',
    title: 'VP Product',
    company: 'Careem',
    location: 'Dubai',
    specialization: 'Product Strategy in MENA Super-Apps',
    industries: ['E-commerce', 'FinTech', 'Product Management'],
    bio: "Scaled Careem's super-app from 2 to 12 product verticals across 15 MENA markets.",
  },
  {
    id: 'layla-mahmoud',
    name: 'Layla Mahmoud',
    initials: 'LM',
    title: 'Cloud Architect',
    company: 'STC',
    location: 'Riyadh',
    specialization: 'Cloud Infrastructure & Saudization Programs',
    industries: ['Telecom', 'Cloud', 'Government'],
    bio: "Architected STC's migration to AWS and Azure serving 17M customers.",
  },
  {
    id: 'khalid-otaibi',
    name: 'Khalid Al-Otaibi',
    initials: 'KO',
    title: 'AI Research Lead',
    company: 'KACST',
    location: 'Riyadh',
    specialization: 'Applied AI Research & NEOM Technology',
    industries: ['Government', 'AI Research', 'Smart Cities'],
    bio: 'Leading AI research for Saudi Vision 2030 smart city initiatives. PhD in Machine Learning from KAUST.',
  },
  {
    id: 'nour-ibrahim',
    name: 'Nour Ibrahim',
    initials: 'NI',
    title: 'UX Lead',
    company: 'Noon',
    location: 'Cairo',
    specialization: 'Arabic UX & RTL Design Systems',
    industries: ['E-commerce', 'UX Design', 'Mobile'],
    bio: "Designed Noon's Arabic-first design system used by 10M+ shoppers.",
  },
  {
    id: 'ahmed-saleh',
    name: 'Ahmed Saleh',
    initials: 'AS',
    title: 'CISO',
    company: 'Gulf Bank',
    location: 'Kuwait City',
    specialization: 'FinTech Cybersecurity & Compliance',
    industries: ['Banking', 'FinTech', 'Cybersecurity'],
    bio: 'Built Gulf Bank cybersecurity function to ISO 27001 compliance. Advisor to Central Bank of Kuwait.',
  },
  {
    id: 'sara-ghamdi',
    name: 'Sara Al-Ghamdi',
    initials: 'SG',
    title: 'Engineering Manager',
    company: 'stc pay',
    location: 'Riyadh',
    specialization: 'FinTech Engineering & Saudi Women in Tech',
    industries: ['FinTech', 'Mobile', 'Engineering Leadership'],
    bio: "Engineering Manager at stc pay leading 25-person team building Saudi Arabia's #1 digital wallet.",
  },
  {
    id: 'youssef-karim',
    name: 'Youssef Karim',
    initials: 'YK',
    title: 'Senior Business Analyst',
    company: 'PIF',
    location: 'Riyadh',
    specialization: 'Investment Analysis & Vision 2030 Sectors',
    industries: ['Government', 'Finance', 'Strategy'],
    bio: 'Senior BA at the Public Investment Fund on Vision 2030 giga-projects. MBA from INSEAD.',
  },
]

export const CAREER_INSIGHTS: CareerInsight[] = [
  {
    stat: '78% of Data roles in KSA require Python',
    description: 'Python dominates data analytics and ML job requirements across Saudi Arabia.',
    source: 'LinkedIn Jobs Saudi Arabia Report 2024',
    relevantRoles: ['Data Analyst', 'AI/ML Engineer', 'Business Analyst'],
    location: 'Saudi Arabia',
    topics: ['python', 'data', 'programming', 'skills'],
  },
  {
    stat: 'Saudization target: 45% in banking by 2026',
    description: 'The Nitaqat program is increasing mandatory Saudi national employment quotas in finance and tech.',
    source: 'HRDF Saudi Arabia 2024',
    relevantRoles: ['Business Analyst', 'Cybersecurity Analyst', 'FinTech Developer'],
    location: 'Saudi Arabia',
    topics: ['saudization', 'nitaqat', 'banking', 'compliance', 'career'],
  },
  {
    stat: 'Vision 2030 created 127,000 net tech jobs in 2023',
    description: "Saudi Arabia's giga-projects (NEOM, Red Sea Project, Qiddiya) are driving unprecedented demand for tech talent.",
    source: 'Saudi Data & AI Authority (SDAIA) 2024',
    relevantRoles: ['AI/ML Engineer', 'Cloud Engineer', 'Software Engineer'],
    location: 'Saudi Arabia',
    topics: ['vision 2030', 'jobs', 'tech', 'growth', 'neom'],
  },
  {
    stat: 'AWS certification increases GCC salary offers by avg 23%',
    description: 'Cloud certifications are among the highest-ROI credentials for tech professionals across the GCC.',
    source: 'Bayt.com MENA Salary Survey 2024',
    relevantRoles: ['Cloud Engineer', 'AI/ML Engineer', 'Software Engineer'],
    location: 'GCC',
    topics: ['aws', 'cloud', 'certification', 'salary', 'skills'],
  },
  {
    stat: 'Arabic-English bilingual PMs earn 18% more in Dubai',
    description: "Bilingual product managers command a significant premium in Dubai's diverse tech market.",
    source: 'Naukrigulf Salary Report 2024',
    relevantRoles: ['Product Manager', 'Digital Marketing Manager'],
    location: 'UAE',
    topics: ['arabic', 'bilingual', 'product', 'dubai', 'salary'],
  },
  {
    stat: 'Emiratization: 10% of private sector roles by 2026',
    description: "UAE's Nafis program mandates increasing Emirati employment quotas in private sector companies.",
    source: 'UAE Ministry of Human Resources 2024',
    relevantRoles: ['Software Engineer', 'Product Manager', 'Business Analyst'],
    location: 'UAE',
    topics: ['emiratization', 'nafis', 'uae', 'career', 'compliance'],
  },
  {
    stat: 'FinTech roles in KSA grew 340% from 2020-2024',
    description: "Saudi Arabia's SAMA regulatory sandbox and the rise of digital payments has made FinTech one of the fastest-growing career sectors.",
    source: 'SAMA FinTech Report 2024',
    relevantRoles: ['FinTech Developer', 'Cybersecurity Analyst', 'Business Analyst'],
    location: 'Saudi Arabia',
    topics: ['fintech', 'growth', 'payments', 'saudi', 'banking'],
  },
]

// MENA Job Listings (for job market scan)
export const MENA_JOB_LISTINGS = [
  {
    title: 'Data Analyst',
    company: 'Saudi Aramco',
    location: 'Dhahran, Saudi Arabia',
    salaryRange: 'SAR 14,000 – 22,000/mo',
    requiredSkills: ['Python', 'SQL', 'Data Visualization', 'Statistics', 'Excel'],
    minReadiness: 55,
  },
  {
    title: 'Product Manager',
    company: 'Careem',
    location: 'Dubai, UAE',
    salaryRange: 'AED 18,000 – 28,000/mo',
    requiredSkills: ['Agile', 'Stakeholder Management', 'SQL', 'Business Strategy', 'Figma'],
    minReadiness: 60,
  },
  {
    title: 'AI/ML Engineer',
    company: 'NEOM',
    location: 'NEOM, Saudi Arabia',
    salaryRange: 'SAR 20,000 – 35,000/mo',
    requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'Mathematics', 'Cloud'],
    minReadiness: 65,
  },
  {
    title: 'Cloud Engineer',
    company: 'STC',
    location: 'Riyadh, Saudi Arabia',
    salaryRange: 'SAR 16,000 – 26,000/mo',
    requiredSkills: ['AWS', 'Linux', 'Networking', 'Terraform', 'Python'],
    minReadiness: 55,
  },
  {
    title: 'Software Engineer',
    company: 'Talabat',
    location: 'Kuwait City, Kuwait',
    salaryRange: 'KWD 900 – 1,500/mo',
    requiredSkills: ['React', 'Node.js', 'SQL', 'Git', 'System Design'],
    minReadiness: 60,
  },
  {
    title: 'Business Analyst',
    company: 'PIF',
    location: 'Riyadh, Saudi Arabia',
    salaryRange: 'SAR 15,000 – 24,000/mo',
    requiredSkills: ['Financial Modeling', 'Excel', 'PowerPoint', 'Stakeholder Management', 'Business Strategy'],
    minReadiness: 50,
  },
  {
    title: 'FinTech Developer',
    company: 'stc pay',
    location: 'Riyadh, Saudi Arabia',
    salaryRange: 'SAR 18,000 – 28,000/mo',
    requiredSkills: ['React Native', 'APIs', 'Security', 'Node.js', 'FinTech Regulations'],
    minReadiness: 65,
  },
  {
    title: 'UX Designer',
    company: 'Noon',
    location: 'Dubai, UAE',
    salaryRange: 'AED 12,000 – 20,000/mo',
    requiredSkills: ['Figma', 'User Research', 'Prototyping', 'Arabic UX', 'HTML/CSS'],
    minReadiness: 55,
  },
]

// Interview questions by role category
export const INTERVIEW_QUESTIONS: Record<string, { behavioral: string[]; technical: string[] }> = {
  'data': {
    behavioral: [
      'Tell me about a time you had to explain a complex data finding to a non-technical stakeholder.',
      'Describe a situation where your analysis led to a business decision that saved time or money.',
      'How do you prioritize when you have multiple data requests with competing deadlines?',
    ],
    technical: [
      'Walk me through how you would clean a dataset with 30% missing values for a sales analysis.',
      'How would you design a dashboard to track Saudization compliance metrics for a GCC enterprise?',
      'Explain the difference between correlation and causation with a real-world MENA business example.',
    ],
  },
  'product': {
    behavioral: [
      'Tell me about a product decision you made that turned out to be wrong. What did you learn?',
      'How do you handle conflicting priorities between engineering capacity and business requirements?',
      'Describe how you would approach launching a new feature in a market with low digital literacy.',
    ],
    technical: [
      'How would you define KPIs for a new delivery feature on a super-app like Careem?',
      'Walk me through your process for writing a PRD for a Saudization compliance tracking feature.',
      'How would you prioritize a backlog of 50 feature requests using limited engineering resources?',
    ],
  },
  'engineering': {
    behavioral: [
      'Describe a production incident you handled. What was your process for resolving it?',
      'Tell me about a time you had to refactor legacy code while keeping the system running.',
      'How do you stay current with emerging technologies while delivering on existing commitments?',
    ],
    technical: [
      'How would you design a real-time notification system for 10 million users in the GCC?',
      'Explain how you would handle API rate limiting in a fintech application processing payments.',
      'How would you optimize a slow SQL query returning user activity data for reporting?',
    ],
  },
  'default': {
    behavioral: [
      'Tell me about a time you had to learn something new quickly to complete a project.',
      'Describe a situation where you disagreed with your manager. How did you handle it?',
      'How do you manage your workload when facing tight deadlines and high expectations?',
    ],
    technical: [
      'How would you approach building a feature that needs to work across different Arabic dialects?',
      'Walk me through your problem-solving process when you encounter a bug in production.',
      'How do you ensure code quality while working in a fast-paced startup environment?',
    ],
  },
}

// Need this type in mock-data for SALARY_BENCHMARKS
interface SalaryBenchmarkData {
  ranges: SalaryRange[]
  certifications: Array<{ cert: string; premiumPercent: number; desc: string }>
  insight: string
}

// Salary benchmark data
export const SALARY_BENCHMARKS: Record<string, SalaryBenchmarkData> = {
  'data analyst': {
    ranges: [
      { level: 'entry', min: 8000, max: 14000, currency: 'SAR', country: 'Saudi Arabia' },
      { level: 'mid', min: 14000, max: 22000, currency: 'SAR', country: 'Saudi Arabia' },
      { level: 'senior', min: 22000, max: 35000, currency: 'SAR', country: 'Saudi Arabia' },
      { level: 'entry', min: 6000, max: 10000, currency: 'AED', country: 'UAE' },
      { level: 'mid', min: 12000, max: 20000, currency: 'AED', country: 'UAE' },
      { level: 'senior', min: 20000, max: 32000, currency: 'AED', country: 'UAE' },
    ],
    certifications: [
      { cert: 'Google Data Analytics Certificate', premiumPercent: 12, desc: 'Widely recognized for entry-level roles' },
      { cert: 'Microsoft Power BI Certification', premiumPercent: 18, desc: 'High demand in GCC enterprises' },
      { cert: 'AWS Certified Data Analytics', premiumPercent: 25, desc: 'Premium for cloud-native roles' },
    ],
    insight: 'Python proficiency is required in 78% of Data Analyst job postings in Saudi Arabia (LinkedIn Jobs 2024).',
  },
  'ai/ml engineer': {
    ranges: [
      { level: 'entry', min: 12000, max: 20000, currency: 'SAR', country: 'Saudi Arabia' },
      { level: 'mid', min: 20000, max: 32000, currency: 'SAR', country: 'Saudi Arabia' },
      { level: 'senior', min: 32000, max: 55000, currency: 'SAR', country: 'Saudi Arabia' },
      { level: 'entry', min: 12000, max: 18000, currency: 'AED', country: 'UAE' },
      { level: 'mid', min: 18000, max: 30000, currency: 'AED', country: 'UAE' },
      { level: 'senior', min: 30000, max: 50000, currency: 'AED', country: 'UAE' },
    ],
    certifications: [
      { cert: 'TensorFlow Developer Certificate', premiumPercent: 20, desc: 'High signal for ML roles' },
      { cert: 'AWS Machine Learning Specialty', premiumPercent: 28, desc: 'Top premium in GCC cloud roles' },
      { cert: 'Deep Learning Specialization (Coursera)', premiumPercent: 15, desc: 'Foundational credibility signal' },
    ],
    insight: 'Vision 2030 AI initiatives created 40,000+ new AI/ML roles in Saudi Arabia between 2022-2024 (SDAIA Report 2024).',
  },
  'software engineer': {
    ranges: [
      { level: 'entry', min: 8000, max: 14000, currency: 'SAR', country: 'Saudi Arabia' },
      { level: 'mid', min: 14000, max: 24000, currency: 'SAR', country: 'Saudi Arabia' },
      { level: 'senior', min: 24000, max: 40000, currency: 'SAR', country: 'Saudi Arabia' },
      { level: 'entry', min: 8000, max: 13000, currency: 'AED', country: 'UAE' },
      { level: 'mid', min: 13000, max: 22000, currency: 'AED', country: 'UAE' },
      { level: 'senior', min: 22000, max: 38000, currency: 'AED', country: 'UAE' },
    ],
    certifications: [
      { cert: 'AWS Solutions Architect', premiumPercent: 23, desc: 'Average 23% salary increase in GCC (LinkedIn 2024)' },
      { cert: 'Google Cloud Professional', premiumPercent: 19, desc: 'Growing demand with Vision 2030 cloud projects' },
      { cert: 'Certified Kubernetes Administrator', premiumPercent: 21, desc: 'High value in enterprise/fintech' },
    ],
    insight: 'Bilingual (Arabic/English) software engineers earn 12-18% more in UAE roles requiring client-facing responsibilities.',
  },
  'product manager': {
    ranges: [
      { level: 'entry', min: 10000, max: 16000, currency: 'SAR', country: 'Saudi Arabia' },
      { level: 'mid', min: 16000, max: 26000, currency: 'SAR', country: 'Saudi Arabia' },
      { level: 'senior', min: 26000, max: 45000, currency: 'SAR', country: 'Saudi Arabia' },
      { level: 'entry', min: 10000, max: 16000, currency: 'AED', country: 'UAE' },
      { level: 'mid', min: 16000, max: 28000, currency: 'AED', country: 'UAE' },
      { level: 'senior', min: 28000, max: 48000, currency: 'AED', country: 'UAE' },
    ],
    certifications: [
      { cert: 'PMI Agile Certified Practitioner', premiumPercent: 16, desc: 'Strong signal for agile-first companies' },
      { cert: 'Product School Certificate', premiumPercent: 11, desc: 'Recognized by GCC tech companies' },
      { cert: 'SQL for Product Managers', premiumPercent: 9, desc: 'Differentiator in data-driven teams' },
    ],
    insight: 'Arabic-English bilingual Product Managers earn 18% more on average in Dubai\'s tech sector (Bayt.com Salary Survey 2024).',
  },
}

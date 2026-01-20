export type PipelineStatus = 'new-match' | 'hr-interview' | 'tech-interview' | 'offer' | 'hired' | 'rejected';
export type ShortlistDecision = 'shortlisted' | 'maybe' | 'pending';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedIn: string;
  matchScore: number;
  pipelineStatus: PipelineStatus;
  shortlistDecision: ShortlistDecision;
  skills: string[];
  experience: string;
  experienceDetails: {
    totalYears: number;
    breakdown: string;
  };
  matchReasons: string[];
  matchAnalysis: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
  };
  hrNotes: string;
  techNotes: string;
  employmentType: string;
  positionApplied: string;
  expectedSalary: string;
  earliestStartDate: string;
  currentOccupation: string;
  assignedJoId?: string;
}

export interface JobOrder {
  id: string;
  joNumber: string;
  title: string;
  description: string;
  level: 'Junior' | 'Mid' | 'Senior' | 'Lead';
  quantity: number;
  hiredCount: number;
  requiredDate: string;
  createdDate: string;
  status: 'draft' | 'in-progress' | 'fulfilled' | 'closed';
  candidateIds: string[];
}

export const mockCandidates: Candidate[] = [
  {
    id: 'c1',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '+63 917 123 4567',
    linkedIn: 'linkedin.com/in/mariasantos',
    matchScore: 98,
    pipelineStatus: 'new-match',
    shortlistDecision: 'shortlisted',
    skills: ['Java', 'Spring Boot', 'AWS', 'Microservices', 'PostgreSQL'],
    experience: '7 years in enterprise software development',
    experienceDetails: {
      totalYears: 7,
      breakdown: '3 years as Senior Developer at Accenture, 2 years at IBM Philippines, 2 years at local fintech startup'
    },
    matchReasons: [
      '✓ 7 Years Java Experience (Exceeds 5-year requirement)',
      '✓ AWS Certified Solutions Architect',
      '✓ Strong Spring Boot & Microservices background',
      '✓ Previous experience in fintech industry',
      '✓ Excellent communication skills noted in references'
    ],
    matchAnalysis: {
      summary: 'Maria is an exceptional candidate with deep expertise in Java and cloud technologies. Her fintech background aligns perfectly with the banking project requirements.',
      strengths: [
        'AWS Certified Solutions Architect with hands-on cloud migration experience',
        'Led development of microservices architecture serving 2M+ users',
        'Strong communication skills and proven team leadership',
        'Domain expertise in financial systems and compliance'
      ],
      weaknesses: [
        'Limited exposure to Kubernetes (prefers ECS)',
        'Salary expectations may be above budget range'
      ]
    },
    hrNotes: '',
    techNotes: '',
    employmentType: 'Full-time',
    positionApplied: 'Senior Java Developer',
    expectedSalary: '₱180,000 - ₱220,000/month',
    earliestStartDate: '2026-03-01',
    currentOccupation: 'Senior Software Engineer at Accenture',
    assignedJoId: 'jo1'
  },
  {
    id: 'c2',
    name: 'John Rodriguez',
    email: 'john.rod@email.com',
    phone: '+63 918 234 5678',
    linkedIn: 'linkedin.com/in/johnrodriguez',
    matchScore: 95,
    pipelineStatus: 'hr-interview',
    shortlistDecision: 'shortlisted',
    skills: ['Java', 'Kotlin', 'AWS', 'Docker', 'Kubernetes'],
    experience: '6 years in software development',
    experienceDetails: {
      totalYears: 6,
      breakdown: '4 years at Globe Telecom, 2 years at tech consultancy'
    },
    matchReasons: [
      '✓ 6 Years Java/Kotlin Development',
      '✓ AWS Certified Developer Associate',
      '✓ Kubernetes orchestration experience',
      '✓ Led team of 4 developers previously'
    ],
    matchAnalysis: {
      summary: 'John brings strong container orchestration skills and leadership experience. His telecom background provides relevant high-availability systems experience.',
      strengths: [
        'Kubernetes expert with production cluster management',
        'Experience with high-traffic systems (10M+ transactions/day)',
        'Proven leadership of development teams',
        'Kotlin proficiency for modern Android development'
      ],
      weaknesses: [
        'Less experience with pure Spring Boot (more Kotlin-focused)',
        'Currently on notice period - available in 60 days'
      ]
    },
    hrNotes: 'Scheduled for technical interview on Monday',
    techNotes: '',
    employmentType: 'Full-time',
    positionApplied: 'Senior Java Developer',
    expectedSalary: '₱160,000 - ₱200,000/month',
    earliestStartDate: '2026-04-01',
    currentOccupation: 'Technical Lead at Globe Telecom',
    assignedJoId: 'jo1'
  },
  {
    id: 'c3',
    name: 'Angela Cruz',
    email: 'angela.cruz@email.com',
    phone: '+63 919 345 6789',
    linkedIn: 'linkedin.com/in/angelacruz',
    matchScore: 88,
    pipelineStatus: 'new-match',
    shortlistDecision: 'maybe',
    skills: ['Java', 'React', 'Node.js', 'MongoDB'],
    experience: '5 years full-stack development',
    experienceDetails: {
      totalYears: 5,
      breakdown: '3 years as Full-stack Developer at startup, 2 years freelance'
    },
    matchReasons: [
      '✓ 5 Years Java Experience',
      '✓ Full-stack capabilities',
      '✓ Strong problem-solving skills',
      '△ No cloud certification (can be acquired)'
    ],
    matchAnalysis: {
      summary: 'Angela is a versatile full-stack developer. While lacking cloud certification, her rapid learning ability and broad skillset make her a promising candidate.',
      strengths: [
        'Full-stack capabilities reduce inter-team dependencies',
        'Adaptable and fast learner based on portfolio',
        'Experience with both SQL and NoSQL databases',
        'Strong React skills for potential frontend needs'
      ],
      weaknesses: [
        'No formal cloud certification',
        'Limited enterprise-scale experience',
        'Freelance background may need adjustment to team dynamics'
      ]
    },
    hrNotes: '',
    techNotes: '',
    employmentType: 'Full-time',
    positionApplied: 'Senior Java Developer',
    expectedSalary: '₱120,000 - ₱150,000/month',
    earliestStartDate: '2026-02-15',
    currentOccupation: 'Freelance Developer',
    assignedJoId: 'jo1'
  },
  {
    id: 'c4',
    name: 'Michael Tan',
    email: 'michael.tan@email.com',
    phone: '+63 920 456 7890',
    linkedIn: 'linkedin.com/in/michaeltan',
    matchScore: 96,
    pipelineStatus: 'new-match',
    shortlistDecision: 'shortlisted',
    skills: ['Selenium', 'Cypress', 'JUnit', 'TestNG', 'API Testing'],
    experience: '5 years in QA automation',
    experienceDetails: {
      totalYears: 5,
      breakdown: '3 years at major bank, 2 years at software house'
    },
    matchReasons: [
      '✓ 5 Years QA Automation Experience',
      '✓ Selenium & Cypress expertise',
      '✓ CI/CD integration experience',
      '✓ ISTQB Certified'
    ],
    matchAnalysis: {
      summary: 'Michael is a highly qualified QA automation engineer with banking domain experience and industry certifications.',
      strengths: [
        'ISTQB certified with strong theoretical foundation',
        'Banking domain experience relevant to fintech projects',
        'Extensive CI/CD pipeline integration knowledge',
        'Both frontend and API testing expertise'
      ],
      weaknesses: [
        'Limited mobile testing experience',
        'Prefers structured environments over agile startups'
      ]
    },
    hrNotes: '',
    techNotes: '',
    employmentType: 'Full-time',
    positionApplied: 'QA Automation Engineer',
    expectedSalary: '₱90,000 - ₱120,000/month',
    earliestStartDate: '2026-03-01',
    currentOccupation: 'QA Engineer at BDO',
    assignedJoId: 'jo2'
  },
  {
    id: 'c5',
    name: 'Patricia Reyes',
    email: 'patricia.reyes@email.com',
    phone: '+63 921 567 8901',
    linkedIn: 'linkedin.com/in/patriciareyes',
    matchScore: 91,
    pipelineStatus: 'offer',
    shortlistDecision: 'shortlisted',
    skills: ['Manual Testing', 'Selenium', 'JIRA', 'Agile'],
    experience: '4 years in software testing',
    experienceDetails: {
      totalYears: 4,
      breakdown: '2 years at BPI, 2 years at software agency'
    },
    matchReasons: [
      '✓ 4 Years Testing Experience',
      '✓ Strong Selenium skills',
      '✓ Agile methodology experience',
      '✓ Excellent documentation skills'
    ],
    matchAnalysis: {
      summary: 'Patricia combines strong manual and automation testing skills with excellent documentation abilities. Offer stage - pending final negotiation.',
      strengths: [
        'Excellent test documentation and reporting',
        'Experience with banking compliance testing',
        'Strong agile methodology adherence',
        'Good mentoring abilities for junior testers'
      ],
      weaknesses: [
        'Less experience with performance testing',
        'Salary negotiation still pending'
      ]
    },
    hrNotes: 'Salary negotiation in progress',
    techNotes: 'Strong automation skills verified',
    employmentType: 'Full-time',
    positionApplied: 'QA Automation Engineer',
    expectedSalary: '₱85,000 - ₱100,000/month',
    earliestStartDate: '2026-02-20',
    currentOccupation: 'QA Lead at BPI',
    assignedJoId: 'jo2'
  },
  {
    id: 'c6',
    name: 'Robert Lim',
    email: 'robert.lim@email.com',
    phone: '+63 922 678 9012',
    linkedIn: 'linkedin.com/in/robertlim',
    matchScore: 94,
    pipelineStatus: 'new-match',
    shortlistDecision: 'pending',
    skills: ['Project Management', 'Agile', 'Scrum', 'JIRA', 'MS Project'],
    experience: '8 years in IT project management',
    experienceDetails: {
      totalYears: 8,
      breakdown: '4 years at Accenture PH, 3 years at PLDT, 1 year consulting'
    },
    matchReasons: [
      '✓ 8 Years PM Experience',
      '✓ PMP Certified',
      '✓ Managed 10+ enterprise projects',
      '✓ Strong stakeholder management'
    ],
    matchAnalysis: {
      summary: 'Robert is a seasoned IT Project Manager with PMP certification and extensive enterprise project delivery experience.',
      strengths: [
        'PMP certified with proven track record',
        'Managed budgets exceeding ₱50M',
        'Excellent executive communication skills',
        'Experience with both waterfall and agile'
      ],
      weaknesses: [
        'May be overqualified for smaller projects',
        'Prefers strategic over tactical roles'
      ]
    },
    hrNotes: '',
    techNotes: '',
    employmentType: 'Full-time',
    positionApplied: 'IT Project Manager',
    expectedSalary: '₱200,000 - ₱250,000/month',
    earliestStartDate: '2026-03-15',
    currentOccupation: 'Senior Project Manager at Accenture',
    assignedJoId: 'jo3'
  },
  {
    id: 'c7',
    name: 'Jennifer Garcia',
    email: 'jennifer.garcia@email.com',
    phone: '+63 923 789 0123',
    linkedIn: 'linkedin.com/in/jennifergarcia',
    matchScore: 89,
    pipelineStatus: 'rejected',
    shortlistDecision: 'maybe',
    skills: ['Project Management', 'Scrum', 'Risk Management'],
    experience: '5 years in project coordination',
    experienceDetails: {
      totalYears: 5,
      breakdown: '3 years as Project Coordinator, 2 years as Associate PM'
    },
    matchReasons: [
      '✓ 5 Years PM Experience',
      '✓ CSM Certified',
      '✓ Budget management experience',
      '△ Limited enterprise-scale experience'
    ],
    matchAnalysis: {
      summary: 'Jennifer has good PM fundamentals but lacks the enterprise-scale experience required for this role. Added to pool for future mid-level positions.',
      strengths: [
        'CSM certified scrum master',
        'Strong organizational skills',
        'Good stakeholder communication',
        'Budget tracking experience'
      ],
      weaknesses: [
        'Limited enterprise-scale experience',
        'No PMP certification yet',
        'Less experience with complex vendor management'
      ]
    },
    hrNotes: 'Good potential, added to talent pool for future roles',
    techNotes: '',
    employmentType: 'Full-time',
    positionApplied: 'IT Project Manager',
    expectedSalary: '₱100,000 - ₱130,000/month',
    earliestStartDate: '2026-02-15',
    currentOccupation: 'Associate Project Manager',
    assignedJoId: 'jo3'
  },
  {
    id: 'c8',
    name: 'David Fernandez',
    email: 'david.fernandez@email.com',
    phone: '+63 924 890 1234',
    linkedIn: 'linkedin.com/in/davidfernandez',
    matchScore: 72,
    pipelineStatus: 'rejected',
    shortlistDecision: 'pending',
    skills: ['Java', 'Basic SQL'],
    experience: '2 years junior development',
    experienceDetails: {
      totalYears: 2,
      breakdown: '2 years as Junior Developer at tech startup'
    },
    matchReasons: [
      '✓ Java fundamentals',
      '✗ Only 2 years experience (requires 5)',
      '✗ No cloud experience',
      '✗ Limited architectural knowledge'
    ],
    matchAnalysis: {
      summary: 'David is a promising junior developer but does not meet the senior-level requirements for this position.',
      strengths: [
        'Solid Java fundamentals',
        'Eager to learn and grow',
        'Good code quality habits'
      ],
      weaknesses: [
        'Only 2 years experience (5 required)',
        'No cloud or distributed systems experience',
        'Limited architectural decision-making exposure',
        'Not ready for senior responsibilities'
      ]
    },
    hrNotes: 'Not enough experience for senior role. Encouraged to apply for junior positions.',
    techNotes: 'Strong fundamentals, recommend for junior openings',
    employmentType: 'Full-time',
    positionApplied: 'Senior Java Developer',
    expectedSalary: '₱50,000 - ₱70,000/month',
    earliestStartDate: '2026-02-01',
    currentOccupation: 'Junior Developer',
    assignedJoId: 'jo1'
  },
  {
    id: 'c9',
    name: 'Sarah Villanueva',
    email: 'sarah.v@email.com',
    phone: '+63 925 901 2345',
    linkedIn: 'linkedin.com/in/sarahvillanueva',
    matchScore: 93,
    pipelineStatus: 'new-match',
    shortlistDecision: 'shortlisted',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS'],
    experience: '6 years in frontend development',
    experienceDetails: {
      totalYears: 6,
      breakdown: '3 years at e-commerce company, 2 years at agency, 1 year freelance'
    },
    matchReasons: [
      '✓ 6 Years React/TypeScript Experience',
      '✓ Led UI/UX initiatives',
      '✓ Performance optimization expert',
      '✓ AWS Amplify experience'
    ],
    matchAnalysis: {
      summary: 'Sarah is a talented frontend specialist with strong performance optimization skills and leadership experience.',
      strengths: [
        'Deep React and TypeScript expertise',
        'Performance optimization specialist',
        'Experience leading frontend teams',
        'Full-stack capable with Node.js'
      ],
      weaknesses: [
        'Less experience with mobile/React Native',
        'Prefers product companies over consultancy'
      ]
    },
    hrNotes: '',
    techNotes: '',
    employmentType: 'Full-time',
    positionApplied: 'Senior Frontend Developer',
    expectedSalary: '₱140,000 - ₱180,000/month',
    earliestStartDate: '2026-03-01',
    currentOccupation: 'Senior Frontend Developer at Lazada',
    assignedJoId: 'jo4'
  },
  {
    id: 'c10',
    name: 'Mark Aquino',
    email: 'mark.aquino@email.com',
    phone: '+63 926 012 3456',
    linkedIn: 'linkedin.com/in/markaquino',
    matchScore: 87,
    pipelineStatus: 'tech-interview',
    shortlistDecision: 'shortlisted',
    skills: ['React', 'Vue.js', 'JavaScript', 'CSS', 'Figma'],
    experience: '4 years in web development',
    experienceDetails: {
      totalYears: 4,
      breakdown: '2 years at digital agency, 2 years at startup'
    },
    matchReasons: [
      '✓ 4 Years Frontend Experience',
      '✓ React & Vue expertise',
      '✓ Design-to-code skills',
      '△ Limited TypeScript (can learn quickly)'
    ],
    matchAnalysis: {
      summary: 'Mark has strong frontend skills with excellent design sensibilities. TypeScript experience is limited but learnable.',
      strengths: [
        'Strong design-to-code translation',
        'Multi-framework experience (React, Vue)',
        'Excellent CSS and animation skills',
        'Good collaboration with designers'
      ],
      weaknesses: [
        'Limited TypeScript experience',
        'Less experience with state management at scale'
      ]
    },
    hrNotes: 'Technical assessment completed. Moving to final interview.',
    techNotes: 'Good problem-solving, needs TypeScript upskilling',
    employmentType: 'Full-time',
    positionApplied: 'Senior Frontend Developer',
    expectedSalary: '₱100,000 - ₱130,000/month',
    earliestStartDate: '2026-02-15',
    currentOccupation: 'Frontend Developer at Startup',
    assignedJoId: 'jo4'
  },
  {
    id: 'c11',
    name: 'Christina Bautista',
    email: 'christina.b@email.com',
    phone: '+63 927 123 4567',
    linkedIn: 'linkedin.com/in/christinabautista',
    matchScore: 90,
    pipelineStatus: 'new-match',
    shortlistDecision: 'shortlisted',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'AWS'],
    experience: '5 years in data science',
    experienceDetails: {
      totalYears: 5,
      breakdown: '3 years at research institution, 2 years at tech company'
    },
    matchReasons: [
      '✓ 5 Years Data Science Experience',
      '✓ ML model deployment experience',
      '✓ AWS SageMaker certified',
      '✓ PhD in Computer Science'
    ],
    matchAnalysis: {
      summary: 'Christina combines academic excellence with practical ML deployment experience. Her PhD research is directly applicable to our AI initiatives.',
      strengths: [
        'PhD-level research capabilities',
        'Production ML deployment experience',
        'AWS SageMaker certified',
        'Published research in NLP'
      ],
      weaknesses: [
        'May prefer research-oriented work',
        'Less experience with real-time systems'
      ]
    },
    hrNotes: '',
    techNotes: '',
    employmentType: 'Full-time',
    positionApplied: 'Data Scientist',
    expectedSalary: '₱180,000 - ₱220,000/month',
    earliestStartDate: '2026-03-15',
    currentOccupation: 'Data Scientist at Tech Company',
    assignedJoId: 'jo5'
  },
  {
    id: 'c12',
    name: 'Paulo Mendoza',
    email: 'paulo.mendoza@email.com',
    phone: '+63 928 234 5678',
    linkedIn: 'linkedin.com/in/paulomendoza',
    matchScore: 85,
    pipelineStatus: 'new-match',
    shortlistDecision: 'maybe',
    skills: ['Python', 'R', 'Tableau', 'SQL', 'Statistics'],
    experience: '4 years in analytics',
    experienceDetails: {
      totalYears: 4,
      breakdown: '2 years as Business Analyst, 2 years as Data Analyst'
    },
    matchReasons: [
      '✓ 4 Years Analytics Experience',
      '✓ Strong statistical background',
      '✓ Business intelligence expertise',
      '△ Limited ML experience'
    ],
    matchAnalysis: {
      summary: 'Paulo has strong BI and analytics skills but limited hands-on ML experience. Would be better suited for analyst roles.',
      strengths: [
        'Strong statistical foundation',
        'Excellent data visualization skills',
        'Business acumen and stakeholder communication',
        'SQL expert'
      ],
      weaknesses: [
        'Limited ML/deep learning experience',
        'No cloud ML platform experience',
        'More BI-focused than data science'
      ]
    },
    hrNotes: '',
    techNotes: '',
    employmentType: 'Full-time',
    positionApplied: 'Data Scientist',
    expectedSalary: '₱80,000 - ₱100,000/month',
    earliestStartDate: '2026-02-01',
    currentOccupation: 'Data Analyst at Retail Company',
    assignedJoId: 'jo5'
  }
];

export const mockJobOrders: JobOrder[] = [
  {
    id: 'jo1',
    joNumber: 'JO-2024-001',
    title: 'Senior Java Developer',
    description: 'Looking for an experienced Java developer to join our core banking team. Must have strong experience with Spring Boot, microservices architecture, and cloud technologies (preferably AWS). The ideal candidate will help architect and build scalable financial solutions.',
    level: 'Senior',
    quantity: 3,
    hiredCount: 0,
    requiredDate: '2026-02-15',
    createdDate: '2026-01-08',
    status: 'in-progress',
    candidateIds: ['c1', 'c2', 'c3', 'c8']
  },
  {
    id: 'jo2',
    joNumber: 'JO-2024-002',
    title: 'QA Automation Engineer',
    description: 'Seeking a QA Automation Engineer to strengthen our testing capabilities. Experience with Selenium, Cypress, and API testing required. ISTQB certification preferred.',
    level: 'Mid',
    quantity: 2,
    hiredCount: 0,
    requiredDate: '2026-02-28',
    createdDate: '2026-01-15',
    status: 'in-progress',
    candidateIds: ['c4', 'c5']
  },
  {
    id: 'jo3',
    joNumber: 'JO-2024-003',
    title: 'IT Project Manager',
    description: 'Need an experienced IT Project Manager to oversee multiple concurrent projects. PMP or equivalent certification required. Must have experience managing enterprise-scale IT implementations.',
    level: 'Lead',
    quantity: 1,
    hiredCount: 0,
    requiredDate: '2026-03-01',
    createdDate: '2026-01-05',
    status: 'in-progress',
    candidateIds: ['c6', 'c7']
  },
  {
    id: 'jo4',
    joNumber: 'JO-2024-004',
    title: 'Senior Frontend Developer',
    description: 'Looking for a Senior Frontend Developer with expertise in React and TypeScript. Experience with modern frontend tooling and performance optimization is essential.',
    level: 'Senior',
    quantity: 2,
    hiredCount: 0,
    requiredDate: '2026-03-20',
    createdDate: '2026-01-18',
    status: 'in-progress',
    candidateIds: ['c9', 'c10']
  },
  {
    id: 'jo5',
    joNumber: 'JO-2024-005',
    title: 'Data Scientist',
    description: 'Seeking a Data Scientist to join our analytics team. Must have experience with Python, machine learning frameworks, and cloud-based ML platforms.',
    level: 'Senior',
    quantity: 1,
    hiredCount: 0,
    requiredDate: '2026-04-15',
    createdDate: '2026-01-17',
    status: 'draft',
    candidateIds: ['c11', 'c12']
  },
  {
    id: 'jo6',
    joNumber: 'JO-2023-089',
    title: 'DevOps Engineer',
    description: 'DevOps Engineer with expertise in CI/CD pipelines, containerization, and cloud infrastructure management. Position has been filled.',
    level: 'Senior',
    quantity: 1,
    hiredCount: 1,
    requiredDate: '2023-12-15',
    createdDate: '2023-11-01',
    status: 'fulfilled',
    candidateIds: []
  }
];

export const pipelineStatusLabels: Record<PipelineStatus, string> = {
  'new-match': 'New Match',
  'hr-interview': 'HR Interview',
  'tech-interview': 'Tech Interview',
  'offer': 'Offer',
  'hired': 'Hired',
  'rejected': 'Rejected'
};

export const pipelineStatusColors: Record<PipelineStatus, string> = {
  'new-match': 'bg-blue-100 text-blue-700',
  'hr-interview': 'bg-purple-100 text-purple-700',
  'tech-interview': 'bg-indigo-100 text-indigo-700',
  'offer': 'bg-amber-100 text-amber-700',
  'hired': 'bg-primary/10 text-primary',
  'rejected': 'bg-red-100 text-red-700'
};

export const shortlistLabels: Record<ShortlistDecision, string> = {
  'shortlisted': 'Shortlisted',
  'maybe': 'Maybe',
  'pending': 'Pending Review'
};

export const shortlistColors: Record<ShortlistDecision, string> = {
  'shortlisted': 'bg-primary/10 text-primary',
  'maybe': 'bg-amber-100 text-amber-700',
  'pending': 'bg-muted text-muted-foreground'
};

export const joStatusLabels: Record<string, string> = {
  'draft': 'Draft',
  'in-progress': 'In Progress',
  'fulfilled': 'Fulfilled',
  'closed': 'Closed'
};

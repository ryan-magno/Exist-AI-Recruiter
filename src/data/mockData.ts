export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedIn: string;
  matchScore: number;
  status: 'new' | 'interview' | 'offer' | 'hired' | 'pooled' | 'rejected';
  skills: string[];
  experience: string;
  matchReasons: string[];
  notes: string;
  assignedJoId?: string;
}

export interface JobOrder {
  id: string;
  joNumber: string;
  title: string;
  description: string;
  level: 'Junior' | 'Mid' | 'Senior' | 'Lead';
  quantity: number;
  requiredDate: string;
  createdDate: string;
  status: 'draft' | 'in-progress' | 'job-offer' | 'closed' | 'fulfilled';
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
    status: 'new',
    skills: ['Java', 'Spring Boot', 'AWS', 'Microservices', 'PostgreSQL'],
    experience: '7 years in enterprise software development',
    matchReasons: [
      '✓ 7 Years Java Experience (Exceeds 5-year requirement)',
      '✓ AWS Certified Solutions Architect',
      '✓ Strong Spring Boot & Microservices background',
      '✓ Previous experience in fintech industry',
      '✓ Excellent communication skills noted in references'
    ],
    notes: '',
    assignedJoId: 'jo1'
  },
  {
    id: 'c2',
    name: 'John Rodriguez',
    email: 'john.rod@email.com',
    phone: '+63 918 234 5678',
    linkedIn: 'linkedin.com/in/johnrodriguez',
    matchScore: 95,
    status: 'interview',
    skills: ['Java', 'Kotlin', 'AWS', 'Docker', 'Kubernetes'],
    experience: '6 years in software development',
    matchReasons: [
      '✓ 6 Years Java/Kotlin Development',
      '✓ AWS Certified Developer Associate',
      '✓ Kubernetes orchestration experience',
      '✓ Led team of 4 developers previously'
    ],
    notes: 'Scheduled for technical interview on Monday',
    assignedJoId: 'jo1'
  },
  {
    id: 'c3',
    name: 'Angela Cruz',
    email: 'angela.cruz@email.com',
    phone: '+63 919 345 6789',
    linkedIn: 'linkedin.com/in/angelacruz',
    matchScore: 88,
    status: 'new',
    skills: ['Java', 'React', 'Node.js', 'MongoDB'],
    experience: '5 years full-stack development',
    matchReasons: [
      '✓ 5 Years Java Experience',
      '✓ Full-stack capabilities',
      '✓ Strong problem-solving skills',
      '△ No cloud certification (can be acquired)'
    ],
    notes: '',
    assignedJoId: 'jo1'
  },
  {
    id: 'c4',
    name: 'Michael Tan',
    email: 'michael.tan@email.com',
    phone: '+63 920 456 7890',
    linkedIn: 'linkedin.com/in/michaeltan',
    matchScore: 96,
    status: 'new',
    skills: ['Selenium', 'Cypress', 'JUnit', 'TestNG', 'API Testing'],
    experience: '5 years in QA automation',
    matchReasons: [
      '✓ 5 Years QA Automation Experience',
      '✓ Selenium & Cypress expertise',
      '✓ CI/CD integration experience',
      '✓ ISTQB Certified'
    ],
    notes: '',
    assignedJoId: 'jo2'
  },
  {
    id: 'c5',
    name: 'Patricia Reyes',
    email: 'patricia.reyes@email.com',
    phone: '+63 921 567 8901',
    linkedIn: 'linkedin.com/in/patriciareyes',
    matchScore: 91,
    status: 'offer',
    skills: ['Manual Testing', 'Selenium', 'JIRA', 'Agile'],
    experience: '4 years in software testing',
    matchReasons: [
      '✓ 4 Years Testing Experience',
      '✓ Strong Selenium skills',
      '✓ Agile methodology experience',
      '✓ Excellent documentation skills'
    ],
    notes: 'Salary negotiation in progress',
    assignedJoId: 'jo2'
  },
  {
    id: 'c6',
    name: 'Robert Lim',
    email: 'robert.lim@email.com',
    phone: '+63 922 678 9012',
    linkedIn: 'linkedin.com/in/robertlim',
    matchScore: 94,
    status: 'new',
    skills: ['Project Management', 'Agile', 'Scrum', 'JIRA', 'MS Project'],
    experience: '8 years in IT project management',
    matchReasons: [
      '✓ 8 Years PM Experience',
      '✓ PMP Certified',
      '✓ Managed 10+ enterprise projects',
      '✓ Strong stakeholder management'
    ],
    notes: '',
    assignedJoId: 'jo3'
  },
  {
    id: 'c7',
    name: 'Jennifer Garcia',
    email: 'jennifer.garcia@email.com',
    phone: '+63 923 789 0123',
    linkedIn: 'linkedin.com/in/jennifergarcia',
    matchScore: 89,
    status: 'pooled',
    skills: ['Project Management', 'Scrum', 'Risk Management'],
    experience: '5 years in project coordination',
    matchReasons: [
      '✓ 5 Years PM Experience',
      '✓ CSM Certified',
      '✓ Budget management experience',
      '△ Limited enterprise-scale experience'
    ],
    notes: 'Good potential, added to talent pool for future roles',
    assignedJoId: 'jo3'
  },
  {
    id: 'c8',
    name: 'David Fernandez',
    email: 'david.fernandez@email.com',
    phone: '+63 924 890 1234',
    linkedIn: 'linkedin.com/in/davidfernandez',
    matchScore: 72,
    status: 'rejected',
    skills: ['Java', 'Basic SQL'],
    experience: '2 years junior development',
    matchReasons: [
      '✓ Java fundamentals',
      '✗ Only 2 years experience (requires 5)',
      '✗ No cloud experience',
      '✗ Limited architectural knowledge'
    ],
    notes: 'Not enough experience for senior role. Encouraged to apply for junior positions.',
    assignedJoId: 'jo1'
  },
  {
    id: 'c9',
    name: 'Sarah Villanueva',
    email: 'sarah.v@email.com',
    phone: '+63 925 901 2345',
    linkedIn: 'linkedin.com/in/sarahvillanueva',
    matchScore: 93,
    status: 'new',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS'],
    experience: '6 years in frontend development',
    matchReasons: [
      '✓ 6 Years React/TypeScript Experience',
      '✓ Led UI/UX initiatives',
      '✓ Performance optimization expert',
      '✓ AWS Amplify experience'
    ],
    notes: '',
    assignedJoId: 'jo4'
  },
  {
    id: 'c10',
    name: 'Mark Aquino',
    email: 'mark.aquino@email.com',
    phone: '+63 926 012 3456',
    linkedIn: 'linkedin.com/in/markaquino',
    matchScore: 87,
    status: 'interview',
    skills: ['React', 'Vue.js', 'JavaScript', 'CSS', 'Figma'],
    experience: '4 years in web development',
    matchReasons: [
      '✓ 4 Years Frontend Experience',
      '✓ React & Vue expertise',
      '✓ Design-to-code skills',
      '△ Limited TypeScript (can learn quickly)'
    ],
    notes: 'Technical assessment completed. Moving to final interview.',
    assignedJoId: 'jo4'
  },
  {
    id: 'c11',
    name: 'Christina Bautista',
    email: 'christina.b@email.com',
    phone: '+63 927 123 4567',
    linkedIn: 'linkedin.com/in/christinabautista',
    matchScore: 90,
    status: 'new',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'AWS'],
    experience: '5 years in data science',
    matchReasons: [
      '✓ 5 Years Data Science Experience',
      '✓ ML model deployment experience',
      '✓ AWS SageMaker certified',
      '✓ PhD in Computer Science'
    ],
    notes: '',
    assignedJoId: 'jo5'
  },
  {
    id: 'c12',
    name: 'Paulo Mendoza',
    email: 'paulo.mendoza@email.com',
    phone: '+63 928 234 5678',
    linkedIn: 'linkedin.com/in/paulomendoza',
    matchScore: 85,
    status: 'new',
    skills: ['Python', 'R', 'Tableau', 'SQL', 'Statistics'],
    experience: '4 years in analytics',
    matchReasons: [
      '✓ 4 Years Analytics Experience',
      '✓ Strong statistical background',
      '✓ Business intelligence expertise',
      '△ Limited ML experience'
    ],
    notes: '',
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
    requiredDate: '2026-02-28',
    createdDate: '2026-01-15',
    status: 'job-offer',
    candidateIds: ['c4', 'c5']
  },
  {
    id: 'jo3',
    joNumber: 'JO-2024-003',
    title: 'IT Project Manager',
    description: 'Need an experienced IT Project Manager to oversee multiple concurrent projects. PMP or equivalent certification required. Must have experience managing enterprise-scale IT implementations.',
    level: 'Lead',
    quantity: 1,
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
    requiredDate: '2023-12-15',
    createdDate: '2023-11-01',
    status: 'fulfilled',
    candidateIds: []
  }
];

export const statusLabels: Record<string, string> = {
  'new': 'New Match',
  'interview': 'Interview',
  'offer': 'Offer',
  'hired': 'Hired',
  'pooled': 'Pooled',
  'rejected': 'Rejected'
};

export const joStatusLabels: Record<string, string> = {
  'draft': 'Draft',
  'in-progress': 'In Progress',
  'job-offer': 'Job Offer',
  'closed': 'Closed',
  'fulfilled': 'Fulfilled'
};

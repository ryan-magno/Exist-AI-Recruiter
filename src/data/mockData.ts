export type PipelineStatus = 'new-match' | 'hr-interview' | 'tech-interview' | 'offer' | 'hired' | 'rejected';
export type TechInterviewResult = 'pending' | 'pass' | 'fail';
export type EmploymentType = 'full-time' | 'project-based' | 'consultant';
export type Level = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedIn: string;
  matchScore: number;
  pipelineStatus: PipelineStatus;
  techInterviewResult: TechInterviewResult;
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
  // HR Notes fields
  workingConditions: string;
  remarks: string;
  techNotes: string;
  employmentType: EmploymentType;
  positionApplied: string;
  expectedSalary: string;
  earliestStartDate: string;
  currentOccupation: string;
  assignedJoId?: string;
  // New fields
  educationalBackground: string;
  relevantWorkExperience: string;
  keySkills: string[];
}

export interface JobOrder {
  id: string;
  joNumber: string;
  title: string;
  description: string;
  level: Level;
  quantity: number;
  hiredCount: number;
  requiredDate: string;
  createdDate: string;
  status: 'draft' | 'in-progress' | 'fulfilled' | 'closed';
  candidateIds: string[];
  department: string;
  employmentType: EmploymentType;
}

export const departmentOptions = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
  'Data Science',
  'IT Infrastructure'
];

export const employmentTypeLabels: Record<EmploymentType, string> = {
  'full-time': 'Full Time / Regular',
  'project-based': 'Project Based',
  'consultant': 'Consultant'
};

export const levelLabels: Record<Level, string> = {
  'L1': 'L1 - Entry',
  'L2': 'L2 - Junior',
  'L3': 'L3 - Mid',
  'L4': 'L4 - Senior',
  'L5': 'L5 - Lead'
};

export const techInterviewLabels: Record<TechInterviewResult, string> = {
  'pending': 'Pending',
  'pass': 'Pass',
  'fail': 'Fail'
};

export const techInterviewColors: Record<TechInterviewResult, string> = {
  'pending': 'bg-gray-100 text-gray-700 border-gray-300',
  'pass': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'fail': 'bg-red-100 text-red-800 border-red-300'
};

export const mockCandidates: Candidate[] = [
  {
    id: 'c1',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '+63 917 123 4567',
    linkedIn: 'linkedin.com/in/mariasantos',
    matchScore: 98,
    pipelineStatus: 'new-match',
    techInterviewResult: 'pending',
    skills: ['Java', 'Spring Boot', 'AWS', 'Microservices', 'PostgreSQL'],
    experience: '7 years in enterprise software development',
    experienceDetails: {
      totalYears: 7,
      breakdown: '3 years as Senior Developer at Accenture, 2 years at IBM Philippines, 2 years at local fintech startup'
    },
    matchReasons: [
      '✓ 7 Years Java Experience (Exceeds 5-year requirement)',
      '✓ AWS Certified Solutions Architect',
      '✓ Strong Spring Boot & Microservices background'
    ],
    matchAnalysis: {
      summary: 'Maria is an exceptional candidate with deep expertise in Java and cloud technologies. Her fintech background aligns perfectly with the banking project requirements.',
      strengths: [
        'AWS Certified Solutions Architect with hands-on cloud migration experience',
        'Led development of microservices architecture serving 2M+ users',
        'Strong communication skills and proven team leadership'
      ],
      weaknesses: [
        'Limited exposure to Kubernetes (prefers ECS)',
        'Salary expectations may be above budget range'
      ]
    },
    workingConditions: '',
    remarks: '',
    techNotes: '',
    employmentType: 'full-time',
    positionApplied: 'Senior Java Developer',
    expectedSalary: '₱180,000 - ₱220,000/month',
    earliestStartDate: '2026-03-01',
    currentOccupation: 'Senior Software Engineer at Accenture',
    assignedJoId: 'jo1',
    educationalBackground: 'BS Computer Science, University of the Philippines Diliman, 2017',
    relevantWorkExperience: '7 years - Enterprise Java Development, Cloud Architecture, Team Leadership',
    keySkills: ['Java', 'Spring Boot', 'AWS', 'Microservices']
  },
  {
    id: 'c2',
    name: 'John Rodriguez',
    email: 'john.rod@email.com',
    phone: '+63 918 234 5678',
    linkedIn: 'linkedin.com/in/johnrodriguez',
    matchScore: 95,
    pipelineStatus: 'hr-interview',
    techInterviewResult: 'pending',
    skills: ['Java', 'Kotlin', 'AWS', 'Docker', 'Kubernetes'],
    experience: '6 years in software development',
    experienceDetails: {
      totalYears: 6,
      breakdown: '4 years at Globe Telecom, 2 years at tech consultancy'
    },
    matchReasons: [
      '✓ 6 Years Java/Kotlin Development',
      '✓ AWS Certified Developer Associate',
      '✓ Kubernetes orchestration experience'
    ],
    matchAnalysis: {
      summary: 'John brings strong container orchestration skills and leadership experience. His telecom background provides relevant high-availability systems experience.',
      strengths: [
        'Kubernetes expert with production cluster management',
        'Experience with high-traffic systems (10M+ transactions/day)',
        'Proven leadership of development teams'
      ],
      weaknesses: [
        'Less experience with pure Spring Boot (more Kotlin-focused)',
        'Currently on notice period - available in 60 days'
      ]
    },
    workingConditions: 'Flexible work hours preferred',
    remarks: 'Scheduled for technical interview on Monday',
    techNotes: '',
    employmentType: 'full-time',
    positionApplied: 'Senior Java Developer',
    expectedSalary: '₱160,000 - ₱200,000/month',
    earliestStartDate: '2026-04-01',
    currentOccupation: 'Technical Lead at Globe Telecom',
    assignedJoId: 'jo1',
    educationalBackground: 'BS Information Technology, Ateneo de Manila University, 2018',
    relevantWorkExperience: '6 years - Backend Development, Cloud Infrastructure, DevOps',
    keySkills: ['Java', 'Kotlin', 'Kubernetes', 'Docker']
  },
  {
    id: 'c3',
    name: 'Angela Cruz',
    email: 'angela.cruz@email.com',
    phone: '+63 919 345 6789',
    linkedIn: 'linkedin.com/in/angelacruz',
    matchScore: 88,
    pipelineStatus: 'new-match',
    techInterviewResult: 'pending',
    skills: ['Java', 'React', 'Node.js', 'MongoDB'],
    experience: '5 years full-stack development',
    experienceDetails: {
      totalYears: 5,
      breakdown: '3 years as Full-stack Developer at startup, 2 years freelance'
    },
    matchReasons: [
      '✓ 5 Years Java Experience',
      '✓ Full-stack capabilities',
      '△ No cloud certification (can be acquired)'
    ],
    matchAnalysis: {
      summary: 'Angela is a versatile full-stack developer. While lacking cloud certification, her rapid learning ability and broad skillset make her a promising candidate.',
      strengths: [
        'Full-stack capabilities reduce inter-team dependencies',
        'Adaptable and fast learner based on portfolio',
        'Experience with both SQL and NoSQL databases'
      ],
      weaknesses: [
        'No formal cloud certification',
        'Limited enterprise-scale experience'
      ]
    },
    workingConditions: '',
    remarks: '',
    techNotes: '',
    employmentType: 'full-time',
    positionApplied: 'Senior Java Developer',
    expectedSalary: '₱120,000 - ₱150,000/month',
    earliestStartDate: '2026-02-15',
    currentOccupation: 'Freelance Developer',
    assignedJoId: 'jo1',
    educationalBackground: 'BS Computer Engineering, Mapua University, 2019',
    relevantWorkExperience: '5 years - Full-stack Development, Freelance Projects',
    keySkills: ['Java', 'React', 'Node.js', 'MongoDB']
  },
  {
    id: 'c4',
    name: 'Michael Tan',
    email: 'michael.tan@email.com',
    phone: '+63 920 456 7890',
    linkedIn: 'linkedin.com/in/michaeltan',
    matchScore: 96,
    pipelineStatus: 'new-match',
    techInterviewResult: 'pending',
    skills: ['Selenium', 'Cypress', 'JUnit', 'TestNG', 'API Testing'],
    experience: '5 years in QA automation',
    experienceDetails: {
      totalYears: 5,
      breakdown: '3 years at major bank, 2 years at software house'
    },
    matchReasons: [
      '✓ 5 Years QA Automation Experience',
      '✓ Selenium & Cypress expertise',
      '✓ ISTQB Certified'
    ],
    matchAnalysis: {
      summary: 'Michael is a highly qualified QA automation engineer with banking domain experience and industry certifications.',
      strengths: [
        'ISTQB certified with strong theoretical foundation',
        'Banking domain experience relevant to fintech projects',
        'Extensive CI/CD pipeline integration knowledge'
      ],
      weaknesses: [
        'Limited mobile testing experience',
        'Prefers structured environments over agile startups'
      ]
    },
    workingConditions: '',
    remarks: '',
    techNotes: '',
    employmentType: 'full-time',
    positionApplied: 'QA Automation Engineer',
    expectedSalary: '₱90,000 - ₱120,000/month',
    earliestStartDate: '2026-03-01',
    currentOccupation: 'QA Engineer at BDO',
    assignedJoId: 'jo2',
    educationalBackground: 'BS Computer Science, De La Salle University, 2019',
    relevantWorkExperience: '5 years - QA Automation, Test Framework Development',
    keySkills: ['Selenium', 'Cypress', 'API Testing', 'CI/CD']
  },
  {
    id: 'c5',
    name: 'Patricia Reyes',
    email: 'patricia.reyes@email.com',
    phone: '+63 921 567 8901',
    linkedIn: 'linkedin.com/in/patriciareyes',
    matchScore: 91,
    pipelineStatus: 'offer',
    techInterviewResult: 'pass',
    skills: ['Manual Testing', 'Selenium', 'JIRA', 'Agile'],
    experience: '4 years in software testing',
    experienceDetails: {
      totalYears: 4,
      breakdown: '2 years at BPI, 2 years at software agency'
    },
    matchReasons: [
      '✓ 4 Years Testing Experience',
      '✓ Strong Selenium skills',
      '✓ Agile methodology experience'
    ],
    matchAnalysis: {
      summary: 'Patricia combines strong manual and automation testing skills with excellent documentation abilities. Offer stage - pending final negotiation.',
      strengths: [
        'Excellent test documentation and reporting',
        'Experience with banking compliance testing',
        'Strong agile methodology adherence'
      ],
      weaknesses: [
        'Less experience with performance testing',
        'Salary negotiation still pending'
      ]
    },
    workingConditions: 'Prefers hybrid work setup',
    remarks: 'Salary negotiation in progress',
    techNotes: 'Strong automation skills verified',
    employmentType: 'full-time',
    positionApplied: 'QA Automation Engineer',
    expectedSalary: '₱85,000 - ₱100,000/month',
    earliestStartDate: '2026-02-20',
    currentOccupation: 'QA Lead at BPI',
    assignedJoId: 'jo2',
    educationalBackground: 'BS Information Systems, UST, 2020',
    relevantWorkExperience: '4 years - Manual & Automation Testing, Banking Domain',
    keySkills: ['Selenium', 'Manual Testing', 'JIRA', 'Agile']
  },
  {
    id: 'c6',
    name: 'Robert Lim',
    email: 'robert.lim@email.com',
    phone: '+63 922 678 9012',
    linkedIn: 'linkedin.com/in/robertlim',
    matchScore: 94,
    pipelineStatus: 'new-match',
    techInterviewResult: 'pending',
    skills: ['Project Management', 'Agile', 'Scrum', 'JIRA', 'MS Project'],
    experience: '8 years in IT project management',
    experienceDetails: {
      totalYears: 8,
      breakdown: '4 years at Accenture PH, 3 years at PLDT, 1 year consulting'
    },
    matchReasons: [
      '✓ 8 Years PM Experience',
      '✓ PMP Certified',
      '✓ Managed 10+ enterprise projects'
    ],
    matchAnalysis: {
      summary: 'Robert is a seasoned IT Project Manager with PMP certification and extensive enterprise project delivery experience.',
      strengths: [
        'PMP certified with proven track record',
        'Managed budgets exceeding ₱50M',
        'Excellent executive communication skills'
      ],
      weaknesses: [
        'May be overqualified for smaller projects',
        'Prefers strategic over tactical roles'
      ]
    },
    workingConditions: '',
    remarks: '',
    techNotes: '',
    employmentType: 'full-time',
    positionApplied: 'IT Project Manager',
    expectedSalary: '₱200,000 - ₱250,000/month',
    earliestStartDate: '2026-03-15',
    currentOccupation: 'Senior Project Manager at Accenture',
    assignedJoId: 'jo3',
    educationalBackground: 'MBA, Asian Institute of Management, 2018',
    relevantWorkExperience: '8 years - IT Project Management, Enterprise Implementations',
    keySkills: ['PMP', 'Agile', 'Scrum', 'Stakeholder Management']
  },
  {
    id: 'c7',
    name: 'Jennifer Garcia',
    email: 'jennifer.garcia@email.com',
    phone: '+63 923 789 0123',
    linkedIn: 'linkedin.com/in/jennifergarcia',
    matchScore: 89,
    pipelineStatus: 'rejected',
    techInterviewResult: 'fail',
    skills: ['Project Management', 'Scrum', 'Risk Management'],
    experience: '5 years in project coordination',
    experienceDetails: {
      totalYears: 5,
      breakdown: '3 years as Project Coordinator, 2 years as Associate PM'
    },
    matchReasons: [
      '✓ 5 Years PM Experience',
      '✓ CSM Certified',
      '△ Limited enterprise-scale experience'
    ],
    matchAnalysis: {
      summary: 'Jennifer has good PM fundamentals but lacks the enterprise-scale experience required for this role.',
      strengths: [
        'CSM certified scrum master',
        'Strong organizational skills',
        'Good stakeholder communication'
      ],
      weaknesses: [
        'Limited enterprise-scale experience',
        'No PMP certification yet'
      ]
    },
    workingConditions: 'On-site preferred',
    remarks: 'Good potential, added to talent pool for future roles',
    techNotes: '',
    employmentType: 'full-time',
    positionApplied: 'IT Project Manager',
    expectedSalary: '₱100,000 - ₱130,000/month',
    earliestStartDate: '2026-02-15',
    currentOccupation: 'Associate Project Manager',
    assignedJoId: 'jo3',
    educationalBackground: 'BS Business Administration, Ateneo de Manila, 2019',
    relevantWorkExperience: '5 years - Project Coordination, Associate PM',
    keySkills: ['Scrum', 'Risk Management', 'Coordination']
  },
  {
    id: 'c8',
    name: 'David Fernandez',
    email: 'david.fernandez@email.com',
    phone: '+63 924 890 1234',
    linkedIn: 'linkedin.com/in/davidfernandez',
    matchScore: 72,
    pipelineStatus: 'rejected',
    techInterviewResult: 'fail',
    skills: ['Java', 'Basic SQL'],
    experience: '2 years junior development',
    experienceDetails: {
      totalYears: 2,
      breakdown: '2 years as Junior Developer at tech startup'
    },
    matchReasons: [
      '✓ Java fundamentals',
      '✗ Only 2 years experience (requires 5)',
      '✗ No cloud experience'
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
        'No cloud or distributed systems experience'
      ]
    },
    workingConditions: '',
    remarks: 'Not enough experience for senior role. Encouraged to apply for junior positions.',
    techNotes: 'Strong fundamentals, recommend for junior openings',
    employmentType: 'full-time',
    positionApplied: 'Senior Java Developer',
    expectedSalary: '₱50,000 - ₱70,000/month',
    earliestStartDate: '2026-02-01',
    currentOccupation: 'Junior Developer',
    assignedJoId: 'jo1',
    educationalBackground: 'BS Computer Science, PUP, 2022',
    relevantWorkExperience: '2 years - Junior Development',
    keySkills: ['Java', 'SQL']
  },
  {
    id: 'c9',
    name: 'Sarah Villanueva',
    email: 'sarah.v@email.com',
    phone: '+63 925 901 2345',
    linkedIn: 'linkedin.com/in/sarahvillanueva',
    matchScore: 93,
    pipelineStatus: 'new-match',
    techInterviewResult: 'pending',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS'],
    experience: '6 years in frontend development',
    experienceDetails: {
      totalYears: 6,
      breakdown: '3 years at e-commerce company, 2 years at agency, 1 year freelance'
    },
    matchReasons: [
      '✓ 6 Years React/TypeScript Experience',
      '✓ Led UI/UX initiatives',
      '✓ Performance optimization expert'
    ],
    matchAnalysis: {
      summary: 'Sarah is a talented frontend specialist with strong performance optimization skills and leadership experience.',
      strengths: [
        'Deep React and TypeScript expertise',
        'Performance optimization specialist',
        'Experience leading frontend teams'
      ],
      weaknesses: [
        'Less experience with mobile/React Native',
        'Prefers product companies over consultancy'
      ]
    },
    workingConditions: '',
    remarks: '',
    techNotes: '',
    employmentType: 'full-time',
    positionApplied: 'Senior Frontend Developer',
    expectedSalary: '₱140,000 - ₱180,000/month',
    earliestStartDate: '2026-03-01',
    currentOccupation: 'Senior Frontend Developer at Lazada',
    assignedJoId: 'jo4',
    educationalBackground: 'BS Computer Science, UP Los Baños, 2018',
    relevantWorkExperience: '6 years - Frontend Development, React/TypeScript',
    keySkills: ['React', 'TypeScript', 'GraphQL', 'Performance']
  },
  {
    id: 'c10',
    name: 'Mark Aquino',
    email: 'mark.aquino@email.com',
    phone: '+63 926 012 3456',
    linkedIn: 'linkedin.com/in/markaquino',
    matchScore: 87,
    pipelineStatus: 'tech-interview',
    techInterviewResult: 'pending',
    skills: ['React', 'Vue.js', 'JavaScript', 'CSS', 'Figma'],
    experience: '4 years in web development',
    experienceDetails: {
      totalYears: 4,
      breakdown: '2 years at digital agency, 2 years at startup'
    },
    matchReasons: [
      '✓ 4 Years Frontend Experience',
      '✓ React & Vue expertise',
      '△ Limited TypeScript (can learn quickly)'
    ],
    matchAnalysis: {
      summary: 'Mark has strong frontend skills with excellent design sensibilities. TypeScript experience is limited but learnable.',
      strengths: [
        'Strong design-to-code translation',
        'Multi-framework experience (React, Vue)',
        'Excellent CSS and animation skills'
      ],
      weaknesses: [
        'Limited TypeScript experience',
        'Less experience with state management at scale'
      ]
    },
    workingConditions: 'Remote work preferred',
    remarks: 'Technical assessment completed. Moving to final interview.',
    techNotes: 'Good problem-solving, needs TypeScript upskilling',
    employmentType: 'full-time',
    positionApplied: 'Senior Frontend Developer',
    expectedSalary: '₱100,000 - ₱130,000/month',
    earliestStartDate: '2026-02-15',
    currentOccupation: 'Frontend Developer at Startup',
    assignedJoId: 'jo4',
    educationalBackground: 'BS Information Technology, FEU, 2020',
    relevantWorkExperience: '4 years - Frontend Development, UI/UX Implementation',
    keySkills: ['React', 'Vue.js', 'CSS', 'JavaScript']
  },
  {
    id: 'c11',
    name: 'Christina Bautista',
    email: 'christina.b@email.com',
    phone: '+63 927 123 4567',
    linkedIn: 'linkedin.com/in/christinabautista',
    matchScore: 90,
    pipelineStatus: 'new-match',
    techInterviewResult: 'pending',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'AWS'],
    experience: '5 years in data science',
    experienceDetails: {
      totalYears: 5,
      breakdown: '3 years at research institution, 2 years at tech company'
    },
    matchReasons: [
      '✓ 5 Years Data Science Experience',
      '✓ ML model deployment experience',
      '✓ AWS SageMaker certified'
    ],
    matchAnalysis: {
      summary: 'Christina combines academic excellence with practical ML deployment experience.',
      strengths: [
        'PhD-level research capabilities',
        'Production ML deployment experience',
        'AWS SageMaker certified'
      ],
      weaknesses: [
        'May prefer research-oriented work',
        'Less experience with real-time systems'
      ]
    },
    workingConditions: '',
    remarks: '',
    techNotes: '',
    employmentType: 'full-time',
    positionApplied: 'Data Scientist',
    expectedSalary: '₱180,000 - ₱220,000/month',
    earliestStartDate: '2026-03-15',
    currentOccupation: 'Data Scientist at Tech Company',
    assignedJoId: 'jo5',
    educationalBackground: 'PhD Computer Science, UP Diliman, 2021',
    relevantWorkExperience: '5 years - Data Science, Machine Learning Research',
    keySkills: ['Python', 'TensorFlow', 'AWS SageMaker', 'ML']
  },
  {
    id: 'c12',
    name: 'Paulo Mendoza',
    email: 'paulo.mendoza@email.com',
    phone: '+63 928 234 5678',
    linkedIn: 'linkedin.com/in/paulomendoza',
    matchScore: 85,
    pipelineStatus: 'new-match',
    techInterviewResult: 'pending',
    skills: ['Python', 'R', 'Tableau', 'SQL', 'Statistics'],
    experience: '4 years in analytics',
    experienceDetails: {
      totalYears: 4,
      breakdown: '2 years as Business Analyst, 2 years as Data Analyst'
    },
    matchReasons: [
      '✓ 4 Years Analytics Experience',
      '✓ Strong statistical background',
      '△ Limited ML experience'
    ],
    matchAnalysis: {
      summary: 'Paulo has strong BI and analytics skills but limited hands-on ML experience.',
      strengths: [
        'Strong statistical foundation',
        'Excellent data visualization skills',
        'Business acumen and stakeholder communication'
      ],
      weaknesses: [
        'Limited ML/deep learning experience',
        'No cloud ML platform experience'
      ]
    },
    workingConditions: '',
    remarks: '',
    techNotes: '',
    employmentType: 'consultant',
    positionApplied: 'Data Scientist',
    expectedSalary: '₱80,000 - ₱100,000/month',
    earliestStartDate: '2026-02-01',
    currentOccupation: 'Data Analyst at Retail Company',
    assignedJoId: 'jo5',
    educationalBackground: 'MS Statistics, Ateneo de Manila, 2020',
    relevantWorkExperience: '4 years - Business Analytics, Data Visualization',
    keySkills: ['Python', 'R', 'Tableau', 'SQL']
  }
];

export const mockJobOrders: JobOrder[] = [
  {
    id: 'jo1',
    joNumber: 'JO-2024-001',
    title: 'Senior Java Developer',
    description: 'Looking for an experienced Java developer to join our core banking team. Must have strong experience with Spring Boot, microservices architecture, and cloud technologies (preferably AWS). The ideal candidate will help architect and build scalable financial solutions.',
    level: 'L4',
    quantity: 3,
    hiredCount: 0,
    requiredDate: '2026-02-15',
    createdDate: '2026-01-08',
    status: 'in-progress',
    candidateIds: ['c1', 'c2', 'c3', 'c8'],
    department: 'Engineering',
    employmentType: 'full-time'
  },
  {
    id: 'jo2',
    joNumber: 'JO-2024-002',
    title: 'QA Automation Engineer',
    description: 'Seeking a QA Automation Engineer to strengthen our testing capabilities. Experience with Selenium, Cypress, and API testing required. ISTQB certification preferred.',
    level: 'L3',
    quantity: 2,
    hiredCount: 0,
    requiredDate: '2026-02-28',
    createdDate: '2026-01-15',
    status: 'in-progress',
    candidateIds: ['c4', 'c5'],
    department: 'Engineering',
    employmentType: 'full-time'
  },
  {
    id: 'jo3',
    joNumber: 'JO-2024-003',
    title: 'IT Project Manager',
    description: 'Need an experienced IT Project Manager to oversee multiple concurrent projects. PMP or equivalent certification required. Must have experience managing enterprise-scale IT implementations.',
    level: 'L5',
    quantity: 1,
    hiredCount: 0,
    requiredDate: '2026-03-01',
    createdDate: '2026-01-05',
    status: 'in-progress',
    candidateIds: ['c6', 'c7'],
    department: 'Operations',
    employmentType: 'full-time'
  },
  {
    id: 'jo4',
    joNumber: 'JO-2024-004',
    title: 'Senior Frontend Developer',
    description: 'Looking for a Senior Frontend Developer with expertise in React and TypeScript. Experience with modern frontend tooling and performance optimization is essential.',
    level: 'L4',
    quantity: 2,
    hiredCount: 0,
    requiredDate: '2026-03-20',
    createdDate: '2026-01-18',
    status: 'in-progress',
    candidateIds: ['c9', 'c10'],
    department: 'Engineering',
    employmentType: 'full-time'
  },
  {
    id: 'jo5',
    joNumber: 'JO-2024-005',
    title: 'Data Scientist',
    description: 'Seeking a Data Scientist to join our analytics team. Must have experience with Python, machine learning frameworks, and cloud-based ML platforms.',
    level: 'L4',
    quantity: 1,
    hiredCount: 0,
    requiredDate: '2026-04-15',
    createdDate: '2026-01-17',
    status: 'draft',
    candidateIds: ['c11', 'c12'],
    department: 'Data Science',
    employmentType: 'consultant'
  },
  {
    id: 'jo6',
    joNumber: 'JO-2023-089',
    title: 'DevOps Engineer',
    description: 'DevOps Engineer with expertise in CI/CD pipelines, containerization, and cloud infrastructure management. Position has been filled.',
    level: 'L4',
    quantity: 1,
    hiredCount: 1,
    requiredDate: '2023-12-15',
    createdDate: '2023-11-01',
    status: 'fulfilled',
    candidateIds: [],
    department: 'IT Infrastructure',
    employmentType: 'full-time'
  }
];

export const pipelineStatusLabels: Record<PipelineStatus, string> = {
  'new-match': 'For HR Interview',
  'hr-interview': 'For Tech Interview',
  'tech-interview': 'Tech Interview',
  'offer': 'Offer',
  'hired': 'Hired',
  'rejected': 'Rejected'
};

export const pipelineStatusColors: Record<PipelineStatus, string> = {
  'new-match': 'bg-sky-100 text-sky-800 border-sky-300',
  'hr-interview': 'bg-violet-100 text-violet-800 border-violet-300',
  'tech-interview': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'offer': 'bg-amber-100 text-amber-800 border-amber-300',
  'hired': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'rejected': 'bg-red-100 text-red-800 border-red-300'
};

export const joStatusLabels: Record<string, string> = {
  'draft': 'Draft',
  'in-progress': 'In Progress',
  'fulfilled': 'Fulfilled',
  'closed': 'Closed'
};

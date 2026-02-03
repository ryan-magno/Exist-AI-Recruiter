export type PipelineStatus = 'new-match' | 'hr-interview' | 'offer' | 'hired' | 'rejected';
export type TechInterviewResult = 'pending' | 'pass' | 'fail';
export type EmploymentType = 'full-time' | 'project-based' | 'consultant';
export type Level = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type ApplicantType = 'internal' | 'external';
export type HRVerdict = 'proceed-to-tech' | 'hold' | 'reject';
export type TechVerdict = 'proceed-to-offer' | 'hold' | 'reject';

export interface TimelineEntry {
  id: string;
  fromStatus: PipelineStatus | 'applied';
  toStatus: PipelineStatus;
  date: string;
  durationDays?: number;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  summary: string;
  projects?: string[];
}

export interface ApplicationHistory {
  id: string;
  joNumber: string;
  position: string;
  department: string;
  appliedDate: string;
  farthestStatus: PipelineStatus;
  statusDate: string;
  notes: string;
  outcome: 'hired' | 'rejected' | 'withdrawn' | 'pending';
}

export interface HRInterviewForm {
  interviewerName: string;
  interviewDate: string;
  interviewMethod: 'phone' | 'virtual' | 'in-person';
  
  // Logistics & Expectations
  noticePeriod: 'immediate' | '1-week' | '2-weeks' | '1-month' | '2-months-plus';
  expectedSalary: string;
  workSetupPreference: 'on-site' | 'hybrid' | 'remote' | 'flexible';
  employmentStatusPreference: 'regular' | 'contractual' | 'freelance' | 'part-time';
  relocationWillingness: 'yes' | 'no' | 'maybe' | 'na';
  
  // Behavioral & Qualitative
  motivationAnswer: string;
  conflictResolutionAnswer: string;
  careerAlignmentAnswer: string;
  administrativeNotes: string;
  
  // Competency Scoring (1-5)
  communicationScore: number;
  culturalFitScore: number;
  engagementScore: number;
  communicationNotes: string;
  
  // Verdict
  verdict: HRVerdict | '';
  verdictRationale: string;
}

export interface TechInterviewForm {
  interviewerName: string;
  interviewDate: string;
  interviewMethod: 'phone' | 'virtual' | 'in-person';
  
  // Technical Assessment
  technicalSkillsScore: number;
  problemSolvingScore: number;
  systemDesignScore: number;
  codingChallengeScore: number;
  
  // Technical Areas
  strengthAreas: string;
  weaknessAreas: string;
  technicalNotes: string;
  
  // Verdict
  verdict: TechVerdict | '';
  verdictRationale: string;
}

export type ProcessingStatus = 'processing' | 'completed' | 'failed';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedIn: string;
  matchScore: number;
  pipelineStatus: PipelineStatus;
  statusChangedDate: string;
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
  workingConditions: string;
  remarks: string;
  techNotes: string;
  employmentType: EmploymentType;
  positionApplied: string;
  expectedSalary: string;
  earliestStartDate: string;
  currentOccupation: string;
  assignedJoId?: string;
  educationalBackground: string;
  relevantWorkExperience: string;
  keySkills: string[];
  appliedDate: string;
  timeline: TimelineEntry[];
  
  // New fields
  applicantType: ApplicantType;
  workExperiences: WorkExperience[];
  applicationHistory: ApplicationHistory[];
  hrInterviewForm?: HRInterviewForm;
  techInterviewForm?: TechInterviewForm;
  
  // Processing status for async CV analysis
  processingStatus?: ProcessingStatus;
  processingBatchId?: string;
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
  requestorName: string;
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

export const pipelineStatusLabels: Record<PipelineStatus, string> = {
  'new-match': 'For HR Interview',
  'hr-interview': 'For Tech Interview',
  'offer': 'Offer',
  'hired': 'Hired',
  'rejected': 'Rejected'
};

export const pipelineStatusColors: Record<PipelineStatus, string> = {
  'new-match': 'bg-sky-100 text-sky-700 border-sky-300',
  'hr-interview': 'bg-violet-100 text-violet-700 border-violet-300',
  'offer': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'hired': 'bg-green-100 text-green-700 border-green-300',
  'rejected': 'bg-red-100 text-red-700 border-red-300'
};

export const joStatusLabels: Record<JobOrder['status'], string> = {
  'draft': 'Draft',
  'in-progress': 'In Progress',
  'fulfilled': 'Fulfilled',
  'closed': 'Closed'
};

export const hrVerdictLabels: Record<HRVerdict, string> = {
  'proceed-to-tech': 'Proceed to Technical',
  'hold': 'Hold',
  'reject': 'Reject'
};

export const techVerdictLabels: Record<TechVerdict, string> = {
  'proceed-to-offer': 'Proceed to Offer',
  'hold': 'Hold',
  'reject': 'Reject'
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
    statusChangedDate: '2026-01-19',
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
    keySkills: ['Java', 'Spring Boot', 'AWS', 'Microservices'],
    appliedDate: '2026-01-10',
    timeline: [
      { id: 't1-1', fromStatus: 'applied', toStatus: 'new-match', date: '2026-01-19', durationDays: 9 }
    ],
    applicantType: 'external',
    workExperiences: [
      {
        company: 'Accenture Philippines',
        position: 'Senior Software Engineer',
        startDate: '2023-01',
        endDate: 'Present',
        summary: 'Led Java development team for banking core systems modernization',
        projects: ['Core Banking Migration', 'Microservices Architecture Implementation', 'AWS Cloud Migration']
      },
      {
        company: 'IBM Philippines',
        position: 'Software Developer',
        startDate: '2021-01',
        endDate: '2022-12',
        summary: 'Developed enterprise applications using Java and cloud technologies',
        projects: ['Enterprise Resource Planning System', 'API Gateway Development']
      },
      {
        company: 'FinTech Startup',
        position: 'Full-stack Developer',
        startDate: '2019-01',
        endDate: '2020-12',
        summary: 'Built payment processing systems and mobile app backends',
        projects: ['Payment Gateway Integration', 'Mobile App Backend']
      }
    ],
    applicationHistory: []
  },
  {
    id: 'c2',
    name: 'John Rodriguez',
    email: 'john.rod@email.com',
    phone: '+63 918 234 5678',
    linkedIn: 'linkedin.com/in/johnrodriguez',
    matchScore: 95,
    pipelineStatus: 'hr-interview',
    statusChangedDate: '2026-01-15',
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
    keySkills: ['Java', 'Kotlin', 'Kubernetes', 'Docker'],
    appliedDate: '2026-01-08',
    timeline: [
      { id: 't2-1', fromStatus: 'applied', toStatus: 'new-match', date: '2026-01-10', durationDays: 2 },
      { id: 't2-2', fromStatus: 'new-match', toStatus: 'hr-interview', date: '2026-01-15', durationDays: 5 }
    ],
    applicantType: 'external',
    workExperiences: [
      {
        company: 'Globe Telecom',
        position: 'Technical Lead',
        startDate: '2022-01',
        endDate: 'Present',
        summary: 'Leading backend development team for billing and payment systems',
        projects: ['Billing System Modernization', 'Kubernetes Migration', 'CI/CD Pipeline Implementation']
      },
      {
        company: 'Globe Telecom',
        position: 'Senior Developer',
        startDate: '2020-01',
        endDate: '2021-12',
        summary: 'Developed high-availability services for prepaid systems',
        projects: ['Prepaid Load System', 'SMS Gateway Integration']
      },
      {
        company: 'Tech Consultancy',
        position: 'Software Developer',
        startDate: '2018-01',
        endDate: '2019-12',
        summary: 'Consulted for various enterprise clients on Java development',
        projects: ['E-commerce Platform', 'CRM System']
      }
    ],
    applicationHistory: [
      {
        id: 'ah1',
        joNumber: 'JO-2024-015',
        position: 'Java Developer',
        department: 'Engineering',
        appliedDate: '2025-06-15',
        farthestStatus: 'hr-interview',
        statusDate: '2025-06-28',
        notes: 'Position was put on hold due to budget constraints',
        outcome: 'withdrawn'
      }
    ],
    hrInterviewForm: {
      interviewerName: 'Ana Garcia',
      interviewDate: '2026-01-18',
      interviewMethod: 'virtual',
      noticePeriod: '1-month',
      expectedSalary: '₱180,000/month',
      workSetupPreference: 'hybrid',
      employmentStatusPreference: 'regular',
      relocationWillingness: 'na',
      motivationAnswer: 'I am excited about this role because it aligns with my career goal of working with enterprise-scale systems.',
      conflictResolutionAnswer: 'I had a disagreement with a colleague about architecture decisions. I scheduled a 1-on-1 meeting to understand their perspective and we reached a compromise.',
      careerAlignmentAnswer: 'I want to grow into a solutions architect role, and this position offers exposure to the systems I need to learn.',
      administrativeNotes: 'Very professional, good communication skills',
      communicationScore: 4,
      culturalFitScore: 5,
      engagementScore: 5,
      communicationNotes: 'Articulate and clear in explanations',
      verdict: 'proceed-to-tech',
      verdictRationale: 'Strong candidate with relevant experience and excellent communication skills. Recommend for technical interview.'
    }
  },
  {
    id: 'c3',
    name: 'Angela Cruz',
    email: 'angela.cruz@email.com',
    phone: '+63 919 345 6789',
    linkedIn: 'linkedin.com/in/angelacruz',
    matchScore: 88,
    pipelineStatus: 'new-match',
    statusChangedDate: '2026-01-20',
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
    keySkills: ['Java', 'React', 'Node.js', 'MongoDB'],
    appliedDate: '2026-01-12',
    timeline: [
      { id: 't3-1', fromStatus: 'applied', toStatus: 'new-match', date: '2026-01-20', durationDays: 8 }
    ],
    applicantType: 'internal',
    workExperiences: [
      {
        company: 'Freelance',
        position: 'Full-stack Developer',
        startDate: '2024-01',
        endDate: 'Present',
        summary: 'Building web applications for various clients',
        projects: ['E-commerce Platform', 'Real Estate Listing App', 'Inventory Management System']
      },
      {
        company: 'Tech Startup PH',
        position: 'Full-stack Developer',
        startDate: '2021-01',
        endDate: '2023-12',
        summary: 'Built and maintained the company main product',
        projects: ['SaaS Platform Development', 'API Integration Suite']
      }
    ],
    applicationHistory: [
      {
        id: 'ah2',
        joNumber: 'JO-2024-008',
        position: 'Junior Developer',
        department: 'Engineering',
        appliedDate: '2024-03-10',
        farthestStatus: 'hired',
        statusDate: '2024-04-15',
        notes: 'Hired as internal developer, now applying for senior role',
        outcome: 'hired'
      }
    ]
  },
  {
    id: 'c4',
    name: 'Michael Tan',
    email: 'michael.tan@email.com',
    phone: '+63 920 456 7890',
    linkedIn: 'linkedin.com/in/michaeltan',
    matchScore: 96,
    pipelineStatus: 'new-match',
    statusChangedDate: '2026-01-18',
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
    keySkills: ['Selenium', 'Cypress', 'API Testing', 'CI/CD'],
    appliedDate: '2026-01-05',
    timeline: [
      { id: 't4-1', fromStatus: 'applied', toStatus: 'new-match', date: '2026-01-18', durationDays: 13 }
    ],
    applicantType: 'external',
    workExperiences: [
      {
        company: 'BDO',
        position: 'QA Engineer',
        startDate: '2022-01',
        endDate: 'Present',
        summary: 'Leading test automation for banking applications',
        projects: ['Online Banking Test Automation', 'Mobile App Testing Framework', 'CI/CD Integration']
      },
      {
        company: 'Software House PH',
        position: 'Junior QA Engineer',
        startDate: '2019-06',
        endDate: '2021-12',
        summary: 'Developed and maintained automated test suites',
        projects: ['Selenium Test Framework', 'API Testing Suite']
      }
    ],
    applicationHistory: []
  },
  {
    id: 'c5',
    name: 'Patricia Reyes',
    email: 'patricia.reyes@email.com',
    phone: '+63 921 567 8901',
    linkedIn: 'linkedin.com/in/patriciareyes',
    matchScore: 91,
    pipelineStatus: 'offer',
    statusChangedDate: '2026-01-13',
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
    keySkills: ['Selenium', 'Manual Testing', 'JIRA', 'Agile'],
    appliedDate: '2026-01-02',
    timeline: [
      { id: 't5-1', fromStatus: 'applied', toStatus: 'new-match', date: '2026-01-04', durationDays: 2 },
      { id: 't5-2', fromStatus: 'new-match', toStatus: 'hr-interview', date: '2026-01-07', durationDays: 3 },
      { id: 't5-3', fromStatus: 'hr-interview', toStatus: 'offer', date: '2026-01-13', durationDays: 6 }
    ],
    applicantType: 'external',
    workExperiences: [
      {
        company: 'BPI',
        position: 'QA Lead',
        startDate: '2022-06',
        endDate: 'Present',
        summary: 'Leading QA team for online banking platforms',
        projects: ['BPI Online QA Automation', 'Regression Testing Suite', 'Performance Testing']
      },
      {
        company: 'Software Agency',
        position: 'QA Analyst',
        startDate: '2020-06',
        endDate: '2022-05',
        summary: 'Performed manual and automation testing for various clients',
        projects: ['Client Portal Testing', 'Mobile App QA']
      }
    ],
    applicationHistory: [],
    hrInterviewForm: {
      interviewerName: 'Ana Garcia',
      interviewDate: '2026-01-08',
      interviewMethod: 'virtual',
      noticePeriod: '2-weeks',
      expectedSalary: '₱95,000/month',
      workSetupPreference: 'hybrid',
      employmentStatusPreference: 'regular',
      relocationWillingness: 'na',
      motivationAnswer: 'I want to work with a company that values quality and continuous improvement.',
      conflictResolutionAnswer: 'I believe in open communication and addressing issues early before they escalate.',
      careerAlignmentAnswer: 'I aim to become a QA Manager and lead larger testing initiatives.',
      administrativeNotes: 'Professional and well-prepared for the interview',
      communicationScore: 5,
      culturalFitScore: 4,
      engagementScore: 5,
      communicationNotes: 'Very articulate and passionate about quality',
      verdict: 'proceed-to-tech',
      verdictRationale: 'Excellent candidate with strong banking domain experience. Highly recommended.'
    },
    techInterviewForm: {
      interviewerName: 'Mark Santos',
      interviewDate: '2026-01-11',
      interviewMethod: 'virtual',
      technicalSkillsScore: 4,
      problemSolvingScore: 5,
      systemDesignScore: 4,
      codingChallengeScore: 4,
      strengthAreas: 'Test automation frameworks, CI/CD integration, API testing',
      weaknessAreas: 'Performance testing tools could be improved',
      technicalNotes: 'Demonstrated strong understanding of test automation best practices',
      verdict: 'proceed-to-offer',
      verdictRationale: 'Strong technical skills with excellent problem-solving abilities. Ready for offer.'
    }
  },
  {
    id: 'c6',
    name: 'Robert Lim',
    email: 'robert.lim@email.com',
    phone: '+63 922 678 9012',
    linkedIn: 'linkedin.com/in/robertlim',
    matchScore: 94,
    pipelineStatus: 'new-match',
    statusChangedDate: '2026-01-21',
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
    keySkills: ['PMP', 'Agile', 'Scrum', 'Stakeholder Management'],
    appliedDate: '2026-01-06',
    timeline: [
      { id: 't6-1', fromStatus: 'applied', toStatus: 'new-match', date: '2026-01-21', durationDays: 15 }
    ],
    applicantType: 'external',
    workExperiences: [
      {
        company: 'Accenture Philippines',
        position: 'Senior Project Manager',
        startDate: '2020-01',
        endDate: 'Present',
        summary: 'Managing large-scale enterprise transformation projects',
        projects: ['Banking Core System Migration (₱50M budget)', 'Digital Transformation Initiative', 'Cloud Migration Program']
      },
      {
        company: 'PLDT',
        position: 'Project Manager',
        startDate: '2017-01',
        endDate: '2019-12',
        summary: 'Led telecom infrastructure and IT projects',
        projects: ['Network Modernization', 'ERP Implementation', 'Customer Portal Development']
      },
      {
        company: 'Independent Consultant',
        position: 'Project Management Consultant',
        startDate: '2016-01',
        endDate: '2016-12',
        summary: 'Provided PM consulting services to various clients',
        projects: ['PMO Setup', 'Process Improvement']
      }
    ],
    applicationHistory: []
  },
  {
    id: 'c7',
    name: 'Jennifer Garcia',
    email: 'jennifer.garcia@email.com',
    phone: '+63 923 789 0123',
    linkedIn: 'linkedin.com/in/jennifergarcia',
    matchScore: 89,
    pipelineStatus: 'rejected',
    statusChangedDate: '2026-01-10',
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
    keySkills: ['Scrum', 'Risk Management', 'Coordination'],
    appliedDate: '2025-12-28',
    timeline: [
      { id: 't7-1', fromStatus: 'applied', toStatus: 'new-match', date: '2026-01-02', durationDays: 5 },
      { id: 't7-2', fromStatus: 'new-match', toStatus: 'hr-interview', date: '2026-01-05', durationDays: 3 },
      { id: 't7-3', fromStatus: 'hr-interview', toStatus: 'rejected', date: '2026-01-10', durationDays: 5 }
    ],
    applicantType: 'external',
    workExperiences: [
      {
        company: 'Tech Company PH',
        position: 'Associate Project Manager',
        startDate: '2023-01',
        endDate: 'Present',
        summary: 'Managing small to medium-sized IT projects',
        projects: ['Website Redesign', 'CRM Implementation']
      },
      {
        company: 'Startup Inc',
        position: 'Project Coordinator',
        startDate: '2019-06',
        endDate: '2022-12',
        summary: 'Coordinated project activities and stakeholder communication',
        projects: ['Product Launch Coordination', 'Event Management']
      }
    ],
    applicationHistory: []
  },
  {
    id: 'c8',
    name: 'David Fernandez',
    email: 'david.fernandez@email.com',
    phone: '+63 924 890 1234',
    linkedIn: 'linkedin.com/in/davidfernandez',
    matchScore: 72,
    pipelineStatus: 'rejected',
    statusChangedDate: '2026-01-08',
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
      summary: 'David has Java fundamentals but lacks the senior-level experience and cloud skills required for this role.',
      strengths: [
        'Solid Java fundamentals',
        'Eager to learn and grow'
      ],
      weaknesses: [
        'Only 2 years experience vs 5 required',
        'No cloud or microservices experience'
      ]
    },
    workingConditions: '',
    remarks: 'Added to talent pool for junior positions',
    techNotes: '',
    employmentType: 'full-time',
    positionApplied: 'Senior Java Developer',
    expectedSalary: '₱60,000 - ₱80,000/month',
    earliestStartDate: '2026-02-01',
    currentOccupation: 'Junior Developer at startup',
    assignedJoId: 'jo1',
    educationalBackground: 'BS Computer Science, FEU, 2022',
    relevantWorkExperience: '2 years - Junior Java Development',
    keySkills: ['Java', 'SQL', 'Git'],
    appliedDate: '2025-12-20',
    timeline: [
      { id: 't8-1', fromStatus: 'applied', toStatus: 'new-match', date: '2026-01-02', durationDays: 13 },
      { id: 't8-2', fromStatus: 'new-match', toStatus: 'hr-interview', date: '2026-01-05', durationDays: 3 },
      { id: 't8-3', fromStatus: 'hr-interview', toStatus: 'rejected', date: '2026-01-08', durationDays: 3 }
    ],
    applicantType: 'external',
    workExperiences: [
      {
        company: 'Tech Startup',
        position: 'Junior Developer',
        startDate: '2022-06',
        endDate: 'Present',
        summary: 'Developing web applications using Java',
        projects: ['Internal Tools Development', 'Bug Fixes and Maintenance']
      }
    ],
    applicationHistory: []
  }
];

export const mockJobOrders: JobOrder[] = [
  {
    id: 'jo1',
    joNumber: 'JO-2024-001',
    title: 'Senior Java Developer',
    description: '<p><strong>Role Overview:</strong></p><p>We are seeking an experienced Senior Java Developer to join our banking technology team.</p><ul><li>Design and develop high-performance Java applications</li><li>Lead code reviews and mentor junior developers</li><li>Collaborate with architects on system design</li></ul><p><em>Must have AWS experience and be comfortable with agile methodologies.</em></p>',
    level: 'L4',
    quantity: 3,
    hiredCount: 0,
    requiredDate: '2026-03-01',
    createdDate: '2026-01-10',
    status: 'in-progress',
    candidateIds: ['c1', 'c2', 'c3', 'c8'],
    department: 'Engineering',
    employmentType: 'full-time',
    requestorName: 'James Lee'
  },
  {
    id: 'jo2',
    joNumber: 'JO-2024-002',
    title: 'QA Automation Engineer',
    description: '<p><strong>About the Role:</strong></p><p>Join our quality assurance team to build and maintain automated testing frameworks.</p><ol><li>Develop automated test scripts using Selenium/Cypress</li><li>Integrate tests with CI/CD pipelines</li><li>Perform API and performance testing</li></ol><p><strong>Requirements:</strong></p><ul><li>3+ years QA automation experience</li><li>Strong programming skills in Java or Python</li></ul>',
    level: 'L3',
    quantity: 2,
    hiredCount: 0,
    requiredDate: '2026-02-15',
    createdDate: '2026-01-08',
    status: 'in-progress',
    candidateIds: ['c4', 'c5'],
    department: 'Engineering',
    employmentType: 'full-time',
    requestorName: 'Sarah Chen'
  },
  {
    id: 'jo3',
    joNumber: 'JO-2024-003',
    title: 'IT Project Manager',
    description: '<p><strong>Position Summary:</strong></p><p>Lead and manage enterprise IT projects from inception to delivery.</p><ul><li>Manage project timelines, budgets, and resources</li><li>Coordinate with cross-functional teams</li><li>Report to executive stakeholders</li></ul><p><em>PMP certification preferred.</em></p>',
    level: 'L5',
    quantity: 1,
    hiredCount: 0,
    requiredDate: '2026-04-01',
    createdDate: '2026-01-05',
    status: 'in-progress',
    candidateIds: ['c6', 'c7'],
    department: 'Product',
    employmentType: 'full-time',
    requestorName: 'Michael Wong'
  }
];

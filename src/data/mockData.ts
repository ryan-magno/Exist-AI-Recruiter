export type PipelineStatus = 'hr_interview' | 'tech_interview' | 'offer' | 'hired' | 'rejected';
export type TechInterviewResult = 'pending' | 'pass' | 'fail' | 'conditional';
export type EmploymentType = 'full_time' | 'part_time' | 'contract';
export type Level = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type ApplicantType = 'internal' | 'external';
export type HRVerdict = 'pass' | 'fail' | 'conditional' | 'pending';
export type TechVerdict = 'pass' | 'fail' | 'conditional' | 'pending';
export type InterviewVerdict = 'pass' | 'fail' | 'conditional' | 'pending';

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
  duration?: string;
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
  noticePeriod: 'immediate' | '1-week' | '2-weeks' | '1-month' | '2-months-plus';
  expectedSalary: string;
  earliestStartDate: string;
  workSetupPreference: 'on-site' | 'hybrid' | 'remote' | 'flexible';
  employmentStatusPreference: 'regular' | 'contractual' | 'freelance' | 'part-time';
  relocationWillingness: 'yes' | 'no' | 'maybe' | 'na';
  motivationAnswer: string;
  conflictResolutionAnswer: string;
  careerAlignmentAnswer: string;
  administrativeNotes: string;
  communicationScore: number;
  culturalFitScore: number;
  engagementScore: number;
  communicationNotes: string;
  verdict: HRVerdict | '';
  verdictRationale: string;
}

export interface TechInterviewForm {
  interviewerName: string;
  interviewDate: string;
  interviewMethod: 'phone' | 'virtual' | 'in-person';
  technicalSkillsScore: number;
  problemSolvingScore: number;
  systemDesignScore: number;
  codingChallengeScore: number;
  strengthAreas: string;
  weaknessAreas: string;
  technicalNotes: string;
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
  currentPosition: string;
  currentCompany: string;
  assignedJoId?: string;
  applicationId?: string;
  educationalBackground: string;
  relevantWorkExperience: string;
  keySkills: string[];
  appliedDate: string;
  timeline: TimelineEntry[];
  applicantType: ApplicantType;
  workExperiences: WorkExperience[];
  applicationHistory: ApplicationHistory[];
  hrInterviewForm?: HRInterviewForm;
  techInterviewForm?: TechInterviewForm;
  processingStatus?: ProcessingStatus;
  processingBatchId?: string;
  offerStatus?: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  qualificationScore?: number;
  // New fields
  overallSummary?: string;
  strengths?: string[];
  weaknesses?: string[];
  internalUploadReason?: string;
  internalFromDate?: string;
  internalToDate?: string;
  googleDriveFileUrl?: string;
  googleDriveFileId?: string;
  preferredEmploymentType?: string;
  batchId?: string;
  batchCreatedAt?: string;
  positionsFitFor?: string[];
  education?: Array<{ degree: string; institution: string; year?: string }>;
  certifications?: Array<{ name: string; issuer?: string; year?: string }>;
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
  status: 'open' | 'closed' | 'on_hold' | 'pooling' | 'archived';
  candidateIds: string[];
  department: string;
  employmentType: EmploymentType;
  requestorName: string;
}

export const departmentOptions = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales',
  'Human Resources', 'Finance', 'Operations', 'Customer Support', 'Data Science', 'IT Infrastructure'
];

export const employmentTypeLabels: Record<EmploymentType, string> = {
  'full_time': 'Full Time',
  'part_time': 'Part Time',
  'contract': 'Contract'
};

export const levelLabels: Record<Level, string> = {
  'L1': 'L1 - Entry', 'L2': 'L2 - Junior', 'L3': 'L3 - Mid', 'L4': 'L4 - Senior', 'L5': 'L5 - Lead'
};

export const techInterviewLabels: Record<TechInterviewResult, string> = {
  'pending': 'Pending', 'pass': 'Pass', 'fail': 'Fail', 'conditional': 'Conditional'
};

export const techInterviewColors: Record<TechInterviewResult, string> = {
  'pending': 'bg-gray-100 text-gray-700 border-gray-300',
  'pass': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'fail': 'bg-red-100 text-red-800 border-red-300',
  'conditional': 'bg-amber-100 text-amber-800 border-amber-300'
};

export const pipelineStatusLabels: Record<PipelineStatus, string> = {
  'hr_interview': 'For HR Interview',
  'tech_interview': 'For Tech Interview',
  'offer': 'Offer',
  'hired': 'Hired',
  'rejected': 'Rejected'
};

export const pipelineStatusColors: Record<PipelineStatus, string> = {
  'hr_interview': 'bg-sky-100 text-sky-700 border-sky-300',
  'tech_interview': 'bg-violet-100 text-violet-700 border-violet-300',
  'offer': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'hired': 'bg-green-100 text-green-700 border-green-300',
  'rejected': 'bg-red-100 text-red-700 border-red-300'
};

export const joStatusLabels: Record<JobOrder['status'], string> = {
  'open': 'Open',
  'closed': 'Closed',
  'on_hold': 'On Hold',
  'pooling': 'Pooling',
  'archived': 'Archived'
};

export const hrVerdictLabels: Record<string, string> = {
  'pass': 'Pass - Proceed to Tech',
  'fail': 'Fail - Reject',
  'pending': 'Pending'
};

export const techVerdictLabels: Record<string, string> = {
  'pass': 'Pass - Proceed to Offer',
  'fail': 'Fail - Reject',
  'pending': 'Pending'
};

export const mockCandidates: Candidate[] = [];
export const mockJobOrders: JobOrder[] = [];

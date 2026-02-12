import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Download, Sparkles, ExternalLink, FileText, Briefcase, Calendar, DollarSign, User, Code, GraduationCap, Clock, Target, History, UserCheck, Building, Tag, FileCheck, Award, AlertTriangle, CheckCircle2, Share2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Candidate, pipelineStatusLabels, pipelineStatusColors, PipelineStatus, techInterviewLabels, techInterviewColors, TechInterviewResult, WorkExperience } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { EmailModal } from '@/components/modals/EmailModal';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { HRInterviewFormTab } from '@/components/candidate/HRInterviewFormTab';
import existLogo from '@/assets/exist-logo.png';
import { TechInterviewFormTab } from '@/components/candidate/TechInterviewFormTab';
import { OfferFormTab } from '@/components/candidate/OfferFormTab';
import { ApplicationHistoryTab } from '@/components/candidate/ApplicationHistoryTab';
import { MatchScoreRing } from '@/components/candidate/MatchScoreRing';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { azureDb } from '@/lib/azureDb';

interface CandidateProfileViewProps {
  candidate: Candidate;
  onBack: () => void;
}

export function CandidateProfileView({ candidate, onBack }: CandidateProfileViewProps) {
  const { updateCandidatePipelineStatus, candidates } = useApp();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [hasPlayedAnimation, setHasPlayedAnimation] = useState(false);
  const [fullData, setFullData] = useState<any>(null);

  const currentCandidate = candidates.find(c => c.id === candidate.id) || candidate;

  useEffect(() => {
    azureDb.candidates.getFull(candidate.id).then(data => {
      if (data) setFullData(data);
    }).catch(err => console.error('Error loading full candidate data:', err));
  }, [candidate.id]);

  const getFormAction = () => {
    switch (currentCandidate.pipelineStatus) {
      case 'hr_interview': return { label: 'Open HR Form', tab: 'hr-form' };
      case 'tech_interview': return { label: 'Open Tech Form', tab: 'tech-form' };
      case 'offer': return { label: 'Open Offer Form', tab: 'offer-form' };
      default: return null;
    }
  };

  const formAction = getFormAction();

  const handleDownloadCV = () => {
    if (currentCandidate.googleDriveFileUrl) {
      window.open(currentCandidate.googleDriveFileUrl, '_blank');
    } else {
      toast.info('No CV file available for download');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'cv', label: 'CV', icon: FileText },
    { id: 'history', label: 'History', icon: History },
    { id: 'hr-form', label: 'HR Form', icon: UserCheck },
    { id: 'tech-form', label: 'Tech Form', icon: Code },
    { id: 'offer-form', label: 'Offer', icon: FileCheck },
  ];

  const score = currentCandidate.qualificationScore ?? currentCandidate.matchScore;

  return (
    <>
      <div className="h-full flex flex-col bg-card">
        {/* ── STICKY HEADER ── */}
        <header className="sticky top-0 z-10 bg-card border-b border-border mt-3">
          <div className="h-20 px-4 flex items-center justify-between gap-4">
            {/* Left: Back + Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={onBack}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors flex-shrink-0"
                title="Back"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="min-w-0">
                {/* Line 1: Name + Score Ring + Source */}
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-lg font-semibold text-foreground truncate">{currentCandidate.name}</h2>
                  {score != null && <MatchScoreRing score={score} size={36} strokeWidth={3} />}
                  {currentCandidate.applicantType === 'internal' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-green-600 bg-green-50 flex-shrink-0">
                      <img src={existLogo} alt="Internal" className="w-4 h-4 object-contain" />
                      Internal
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 flex-shrink-0">
                      <Tag className="w-2.5 h-2.5 mr-0.5" />
                      External
                    </span>
                  )}
                </div>
                {/* Line 2: Role @ Company • Experience */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {currentCandidate.currentPosition && (
                    <>
                      <span>{currentCandidate.currentPosition}</span>
                      {currentCandidate.currentCompany && (
                        <>
                          <span>@</span>
                          <span className="font-medium text-foreground">{currentCandidate.currentCompany}</span>
                        </>
                      )}
                      <span className="text-border">•</span>
                    </>
                  )}
                  <span>{currentCandidate.experienceDetails?.totalYears || 0} yr exp</span>
                </div>
                {/* Line 3: Phone & Email (click to copy) */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  {currentCandidate.phone && (
                    <button
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                      onClick={() => { navigator.clipboard.writeText(currentCandidate.phone); toast.success('Phone copied'); }}
                      title="Click to copy phone"
                    >
                      <Phone className="w-3 h-3" />
                      {currentCandidate.phone}
                    </button>
                  )}
                  {currentCandidate.email && (
                    <button
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                      onClick={() => { navigator.clipboard.writeText(currentCandidate.email); toast.success('Email copied'); }}
                      title="Click to copy email"
                    >
                      <Mail className="w-3 h-3" />
                      {currentCandidate.email}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Read-only status badge */}
              <span className={cn("inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border", pipelineStatusColors[currentCandidate.pipelineStatus])}>
                {pipelineStatusLabels[currentCandidate.pipelineStatus]}
              </span>

              {formAction && (
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setActiveTab(formAction.tab)}
                >
                  {formAction.label}
                </Button>
              )}

              <button
                title="Send Email"
                aria-label="Send email to candidate"
                onClick={() => setShowEmailModal(true)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors"
              >
                <Mail className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                title="Download CV"
                aria-label="Download candidate CV"
                onClick={handleDownloadCV}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors"
              >
                <Download className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Tab Navigation - underline style */}
          <nav className="flex px-4 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors duration-150 border-b-2 -mb-px whitespace-nowrap',
                    activeTab === tab.id
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' && <ProfileTab candidate={currentCandidate} fullData={fullData} />}
          {activeTab === 'cv' && <CVPreview candidate={currentCandidate} />}
          {activeTab === 'history' && <ApplicationHistoryTab candidate={currentCandidate} />}
          {activeTab === 'hr-form' && <HRInterviewFormTab candidate={currentCandidate} />}
          {activeTab === 'tech-form' && <TechInterviewFormTab candidate={currentCandidate} />}
          {activeTab === 'offer-form' && <OfferFormTab candidate={currentCandidate} />}
        </div>
      </div>

      <EmailModal open={showEmailModal} onClose={() => setShowEmailModal(false)} candidate={currentCandidate} />
    </>
  );
}

// ── AI Key Insights (2-column) ──
function AIKeyInsights({ candidate }: { candidate: Candidate }) {
  const strengths = candidate.matchAnalysis?.strengths?.length > 0
    ? candidate.matchAnalysis.strengths
    : candidate.strengths || [];
  const risks = candidate.matchAnalysis?.weaknesses?.length > 0
    ? candidate.matchAnalysis.weaknesses
    : candidate.weaknesses || [];

  if (strengths.length === 0 && risks.length === 0) return null;

  return (
    <section className="mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-3">AI Key Insights</h3>
      <div className="grid grid-cols-2 gap-3">
        {strengths.length > 0 && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-md p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <h4 className="text-xs font-semibold text-green-900">Strengths</h4>
            </div>
            <ul className="space-y-1.5">
              {strengths.slice(0, 4).map((s: string, i: number) => (
                <li key={i} className="text-xs text-green-900 leading-relaxed">• {s}</li>
              ))}
            </ul>
          </div>
        )}
        {risks.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-md p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-semibold text-amber-900">Areas for Development</h4>
            </div>
            <ul className="space-y-1.5">
              {risks.slice(0, 4).map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-1 text-xs text-amber-900 leading-relaxed">
                  <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Skills Matrix ──
function SkillsSection({ candidate }: { candidate: Candidate }) {
  const skills = candidate.keySkills?.length > 0 ? candidate.keySkills : candidate.skills || [];
  if (skills.length === 0) return null;

  return (
    <section className="mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-3">Skills</h3>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill: string) => (
          <span key={skill} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
}

// ── Work Experience Timeline ──
function WorkExperienceTimeline({ experiences, totalYears }: { experiences: WorkExperience[]; totalYears: number }) {
  if (experiences.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Work Experience</h3>
        <span className="text-xs text-muted-foreground">{totalYears} years total</span>
      </div>

      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-1.5 bottom-0 w-0.5 bg-border" />

        {experiences.map((exp, index) => (
          <TimelineEntry key={index} experience={exp} isFirst={index === 0} />
        ))}
      </div>
    </section>
  );
}

function TimelineEntry({ experience, isFirst }: { experience: WorkExperience; isFirst: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative mb-4 last:mb-0">
      {/* Node */}
      <div className={cn(
        'absolute left-[-20px] w-2.5 h-2.5 rounded-full border-2 border-card',
        isFirst ? 'bg-primary' : 'bg-muted-foreground/40'
      )} />

      <div>
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div>
            <p className="text-sm font-semibold text-foreground">{experience.position}</p>
            <p className="text-sm font-medium text-primary">{experience.company}</p>
          </div>
          {experience.duration && (
            <span className="text-xs text-muted-foreground flex-shrink-0">{experience.duration}</span>
          )}
        </div>

        {experience.summary && (
          <>
            <p className={cn('text-xs text-muted-foreground leading-relaxed', !expanded && 'line-clamp-2')}>
              {experience.summary}
            </p>
            {experience.summary.length > 120 && (
              <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-primary hover:underline mt-0.5">
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </>
        )}

        {experience.projects && experience.projects.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {experience.projects.map((p, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">
                {p}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Education & Certs Compact ──
function EducationSection({ education, certifications, educationalBackground }: {
  education: any[];
  certifications: any[];
  educationalBackground?: string;
}) {
  return (
    <section className="mb-6">
      {(education.length > 0 || educationalBackground) && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Education</h3>
          </div>
          {education.length > 0 ? (
            <div className="space-y-1">
              {education.map((edu: any, i: number) => (
                <p key={i} className="text-xs text-foreground">
                  <span className="font-medium">{edu.degree}</span>
                  <span className="text-muted-foreground"> • {edu.institution}</span>
                  {edu.year && <span className="text-muted-foreground"> • {edu.year}</span>}
                </p>
              ))}
            </div>
          ) : educationalBackground ? (
            <p className="text-xs text-foreground">{educationalBackground}</p>
          ) : null}
        </div>
      )}

      {certifications.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Award className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Certifications</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {certifications.map((cert: any, i: number) => (
              <span key={i} className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-amber-50 border border-amber-200 text-amber-800">
                {cert.name}{cert.year ? ` • ${cert.year}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Application Metadata Grid ──
function ApplicationMetadata({ candidate }: { candidate: Candidate }) {
  const displayValue = (v: string | null | undefined) => v || 'Not provided';

  const items = [
    { label: 'Applied Date', value: candidate.appliedDate ? new Date(candidate.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not provided', icon: Calendar },
    { label: 'Position Applied', value: displayValue(candidate.positionApplied), icon: Briefcase },
    { label: 'Earliest Start Date', value: candidate.earliestStartDate ? new Date(candidate.earliestStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not provided', icon: Clock },
    { label: 'Employment Type', value: displayValue(formatEmploymentType(candidate.preferredEmploymentType || '')), icon: FileText },
    { label: 'Expected Salary', value: displayValue(candidate.expectedSalary), icon: DollarSign },
    { label: 'Current Company', value: displayValue(candidate.currentCompany), icon: Building },
  ];

  return (
    <section className="mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-3">Application Details</h3>
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {items.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                </div>
                <p className="text-xs font-medium text-foreground ml-[18px]">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Profile Tab ──
function ProfileTab({ candidate, fullData }: { candidate: Candidate; fullData: any }) {
  const education = fullData?.education || candidate.education || [];
  const certifications = fullData?.certifications || candidate.certifications || [];
  const workExperiences = fullData?.work_experiences || [];

  const mergedWorkExperiences = workExperiences.length > 0
    ? workExperiences.map((exp: any) => ({
        company: exp.company_name,
        position: exp.job_title,
        duration: exp.duration,
        summary: exp.description || '',
        projects: Array.isArray(exp.key_projects) ? exp.key_projects : [],
      }))
    : candidate.workExperiences || [];

  // Overall summary from match analysis
  const overallSummary = candidate.matchAnalysis?.summary || candidate.overallSummary;

  return (
    <div className="max-w-4xl">
      {/* Overall Summary */}
      {overallSummary && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Overall Summary</h3>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-foreground leading-relaxed">{overallSummary}</p>
          </div>
        </section>
      )}

      {/* AI Insights 2-column */}
      <AIKeyInsights candidate={candidate} />

      {/* Positions Fit For */}
      {candidate.positionsFitFor && candidate.positionsFitFor.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Qualified For</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {candidate.positionsFitFor.map((pos, i) => (
              <span key={i} className="px-2.5 py-1 bg-card rounded-md border text-xs font-medium text-foreground">
                {pos}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Internal Candidate */}
      {candidate.applicantType === 'internal' && (
        <section className="mb-6 bg-blue-50 rounded-lg p-3 border border-blue-200">
          <h4 className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
            <Building className="w-3.5 h-3.5" /> Internal Details
          </h4>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-blue-600 font-medium">Reason</span>
              <p className="text-foreground">{candidate.internalUploadReason || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">From</span>
              <p className="text-foreground">{candidate.internalFromDate ? new Date(candidate.internalFromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">To</span>
              <p className="text-foreground">{candidate.internalToDate ? new Date(candidate.internalToDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
            </div>
          </div>
        </section>
      )}

      {/* Skills */}
      <SkillsSection candidate={candidate} />

      {/* Application Metadata */}
      <ApplicationMetadata candidate={candidate} />

      {/* Education & Certs */}
      <EducationSection
        education={education}
        certifications={certifications}
        educationalBackground={candidate.educationalBackground}
      />

      {/* Work Experience Timeline */}
      <WorkExperienceTimeline
        experiences={mergedWorkExperiences}
        totalYears={candidate.experienceDetails?.totalYears || 0}
      />
    </div>
  );
}

function formatEmploymentType(value: string): string {
  const labels: Record<string, string> = {
    full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract',
    regular: 'Regular', 'project-based': 'Project-Based', consultant: 'Consultant',
  };
  return labels[value] || value || 'Not provided';
}

// ── Match Analysis ──
function MatchAnalysis({ candidate, isActive, hasPlayed, onAnimationComplete }: { candidate: Candidate; isActive: boolean; hasPlayed: boolean; onAnimationComplete: () => void }) {
  const [showContent, setShowContent] = useState(hasPlayed);

  useEffect(() => {
    if (isActive && !hasPlayed) {
      setShowContent(false);
      const timer = setTimeout(() => { setShowContent(true); onAnimationComplete(); }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, hasPlayed, onAnimationComplete]);

  const shouldAnimate = isActive && !hasPlayed;
  const strengths = candidate.matchAnalysis?.strengths?.length > 0 ? candidate.matchAnalysis.strengths : candidate.strengths || [];
  const weaknesses = candidate.matchAnalysis?.weaknesses?.length > 0 ? candidate.matchAnalysis.weaknesses : candidate.weaknesses || [];

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">AI Match Intelligence</h3>
        {candidate.qualificationScore != null && (
          <MatchScoreRing score={candidate.qualificationScore} size={36} strokeWidth={3} />
        )}
      </div>

      {/* Summary */}
      {(candidate.matchAnalysis?.summary || candidate.overallSummary) && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-sm text-blue-800 mb-2">Overall Summary</h4>
          {shouldAnimate && showContent ? (
            <TypewriterText text={candidate.matchAnalysis.summary || candidate.overallSummary || ''} delay={0} speed={15} />
          ) : (
            <p className="text-sm text-foreground">{candidate.matchAnalysis.summary || candidate.overallSummary}</p>
          )}
        </div>
      )}

      {/* Strengths & Weaknesses 2-column */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border-l-4 border-green-500 rounded-md p-3">
          <h4 className="text-xs font-semibold text-green-900 mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Strengths
          </h4>
          {strengths.length > 0 ? (
            <ul className="space-y-1.5">
              {strengths.map((s: string, i: number) => (
                <motion.li key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="text-xs text-green-900">
                  {shouldAnimate && showContent ? <TypewriterText text={`✓ ${s}`} delay={800 + i * 400} speed={20} /> : <span>✓ {s}</span>}
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">No data available</p>
          )}
        </div>
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-md p-3">
          <h4 className="text-xs font-semibold text-amber-900 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Areas to Consider
          </h4>
          {weaknesses.length > 0 ? (
            <ul className="space-y-1.5">
              {weaknesses.map((w: string, i: number) => (
                <motion.li key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (strengths.length + i) * 0.1 }} className="text-xs text-amber-900 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                  {shouldAnimate && showContent ? <TypewriterText text={w} delay={800 + (strengths.length + i) * 400} speed={20} /> : <span>{w}</span>}
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">No areas identified</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CV Preview ──
function CVPreview({ candidate }: { candidate: Candidate }) {
  if (candidate.googleDriveFileId) {
    return (
      <div className="w-full h-full min-h-[500px]">
        <iframe
          src={`https://drive.google.com/file/d/${candidate.googleDriveFileId}/preview`}
          title="CV Preview"
          width="100%"
          height="100%"
          className="border-none rounded-lg shadow-sm min-h-[500px]"
          allow="autoplay"
        />
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-lg border-2 border-dashed border-border p-8 flex flex-col items-center justify-center min-h-[300px]">
      <FileText className="w-12 h-12 text-muted-foreground mb-3" />
      <h3 className="font-semibold text-foreground mb-1">No CV Preview</h3>
      <p className="text-xs text-muted-foreground">{candidate.name.replace(' ', '_')}_CV.pdf</p>
      {candidate.googleDriveFileUrl && (
        <Button variant="outline" size="sm" className="mt-3 gap-1 text-xs" onClick={() => window.open(candidate.googleDriveFileUrl, '_blank')}>
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Drive
        </Button>
      )}
    </div>
  );
}

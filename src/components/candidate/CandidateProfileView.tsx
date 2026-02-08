import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, Linkedin, FileText, Sparkles, ExternalLink, Download, Briefcase, Calendar, DollarSign, User, Code, GraduationCap, Clock, Target, History, UserCheck, Building, Tag, FileCheck, Award, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Candidate, pipelineStatusLabels, pipelineStatusColors, PipelineStatus, techInterviewLabels, techInterviewColors, TechInterviewResult, mockJobOrders, WorkExperience } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { EmailModal } from '@/components/modals/EmailModal';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { HRInterviewFormTab } from '@/components/candidate/HRInterviewFormTab';
import { TechInterviewFormTab } from '@/components/candidate/TechInterviewFormTab';
import { OfferFormTab } from '@/components/candidate/OfferFormTab';
import { ApplicationHistoryTab } from '@/components/candidate/ApplicationHistoryTab';
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

  // Get the latest candidate data from context to reflect status changes
  const currentCandidate = candidates.find(c => c.id === candidate.id) || candidate;

  // Lazy-load full candidate data (education, certifications, work experience)
  useEffect(() => {
    azureDb.candidates.getFull(candidate.id).then(data => {
      if (data) setFullData(data);
    }).catch(err => console.error('Error loading full candidate data:', err));
  }, [candidate.id]);

  // Tech form only available from tech stage onwards
  const isTechStageOrBeyond = ['tech_interview', 'offer', 'hired'].includes(currentCandidate.pipelineStatus);
  const handleDownloadCV = () => {
    if (currentCandidate.googleDriveFileUrl) {
      window.open(currentCandidate.googleDriveFileUrl, '_blank');
    } else {
      toast.success('CV Download Started', {
        description: `${currentCandidate?.name.replace(' ', '_')}_CV.pdf`
      });
    }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-4 pb-0 flex-shrink-0 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{currentCandidate.name}</h2>
                {/* Applicant Type Badge */}
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1',
                  currentCandidate.applicantType === 'internal' 
                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                )}>
                  <Tag className="w-3 h-3" />
                  {currentCandidate.applicantType === 'internal' ? 'Internal' : 'External'}
                </span>
                {/* Qualification Score Badge */}
                <QualificationScoreBadge score={currentCandidate.qualificationScore} />
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                {currentCandidate.currentPosition && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" />
                    {currentCandidate.currentPosition}{currentCandidate.currentCompany ? ` at ${currentCandidate.currentCompany}` : ''}
                  </span>
                )}
                <a href={`mailto:${currentCandidate.email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  {currentCandidate.email}
                </a>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {currentCandidate.phone}
                </span>
                {currentCandidate.linkedIn && (
                  <a href={currentCandidate.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Linkedin className="w-3.5 h-3.5" />
                    LinkedIn
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Row with Actions */}
        <div className="flex items-end gap-3 px-4 py-3 border-b flex-wrap flex-shrink-0">
          <div className="min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <Select
              value={currentCandidate.pipelineStatus}
              onValueChange={(value) => updateCandidatePipelineStatus(currentCandidate.id, value as PipelineStatus)}
            >
              <SelectTrigger className={cn("h-9 text-sm border", pipelineStatusColors[currentCandidate.pipelineStatus])}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(pipelineStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">Tech Interview Result</label>
            <div className={cn(
              "h-9 px-3 flex items-center text-sm border rounded-md",
              techInterviewColors[currentCandidate.techInterviewResult]
            )}>
              {techInterviewLabels[currentCandidate.techInterviewResult]}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setShowEmailModal(true)}>
              <Mail className="w-4 h-4" />
              Email
            </Button>
            {currentCandidate.googleDriveFileUrl && (
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => window.open(currentCandidate.googleDriveFileUrl, '_blank')}>
                <ExternalLink className="w-4 h-4" />
                View in Drive
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleDownloadCV}>
              <Download className="w-4 h-4" />
              Download CV
            </Button>
          </div>
        </div>

        {/* Main Tabs - Two rows */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 pt-2 flex-shrink-0 space-y-1">
            {/* Row 1: Profile tabs */}
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="gap-1.5 text-xs">
                <User className="w-3.5 h-3.5" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Match
              </TabsTrigger>
              <TabsTrigger value="cv" className="gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5" />
                CV
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 text-xs">
                <History className="w-3.5 h-3.5" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Row 2: Interview form tabs */}
            <TabsList className={cn(
              "grid w-full",
              isTechStageOrBeyond ? "grid-cols-3" : "grid-cols-2"
            )}>
              <TabsTrigger value="hr-form" className="gap-1.5 text-xs">
                <UserCheck className="w-3.5 h-3.5" />
                HR Form
              </TabsTrigger>
              {isTechStageOrBeyond && (
                <TabsTrigger value="tech-form" className="gap-1.5 text-xs">
                  <Code className="w-3.5 h-3.5" />
                  Tech Form
                </TabsTrigger>
              )}
              <TabsTrigger value="offer-form" className="gap-1.5 text-xs">
                <FileCheck className="w-3.5 h-3.5" />
                Offer Form
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto p-4 pb-8">
            <TabsContent value="profile" className="m-0 h-full">
              <ProfileTab candidate={currentCandidate} fullData={fullData} />
            </TabsContent>

            <TabsContent value="analysis" className="m-0 h-full">
              <MatchAnalysis 
                candidate={currentCandidate} 
                isActive={activeTab === 'analysis'} 
                hasPlayed={hasPlayedAnimation}
                onAnimationComplete={() => setHasPlayedAnimation(true)}
              />
            </TabsContent>

            <TabsContent value="cv" className="m-0 h-full pb-4">
              <CVPreview candidate={currentCandidate} />
            </TabsContent>

            <TabsContent value="history" className="m-0 h-full">
              <ApplicationHistoryTab candidate={currentCandidate} />
            </TabsContent>

            <TabsContent value="hr-form" className="m-0 h-full">
              <HRInterviewFormTab candidate={currentCandidate} />
            </TabsContent>

            {isTechStageOrBeyond && (
              <TabsContent value="tech-form" className="m-0 h-full">
                <TechInterviewFormTab candidate={currentCandidate} />
              </TabsContent>
            )}

            <TabsContent value="offer-form" className="m-0 h-full">
              <OfferFormTab candidate={currentCandidate} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <EmailModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        candidate={currentCandidate}
      />
    </>
  );
}

function QualificationScoreBadge({ score }: { score?: number }) {
  if (score == null) return null;
  const color = score >= 80 
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
    : score >= 60 
      ? 'bg-amber-100 text-amber-800 border-amber-300' 
      : 'bg-red-100 text-red-800 border-red-300';
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border', color)}>
      {score}/100
    </span>
  );
}

function ProfileTab({ candidate, fullData }: { candidate: Candidate; fullData: any }) {
  const displayValue = (value: string | null | undefined) => value || 'Not provided';

  const education = fullData?.education || candidate.education || [];
  const certifications = fullData?.certifications || candidate.certifications || [];
  const workExperiences = fullData?.work_experiences || [];

  // Merge work experiences: prefer fullData (from DB with key_projects), fall back to candidate.workExperiences
  const mergedWorkExperiences = workExperiences.length > 0 
    ? workExperiences.map((exp: any) => ({
        company: exp.company_name,
        position: exp.job_title,
        duration: exp.duration,
        summary: exp.description || '',
        projects: Array.isArray(exp.key_projects) ? exp.key_projects : [],
      }))
    : candidate.workExperiences || [];

  return (
    <div className="space-y-4">
      {/* AI Overall Summary */}
      {candidate.overallSummary && (
        <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
          <div className="flex items-center gap-2 text-sky-700 mb-2">
            <Sparkles className="w-4 h-4" />
            <h4 className="font-semibold text-sm">AI Evaluation Summary</h4>
          </div>
          <p className="text-sm text-slate-700">{candidate.overallSummary}</p>
        </div>
      )}

      {/* Internal Candidate Section */}
      {candidate.applicantType === 'internal' && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <Shield className="w-4 h-4" />
            <h4 className="font-semibold text-sm">Internal Candidate Details</h4>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-blue-600 text-xs font-medium">Upload Reason</span>
              <p className="font-medium text-foreground">{displayValue(candidate.internalUploadReason)}</p>
            </div>
            <div>
              <span className="text-blue-600 text-xs font-medium">Available From</span>
              <p className="font-medium text-foreground">{candidate.internalFromDate ? new Date(candidate.internalFromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not specified'}</p>
            </div>
            <div>
              <span className="text-blue-600 text-xs font-medium">Available To</span>
              <p className="font-medium text-foreground">{candidate.internalToDate ? new Date(candidate.internalToDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not specified'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Positions Fit For */}
      {candidate.positionsFitFor && candidate.positionsFitFor.length > 0 && (
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Target className="w-5 h-5" />
            <h4 className="font-semibold">Qualified For</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {candidate.positionsFitFor.map((pos, idx) => (
              <span key={idx} className="px-3 py-1.5 bg-white rounded-lg border border-primary/10 text-sm font-medium text-foreground">
                {pos}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      {((candidate.strengths && candidate.strengths.length > 0) || (candidate.weaknesses && candidate.weaknesses.length > 0)) && (
        <div className="grid grid-cols-2 gap-3">
          {candidate.strengths && candidate.strengths.length > 0 && (
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <h4 className="font-semibold text-sm text-emerald-800 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {candidate.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {candidate.weaknesses && candidate.weaknesses.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <h4 className="font-semibold text-sm text-amber-800 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Areas for Development
              </h4>
              <ul className="space-y-1">
                {candidate.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                    <span className="text-amber-600 mt-0.5">⚠</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Applied Date</span>
          </div>
          <p className="font-semibold text-foreground">{candidate.appliedDate ? new Date(candidate.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not provided'}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs font-medium">Employment Type</span>
          </div>
          <p className={cn("font-semibold", candidate.employmentType ? "text-foreground" : "text-muted-foreground italic")}>
            {displayValue(candidate.employmentType)}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <User className="w-4 h-4" />
            <span className="text-xs font-medium">Position Applied</span>
          </div>
          <p className={cn("font-semibold", candidate.positionApplied ? "text-foreground" : "text-muted-foreground italic")}>
            {displayValue(candidate.positionApplied)}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Expected Salary</span>
          </div>
          <p className={cn("font-semibold", candidate.expectedSalary ? "text-foreground" : "text-muted-foreground italic")}>
            {displayValue(candidate.expectedSalary)}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Earliest Start Date</span>
          </div>
          <p className={cn("font-semibold", candidate.earliestStartDate ? "text-foreground" : "text-muted-foreground italic")}>
            {candidate.earliestStartDate ? new Date(candidate.earliestStartDate).toLocaleDateString() : 'Not provided'}
          </p>
        </div>
        {candidate.preferredEmploymentType && (
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <Briefcase className="w-4 h-4" />
              <span className="text-xs font-medium">Preferred Employment</span>
            </div>
            <p className="font-semibold text-foreground">
              {formatEmploymentType(candidate.preferredEmploymentType)}
            </p>
          </div>
        )}
      </div>

      {/* Education */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700 mb-1">
          <GraduationCap className="w-4 h-4" />
          <span className="text-xs font-medium">Educational Background</span>
        </div>
        {education.length > 0 ? (
          <div className="space-y-2 mt-2">
            {education.map((edu: any, idx: number) => (
              <div key={idx} className="bg-white rounded-lg p-2.5 border border-blue-100">
                <p className="font-medium text-foreground text-sm">{edu.degree}</p>
                <p className="text-xs text-muted-foreground">{edu.institution}{edu.year ? ` • ${edu.year}` : ''}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className={cn("font-medium", candidate.educationalBackground ? "text-foreground" : "text-muted-foreground italic")}>
            {displayValue(candidate.educationalBackground)}
          </p>
        )}
      </div>

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <Award className="w-4 h-4" />
            <span className="text-xs font-medium">Certifications</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert: any, idx: number) => (
              <span key={idx} className="px-2.5 py-1 bg-white rounded-lg border border-amber-200 text-xs font-medium text-foreground">
                {cert.name}{cert.issuer ? ` - ${cert.issuer}` : ''}{cert.year ? ` (${cert.year})` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Current Position & Company */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Building className="w-4 h-4" />
            <span className="text-xs font-medium">Current Position</span>
          </div>
          <p className={cn("font-semibold", candidate.currentPosition ? "text-foreground" : "text-muted-foreground italic")}>
            {displayValue(candidate.currentPosition)}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Building className="w-4 h-4" />
            <span className="text-xs font-medium">Current Company</span>
          </div>
          <p className={cn("font-semibold", candidate.currentCompany ? "text-foreground" : "text-muted-foreground italic")}>
            {displayValue(candidate.currentCompany)}
          </p>
        </div>
      </div>

      {/* Work Experience */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-5 h-5 text-violet-600" />
          <h4 className="font-semibold text-foreground">Work Experience</h4>
          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
            {candidate.experienceDetails?.totalYears || 0} years total
          </span>
        </div>
        <div className="space-y-3">
          {mergedWorkExperiences.length > 0 ? (
            mergedWorkExperiences.map((exp: WorkExperience, index: number) => (
              <WorkExperienceCard key={index} experience={exp} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No work experience provided</p>
          )}
        </div>
      </div>

      {/* Skills */}
      <div>
        <h4 className="font-semibold text-foreground mb-2 text-sm">Key Skills</h4>
        <div className="flex flex-wrap gap-2">
          {(candidate.keySkills || []).length > 0 ? (
            candidate.keySkills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 bg-primary/15 text-primary rounded-full text-sm font-medium border border-primary/30"
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No skills specified</p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatEmploymentType(value: string): string {
  const labels: Record<string, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
  };
  return labels[value] || value;
}

function WorkExperienceCard({ experience }: { experience: WorkExperience }) {
  return (
    <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-foreground">{experience.position}</p>
          <p className="text-sm text-violet-700">{experience.company}</p>
        </div>
        {experience.duration && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {experience.duration}
          </span>
        )}
      </div>
      {experience.summary && <p className="text-sm text-slate-700 mb-2">{experience.summary}</p>}
      {experience.projects && experience.projects.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-violet-700 mb-1">Key Projects:</p>
          <div className="flex flex-wrap gap-1.5">
            {experience.projects.map((project, idx) => (
              <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-violet-200">
                {project}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchAnalysis({ candidate, isActive, hasPlayed, onAnimationComplete }: { candidate: Candidate; isActive: boolean; hasPlayed: boolean; onAnimationComplete: () => void }) {
  const [showContent, setShowContent] = useState(hasPlayed);

  useEffect(() => {
    if (isActive && !hasPlayed) {
      setShowContent(false);
      const timer = setTimeout(() => {
        setShowContent(true);
        onAnimationComplete();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, hasPlayed, onAnimationComplete]);

  const shouldAnimate = isActive && !hasPlayed;

  return (
    <div className="space-y-4">
      {/* Qualification Score */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">AI Match Intelligence</h3>
        <QualificationScoreBadge score={candidate.qualificationScore} />
      </div>

      {/* Overall Summary */}
      <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
        <h4 className="font-semibold text-sky-800 mb-2">Overall Summary</h4>
        {shouldAnimate && showContent ? (
          <TypewriterText text={candidate.matchAnalysis.summary || candidate.overallSummary || ''} delay={0} speed={15} />
        ) : (
          <p className="text-slate-700">{candidate.matchAnalysis.summary || candidate.overallSummary || 'No summary available'}</p>
        )}
      </div>

      {/* Strengths */}
      <div>
        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Strengths
        </h4>
        <div className="space-y-2 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
          {(candidate.matchAnalysis.strengths.length > 0 ? candidate.matchAnalysis.strengths : candidate.strengths || []).map((strength, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 text-slate-700"
            >
              <span className="text-emerald-600 mt-0.5">✓</span>
              {shouldAnimate && showContent ? (
                <TypewriterText text={strength} delay={800 + index * 400} speed={20} />
              ) : (
                <span>{strength}</span>
              )}
            </motion.div>
          ))}
          {candidate.matchAnalysis.strengths.length === 0 && (!candidate.strengths || candidate.strengths.length === 0) && (
            <p className="text-sm text-muted-foreground italic">No strengths data available</p>
          )}
        </div>
      </div>

      {/* Weaknesses */}
      <div>
        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Areas to Consider
        </h4>
        <div className="space-y-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
          {(candidate.matchAnalysis.weaknesses.length > 0 ? candidate.matchAnalysis.weaknesses : candidate.weaknesses || []).map((weakness, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (candidate.matchAnalysis.strengths.length + index) * 0.1 }}
              className="flex items-start gap-2 text-slate-700"
            >
              <span className="text-amber-600 mt-0.5">△</span>
              {shouldAnimate && showContent ? (
                <TypewriterText text={weakness} delay={800 + (candidate.matchAnalysis.strengths.length + index) * 400} speed={20} />
              ) : (
                <span>{weakness}</span>
              )}
            </motion.div>
          ))}
          {candidate.matchAnalysis.weaknesses.length === 0 && (!candidate.weaknesses || candidate.weaknesses.length === 0) && (
            <p className="text-sm text-muted-foreground italic">No areas for development identified</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CVPreview({ candidate }: { candidate: Candidate }) {
  // If Google Drive file is available, show embedded preview
  if (candidate.googleDriveFileId) {
    const embedUrl = `https://drive.google.com/file/d/${candidate.googleDriveFileId}/preview`;
    return (
      <div className="w-full h-full min-h-[500px]">
        <iframe
          src={embedUrl}
          title="CV Preview"
          width="100%"
          height="100%"
          className="border-none rounded-lg shadow-lg min-h-[500px]"
          allow="autoplay"
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 p-8 flex flex-col items-center justify-center h-full min-h-[300px]">
      <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center mb-3">
        <FileText className="w-7 h-7 text-slate-500" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">CV Document Preview</h3>
      <p className="text-sm text-slate-600 text-center">
        {candidate.name.replace(' ', '_')}_CV.pdf
      </p>
      <p className="text-xs text-slate-500 mt-1">
        No CV preview available
      </p>
      {candidate.googleDriveFileUrl && (
        <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => window.open(candidate.googleDriveFileUrl, '_blank')}>
          <ExternalLink className="w-4 h-4" />
          Open in Google Drive
        </Button>
      )}
    </div>
  );
}

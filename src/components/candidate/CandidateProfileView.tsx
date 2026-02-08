import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, Linkedin, FileText, Sparkles, ExternalLink, Download, Briefcase, Calendar, DollarSign, User, Code, GraduationCap, Clock, Target, History, UserCheck, Building, Tag, FileCheck } from 'lucide-react';
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

interface CandidateProfileViewProps {
  candidate: Candidate;
  onBack: () => void;
}

export function CandidateProfileView({ candidate, onBack }: CandidateProfileViewProps) {
  const { updateCandidatePipelineStatus, candidates } = useApp();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [hasPlayedAnimation, setHasPlayedAnimation] = useState(false);

  // Get the latest candidate data from context to reflect status changes
  const currentCandidate = candidates.find(c => c.id === candidate.id) || candidate;

  // Tech form only available from tech stage onwards
  const isTechStageOrBeyond = ['tech_interview', 'offer', 'hired'].includes(currentCandidate.pipelineStatus);
  const handleDownloadCV = () => {
    toast.success('CV Download Started', {
      description: `${currentCandidate?.name.replace(' ', '_')}_CV.pdf`
    });
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
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                <a href={`mailto:${currentCandidate.email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  {currentCandidate.email}
                </a>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {currentCandidate.phone}
                </span>
                <a href="#" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Linkedin className="w-3.5 h-3.5" />
                  LinkedIn
                  <ExternalLink className="w-3 h-3" />
                </a>
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
              <ProfileTab candidate={currentCandidate} />
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

function ProfileTab({ candidate }: { candidate: Candidate }) {
  // Get positions this candidate could fit based on their skills
  const getPositionsFitFor = () => {
    const matchingJobs = mockJobOrders
      .filter(jo => jo.status === 'open' || jo.status === 'pooling')
      .filter(jo => {
        const positionMatch = candidate.positionApplied?.toLowerCase().includes(jo.title.toLowerCase().split(' ')[0]);
        return positionMatch || jo.candidateIds.includes(candidate.id);
      })
      .map(jo => ({
        title: jo.title,
        department: jo.department,
        level: jo.level
      }));
    
    return matchingJobs.length > 0 ? matchingJobs : candidate.positionApplied ? [{ title: candidate.positionApplied, department: 'N/A', level: 'N/A' }] : [];
  };

  const positionsFit = getPositionsFitFor();

  // Helper to display field value or "Not provided"
  const displayValue = (value: string | null | undefined) => {
    return value || 'Not provided';
  };

  return (
    <div className="space-y-4">
      {/* Position/s Fit For */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-2 text-primary mb-3">
          <Target className="w-5 h-5" />
          <h4 className="font-semibold">Position/s Fit For</h4>
        </div>
        {positionsFit.length > 0 ? (
          <div className="space-y-2">
            {positionsFit.map((pos, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-primary/10">
                <div>
                  <p className="font-medium text-foreground">{pos.title}</p>
                  <p className="text-xs text-muted-foreground">{pos.department}</p>
                </div>
                {pos.level !== 'N/A' && (
                  <span className="text-xs font-medium px-2 py-1 bg-muted rounded">{pos.level}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No position specified</p>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Applied Date</span>
          </div>
          <p className="font-semibold text-foreground">{new Date(candidate.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
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
      </div>

      {/* Education */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700 mb-1">
          <GraduationCap className="w-4 h-4" />
          <span className="text-xs font-medium">Educational Background</span>
        </div>
        <p className={cn("font-medium", candidate.educationalBackground ? "text-foreground" : "text-muted-foreground italic")}>
          {displayValue(candidate.educationalBackground)}
        </p>
      </div>

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

      {/* Work Experience - ALL EXPERIENCE */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-5 h-5 text-violet-600" />
          <h4 className="font-semibold text-foreground">Work Experience</h4>
          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
            {candidate.experienceDetails?.totalYears || 0} years total
          </span>
        </div>
        <div className="space-y-3">
          {(candidate.workExperiences || []).length > 0 ? (
            candidate.workExperiences.map((exp, index) => (
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

function WorkExperienceCard({ experience }: { experience: WorkExperience }) {
  const formatDate = (dateString: string) => {
    if (dateString === 'Present') return 'Present';
    const [year, month] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

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
      <p className="text-sm text-slate-700 mb-2">{experience.summary}</p>
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
      {/* Match Score */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">AI Match Intelligence</h3>
        <span className="px-2.5 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          {candidate.matchScore}% Match
        </span>
      </div>

      {/* Overall Summary */}
      <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
        <h4 className="font-semibold text-sky-800 mb-2">Overall Summary</h4>
        {shouldAnimate && showContent ? (
          <TypewriterText text={candidate.matchAnalysis.summary} delay={0} speed={15} />
        ) : (
          <p className="text-slate-700">{candidate.matchAnalysis.summary}</p>
        )}
      </div>

      {/* Strengths */}
      <div>
        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Strengths
        </h4>
        <div className="space-y-2 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
          {candidate.matchAnalysis.strengths.map((strength, index) => (
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
        </div>
      </div>

      {/* Weaknesses */}
      <div>
        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Areas to Consider
        </h4>
        <div className="space-y-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
          {candidate.matchAnalysis.weaknesses.map((weakness, index) => (
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
        </div>
      </div>
    </div>
  );
}

function CVPreview({ candidate }: { candidate: Candidate }) {
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
        Rendering document preview...
      </p>
      <div className="mt-4 w-full max-w-md space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-2.5 bg-slate-200 rounded animate-pulse" style={{ width: `${100 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}

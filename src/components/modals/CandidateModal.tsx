import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Phone, Linkedin, FileText, Sparkles, MessageSquare, ExternalLink, Download, Briefcase, Calendar, DollarSign, User, Check, Loader2, Code, GraduationCap, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Candidate, pipelineStatusLabels, pipelineStatusColors, PipelineStatus, techInterviewLabels, techInterviewColors, TechInterviewResult, mockJobOrders } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { EmailModal } from './EmailModal';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CandidateModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  initialTab?: string;
}

export function CandidateModal({ candidate, onClose, initialTab = 'profile' }: CandidateModalProps) {
  const { updateCandidatePipelineStatus, updateCandidateTechInterviewResult, updateCandidateWorkingConditions, updateCandidateRemarks, updateCandidateTechNotes, candidates } = useApp();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [workingConditions, setWorkingConditions] = useState(candidate?.workingConditions || '');
  const [remarks, setRemarks] = useState(candidate?.remarks || '');
  const [techNotes, setTechNotes] = useState(candidate?.techNotes || '');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [hasPlayedAnimation, setHasPlayedAnimation] = useState(false);

  // Get the latest candidate data from context to reflect status changes
  const currentCandidate = candidate ? candidates.find(c => c.id === candidate.id) || candidate : null;

  useEffect(() => {
    if (candidate) {
      setWorkingConditions(candidate.workingConditions);
      setRemarks(candidate.remarks);
      setTechNotes(candidate.techNotes);
      setActiveTab(initialTab);
    }
  }, [candidate, initialTab]);

  const handleSaveNotes = () => {
    if (candidate) {
      updateCandidateWorkingConditions(candidate.id, workingConditions);
      updateCandidateRemarks(candidate.id, remarks);
      updateCandidateTechNotes(candidate.id, techNotes);
      toast.success('Notes saved');
    }
  };

  const handleDownloadCV = () => {
    toast.success('CV Download Started', {
      description: `${candidate?.name.replace(' ', '_')}_CV.pdf`
    });
  };

  if (!currentCandidate) return null;

  return (
    <>
      <Dialog open={!!candidate} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 p-4 pb-0">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold">{currentCandidate.name}</DialogTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1.5 flex-wrap">
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
          </DialogHeader>

          {/* Status Row with Actions */}
          <div className="flex items-end gap-3 px-4 py-3 border-b flex-wrap">
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
              <label className="text-xs text-muted-foreground mb-1 block">Tech Interview Status</label>
              <Select
                value={currentCandidate.techInterviewResult}
                onValueChange={(value) => updateCandidateTechInterviewResult(currentCandidate.id, value as TechInterviewResult)}
              >
                <SelectTrigger className={cn("h-9 text-sm border", techInterviewColors[currentCandidate.techInterviewResult])}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(techInterviewLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0 mx-4 mt-2" style={{width: 'calc(100% - 32px)'}}>
              <TabsTrigger value="profile" className="gap-1.5 text-sm">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-1.5 text-sm">
                <Sparkles className="w-4 h-4" />
                Match Intelligence
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1.5 text-sm">
                <MessageSquare className="w-4 h-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="cv" className="gap-1.5 text-sm">
                <FileText className="w-4 h-4" />
                CV Preview
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto p-4 pb-6">
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

              <TabsContent value="notes" className="m-0 h-full">
                <NotesTab 
                  workingConditions={workingConditions}
                  remarks={remarks}
                  techNotes={techNotes}
                  onWorkingConditionsChange={setWorkingConditions}
                  onRemarksChange={setRemarks}
                  onTechNotesChange={setTechNotes}
                  onSave={handleSaveNotes}
                />
              </TabsContent>

              <TabsContent value="cv" className="m-0 h-full pb-4">
                <CVPreview candidate={currentCandidate} />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

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
      .filter(jo => jo.status === 'in-progress' || jo.status === 'draft')
      .filter(jo => {
        // Simple matching based on skills and position applied
        const positionMatch = candidate.positionApplied.toLowerCase().includes(jo.title.toLowerCase().split(' ')[0]);
        return positionMatch || jo.candidateIds.includes(candidate.id);
      })
      .map(jo => ({
        title: jo.title,
        department: jo.department,
        level: jo.level
      }));
    
    return matchingJobs.length > 0 ? matchingJobs : [{ title: candidate.positionApplied, department: 'N/A', level: 'N/A' }];
  };

  const positionsFit = getPositionsFitFor();

  return (
    <div className="space-y-4">
      {/* Position/s Fit For */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-2 text-primary mb-3">
          <Target className="w-5 h-5" />
          <h4 className="font-semibold">Position/s Fit For</h4>
        </div>
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
          <p className="font-semibold text-foreground">{candidate.employmentType}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <User className="w-4 h-4" />
            <span className="text-xs font-medium">Position Applied</span>
          </div>
          <p className="font-semibold text-foreground">{candidate.positionApplied}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Expected Salary</span>
          </div>
          <p className="font-semibold text-foreground">{candidate.expectedSalary}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Earliest Start Date</span>
          </div>
          <p className="font-semibold text-foreground">{new Date(candidate.earliestStartDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Education & Work Experience */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span className="text-xs font-medium">Educational Background</span>
          </div>
          <p className="font-medium text-foreground">{candidate.educationalBackground}</p>
        </div>
        <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
          <div className="flex items-center gap-2 text-violet-700 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Relevant Work Experience</span>
          </div>
          <p className="font-medium text-foreground">{candidate.relevantWorkExperience}</p>
        </div>
      </div>

      {/* Current Occupation */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <div className="flex items-center gap-2 text-slate-600 mb-1">
          <Briefcase className="w-4 h-4" />
          <span className="text-xs font-medium">Current Occupation</span>
        </div>
        <p className="font-semibold text-foreground">{candidate.currentOccupation}</p>
      </div>

      {/* Experience */}
      <div>
        <h4 className="font-semibold text-foreground mb-2 text-sm">Experience Details</h4>
        <div className="bg-emerald-50 rounded-lg p-3 border-l-4 border-emerald-500">
          <p className="text-foreground font-semibold mb-1">
            Total: {candidate.experienceDetails.totalYears} years
          </p>
          <p className="text-sm text-slate-700">
            {candidate.experienceDetails.breakdown}
          </p>
        </div>
      </div>

      {/* Skills */}
      <div>
        <h4 className="font-semibold text-foreground mb-2 text-sm">Key Skills</h4>
        <div className="flex flex-wrap gap-2">
          {candidate.keySkills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1.5 bg-primary/15 text-primary rounded-full text-sm font-medium border border-primary/30"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
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

function NotesTab({ 
  workingConditions, 
  remarks, 
  techNotes, 
  onWorkingConditionsChange, 
  onRemarksChange,
  onTechNotesChange,
  onSave 
}: { 
  workingConditions: string; 
  remarks: string; 
  techNotes: string;
  onWorkingConditionsChange: (notes: string) => void;
  onRemarksChange: (notes: string) => void;
  onTechNotesChange: (notes: string) => void;
  onSave: () => void;
}) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setSaveStatus('saving');
    setTimeout(() => {
      onSave();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      {/* HR Notes Section */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-700" />
            <label className="font-semibold text-blue-800">HR Notes</label>
          </div>
          <SaveIndicator status={saveStatus} />
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-blue-700 mb-1 block">Working Conditions</label>
            <Textarea
              placeholder="Preferred working setup, schedule flexibility, location requirements..."
              rows={3}
              value={workingConditions}
              onChange={(e) => handleChange(onWorkingConditionsChange)(e.target.value)}
              className="resize-none bg-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-blue-700 mb-1 block">Remarks</label>
            <Textarea
              placeholder="General observations, interview notes, compensation discussions..."
              rows={3}
              value={remarks}
              onChange={(e) => handleChange(onRemarksChange)(e.target.value)}
              className="resize-none bg-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Technical Notes Section */}
      <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-violet-700" />
            <label className="font-semibold text-violet-800">Technical Interviewer Notes</label>
          </div>
        </div>
        <Textarea
          placeholder="Technical assessment results, coding challenge performance, system design discussions..."
          rows={4}
          value={techNotes}
          onChange={(e) => handleChange(onTechNotesChange)(e.target.value)}
          className="resize-none bg-white text-sm"
        />
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' }) {
  if (status === 'idle') return null;
  
  return (
    <span className={cn(
      "text-xs flex items-center gap-1 transition-opacity",
      status === 'saving' && 'text-slate-500',
      status === 'saved' && 'text-emerald-600'
    )}>
      {status === 'saving' && (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving...
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-3 h-3" />
          Saved
        </>
      )}
    </span>
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

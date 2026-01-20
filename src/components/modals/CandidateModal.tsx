import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Phone, Linkedin, FileText, Sparkles, MessageSquare, ExternalLink, Download, Briefcase, Calendar, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Candidate, pipelineStatusLabels, pipelineStatusColors, shortlistLabels, shortlistColors, PipelineStatus, ShortlistDecision } from '@/data/mockData';
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
  const { updateCandidatePipelineStatus, updateCandidateShortlistDecision, updateCandidateHrNotes, updateCandidateTechNotes } = useApp();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [hrNotes, setHrNotes] = useState(candidate?.hrNotes || '');
  const [techNotes, setTechNotes] = useState(candidate?.techNotes || '');
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (candidate) {
      setHrNotes(candidate.hrNotes);
      setTechNotes(candidate.techNotes);
      setActiveTab(initialTab);
    }
  }, [candidate, initialTab]);

  const handleSaveNotes = () => {
    if (candidate) {
      updateCandidateHrNotes(candidate.id, hrNotes);
      updateCandidateTechNotes(candidate.id, techNotes);
      toast.success('Notes saved');
    }
  };

  const handleDownloadCV = () => {
    toast.success('CV Download Started', {
      description: `${candidate?.name.replace(' ', '_')}_CV.pdf`
    });
  };

  if (!candidate) return null;

  return (
    <>
      <Dialog open={!!candidate} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">{candidate.name}</DialogTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <a href={`mailto:${candidate.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <Mail className="w-4 h-4" />
                    {candidate.email}
                  </a>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    {candidate.phone}
                  </span>
                  <a href="#" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadCV}>
                <Download className="w-4 h-4" />
                Download CV
              </Button>
            </div>
          </DialogHeader>

          {/* Status Dropdowns */}
          <div className="flex items-center gap-4 py-4 border-b">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Pipeline Status</label>
              <Select
                value={candidate.pipelineStatus}
                onValueChange={(value) => updateCandidatePipelineStatus(candidate.id, value as PipelineStatus)}
              >
                <SelectTrigger className={cn("w-full", pipelineStatusColors[candidate.pipelineStatus])}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(pipelineStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Shortlist Decision</label>
              <Select
                value={candidate.shortlistDecision}
                onValueChange={(value) => updateCandidateShortlistDecision(candidate.id, value as ShortlistDecision)}
              >
                <SelectTrigger className={cn("w-full", shortlistColors[candidate.shortlistDecision])}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(shortlistLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-2 self-end" onClick={() => setShowEmailModal(true)}>
              <Mail className="w-4 h-4" />
              Email
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Match Intelligence
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="cv" className="gap-2">
                <FileText className="w-4 h-4" />
                CV Preview
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="profile" className="m-0 h-full">
                <ProfileTab candidate={candidate} />
              </TabsContent>

              <TabsContent value="analysis" className="m-0">
                <MatchAnalysis candidate={candidate} isActive={activeTab === 'analysis'} />
              </TabsContent>

              <TabsContent value="notes" className="m-0">
                <NotesTab 
                  hrNotes={hrNotes}
                  techNotes={techNotes}
                  onHrNotesChange={setHrNotes}
                  onTechNotesChange={setTechNotes}
                  onSave={handleSaveNotes}
                />
              </TabsContent>

              <TabsContent value="cv" className="m-0 h-full">
                <CVPreview candidate={candidate} />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <EmailModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        candidate={candidate}
      />
    </>
  );
}

function ProfileTab({ candidate }: { candidate: Candidate }) {
  return (
    <div className="space-y-6">
      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs">Employment Type</span>
          </div>
          <p className="font-medium text-foreground">{candidate.employmentType}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <User className="w-4 h-4" />
            <span className="text-xs">Position Applied</span>
          </div>
          <p className="font-medium text-foreground">{candidate.positionApplied}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Expected Salary</span>
          </div>
          <p className="font-medium text-foreground">{candidate.expectedSalary}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Earliest Start Date</span>
          </div>
          <p className="font-medium text-foreground">{new Date(candidate.earliestStartDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Current Occupation */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Briefcase className="w-4 h-4" />
          <span className="text-xs">Current Occupation</span>
        </div>
        <p className="font-medium text-foreground">{candidate.currentOccupation}</p>
      </div>

      {/* Experience */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Experience</h4>
        <div className="bg-accent/30 rounded-lg p-4">
          <p className="text-foreground font-medium mb-2">
            Total: {candidate.experienceDetails.totalYears} years
          </p>
          <p className="text-sm text-muted-foreground">
            {candidate.experienceDetails.breakdown}
          </p>
        </div>
      </div>

      {/* Skills */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Skills</h4>
        <div className="flex flex-wrap gap-2">
          {candidate.skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchAnalysis({ candidate, isActive }: { candidate: Candidate; isActive: boolean }) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowContent(false);
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <div className="space-y-6">
      {/* Match Score */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">AI Match Intelligence</h3>
        <span className="status-badge match-score-high font-semibold">
          {candidate.matchScore}% Match
        </span>
      </div>

      {/* Overall Summary */}
      <div className="bg-accent/30 rounded-xl p-6">
        <h4 className="font-medium text-foreground mb-3">Overall Summary</h4>
        {showContent && isActive ? (
          <TypewriterText text={candidate.matchAnalysis.summary} delay={0} speed={15} />
        ) : (
          <p className="text-foreground">{candidate.matchAnalysis.summary}</p>
        )}
      </div>

      {/* Strengths */}
      <div>
        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Strengths
        </h4>
        <div className="space-y-2">
          {candidate.matchAnalysis.strengths.map((strength, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 text-foreground"
            >
              <span className="text-primary mt-1">✓</span>
              {showContent && isActive ? (
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
        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Areas to Consider
        </h4>
        <div className="space-y-2">
          {candidate.matchAnalysis.weaknesses.map((weakness, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (candidate.matchAnalysis.strengths.length + index) * 0.1 }}
              className="flex items-start gap-2 text-foreground"
            >
              <span className="text-amber-500 mt-1">△</span>
              {showContent && isActive ? (
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
  hrNotes, 
  techNotes, 
  onHrNotesChange, 
  onTechNotesChange,
  onSave 
}: { 
  hrNotes: string; 
  techNotes: string; 
  onHrNotesChange: (notes: string) => void;
  onTechNotesChange: (notes: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="font-medium text-foreground mb-2 block">HR Notes</label>
        <Textarea
          placeholder="Add HR interview notes, observations, and feedback..."
          rows={5}
          value={hrNotes}
          onChange={(e) => onHrNotesChange(e.target.value)}
          className="resize-none"
        />
      </div>
      <div>
        <label className="font-medium text-foreground mb-2 block">Technical Interviewer Notes</label>
        <Textarea
          placeholder="Add technical assessment notes, coding exercise feedback..."
          rows={5}
          value={techNotes}
          onChange={(e) => onTechNotesChange(e.target.value)}
          className="resize-none"
        />
      </div>
      <Button onClick={onSave}>Save Notes</Button>
    </div>
  );
}

function CVPreview({ candidate }: { candidate: Candidate }) {
  return (
    <div className="bg-muted/30 rounded-xl border-2 border-dashed border-muted p-8 flex flex-col items-center justify-center min-h-[300px]">
      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-2">CV Document Preview</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {candidate.name.replace(' ', '_')}_CV.pdf
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Rendering document preview...
      </p>
      <div className="mt-4 w-full max-w-md space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 bg-muted rounded animate-pulse" style={{ width: `${100 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}

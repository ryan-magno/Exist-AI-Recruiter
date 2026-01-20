import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, Linkedin, FileText, Sparkles, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Candidate, statusLabels } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { EmailModal } from './EmailModal';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { toast } from 'sonner';

interface CandidateModalProps {
  candidate: Candidate | null;
  onClose: () => void;
}

export function CandidateModal({ candidate, onClose }: CandidateModalProps) {
  const { updateCandidateStatus, updateCandidateNotes } = useApp();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [notes, setNotes] = useState(candidate?.notes || '');
  const [activeTab, setActiveTab] = useState('cv');

  useEffect(() => {
    if (candidate) {
      setNotes(candidate.notes);
      setActiveTab('cv');
    }
  }, [candidate]);

  const handleSaveNotes = () => {
    if (candidate) {
      updateCandidateNotes(candidate.id, notes);
      toast.success('Notes saved');
    }
  };

  if (!candidate) return null;

  return (
    <>
      <Dialog open={!!candidate} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
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
          </DialogHeader>

          <div className="flex items-center gap-4 py-4 border-b">
            <Select
              value={candidate.status}
              onValueChange={(value) => updateCandidateStatus(candidate.id, value as Candidate['status'])}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2" onClick={() => setShowEmailModal(true)}>
              <Mail className="w-4 h-4" />
              Email Candidate
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="cv" className="gap-2">
                <FileText className="w-4 h-4" />
                CV Preview
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Match Analysis
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="cv" className="m-0 h-full">
                <CVPreview candidate={candidate} />
              </TabsContent>

              <TabsContent value="analysis" className="m-0">
                <MatchAnalysis candidate={candidate} isActive={activeTab === 'analysis'} />
              </TabsContent>

              <TabsContent value="notes" className="m-0">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add notes about this candidate..."
                    rows={8}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <Button onClick={handleSaveNotes}>Save Notes</Button>
                </div>
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

function MatchAnalysis({ candidate, isActive }: { candidate: Candidate; isActive: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">AI Match Analysis</h3>
        <span className="status-badge match-score-high font-semibold">
          {candidate.matchScore}% Match
        </span>
      </div>

      <div className="bg-accent/30 rounded-xl p-6 space-y-3">
        {candidate.matchReasons.map((reason, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {isActive ? (
              <TypewriterText text={reason} delay={index * 600} />
            ) : (
              <p className="text-foreground">{reason}</p>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-6">
        <h4 className="font-medium text-foreground mb-3">Key Skills</h4>
        <div className="flex flex-wrap gap-2">
          {candidate.skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1.5 bg-muted rounded-full text-sm font-medium text-foreground"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

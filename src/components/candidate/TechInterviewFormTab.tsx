import { useState, useEffect } from 'react';
import { Code, User, Phone, Video, MapPin, Save, Star, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Candidate, TechInterviewForm, TechVerdict, techVerdictLabels } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TechInterviewFormTabProps {
  candidate: Candidate;
}

const emptyForm: TechInterviewForm = {
  interviewerName: '',
  interviewDate: '',
  interviewMethod: 'virtual',
  technicalSkillsScore: 3,
  problemSolvingScore: 3,
  systemDesignScore: 3,
  codingChallengeScore: 3,
  strengthAreas: '',
  weaknessAreas: '',
  technicalNotes: '',
  verdict: '',
  verdictRationale: ''
};

export function TechInterviewFormTab({ candidate }: TechInterviewFormTabProps) {
  const { updateCandidateTechForm, updateCandidatePipelineStatus, updateCandidateTechInterviewResult } = useApp();
  const [form, setForm] = useState<TechInterviewForm>(candidate.techInterviewForm || emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(candidate.techInterviewForm || emptyForm);
  }, [candidate.id]);

  const handleSave = () => {
    if (!form.interviewerName) {
      toast.error('Please enter the interviewer name');
      return;
    }
    
    setSaving(true);
    setTimeout(() => {
      updateCandidateTechForm(candidate.id, form);
      setSaving(false);
      setSaved(true);
      toast.success('Tech Interview form saved');
      
      // Auto-move based on verdict
      if (form.verdict === 'proceed-to-offer' && candidate.pipelineStatus === 'hr-interview') {
        updateCandidatePipelineStatus(candidate.id, 'offer');
        updateCandidateTechInterviewResult(candidate.id, 'pass');
        toast.success('Candidate moved to Offer stage');
      } else if (form.verdict === 'reject') {
        updateCandidatePipelineStatus(candidate.id, 'rejected');
        updateCandidateTechInterviewResult(candidate.id, 'fail');
        toast.info('Candidate marked as rejected');
      }
      
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  const updateField = <K extends keyof TechInterviewForm>(key: K, value: TechInterviewForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Selectable rating component with clickable buttons
  const RatingSelector = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              'w-8 h-8 rounded-md border-2 flex items-center justify-center transition-all font-semibold text-sm',
              i <= value 
                ? 'bg-violet-100 border-violet-400 text-violet-700' 
                : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:border-violet-300'
            )}
          >
            {i}
          </button>
        ))}
        <div className="flex items-center gap-0.5 ml-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Star 
              key={i} 
              className={cn(
                'w-4 h-4 transition-colors',
                i <= value ? 'fill-violet-400 text-violet-400' : 'text-muted-foreground'
              )} 
            />
          ))}
        </div>
      </div>
    </div>
  );

  const avgScore = ((form.technicalSkillsScore + form.problemSolvingScore + form.systemDesignScore + form.codingChallengeScore) / 4).toFixed(1);

  return (
    <div className="space-y-6 pb-6">
      {/* Interview Metadata */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Code className="w-4 h-4" />
          Tech Interview Metadata
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tech Interviewer Name *</Label>
            <Input 
              placeholder="Enter interviewer name"
              value={form.interviewerName}
              onChange={e => updateField('interviewerName', e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Interview Date</Label>
            <DatePickerField
              value={form.interviewDate}
              onChange={v => updateField('interviewDate', v)}
              placeholder="Select date"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Interview Method</Label>
            <Select value={form.interviewMethod} onValueChange={v => updateField('interviewMethod', v as TechInterviewForm['interviewMethod'])}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone"><Phone className="w-3 h-3 inline mr-2" />Phone</SelectItem>
                <SelectItem value="virtual"><Video className="w-3 h-3 inline mr-2" />Virtual Meet</SelectItem>
                <SelectItem value="in-person"><MapPin className="w-3 h-3 inline mr-2" />In-Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Technical Assessment Scores */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Star className="w-4 h-4" />
            Technical Assessment (1-5)
          </h4>
          <div className="text-sm font-bold text-violet-700 bg-violet-100 px-2 py-1 rounded">
            Avg: {avgScore}/5
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <RatingSelector 
            label="Technical Skills" 
            value={form.technicalSkillsScore} 
            onChange={v => updateField('technicalSkillsScore', v)} 
          />
          <RatingSelector 
            label="Problem Solving" 
            value={form.problemSolvingScore} 
            onChange={v => updateField('problemSolvingScore', v)} 
          />
          <RatingSelector 
            label="System Design" 
            value={form.systemDesignScore} 
            onChange={v => updateField('systemDesignScore', v)} 
          />
          <RatingSelector 
            label="Coding Challenge" 
            value={form.codingChallengeScore} 
            onChange={v => updateField('codingChallengeScore', v)} 
          />
        </div>
      </div>

      {/* Technical Areas */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <h4 className="font-semibold text-foreground mb-3">Technical Assessment Details</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Strength Areas</Label>
            <Textarea 
              placeholder="Technical areas where candidate excels..."
              value={form.strengthAreas}
              onChange={e => updateField('strengthAreas', e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Weakness Areas</Label>
            <Textarea 
              placeholder="Technical areas that need improvement..."
              value={form.weaknessAreas}
              onChange={e => updateField('weaknessAreas', e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Technical Notes</Label>
            <Textarea 
              placeholder="Detailed technical observations, coding quality, etc..."
              value={form.technicalNotes}
              onChange={e => updateField('technicalNotes', e.target.value)}
              rows={3}
              className="text-sm resize-none"
            />
          </div>
        </div>
      </div>

      {/* Final Tech Verdict */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Check className="w-4 h-4" />
          Final Tech Verdict
        </h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Technical Recommendation</Label>
            <Select value={form.verdict} onValueChange={v => updateField('verdict', v as TechVerdict)}>
              <SelectTrigger className={cn(
                "h-9 text-sm",
                form.verdict === 'proceed-to-offer' && 'border-emerald-500 bg-emerald-100',
                form.verdict === 'hold' && 'border-amber-500 bg-amber-100',
                form.verdict === 'reject' && 'border-red-500 bg-red-100'
              )}>
                <SelectValue placeholder="Select recommendation..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(techVerdictLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Rationale for Recommendation *</Label>
            <Textarea 
              placeholder="Provide reasoning for your recommendation..."
              value={form.verdictRationale}
              onChange={e => updateField('verdictRationale', e.target.value)}
              rows={3}
              className="text-sm resize-none"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Tech Form
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

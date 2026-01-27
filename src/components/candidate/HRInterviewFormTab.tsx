import { useState, useEffect } from 'react';
import { User, Calendar, Phone, Video, MapPin, DollarSign, Clock, Home, Briefcase, Globe, Save, Star, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Candidate, HRInterviewForm, HRVerdict, hrVerdictLabels } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HRInterviewFormTabProps {
  candidate: Candidate;
}

const emptyForm: HRInterviewForm = {
  interviewerName: '',
  interviewDate: '',
  interviewMethod: 'virtual',
  noticePeriod: 'immediate',
  expectedSalary: '',
  workSetupPreference: 'flexible',
  employmentStatusPreference: 'regular',
  relocationWillingness: 'na',
  motivationAnswer: '',
  conflictResolutionAnswer: '',
  careerAlignmentAnswer: '',
  administrativeNotes: '',
  communicationScore: 3,
  culturalFitScore: 3,
  engagementScore: 3,
  communicationNotes: '',
  verdict: '',
  verdictRationale: ''
};

export function HRInterviewFormTab({ candidate }: HRInterviewFormTabProps) {
  const { updateCandidateHRForm, updateCandidatePipelineStatus } = useApp();
  const [form, setForm] = useState<HRInterviewForm>(candidate.hrInterviewForm || emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(candidate.hrInterviewForm || emptyForm);
  }, [candidate.id]);

  const handleSave = () => {
    if (!form.interviewerName) {
      toast.error('Please enter the interviewer name');
      return;
    }
    
    setSaving(true);
    setTimeout(() => {
      updateCandidateHRForm(candidate.id, form);
      setSaving(false);
      setSaved(true);
      toast.success('HR Interview form saved');
      
      // Auto-move based on verdict
      if (form.verdict === 'proceed-to-tech' && candidate.pipelineStatus === 'new-match') {
        updateCandidatePipelineStatus(candidate.id, 'hr-interview');
        toast.success('Candidate moved to Tech Interview stage');
      } else if (form.verdict === 'reject') {
        updateCandidatePipelineStatus(candidate.id, 'rejected');
        toast.info('Candidate marked as rejected');
      }
      
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  const updateField = <K extends keyof HRInterviewForm>(key: K, value: HRInterviewForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const ScoreSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Star 
              key={i} 
              className={cn(
                'w-4 h-4 transition-colors',
                i <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
              )} 
            />
          ))}
        </div>
      </div>
      <Slider 
        value={[value]} 
        onValueChange={([v]) => onChange(v)} 
        min={1} 
        max={5} 
        step={1}
        className="w-full"
      />
    </div>
  );

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Interview Metadata */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          Interview Metadata
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-blue-700">HR Interviewer Name *</Label>
            <Input 
              placeholder="Enter interviewer name"
              value={form.interviewerName}
              onChange={e => updateField('interviewerName', e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-blue-700">Interview Date</Label>
            <Input 
              type="date"
              value={form.interviewDate}
              onChange={e => updateField('interviewDate', e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-blue-700">Interview Method</Label>
            <Select value={form.interviewMethod} onValueChange={v => updateField('interviewMethod', v as HRInterviewForm['interviewMethod'])}>
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

      {/* 2. Logistics & Expectations */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Logistics & Expectations
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Availability / Notice Period
            </Label>
            <Select value={form.noticePeriod} onValueChange={v => updateField('noticePeriod', v as HRInterviewForm['noticePeriod'])}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="1-week">1 week</SelectItem>
                <SelectItem value="2-weeks">2 weeks</SelectItem>
                <SelectItem value="1-month">1 month</SelectItem>
                <SelectItem value="2-months-plus">2+ months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Expected Salary / Rate
            </Label>
            <Input 
              placeholder="e.g., ₱150,000 - ₱180,000/month"
              value={form.expectedSalary}
              onChange={e => updateField('expectedSalary', e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 flex items-center gap-1">
              <Home className="w-3 h-3" />
              Work Setup Preference
            </Label>
            <Select value={form.workSetupPreference} onValueChange={v => updateField('workSetupPreference', v as HRInterviewForm['workSetupPreference'])}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on-site">On-site</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Employment Status Preference</Label>
            <Select value={form.employmentStatusPreference} onValueChange={v => updateField('employmentStatusPreference', v as HRInterviewForm['employmentStatusPreference'])}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="contractual">Contractual</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs text-slate-600 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Relocation Willingness
            </Label>
            <Select value={form.relocationWillingness} onValueChange={v => updateField('relocationWillingness', v as HRInterviewForm['relocationWillingness'])}>
              <SelectTrigger className="h-9 text-sm w-1/2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="maybe">Maybe</SelectItem>
                <SelectItem value="na">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 3. Behavioral & Qualitative Assessment */}
      <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
        <h4 className="font-semibold text-violet-800 mb-3">Behavioral & Qualitative Assessment</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-violet-700">Motivation: Why are you interested in this role and our company?</Label>
            <Textarea 
              placeholder="Capture candidate's response..."
              value={form.motivationAnswer}
              onChange={e => updateField('motivationAnswer', e.target.value)}
              rows={3}
              className="text-sm resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-violet-700">Conflict Resolution: Describe a challenging situation with a previous supervisor or teammate and how you resolved it.</Label>
            <Textarea 
              placeholder="Capture candidate's response..."
              value={form.conflictResolutionAnswer}
              onChange={e => updateField('conflictResolutionAnswer', e.target.value)}
              rows={3}
              className="text-sm resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-violet-700">Career Alignment: What are your long-term career goals, and how does this role fit into them?</Label>
            <Textarea 
              placeholder="Capture candidate's response..."
              value={form.careerAlignmentAnswer}
              onChange={e => updateField('careerAlignmentAnswer', e.target.value)}
              rows={3}
              className="text-sm resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-violet-700">Administrative Notes / Red Flags / Concerns</Label>
            <Textarea 
              placeholder="Any additional observations..."
              value={form.administrativeNotes}
              onChange={e => updateField('administrativeNotes', e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          </div>
        </div>
      </div>

      {/* 4. Competency & Culture Scoring */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
        <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" />
          Competency & Culture Scoring (1-5)
        </h4>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <ScoreSlider 
            label="Communication" 
            value={form.communicationScore} 
            onChange={v => updateField('communicationScore', v)} 
          />
          <ScoreSlider 
            label="Cultural Fit" 
            value={form.culturalFitScore} 
            onChange={v => updateField('culturalFitScore', v)} 
          />
          <ScoreSlider 
            label="Engagement" 
            value={form.engagementScore} 
            onChange={v => updateField('engagementScore', v)} 
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-amber-700">Communication Notes</Label>
          <Textarea 
            placeholder="Specific feedback on scores..."
            value={form.communicationNotes}
            onChange={e => updateField('communicationNotes', e.target.value)}
            rows={2}
            className="text-sm resize-none"
          />
        </div>
      </div>

      {/* 5. Final HR Verdict */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
        <h4 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
          <Check className="w-4 h-4" />
          Final HR Verdict
        </h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-emerald-700">Overall HR Recommendation</Label>
            <Select value={form.verdict} onValueChange={v => updateField('verdict', v as HRVerdict)}>
              <SelectTrigger className={cn(
                "h-9 text-sm",
                form.verdict === 'proceed-to-tech' && 'border-emerald-500 bg-emerald-100',
                form.verdict === 'hold' && 'border-amber-500 bg-amber-100',
                form.verdict === 'reject' && 'border-red-500 bg-red-100'
              )}>
                <SelectValue placeholder="Select recommendation..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(hrVerdictLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-emerald-700">Rationale for Recommendation *</Label>
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
              Save HR Form
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

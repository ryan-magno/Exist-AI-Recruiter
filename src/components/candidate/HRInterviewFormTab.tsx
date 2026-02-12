import { useState, useEffect } from 'react';
import { User, Phone, Video, MapPin, DollarSign, Clock, Home, Briefcase, Globe, Save, Star, Check, Loader2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Candidate, HRInterviewForm, HRVerdict, hrVerdictLabels } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { useHRInterview, useUpsertHRInterview } from '@/hooks/useInterviews';
import { azureDb } from '@/lib/azureDb';
import { logActivity } from '@/lib/activityLogger';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HRInterviewFormTabProps {
  candidate: Candidate;
}

const todayStr = () => new Date().toISOString().split('T')[0];

const emptyForm: HRInterviewForm = {
  interviewerName: '',
  interviewDate: todayStr(),
  interviewMethod: 'virtual',
  noticePeriod: 'immediate',
  expectedSalary: '',
  earliestStartDate: '',
  workSetupPreference: 'flexible',
  employmentStatusPreference: 'regular',
  relocationWillingness: 'na',
  motivationAnswer: '',
  conflictResolutionAnswer: '',
  careerAlignmentAnswer: '',
  administrativeNotes: '',
  communicationScore: 0,
  culturalFitScore: 0,
  engagementScore: 0,
  communicationNotes: '',
  verdict: '',
  verdictRationale: ''
};

export function HRInterviewFormTab({ candidate }: HRInterviewFormTabProps) {
  const { updateCandidateHRForm, updateCandidatePipelineStatus } = useApp();
  const applicationId = candidate.applicationId || null;
  const { data: existingInterview, isLoading: loadingInterview } = useHRInterview(applicationId);
  const upsertHRInterview = useUpsertHRInterview();

  const [form, setForm] = useState<HRInterviewForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isExistingRecord, setIsExistingRecord] = useState(false);

  // Load form data from DB or pre-fill from candidate
  useEffect(() => {
    if (loadingInterview) return;

    if (existingInterview) {
      setIsExistingRecord(true);
      setForm({
        interviewerName: existingInterview.interviewer_name || '',
        interviewDate: existingInterview.interview_date || todayStr(),
        interviewMethod: (existingInterview.interview_mode as any) || 'virtual',
        noticePeriod: (existingInterview.notice_period as any) || 'immediate',
        expectedSalary: existingInterview.expected_salary || '',
        earliestStartDate: existingInterview.earliest_start_date || candidate.earliestStartDate || '',
        workSetupPreference: (existingInterview.preferred_work_setup as any) || candidate.workSetupPreference || 'flexible',
        employmentStatusPreference: candidate.employmentStatusPreference || 'regular',
        relocationWillingness: candidate.relocationWillingness || 'na',
        motivationAnswer: '',
        conflictResolutionAnswer: '',
        careerAlignmentAnswer: '',
        administrativeNotes: '',
        communicationScore: existingInterview.communication_rating || 0,
        culturalFitScore: existingInterview.cultural_fit_rating || 0,
        engagementScore: existingInterview.motivation_rating || 0,
        communicationNotes: existingInterview.strengths || '',
        verdict: (existingInterview.verdict as HRVerdict) || '',
        verdictRationale: existingInterview.verdict_rationale || '',
      });
    } else {
      setIsExistingRecord(false);
      setForm({
        ...emptyForm,
        interviewDate: todayStr(),
        expectedSalary: candidate.expectedSalary || '',
        earliestStartDate: candidate.earliestStartDate || '',
        workSetupPreference: candidate.workSetupPreference || 'flexible',
        employmentStatusPreference: candidate.employmentStatusPreference || 'regular',
        relocationWillingness: candidate.relocationWillingness || 'na',
      });
    }
  }, [candidate.id, existingInterview, loadingInterview]);

  const handleSave = async () => {
    if (!form.interviewerName) {
      toast.error('Please enter the interviewer name');
      return;
    }
    if (!applicationId) {
      toast.error('No application found for this candidate');
      return;
    }

    setSaving(true);
    try {
      // Step 1: Save HR interview to database
      const hrData = {
        application_id: applicationId,
        candidate_id: candidate.id,
        interview_date: form.interviewDate || null,
        interviewer_name: form.interviewerName || null,
        interview_mode: form.interviewMethod || null,
        availability: null,
        expected_salary: form.expectedSalary || null,
        earliest_start_date: form.earliestStartDate || null,
        preferred_work_setup: form.workSetupPreference || null,
        notice_period: form.noticePeriod || null,
        communication_rating: form.communicationScore || null,
        motivation_rating: form.engagementScore || null,
        cultural_fit_rating: form.culturalFitScore || null,
        professionalism_rating: null,
        strengths: [form.communicationNotes, form.motivationAnswer, form.careerAlignmentAnswer].filter(Boolean).join('\n\n') || null,
        concerns: [form.conflictResolutionAnswer, form.administrativeNotes].filter(Boolean).join('\n\n') || null,
        verdict: form.verdict || null,
        verdict_rationale: form.verdictRationale || null,
      };

      await upsertHRInterview.mutateAsync(hrData as any);

      // Step 2: Sync fields to candidate profile (overwrite with HR form data)
      const candidateUpdates: Record<string, any> = {};
      if (form.expectedSalary) candidateUpdates.expected_salary = form.expectedSalary;
      if (form.earliestStartDate) candidateUpdates.earliest_start_date = form.earliestStartDate;
      if (form.workSetupPreference) candidateUpdates.preferred_work_setup = form.workSetupPreference;
      if (form.employmentStatusPreference) candidateUpdates.employment_status_preference = form.employmentStatusPreference;
      if (form.relocationWillingness) candidateUpdates.relocation_willingness = form.relocationWillingness;
      if (form.noticePeriod) candidateUpdates.notice_period = form.noticePeriod;

      if (Object.keys(candidateUpdates).length > 0) {
        await azureDb.candidates.update(candidate.id, candidateUpdates);
      }

      // Step 3: Log activity
      logActivity({
        activityType: isExistingRecord ? 'hr_interview_updated' : 'hr_interview_submitted',
        entityType: 'interview',
        entityId: applicationId,
        performedByName: form.interviewerName,
        details: {
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          application_id: applicationId,
          interview_date: form.interviewDate,
          verdict: form.verdict || null,
        }
      });

      // Step 4: Log profile changes for salary and start date
      if (form.expectedSalary && candidate.expectedSalary !== form.expectedSalary) {
        logActivity({
          activityType: 'profile_updated', entityType: 'candidate', entityId: candidate.id,
          performedByName: form.interviewerName,
          details: { candidate_name: candidate.name, field_changed: 'expected_salary', old_value: candidate.expectedSalary || 'Not set', new_value: form.expectedSalary, source: 'hr_interview' }
        });
      }
      if (form.earliestStartDate && candidate.earliestStartDate !== form.earliestStartDate) {
        logActivity({
          activityType: 'profile_updated', entityType: 'candidate', entityId: candidate.id,
          performedByName: form.interviewerName,
          details: { candidate_name: candidate.name, field_changed: 'earliest_start_date', old_value: candidate.earliestStartDate || 'Not set', new_value: form.earliestStartDate, source: 'hr_interview' }
        });
      }
      if (form.workSetupPreference && candidate.workSetupPreference !== form.workSetupPreference) {
        logActivity({
          activityType: 'profile_updated', entityType: 'candidate', entityId: candidate.id,
          performedByName: form.interviewerName,
          details: { candidate_name: candidate.name, field_changed: 'work_setup_preference', old_value: candidate.workSetupPreference || 'Not set', new_value: form.workSetupPreference, source: 'hr_interview' }
        });
      }
      if (form.employmentStatusPreference && candidate.employmentStatusPreference !== form.employmentStatusPreference) {
        logActivity({
          activityType: 'profile_updated', entityType: 'candidate', entityId: candidate.id,
          performedByName: form.interviewerName,
          details: { candidate_name: candidate.name, field_changed: 'employment_status_preference', old_value: candidate.employmentStatusPreference || 'Not set', new_value: form.employmentStatusPreference, source: 'hr_interview' }
        });
      }
      if (form.relocationWillingness && candidate.relocationWillingness !== form.relocationWillingness) {
        logActivity({
          activityType: 'profile_updated', entityType: 'candidate', entityId: candidate.id,
          performedByName: form.interviewerName,
          details: { candidate_name: candidate.name, field_changed: 'relocation_willingness', old_value: candidate.relocationWillingness || 'Not set', new_value: form.relocationWillingness, source: 'hr_interview' }
        });
      }

      // Step 5: Update local state
      updateCandidateHRForm(candidate.id, form);

      // Step 6: Auto-move based on verdict
      if (form.verdict === 'pass' && candidate.pipelineStatus === 'hr_interview') {
        updateCandidatePipelineStatus(candidate.id, 'tech_interview');
        toast.success('Candidate moved to Tech Interview stage');
      } else if (form.verdict === 'fail') {
        updateCandidatePipelineStatus(candidate.id, 'rejected');
        toast.info('Candidate marked as rejected');
      }

      setSaved(true);
      toast.success('HR Interview form saved');
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving HR form:', error);
      toast.error('Failed to save HR Interview form');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof HRInterviewForm>(key: K, value: HRInterviewForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const RatingSelector = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i === value ? 0 : i)}
            className={cn(
              'w-8 h-8 rounded-md border-2 flex items-center justify-center transition-all font-semibold text-sm',
              value > 0 && i <= value
                ? 'bg-amber-100 border-amber-400 text-amber-700'
                : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:border-amber-300'
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
                value > 0 && i <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (loadingInterview) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Interview Metadata */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          Interview Metadata
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">HR Interviewer Name *</Label>
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
            <Select value={form.interviewMethod} onValueChange={v => updateField('interviewMethod', v as HRInterviewForm['interviewMethod'])}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
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
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Logistics & Expectations
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Availability / Notice Period
            </Label>
            <Select value={form.noticePeriod} onValueChange={v => updateField('noticePeriod', v as HRInterviewForm['noticePeriod'])}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
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
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Expected Salary / Rate
            </Label>
            <Input
              placeholder="e.g., 30,000 - 40,000"
              value={form.expectedSalary}
              onChange={e => updateField('expectedSalary', e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              Earliest Start Date
            </Label>
            <DatePickerField
              value={form.earliestStartDate}
              onChange={v => updateField('earliestStartDate', v)}
              placeholder="Select earliest start date"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Home className="w-3 h-3" />
              Work Setup Preference
            </Label>
            <Select value={form.workSetupPreference} onValueChange={v => updateField('workSetupPreference', v as HRInterviewForm['workSetupPreference'])}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="on-site">On-site</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Employment Status Preference</Label>
            <Select value={form.employmentStatusPreference} onValueChange={v => updateField('employmentStatusPreference', v as HRInterviewForm['employmentStatusPreference'])}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="contractual">Contractual</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Relocation Willingness
            </Label>
            <Select value={form.relocationWillingness} onValueChange={v => updateField('relocationWillingness', v as HRInterviewForm['relocationWillingness'])}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
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
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <h4 className="font-semibold text-foreground mb-3">Behavioral & Qualitative Assessment</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Motivation: Why are you interested in this role and our company?</Label>
            <Textarea placeholder="Capture candidate's response..." value={form.motivationAnswer} onChange={e => updateField('motivationAnswer', e.target.value)} rows={3} className="text-sm resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Conflict Resolution: Describe a challenging situation with a previous supervisor or teammate and how you resolved it.</Label>
            <Textarea placeholder="Capture candidate's response..." value={form.conflictResolutionAnswer} onChange={e => updateField('conflictResolutionAnswer', e.target.value)} rows={3} className="text-sm resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Career Alignment: What are your long-term career goals, and how does this role fit into them?</Label>
            <Textarea placeholder="Capture candidate's response..." value={form.careerAlignmentAnswer} onChange={e => updateField('careerAlignmentAnswer', e.target.value)} rows={3} className="text-sm resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Administrative Notes / Red Flags / Concerns</Label>
            <Textarea placeholder="Any additional observations..." value={form.administrativeNotes} onChange={e => updateField('administrativeNotes', e.target.value)} rows={2} className="text-sm resize-none" />
          </div>
        </div>
      </div>

      {/* 4. Competency & Culture Scoring */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" />
          Competency & Culture Scoring (1-5)
        </h4>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <RatingSelector label="Communication" value={form.communicationScore} onChange={v => updateField('communicationScore', v)} />
          <RatingSelector label="Cultural Fit" value={form.culturalFitScore} onChange={v => updateField('culturalFitScore', v)} />
          <RatingSelector label="Engagement" value={form.engagementScore} onChange={v => updateField('engagementScore', v)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Communication Notes</Label>
          <Textarea placeholder="Specific feedback on scores..." value={form.communicationNotes} onChange={e => updateField('communicationNotes', e.target.value)} rows={2} className="text-sm resize-none" />
        </div>
      </div>

      {/* 5. Final HR Verdict */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Check className="w-4 h-4" />
          Final HR Verdict
        </h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Overall HR Recommendation</Label>
            <Select value={form.verdict} onValueChange={v => updateField('verdict', v as HRVerdict)}>
              <SelectTrigger className={cn(
                "h-9 text-sm",
                form.verdict === 'pass' && 'border-emerald-500 bg-emerald-100',
                form.verdict === 'fail' && 'border-red-500 bg-red-100'
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
            <Label className="text-xs text-muted-foreground">Rationale for Recommendation *</Label>
            <Textarea placeholder="Provide reasoning for your recommendation..." value={form.verdictRationale} onChange={e => updateField('verdictRationale', e.target.value)} rows={3} className="text-sm resize-none" />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
          ) : saved ? (
            <><Check className="w-4 h-4" />Saved!</>
          ) : (
            <><Save className="w-4 h-4" />Save HR Form</>
          )}
        </Button>
      </div>
    </div>
  );
}

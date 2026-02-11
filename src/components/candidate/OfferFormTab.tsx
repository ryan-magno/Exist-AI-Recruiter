import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, FileCheck, AlertCircle, DollarSign, Briefcase, Clock, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Candidate } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { useOffer, useUpsertOffer, OfferStatus as DBOfferStatus } from '@/hooks/useOffers';
import { logActivity } from '@/lib/activityLogger';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DatePickerField } from '@/components/ui/DatePickerField';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';

export interface OfferForm {
  offerDate: string;
  offerAmount: string;
  position: string;
  startDate: string;
  status: OfferStatus | '';
  remarks: string;
}

const offerStatusLabels: Record<OfferStatus, string> = {
  'pending': 'Pending Response',
  'accepted': 'Accepted',
  'rejected': 'Rejected',
  'withdrawn': 'Withdrawn',
  'expired': 'Expired'
};

const offerStatusColors: Record<OfferStatus | '', string> = {
  '': 'bg-slate-100 text-slate-600 border-slate-300',
  'pending': 'bg-amber-100 text-amber-700 border-amber-300',
  'accepted': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'rejected': 'bg-red-100 text-red-700 border-red-300',
  'withdrawn': 'bg-blue-100 text-blue-700 border-blue-300',
  'expired': 'bg-slate-100 text-slate-600 border-slate-300'
};

interface OfferFormTabProps {
  candidate: Candidate;
}

export function OfferFormTab({ candidate }: OfferFormTabProps) {
  const { candidates, updateCandidatePipelineStatus } = useApp();
  const currentCandidate = candidates.find(c => c.id === candidate.id) || candidate;
  
  const applicationId = (currentCandidate as any).applicationId;
  const { data: existingOffer, isLoading: isLoadingOffer } = useOffer(applicationId);
  const upsertOfferMutation = useUpsertOffer();
  
  const isOfferStage = currentCandidate.pipelineStatus === 'offer' || currentCandidate.pipelineStatus === 'hired';

  const [formData, setFormData] = useState<OfferForm>({
    offerDate: new Date().toISOString().split('T')[0],
    offerAmount: '',
    position: currentCandidate.positionApplied || '',
    startDate: '',
    status: '',
    remarks: '',
  });

  // Load existing offer data when available
  useEffect(() => {
    if (existingOffer) {
      setFormData({
        offerDate: existingOffer.offer_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        offerAmount: existingOffer.offer_amount || '',
        position: existingOffer.position || currentCandidate.positionApplied || '',
        startDate: existingOffer.start_date?.split('T')[0] || '',
        status: (existingOffer.status as OfferStatus) || '',
        remarks: existingOffer.remarks || '',
      });
    }
  }, [existingOffer, currentCandidate.positionApplied]);

  const handleSave = async () => {
    if (!applicationId) {
      toast.error('Cannot save: No application ID found');
      return;
    }
    
    const isCreating = !existingOffer;
    
    try {
      await upsertOfferMutation.mutateAsync({
        application_id: applicationId,
        candidate_id: currentCandidate.id,
        offer_date: formData.offerDate || null,
        offer_amount: formData.offerAmount || null,
        position: formData.position || null,
        start_date: formData.startDate || null,
        status: (formData.status || 'pending') as DBOfferStatus,
        remarks: formData.remarks || null,
      });
      
      // Log offer activity
      logActivity({
        activityType: isCreating ? 'offer_created' : 'offer_updated',
        entityType: 'offer',
        entityId: applicationId,
        details: {
          candidate_id: currentCandidate.id,
          candidate_name: currentCandidate.name,
          application_id: applicationId,
          offer_amount: formData.offerAmount || null,
          start_date: formData.startDate || null,
          status: formData.status || 'pending',
          ...(!isCreating && { new_status: formData.status }),
        }
      });
      
      // If offer is accepted, move to hired
      if (formData.status === 'accepted' && currentCandidate.pipelineStatus !== 'hired') {
        updateCandidatePipelineStatus(currentCandidate.id, 'hired');
        toast.success('Offer accepted! Candidate moved to Hired.');
      } else if (formData.status === 'rejected') {
        toast.success('Offer form saved. Candidate rejected the offer.');
      } else {
        toast.success('Offer form saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save offer form');
    }
  };

  if (!isOfferStage) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Not Yet at Offer Stage</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          This form will be available once the candidate reaches the Offer stage.
        </p>
      </div>
    );
  }

  if (isLoadingOffer) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading offer data...</span>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
      <div className="bg-card rounded-xl border p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-primary" />
          Offer Details
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              Offer Date
            </Label>
            <DatePickerField
              value={formData.offerDate}
              onChange={(v) => setFormData({ ...formData, offerDate: v })}
              placeholder="Select offer date"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Offer Amount
            </Label>
            <Input
              placeholder="e.g., 150,000/month"
              value={formData.offerAmount}
              onChange={(e) => setFormData({ ...formData, offerAmount: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              Position
            </Label>
            <Input
              placeholder="Position offered"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Start Date
            </Label>
            <DatePickerField
              value={formData.startDate}
              onChange={(v) => setFormData({ ...formData, startDate: v })}
              placeholder="Select start date"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Offer Status</Label>
            <Select
              value={formData.status || undefined}
              onValueChange={(value) => setFormData({ ...formData, status: value as OfferStatus })}
            >
              <SelectTrigger className={cn("border", formData.status && offerStatusColors[formData.status])}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(offerStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div className="bg-card rounded-xl border p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Remarks
        </h3>

        <div className="space-y-2">
          <Label className="text-sm">Remarks</Label>
          <Textarea
            placeholder="General remarks about the offer..."
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsertOfferMutation.isPending} className="gap-2">
          {upsertOfferMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Offer Form
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

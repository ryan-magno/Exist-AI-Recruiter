import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { usePoolCandidate } from '@/hooks/usePooledCandidates';
import { toast } from 'sonner';
import { Droplets, Loader2 } from 'lucide-react';

const POOL_REASONS = [
  'JO filled / Position closed',
  'Budget constraints',
  'Role requirements changed',
  'Candidate not ready now',
  'Good fit for future roles',
  'Organizational restructuring',
  'Other',
];

interface PoolCandidateModalProps {
  applicationId: string;
  candidateName: string;
  joTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PoolCandidateModal({ applicationId, candidateName, joTitle, open, onOpenChange }: PoolCandidateModalProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const poolMutation = usePoolCandidate();

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }
    try {
      await poolMutation.mutateAsync({
        applicationId,
        data: { pool_reason: reason, pool_notes: notes || undefined },
      });
      toast.success(`${candidateName} moved to talent pool`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to pool candidate');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-amber-600" />
            Move to Talent Pool
          </DialogTitle>
          <DialogDescription>
            Move <strong>{candidateName}</strong> from <strong>{joTitle}</strong> to the talent pool for future consideration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                {POOL_REASONS.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes about this candidate..."
              className="text-xs min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={poolMutation.isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={poolMutation.isPending || !reason}>
            {poolMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Droplets className="w-3.5 h-3.5 mr-1.5" />}
            Move to Pool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

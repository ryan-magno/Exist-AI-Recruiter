import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useActivatePooled } from '@/hooks/usePooledCandidates';
import { PooledCandidate } from '@/hooks/usePooledCandidates';
import { pipelineStatusLabels, PipelineStatus } from '@/data/mockData';
import { toast } from 'sonner';
import { UserPlus, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoveToActiveJOModalProps {
  pooledRecord: PooledCandidate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobOrders: Array<{ id: string; jo_number: string; title: string; department_name?: string; status: string }>;
}

export function MoveToActiveJOModal({ pooledRecord, open, onOpenChange, jobOrders }: MoveToActiveJOModalProps) {
  const [selectedJO, setSelectedJO] = useState('');
  const [targetStatus, setTargetStatus] = useState<string>('hr_interview');
  const [joSearch, setJoSearch] = useState('');
  const activateMutation = useActivatePooled();

  const filteredJOs = jobOrders.filter(jo => {
    if (!joSearch) return true;
    const q = joSearch.toLowerCase();
    return jo.jo_number.toLowerCase().includes(q) || jo.title.toLowerCase().includes(q) || (jo.department_name || '').toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    if (!selectedJO) {
      toast.error('Please select a job order');
      return;
    }
    try {
      await activateMutation.mutateAsync({
        pooledId: pooledRecord.id,
        data: { target_job_order_id: selectedJO, target_pipeline_status: targetStatus },
      });
      const jo = jobOrders.find(j => j.id === selectedJO);
      toast.success(`${pooledRecord.full_name} moved to ${jo?.jo_number || 'JO'} at ${pipelineStatusLabels[targetStatus as PipelineStatus] || targetStatus}`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate candidate');
    }
  };

  const selectedJOData = jobOrders.find(j => j.id === selectedJO);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            Move to Active Job Order
          </DialogTitle>
          <DialogDescription>
            Assign <strong>{pooledRecord.full_name}</strong> to an active job order. They were originally from{' '}
            <strong>{pooledRecord.original_jo_number} - {pooledRecord.original_jo_title}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* JO Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs">Target Job Order *</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search job orders..."
                value={joSearch}
                onChange={e => setJoSearch(e.target.value)}
                className="pl-8 h-8 text-xs mb-2"
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto border rounded-md">
              {filteredJOs.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 text-center">No matching job orders</p>
              ) : (
                filteredJOs.map(jo => (
                  <button
                    key={jo.id}
                    type="button"
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs hover:bg-muted/50 border-b last:border-b-0 transition-colors',
                      selectedJO === jo.id && 'bg-primary/10 border-primary/20'
                    )}
                    onClick={() => setSelectedJO(jo.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{jo.jo_number}</span>
                      <Badge variant="outline" className={cn('text-[10px] px-1 py-0',
                        jo.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      )}>
                        {jo.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground truncate">{jo.title}</p>
                    {jo.department_name && <p className="text-muted-foreground/70 text-[10px]">{jo.department_name}</p>}
                  </button>
                ))
              )}
            </div>
            {selectedJOData && (
              <p className="text-xs text-emerald-600 mt-1">Selected: {selectedJOData.jo_number} - {selectedJOData.title}</p>
            )}
          </div>

          {/* Target pipeline status */}
          <div className="space-y-1.5">
            <Label className="text-xs">Starting Pipeline Stage</Label>
            <Select value={targetStatus} onValueChange={setTargetStatus}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hr_interview">For HR Interview</SelectItem>
                <SelectItem value="tech_interview">For Tech Interview</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={activateMutation.isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={activateMutation.isPending || !selectedJO}>
            {activateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5 mr-1.5" />}
            Move to JO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

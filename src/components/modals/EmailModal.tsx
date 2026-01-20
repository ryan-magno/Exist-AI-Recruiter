import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Candidate } from '@/data/mockData';
import { toast } from 'sonner';

interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  candidate: Candidate;
}

export function EmailModal({ open, onClose, candidate }: EmailModalProps) {
  const [subject, setSubject] = useState(`Interview Invitation for Senior Java Developer Position`);
  const [body, setBody] = useState(`Dear ${candidate.name},

We were impressed with your profile and would like to invite you for an interview for the Senior Java Developer position at our company.

Your experience in ${candidate.skills.slice(0, 3).join(', ')} aligns well with what we're looking for.

Please let us know your availability for the coming week, and we'll schedule a convenient time for both of us.

Looking forward to hearing from you.

Best regards,
HR Team`);

  const handleSend = () => {
    toast.success('Email sent successfully', {
      description: `Interview invitation sent to ${candidate.name}`
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Compose Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>To</Label>
            <Input value={`${candidate.name} <${candidate.email}>`} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} className="gap-2">
            <Send className="w-4 h-4" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

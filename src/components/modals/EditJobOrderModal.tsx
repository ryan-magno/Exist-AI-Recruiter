import { useState, useEffect } from 'react';
import { Calendar, Briefcase, Users, Building, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { JobOrder, Level, EmploymentType, departmentOptions, levelLabels, employmentTypeLabels } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

interface EditJobOrderModalProps {
  jobOrder: JobOrder | null;
  open: boolean;
  onClose: () => void;
  onSave: (updatedJo: Partial<JobOrder>) => void;
}

export function EditJobOrderModal({ jobOrder, open, onClose, onSave }: EditJobOrderModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: '' as Level | '',
    quantity: 1,
    requiredDate: '',
    department: '',
    employmentType: '' as EmploymentType | '',
    requestorName: ''
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (jobOrder) {
      setFormData({
        title: jobOrder.title,
        description: jobOrder.description,
        level: jobOrder.level,
        quantity: jobOrder.quantity,
        requiredDate: jobOrder.requiredDate,
        department: jobOrder.department,
        employmentType: jobOrder.employmentType,
        requestorName: jobOrder.requestorName || ''
      });
      setErrors({});
    }
  }, [jobOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, boolean> = {};
    if (!formData.title) newErrors.title = true;
    if (!formData.description) newErrors.description = true;
    if (!formData.level) newErrors.level = true;
    if (!formData.requiredDate) newErrors.requiredDate = true;
    if (!formData.department) newErrors.department = true;
    if (!formData.employmentType) newErrors.employmentType = true;
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSave({
      title: formData.title,
      description: formData.description,
      level: formData.level as Level,
      quantity: formData.quantity,
      requiredDate: formData.requiredDate,
      department: formData.department,
      employmentType: formData.employmentType as EmploymentType,
      requestorName: formData.requestorName
    });

    toast.success('Job Order updated successfully');
    onClose();
  };

  if (!jobOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Edit Job Order - {jobOrder.joNumber}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Position Title */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              Position Title
            </Label>
            <Input
              placeholder="e.g., Senior Java Developer"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (e.target.value) setErrors(prev => ({ ...prev, title: false }));
              }}
              className={cn(errors.title && 'border-destructive focus-visible:ring-destructive')}
            />
          </div>

          {/* Requestor Name */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              Requestor Name
            </Label>
            <Input
              placeholder="e.g., John Smith"
              value={formData.requestorName}
              onChange={(e) => setFormData({ ...formData, requestorName: e.target.value })}
            />
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm">
              <Building className="w-4 h-4 text-muted-foreground" />
              Requesting Department
            </Label>
            <Select
              value={formData.department}
              onValueChange={(value) => {
                setFormData({ ...formData, department: value });
                setErrors(prev => ({ ...prev, department: false }));
              }}
            >
              <SelectTrigger className={cn(errors.department && 'border-destructive focus-visible:ring-destructive')}>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Description */}
          <div className="space-y-1.5">
            <Label className="text-sm">Job Description</Label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => {
                setFormData({ ...formData, description: value });
                if (value) setErrors(prev => ({ ...prev, description: false }));
              }}
              placeholder="Describe the role, responsibilities, and requirements..."
              error={errors.description}
              minHeight="150px"
            />
          </div>

          {/* Level, Employment Type, Quantity */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Level</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => {
                  setFormData({ ...formData, level: value as Level });
                  setErrors(prev => ({ ...prev, level: false }));
                }}
              >
                <SelectTrigger className={cn(errors.level && 'border-destructive focus-visible:ring-destructive')}>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(levelLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Employment Type</Label>
              <Select
                value={formData.employmentType}
                onValueChange={(value) => {
                  setFormData({ ...formData, employmentType: value as EmploymentType });
                  setErrors(prev => ({ ...prev, employmentType: false }));
                }}
              >
                <SelectTrigger className={cn(errors.employmentType && 'border-destructive focus-visible:ring-destructive')}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(employmentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                Quantity
              </Label>
              <Input
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          {/* Required Date */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Required Date
            </Label>
            <Input
              type="date"
              value={formData.requiredDate}
              onChange={(e) => {
                setFormData({ ...formData, requiredDate: e.target.value });
                if (e.target.value) setErrors(prev => ({ ...prev, requiredDate: false }));
              }}
              className={cn(errors.requiredDate && 'border-destructive focus-visible:ring-destructive')}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

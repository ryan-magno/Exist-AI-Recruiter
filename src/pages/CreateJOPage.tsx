import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FilePlus, Calendar, Hash, Briefcase, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

export default function CreateJOPage() {
  const navigate = useNavigate();
  const { addJobOrder, jobOrders } = useApp();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: '' as 'Junior' | 'Mid' | 'Senior' | 'Lead' | '',
    quantity: 1,
    requiredDate: ''
  });

  const nextJoNumber = `JO-2024-${String(jobOrders.length + 1).padStart(3, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.level || !formData.requiredDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    addJobOrder({
      title: formData.title,
      description: formData.description,
      level: formData.level as 'Junior' | 'Mid' | 'Senior' | 'Lead',
      quantity: formData.quantity,
      requiredDate: formData.requiredDate,
      status: 'draft'
    });

    toast.success('Job Order created successfully', {
      description: `${nextJoNumber} has been added to your dashboard.`
    });

    navigate('/dashboard');
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
              <FilePlus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Create Job Order
              </h1>
              <p className="text-muted-foreground">
                Define a new position to start matching candidates
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
            {/* JO Number (Auto) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                JO Number
              </Label>
              <Input
                value={nextJoNumber}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated based on sequence
              </p>
            </div>

            {/* Position Title */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                Position Title *
              </Label>
              <Input
                placeholder="e.g., Senior Java Developer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <Label>Job Description *</Label>
              <Textarea
                placeholder="Describe the role, responsibilities, and requirements..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Level and Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Level *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value as typeof formData.level })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Mid">Mid</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Quantity *
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
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Required Date *
              </Label>
              <Input
                type="date"
                value={formData.requiredDate}
                onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <FilePlus className="w-4 h-4" />
              Create Job Order
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

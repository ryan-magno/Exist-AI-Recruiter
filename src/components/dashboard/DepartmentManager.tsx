import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Loader2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, Department } from '@/hooks/useDepartments';
import { cn } from '@/lib/utils';

interface DepartmentManagerProps {
  onSelect?: (department: string) => void;
  selectedDepartment?: string;
}

export function DepartmentManager({ onSelect, selectedDepartment }: DepartmentManagerProps) {
  const [open, setOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const { data: departments = [], isLoading } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const handleCreate = async () => {
    if (!newDeptName.trim()) {
      toast.error('Please enter a department name');
      return;
    }
    
    try {
      await createDepartment.mutateAsync(newDeptName.trim());
      setNewDeptName('');
      toast.success('Department created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create department');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) {
      toast.error('Please enter a department name');
      return;
    }
    
    try {
      await updateDepartment.mutateAsync({ id, name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
      toast.success('Department updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update department');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      await deleteDepartment.mutateAsync(id);
      toast.success('Department deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete department');
    }
  };

  const startEditing = (dept: Department) => {
    setEditingId(dept.id);
    setEditingName(dept.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Building className="w-3.5 h-3.5" />
          Manage Departments
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            Manage Departments
          </DialogTitle>
        </DialogHeader>

        {/* Add new department */}
        <div className="flex gap-2">
          <Input
            placeholder="New department name..."
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button
            type="button"
            onClick={handleCreate}
            disabled={createDepartment.isPending || !newDeptName.trim()}
            size="sm"
            className="shrink-0"
          >
            {createDepartment.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Department list */}
        <div className="max-h-64 overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : departments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No departments yet. Add one above.
            </p>
          ) : (
            departments.map((dept) => (
              <div
                key={dept.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md border transition-colors",
                  selectedDepartment === dept.name && "bg-primary/10 border-primary"
                )}
              >
                {editingId === dept.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(dept.id);
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleUpdate(dept.id)}
                      disabled={updateDepartment.isPending}
                    >
                      {updateDepartment.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={cancelEditing}
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span
                      className="flex-1 text-sm cursor-pointer hover:text-primary"
                      onClick={() => {
                        onSelect?.(dept.name);
                        setOpen(false);
                      }}
                    >
                      {dept.name}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => startEditing(dept)}
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDelete(dept.id, dept.name)}
                      disabled={deleteDepartment.isPending}
                    >
                      {deleteDepartment.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

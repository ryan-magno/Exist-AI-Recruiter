import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FilePlus, Hash, Briefcase, Users, Building, User, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { Level, EmploymentType, levelLabels, employmentTypeLabels } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { useDepartmentNames } from "@/hooks/useDepartments";
import { useJobOrderCount, useCreateJobOrder, JobOrderInsert } from "@/hooks/useJobOrders";
import { DepartmentManager } from "@/components/dashboard/DepartmentManager";

const JOB_POSTING_SITES = [
  { id: "linkedin", name: "LinkedIn" },
  { id: "indeed", name: "Indeed" },
  { id: "jobstreet", name: "JobStreet" },
];

export default function CreateJOPage() {
  const navigate = useNavigate();
  const { data: departmentNames = [], isLoading: loadingDepartments } = useDepartmentNames();
  const { data: joCount = 0, isLoading: loadingCount } = useJobOrderCount();
  const createJobOrder = useCreateJobOrder();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "" as Level | "",
    quantity: 1 as number | '',
    requiredDate: "",
    department: "",
    employmentType: "" as EmploymentType | "",
    requestorName: "",
  });

  const [postingSites, setPostingSites] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const nextJoNumber = `JO-${new Date().getFullYear()}-${String(joCount + 1).padStart(3, "0")}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, boolean> = {};
    if (!formData.title) newErrors.title = true;
    if (!formData.description) newErrors.description = true;
    if (!formData.level) newErrors.level = true;
    if (!formData.requiredDate) newErrors.requiredDate = true;
    if (!formData.department) newErrors.department = true;
    if (!formData.employmentType) newErrors.employmentType = true;
    if (!formData.requestorName) newErrors.requestorName = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createJobOrder.mutateAsync({
        jo_number: nextJoNumber,
        title: formData.title,
        description: formData.description,
        level: formData.level as JobOrderInsert['level'],
        quantity: Number(formData.quantity) || 1,
        required_date: formData.requiredDate || null,
        status: "open",
        department_name: formData.department,
        employment_type: formData.employmentType as JobOrderInsert['employment_type'],
        requestor_name: formData.requestorName,
      });

      toast.success("Job Order created successfully", {
        description: `${nextJoNumber} has been added to your dashboard.`,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating job order:", error);
      toast.error("Failed to create job order");
    }
  };

  const isLoading = loadingDepartments || loadingCount;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <FilePlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create Job Order</h1>
              <p className="text-sm text-muted-foreground">Define a new position to start matching candidates</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-card rounded-xl border shadow-sm p-5 space-y-4">
            {/* JO Number (Auto) */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm">
                <Hash className="w-4 h-4 text-muted-foreground" />
                JO Number
              </Label>
              <Input value={isLoading ? "Loading..." : nextJoNumber} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Auto-generated</p>
            </div>

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
                  if (e.target.value) setErrors((prev) => ({ ...prev, title: false }));
                }}
                className={cn(errors.title && "border-destructive focus-visible:ring-destructive")}
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
                onChange={(e) => {
                  setFormData({ ...formData, requestorName: e.target.value });
                  if (e.target.value) setErrors((prev) => ({ ...prev, requestorName: false }));
                }}
                className={cn(errors.requestorName && "border-destructive focus-visible:ring-destructive")}
              />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  Requesting Department
                </Label>
                <DepartmentManager
                  selectedDepartment={formData.department}
                  onSelect={(dept) => {
                    setFormData({ ...formData, department: dept });
                    setErrors((prev) => ({ ...prev, department: false }));
                  }}
                />
              </div>
              <Select
                value={formData.department}
                onValueChange={(value) => {
                  setFormData({ ...formData, department: value });
                  setErrors((prev) => ({ ...prev, department: false }));
                }}
              >
                <SelectTrigger className={cn(errors.department && "border-destructive focus-visible:ring-destructive")}>
                  <SelectValue placeholder={loadingDepartments ? "Loading..." : "Select department"} />
                </SelectTrigger>
                <SelectContent>
                  {departmentNames.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
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
                  if (value) setErrors((prev) => ({ ...prev, description: false }));
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
                    setErrors((prev) => ({ ...prev, level: false }));
                  }}
                >
                  <SelectTrigger className={cn(errors.level && "border-destructive focus-visible:ring-destructive")}>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(levelLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
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
                    setErrors((prev) => ({ ...prev, employmentType: false }));
                  }}
                >
                  <SelectTrigger
                    className={cn(errors.employmentType && "border-destructive focus-visible:ring-destructive")}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(employmentTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
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
                  step={1}
                  value={formData.quantity}
                  onKeyDown={(e) => { if (['.', 'e', 'E', '-', '+'].includes(e.key)) e.preventDefault(); }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') { setFormData({ ...formData, quantity: '' }); return; }
                    const parsed = parseInt(raw, 10);
                    if (!isNaN(parsed) && parsed >= 0) setFormData({ ...formData, quantity: parsed });
                  }}
                  onBlur={() => { if (formData.quantity === '' || formData.quantity < 1) setFormData({ ...formData, quantity: 1 }); }}
                />
              </div>
            </div>

            {/* Job Posting Sites */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                Post To Job Sites
              </Label>
              <div className="flex flex-wrap gap-3">
                {JOB_POSTING_SITES.map((site) => (
                  <label
                    key={site.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                      postingSites.includes(site.id)
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted/50 border-border hover:border-primary/50",
                    )}
                  >
                    <Checkbox
                      checked={postingSites.includes(site.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setPostingSites([...postingSites, site.id]);
                        } else {
                          setPostingSites(postingSites.filter((id) => id !== site.id));
                        }
                      }}
                    />
                    <span className="text-sm font-medium">{site.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Select platforms to post this job order</p>
            </div>

            {/* Required Date */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm">
                Required Date
              </Label>
              <DatePickerField
                value={formData.requiredDate}
                onChange={(v) => {
                  setFormData({ ...formData, requiredDate: v });
                  if (v) setErrors((prev) => ({ ...prev, requiredDate: false }));
                }}
                placeholder="Select required date"
                error={errors.requiredDate}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="gap-2"
              disabled={
                createJobOrder.isPending ||
                !formData.title ||
                !formData.description ||
                !formData.level ||
                !formData.requiredDate ||
                !formData.department ||
                !formData.employmentType ||
                !formData.requestorName
              }
            >
              {createJobOrder.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FilePlus className="w-4 h-4" />
                  Create Job Order
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

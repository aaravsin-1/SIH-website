import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react';

interface TeacherDetails {
  department: string;
  specialization: string;
  employeeId: string;
  campus: string;
}

interface TeacherInfoFormProps {
  teacherDetails: TeacherDetails;
  onTeacherDetailsChange: (field: string, value: string) => void;
}

export const TeacherInfoForm = ({ teacherDetails, onTeacherDetailsChange }: TeacherInfoFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-primary" />
        <h3 className="font-semibold">Teacher Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={teacherDetails.department}
            onChange={(e) => onTeacherDetailsChange('department', e.target.value)}
            placeholder="e.g., Computer Science"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialization">Specialization</Label>
          <Input
            id="specialization"
            value={teacherDetails.specialization}
            onChange={(e) => onTeacherDetailsChange('specialization', e.target.value)}
            placeholder="e.g., Machine Learning"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input
            id="employeeId"
            value={teacherDetails.employeeId}
            onChange={(e) => onTeacherDetailsChange('employeeId', e.target.value)}
            placeholder="Your employee ID"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campus">Campus</Label>
          <Input
            id="campus"
            value={teacherDetails.campus}
            onChange={(e) => onTeacherDetailsChange('campus', e.target.value)}
            placeholder="Campus location"
          />
        </div>
      </div>
    </div>
  );
};
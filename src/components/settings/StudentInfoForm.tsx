import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { School, Shield, GraduationCap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface StudentDetails {
  fullName: string;
  collegeName: string;
  course: string;
  year: string;
  guardianName: string;
  guardianPhone: string;
  emergencyContact: string;
  studentId: string;
  cgpa: string;
  attendance: string;
  preferredPronouns: string;
}

interface StudentInfoFormProps {
  studentDetails: StudentDetails;
  onStudentDetailsChange: (field: string, value: string) => void;
}

export const StudentInfoForm = ({ studentDetails, onStudentDetailsChange }: StudentInfoFormProps) => {
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <School className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Student Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={studentDetails.fullName}
              onChange={(e) => onStudentDetailsChange('fullName', e.target.value)}
              placeholder="Student's full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              value={studentDetails.studentId}
              onChange={(e) => onStudentDetailsChange('studentId', e.target.value)}
              placeholder="Student ID number"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="collegeName">College/University</Label>
            <Input
              id="collegeName"
              value={studentDetails.collegeName}
              onChange={(e) => onStudentDetailsChange('collegeName', e.target.value)}
              placeholder="Institution name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course">Course/Major</Label>
            <Input
              id="course"
              value={studentDetails.course}
              onChange={(e) => onStudentDetailsChange('course', e.target.value)}
              placeholder="e.g., Computer Science"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="year">Year of Study</Label>
            <Input
              id="year"
              value={studentDetails.year}
              onChange={(e) => onStudentDetailsChange('year', e.target.value)}
              placeholder="e.g., 2nd Year"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cgpa">CGPA</Label>
            <Input
              id="cgpa"
              value={studentDetails.cgpa}
              onChange={(e) => onStudentDetailsChange('cgpa', e.target.value)}
              placeholder="Current CGPA"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendance">Attendance %</Label>
            <Input
              id="attendance"
              value={studentDetails.attendance}
              onChange={(e) => onStudentDetailsChange('attendance', e.target.value)}
              placeholder="Attendance percentage"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredPronouns">Preferred Pronouns</Label>
          <Input
            id="preferredPronouns"
            value={studentDetails.preferredPronouns}
            onChange={(e) => onStudentDetailsChange('preferredPronouns', e.target.value)}
            placeholder="e.g., he/him, she/her, they/them"
          />
        </div>
      </div>

      <Separator />

      {/* Emergency Contacts */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Emergency Contacts</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="guardianName">Guardian/Parent Name</Label>
          <Input
            id="guardianName"
            value={studentDetails.guardianName}
            onChange={(e) => onStudentDetailsChange('guardianName', e.target.value)}
            placeholder="Guardian's full name"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="guardianPhone">Guardian Phone</Label>
            <Input
              id="guardianPhone"
              type="tel"
              value={studentDetails.guardianPhone}
              onChange={(e) => onStudentDetailsChange('guardianPhone', e.target.value)}
              placeholder="Guardian's phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input
              id="emergencyContact"
              type="tel"
              value={studentDetails.emergencyContact}
              onChange={(e) => onStudentDetailsChange('emergencyContact', e.target.value)}
              placeholder="Emergency phone number"
            />
          </div>
        </div>
      </div>
    </>
  );
};
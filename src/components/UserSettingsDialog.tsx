import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';
import { BasicInfoForm } from './settings/BasicInfoForm';
import { StudentInfoForm } from './settings/StudentInfoForm';
import { TeacherInfoForm } from './settings/TeacherInfoForm';

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: string; // Optional - if provided, edit this student's info instead of current user
  studentName?: string; // For display in dialog title
}

export const UserSettingsDialog = ({ open, onOpenChange, studentId, studentName }: UserSettingsDialogProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  
  const [basicInfo, setBasicInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  const [studentDetails, setStudentDetails] = useState({
    fullName: '',
    collegeName: '',
    course: '',
    year: '',
    guardianName: '',
    guardianPhone: '',
    emergencyContact: '',
    studentId: '',
    cgpa: '',
    attendance: '',
    preferredPronouns: ''
  });

  const [teacherDetails, setTeacherDetails] = useState({
    department: '',
    specialization: '',
    employeeId: '',
    campus: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (studentId) {
      // Load specific student's data
      loadStudentData(studentId);
    } else if (user) {
      // Load current user's data
      setBasicInfo({
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || ''
      });
      
      if (userRole === 'student') {
        loadCurrentUserStudentData();
      } else if (userRole === 'teacher') {
        loadTeacherProfile();
      }
    }
  }, [user, userRole, studentId]);

  const loadStudentData = async (targetStudentId: string) => {
    const { data: studentData, error: studentError } = await supabase
      .from('student_info')
      .select('*')
      .eq('user_id', targetStudentId)
      .maybeSingle();

    if (studentError) {
      console.error('Error loading student data:', studentError);
      return;
    }

    if (studentData) {
      setBasicInfo({
        firstName: studentData.first_name || '',
        lastName: studentData.last_name || '',
        email: studentData.email || '',
        phone: studentData.phone || ''
      });

      setStudentDetails({
        fullName: studentData.first_name && studentData.last_name 
          ? `${studentData.first_name} ${studentData.last_name}` 
          : '',
        collegeName: studentData.college_name || '',
        course: studentData.course || '',
        year: studentData.year_of_study || '',
        guardianName: studentData.guardian_name || '',
        guardianPhone: studentData.guardian_phone || '',
        emergencyContact: studentData.emergency_contact || '',
        studentId: studentData.student_id || '',
        cgpa: studentData.cgpa || '',
        attendance: studentData.attendance || '',
        preferredPronouns: studentData.preferred_pronouns || ''
      });
    }
  };

  const loadCurrentUserStudentData = async () => {
    if (!user) return;
    
    // Load from student_info table first, then fall back to user metadata
    const { data: studentData, error } = await supabase
      .from('student_info')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (studentData) {
      setStudentDetails({
        fullName: studentData.first_name && studentData.last_name 
          ? `${studentData.first_name} ${studentData.last_name}` 
          : '',
        collegeName: studentData.college_name || '',
        course: studentData.course || '',
        year: studentData.year_of_study || '',
        guardianName: studentData.guardian_name || '',
        guardianPhone: studentData.guardian_phone || '',
        emergencyContact: studentData.emergency_contact || '',
        studentId: studentData.student_id || '',
        cgpa: studentData.cgpa || '',
        attendance: studentData.attendance || '',
        preferredPronouns: studentData.preferred_pronouns || ''
      });
    } else {
      // Fall back to user metadata if no student_info record exists
      const details = user.user_metadata?.student_details || {};
      setStudentDetails({
        fullName: details.fullName || '',
        collegeName: details.collegeName || '',
        course: details.course || '',
        year: details.year || '',
        guardianName: details.guardianName || '',
        guardianPhone: details.guardianPhone || '',
        emergencyContact: details.emergencyContact || '',
        studentId: '',
        cgpa: '',
        attendance: '',
        preferredPronouns: ''
      });
    }
  };

  const loadTeacherProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select('department, specialization, employee_id, campus')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading teacher profile:', error);
      return;
    }

    if (data) {
      setTeacherDetails({
        department: data.department || '',
        specialization: data.specialization || '',
        employeeId: data.employee_id || '',
        campus: data.campus || ''
      });
    }
  };

  const handleBasicInfoChange = (field: string, value: string) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleStudentDetailsChange = (field: string, value: string) => {
    setStudentDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleTeacherDetailsChange = (field: string, value: string) => {
    setTeacherDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const targetUserId = studentId || user?.id;
      
      if (!targetUserId) {
        toast({
          title: "Error",
          description: "No user ID available.",
          variant: "destructive"
        });
        return;
      }

      if (studentId) {
        // Update specific student's data in student_info table
        const { error: studentError } = await supabase
          .from('student_info')
          .upsert({
            user_id: studentId,
            first_name: basicInfo.firstName,
            last_name: basicInfo.lastName,
            email: basicInfo.email,
            phone: basicInfo.phone || null,
            college_name: studentDetails.collegeName,
            course: studentDetails.course,
            year_of_study: studentDetails.year,
            guardian_name: studentDetails.guardianName,
            guardian_phone: studentDetails.guardianPhone,
            emergency_contact: studentDetails.emergencyContact,
            student_id: studentDetails.studentId || null,
            cgpa: studentDetails.cgpa || null,
            attendance: studentDetails.attendance || null,
            preferred_pronouns: studentDetails.preferredPronouns || null,
            profile_completed: "true"
          }, {
            onConflict: 'user_id'
          });

        if (studentError) {
          toast({
            title: "Error updating student info",
            description: studentError.message,
            variant: "destructive"
          });
          return;
        }

        // Also update profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: studentId,
            first_name: basicInfo.firstName,
            last_name: basicInfo.lastName,
            phone: basicInfo.phone
          }, {
            onConflict: 'user_id'
          });

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }

      } else {
        // Update current user's data (original functionality)
        if (!user) {
          toast({
            title: "Authentication error",
            description: "Please log in again.",
            variant: "destructive"
          });
          return;
        }

        const metadataUpdate: any = {
          first_name: basicInfo.firstName,
          last_name: basicInfo.lastName,
          phone: basicInfo.phone,
          profile_completed: true
        };

        if (userRole === 'student') {
          metadataUpdate.student_details = studentDetails;
        }

        const { error: authError } = await supabase.auth.updateUser({
          data: metadataUpdate
        });

        if (authError) {
          toast({
            title: "Error updating profile",
            description: authError.message,
            variant: "destructive"
          });
          return;
        }

        if (userRole === 'student') {
          const { error: studentError } = await supabase
            .from('student_info')
            .upsert({
              user_id: user.id,
              first_name: basicInfo.firstName,
              last_name: basicInfo.lastName,
              email: basicInfo.email,
              phone: basicInfo.phone || null,
              college_name: studentDetails.collegeName,
              course: studentDetails.course,
              year_of_study: studentDetails.year,
              guardian_name: studentDetails.guardianName,
              guardian_phone: studentDetails.guardianPhone,
              emergency_contact: studentDetails.emergencyContact,
              student_id: studentDetails.studentId || null,
              cgpa: studentDetails.cgpa || null,
              attendance: studentDetails.attendance || null,
              preferred_pronouns: studentDetails.preferredPronouns || null,
              profile_completed: "true"
            }, {
              onConflict: 'user_id'
            });

          if (studentError) {
            toast({
              title: "Error updating student info",
              description: studentError.message,
              variant: "destructive"
            });
            return;
          }
        } else if (userRole === 'teacher') {
          const { error: teacherError } = await supabase
            .from('teacher_profiles')
            .upsert({
              user_id: user.id,
              department: teacherDetails.department,
              specialization: teacherDetails.specialization,
              employee_id: teacherDetails.employeeId,
              campus: teacherDetails.campus
            }, {
              onConflict: 'user_id'
            });

          if (teacherError) {
            toast({
              title: "Error updating teacher profile",
              description: teacherError.message,
              variant: "destructive"
            });
            return;
          }

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              user_id: user.id,
              first_name: basicInfo.firstName,
              last_name: basicInfo.lastName,
              phone: basicInfo.phone
            }, {
              onConflict: 'user_id'
            });

          if (profileError) {
            console.error('Error updating profile:', profileError);
          }
        }
      }

      toast({
        title: "Profile updated!",
        description: studentId 
          ? `${studentName || 'Student'}'s information has been updated successfully.`
          : "Your information has been saved successfully."
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {studentId ? `${studentName || 'Student'} Settings` : 'Account Settings'}
          </DialogTitle>
          <DialogDescription>
            {studentId 
              ? `View and update ${studentName || "this student"}'s information` 
              : "View and update your account information"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <BasicInfoForm 
            basicInfo={basicInfo}
            onBasicInfoChange={handleBasicInfoChange}
          />

          <Separator />

          {/* Role-specific Information */}
          {(studentId || userRole === 'student') ? (
            <StudentInfoForm 
              studentDetails={studentDetails}
              onStudentDetailsChange={handleStudentDetailsChange}
            />
          ) : userRole === 'teacher' ? (
            <TeacherInfoForm 
              teacherDetails={teacherDetails}
              onTeacherDetailsChange={handleTeacherDetailsChange}
            />
          ) : null}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
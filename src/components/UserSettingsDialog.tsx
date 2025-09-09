import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, School, BookOpen, Users, Shield, Building, GraduationCap } from 'lucide-react';

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserSettingsDialog = ({ open, onOpenChange }: UserSettingsDialogProps) => {
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
    emergencyContact: ''
  });

  const [teacherDetails, setTeacherDetails] = useState({
    department: '',
    specialization: '',
    employeeId: '',
    campus: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Load basic user info
      setBasicInfo({
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || ''
      });
      
      if (userRole === 'student') {
        // Load student details
        const details = user.user_metadata?.student_details || {};
        setStudentDetails({
          fullName: details.fullName || '',
          collegeName: details.collegeName || '',
          course: details.course || '',
          year: details.year || '',
          guardianName: details.guardianName || '',
          guardianPhone: details.guardianPhone || '',
          emergencyContact: details.emergencyContact || ''
        });
      } else if (userRole === 'teacher') {
        // Load teacher details from teacher_profiles table
        loadTeacherProfile();
      }
    }
  }, [user, userRole]);

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
      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please log in again.",
          variant: "destructive"
        });
        return;
      }

      // Update user metadata
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
        // Update student_info table
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
        // Update teacher_profiles table
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

        // Also update profiles table for teachers
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

      toast({
        title: "Profile updated!",
        description: "Your information has been saved successfully."
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
            Account Settings
          </DialogTitle>
          <DialogDescription>
            View and update your account information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={basicInfo.firstName}
                  onChange={(e) => handleBasicInfoChange('firstName', e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={basicInfo.lastName}
                  onChange={(e) => handleBasicInfoChange('lastName', e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={basicInfo.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={basicInfo.phone}
                  onChange={(e) => handleBasicInfoChange('phone', e.target.value)}
                  placeholder="Your phone number"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Role-specific Information */}
          {userRole === 'student' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Student Information</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={studentDetails.fullName}
                  onChange={(e) => handleStudentDetailsChange('fullName', e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collegeName">College/University</Label>
                  <Input
                    id="collegeName"
                    value={studentDetails.collegeName}
                    onChange={(e) => handleStudentDetailsChange('collegeName', e.target.value)}
                    placeholder="Your institution name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course">Course/Major</Label>
                  <Input
                    id="course"
                    value={studentDetails.course}
                    onChange={(e) => handleStudentDetailsChange('course', e.target.value)}
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year">Year of Study</Label>
                <Input
                  id="year"
                  value={studentDetails.year}
                  onChange={(e) => handleStudentDetailsChange('year', e.target.value)}
                  placeholder="e.g., 2nd Year, Final Year"
                />
              </div>
            </div>
          ) : userRole === 'teacher' ? (
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
                    onChange={(e) => handleTeacherDetailsChange('department', e.target.value)}
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={teacherDetails.specialization}
                    onChange={(e) => handleTeacherDetailsChange('specialization', e.target.value)}
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
                    onChange={(e) => handleTeacherDetailsChange('employeeId', e.target.value)}
                    placeholder="Your employee ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campus">Campus</Label>
                  <Input
                    id="campus"
                    value={teacherDetails.campus}
                    onChange={(e) => handleTeacherDetailsChange('campus', e.target.value)}
                    placeholder="Campus location"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {userRole === 'student' && (
            <>
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
                    onChange={(e) => handleStudentDetailsChange('guardianName', e.target.value)}
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
                      onChange={(e) => handleStudentDetailsChange('guardianPhone', e.target.value)}
                      placeholder="Guardian's phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      type="tel"
                      value={studentDetails.emergencyContact}
                      onChange={(e) => handleStudentDetailsChange('emergencyContact', e.target.value)}
                      placeholder="Emergency phone number"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

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
              className="bg-primary hover:bg-primary-glow"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Phone, FileText } from 'lucide-react';

interface StudentRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentRegistered: () => void;
}

export const StudentRegistrationDialog = ({ open, onOpenChange, onStudentRegistered }: StudentRegistrationDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    studentPhone: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegisterStudent = async () => {
    if (!user || !formData.studentPhone) {
      toast({
        title: "Missing information",
        description: "Please enter the student's phone number.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Clean the phone number (remove any non-digits, keep as string)
      const cleanPhone = formData.studentPhone.replace(/\D/g, '').trim();
      
      console.log('=== STUDENT REGISTRATION DEBUG ===');
      console.log('Database: Supabase');
      console.log('Table: student_info');
      console.log('Column: phone (text)');
      console.log('Input phone:', formData.studentPhone);
      console.log('Cleaned phone:', cleanPhone);

      // Query student_info table with cleaned string
      const { data: studentInfo, error: searchError } = await supabase
        .from('student_info')
        .select('user_id, first_name, last_name, phone')
        .ilike('phone', cleanPhone)
        .maybeSingle();

      console.log('Query result:', studentInfo);
      console.log('Query error:', searchError);

      if (searchError) {
        console.error('Search error:', searchError);
        toast({
          title: "Search failed",
          description: "An error occurred while searching for the student. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (!studentInfo) {
        toast({
          title: "Student not found",
          description: "No student found with this phone number. Please make sure the student has completed their profile.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Check if relationship already exists
      const { data: existingRelation } = await supabase
        .from('teacher_student_relationships')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('student_id', studentInfo.user_id)
        .maybeSingle();

      if (existingRelation) {
        toast({
          title: "Student already registered",
          description: `${studentInfo.first_name} ${studentInfo.last_name} is already in your student list.`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Create teacher-student relationship
      const { error: insertError } = await supabase
        .from('teacher_student_relationships')
        .insert({
          teacher_id: user.id,
          student_id: studentInfo.user_id,
          student_phone: cleanPhone,
          notes: formData.notes,
          is_active: true
        });

      if (insertError) {
        toast({
          title: "Registration failed",
          description: insertError.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Student registered successfully!",
        description: `${studentInfo.first_name} ${studentInfo.last_name} has been added to your student monitoring list.`
      });

      // Reset form
      setFormData({ studentPhone: '', notes: '' });
      onStudentRegistered();
      onOpenChange(false);

    } catch (error) {
      console.error('Registration error:', error);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Register New Student
          </DialogTitle>
          <DialogDescription>
            Add a student to your monitoring list by their phone number
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="studentPhone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Student Phone Number
            </Label>
            <Input
              id="studentPhone"
              type="tel"
              value={formData.studentPhone}
              onChange={(e) => handleInputChange('studentPhone', e.target.value)}
              placeholder="Enter student's phone number"
              required
            />
            <p className="text-xs text-muted-foreground">
              The phone number must match what the student entered in their profile
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any notes about this student..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRegisterStudent}
            disabled={loading || !formData.studentPhone.trim()}
          >
            {loading ? 'Registering...' : 'Register Student'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

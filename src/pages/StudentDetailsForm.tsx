import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentDetailsForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    collegeName: '',
    course: '',
    year: '',
    guardianName: '',
    guardianPhone: '',
    emergencyContact: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Update student_info table with detailed student information
      const { error: studentError } = await supabase
        .from('student_info')
        .upsert({
          user_id: user.id,
          first_name: user.user_metadata?.first_name || formData.fullName.split(' ')[0],
          last_name: user.user_metadata?.last_name || formData.fullName.split(' ').slice(1).join(' '),
          email: user.email,
          phone: user.user_metadata?.phone || null,
          college_name: formData.collegeName,
          course: formData.course,
          year_of_study: formData.year,
          guardian_name: formData.guardianName,
          guardian_phone: formData.guardianPhone,
          emergency_contact: formData.emergencyContact,
          profile_completed: "true"
        });

      if (studentError) {
        toast({
          title: "Error updating profile",
          description: studentError.message,
          variant: "destructive"
        });
        return;
      }

      // Also update user metadata to mark profile as completed
      await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          profile_completed: true
        }
      });

      toast({
        title: "Profile updated!",
        description: "Your student details have been saved successfully."
      });
      navigate('/');

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

  const handleSkip = () => {
    navigate('/');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Complete Your Student Profile
          </CardTitle>
          <CardDescription className="text-center">
            Help us personalize your wellness experience (Optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collegeName">College/University</Label>
                <Input
                  id="collegeName"
                  type="text"
                  value={formData.collegeName}
                  onChange={(e) => handleInputChange('collegeName', e.target.value)}
                  placeholder="Your institution name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course">Course/Major</Label>
                <Input
                  id="course"
                  type="text"
                  value={formData.course}
                  onChange={(e) => handleInputChange('course', e.target.value)}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year of Study</Label>
                <Input
                  id="year"
                  type="text"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="e.g., 2nd Year"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianName">Guardian/Parent Name</Label>
              <Input
                id="guardianName"
                type="text"
                value={formData.guardianName}
                onChange={(e) => handleInputChange('guardianName', e.target.value)}
                placeholder="Guardian's full name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guardianPhone">Guardian Phone</Label>
                <Input
                  id="guardianPhone"
                  type="tel"
                  value={formData.guardianPhone}
                  onChange={(e) => handleInputChange('guardianPhone', e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  placeholder="Emergency phone number"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary-glow"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Details'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip for Now
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
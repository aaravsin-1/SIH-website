import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users } from 'lucide-react';

interface RoleSelectionProps {
  onSelectRole: (role: 'student' | 'teacher') => void;
}

export default function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Join Our Campus Wellness Community</CardTitle>
          <CardDescription className="text-lg">
            Choose your role to get started with personalized mental health support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:scale-105 wellness-card ${
                selectedRole === 'student' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedRole('student')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">I'm a Student</h3>
                <p className="text-muted-foreground">
                  Access personalized wellness resources, peer support, and counseling services 
                  designed specifically for your academic journey.
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all duration-300 hover:scale-105 wellness-card ${
                selectedRole === 'teacher' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedRole('teacher')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">I'm a Teacher/Staff</h3>
                <p className="text-muted-foreground">
                  Support your students' mental health with professional resources, 
                  training materials, and intervention tools.
                </p>
              </CardContent>
            </Card>
          </div>

          <Button 
            onClick={handleContinue}
            disabled={!selectedRole}
            className="w-full py-6 text-lg bg-primary hover:bg-primary-glow"
          >
            Continue as {selectedRole === 'student' ? 'Student' : selectedRole === 'teacher' ? 'Teacher' : '...'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
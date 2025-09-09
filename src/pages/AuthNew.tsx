import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import RoleSelection from './RoleSelection';
import { ArrowLeft } from 'lucide-react';

export default function AuthNew() {
  const [step, setStep] = useState<'role' | 'signup' | 'login'>('role');
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  // Teacher-specific fields
  const [department, setDepartment] = useState('');
  const [campus, setCampus] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Check if student needs to complete profile
      if (user.user_metadata?.role === 'student' && !user.user_metadata?.profile_completed) {
        navigate('/student-details');
      } else if (user.user_metadata?.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleRoleSelection = (role: 'student' | 'teacher') => {
    setSelectedRole(role);
    setStep('signup');
  };

  const handleBackToRole = () => {
    setStep('role');
    setSelectedRole(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in."
          });
        }
      } else {
        if (!selectedRole) {
          toast({
            title: "Role required",
            description: "Please select your role first.",
            variant: "destructive"
          });
          return;
        }
        
        const teacherData = selectedRole === 'teacher' ? {
          department,
          campus,
          employeeId,
          specialization
        } : undefined;
        
        const { error } = await signUp(email, password, firstName, lastName, phone, selectedRole, teacherData);
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account."
          });
        }
      }
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

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setStep(isLogin ? 'signup' : 'login');
  };

  if (step === 'role') {
    return <RoleSelection onSelectRole={handleRoleSelection} />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            {!isLogin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToRole}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">
                {isLogin ? 'Welcome Back' : `Create ${selectedRole === 'student' ? 'Student' : 'Teacher'} Account`}
              </CardTitle>
            </div>
          </div>
          <CardDescription>
            {isLogin 
              ? 'Sign in to access your wellness dashboard' 
              : `Join our campus wellness community as a ${selectedRole}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required={!isLogin}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required={!isLogin}
                      placeholder="Doe"
                    />
                  </div>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="phone">Phone Number</Label>
                   <Input
                     id="phone"
                     type="tel"
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                     required={!isLogin}
                     placeholder="+1234567890"
                   />
                 </div>
                 
                 {/* Teacher-specific fields */}
                 {selectedRole === 'teacher' && (
                   <>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label htmlFor="department">Department</Label>
                         <Input
                           id="department"
                           type="text"
                           value={department}
                           onChange={(e) => setDepartment(e.target.value)}
                           required
                           placeholder="Computer Science"
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="campus">Campus</Label>
                         <Input
                           id="campus"
                           type="text"
                           value={campus}
                           onChange={(e) => setCampus(e.target.value)}
                           required
                           placeholder="Main Campus"
                         />
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label htmlFor="employeeId">Employee ID</Label>
                         <Input
                           id="employeeId"
                           type="text"
                           value={employeeId}
                           onChange={(e) => setEmployeeId(e.target.value)}
                           required
                           placeholder="EMP001"
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="specialization">Specialization</Label>
                         <Input
                           id="specialization"
                           type="text"
                           value={specialization}
                           onChange={(e) => setSpecialization(e.target.value)}
                           placeholder="Counseling Psychology"
                         />
                       </div>
                     </div>
                   </>
                 )}
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary-glow"
              disabled={loading}
            >
              {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={toggleMode}
              className="text-primary hover:text-primary-glow"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
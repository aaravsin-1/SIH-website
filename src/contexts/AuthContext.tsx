import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface TeacherData {
  department: string;
  campus: string;
  employeeId: string;
  specialization?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: 'student' | 'teacher' | null;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone: string, role: 'student' | 'teacher', teacherData?: TeacherData) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'student' | 'teacher' | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setUserRole(session?.user?.user_metadata?.role || null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setUserRole(session?.user?.user_metadata?.role || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phone: string, role: 'student' | 'teacher', teacherData?: TeacherData) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          role: role
        }
      }
    });

    if (authError || !authData.user) {
      return { error: authError };
    }

    // Create profile record for all users
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        phone: phone
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }

    // Create role-specific records
    if (role === 'student') {
      const { error: studentError } = await supabase
        .from('student_info')
        .insert({
          user_id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone // Keep as string to match the schema
        });

      if (studentError) {
        console.error('Error creating student info:', studentError);
      }
    } else if (role === 'teacher') {
      console.log('Creating teacher profile with data:', teacherData);
      
      const { error: teacherError } = await supabase
        .from('teacher_profiles')
        .insert({
          user_id: authData.user.id,
          department: teacherData?.department || null,
          specialization: teacherData?.specialization || null,
          employee_id: teacherData?.employeeId || null,
          campus: teacherData?.campus || null
        });

      if (teacherError) {
        console.error('Error creating teacher profile:', teacherError);
        // Return the teacher error as well so signup shows the error
        return { error: teacherError };
      }
      
      console.log('Teacher profile created successfully');
    }

    return { error: authError };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      userRole,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};